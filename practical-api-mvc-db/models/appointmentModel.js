// models/appointmentModel.js
const sql = require("mssql");
const dbConfig = require("../../dbConfig");

// reuse a single global pool instead of reconnecting every time
let poolPromise = null;
function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch(err => {
      poolPromise = null;
      console.error("MSSQL connection failed:", err);
      throw err;
    });
  }
  return poolPromise;
}

async function userExists(userID) {
  const pool = await getPool();
  const result = await pool.request()
    .input("UserID", sql.VarChar(50), userID)
    .query(`SELECT 1 FROM Users WHERE ID = @UserID`);
  return result.recordset.length > 0;
}

async function hasConflict({ date, startTime, endTime, doctor }) {
  const pool = await getPool();
  // Overlap if new.Start < existing.End AND new.End > existing.Start on same date & doctor
  const result = await pool.request()
    .input("Date", sql.Date, date)
    .input("StartTime", sql.Char(5), startTime)
    .input("EndTime", sql.Char(5), endTime)
    .input("Doctor", sql.VarChar(50), doctor)
    .query(`
      SELECT 1 FROM Appointments
      WHERE Doctor = @Doctor
        AND Date = @Date
        AND (
          (CAST(@StartTime AS time) < CAST(EndTime AS time) AND CAST(@EndTime AS time) > CAST(StartTime AS time))
        )
    `);
  return result.recordset.length > 0;
}

module.exports = {
  async createAppointment({ userID, date, startTime, endTime, doctor }) {
    const pool = await getPool();

    // check user exists (foreign key will also protect, but this gives nicer error)
    if (!(await userExists(userID))) {
      const err = new Error("User not present");
      err.code = "NO_USER";
      throw err;
    }

    // conflict check
    if (await hasConflict({ date, startTime, endTime, doctor })) {
      const err = new Error("Time slot already booked for this doctor");
      err.code = "CONFLICT";
      throw err;
    }

    try {
      const result = await pool.request()
        .input("UserID", sql.VarChar(50), userID)
        .input("Date", sql.Date, date)
        .input("StartTime", sql.Char(5), startTime)
        .input("EndTime", sql.Char(5), endTime)
        .input("Doctor", sql.VarChar(50), doctor)
        .query(`
          INSERT INTO Appointments (UserID, Date, StartTime, EndTime, Doctor)
          OUTPUT INSERTED.AppointmentID
          VALUES (@UserID, @Date, @StartTime, @EndTime, @Doctor);
        `);
      return result.recordset[0]?.AppointmentID;
    } catch (err) {
      console.error("createAppointment SQL error:", err);
      throw err;
    }
  },

  async getLatestAppointment() {
    const pool = await getPool();
    try {
      const result = await pool.request()
        .query(`SELECT TOP 1 * FROM Appointments ORDER BY CreatedAt DESC`);
      return result.recordset[0];
    } catch (err) {
      console.error("getLatestAppointment SQL error:", err);
      throw err;
    }
  },

  async getAppointmentsByUser(userID) {
    const pool = await getPool();
    if (!(await userExists(userID))) {
      const err = new Error("User not present");
      err.code = "NO_USER";
      throw err;
    }
    try {
      const result = await pool.request()
        .input("UserID", sql.VarChar(50), userID)
        .query(`SELECT * FROM Appointments WHERE UserID = @UserID ORDER BY Date, StartTime`);
      return result.recordset;
    } catch (err) {
      console.error("getAppointmentsByUser SQL error:", err);
      throw err;
    }
  },

  async updateAppointment(id, { date, startTime, endTime, doctor }) {
    const pool = await getPool();
    try {
      await pool.request()
        .input("ID", sql.Int, id)
        .input("Date", sql.Date, date)
        .input("StartTime", sql.Char(5), startTime)
        .input("EndTime", sql.Char(5), endTime)
        .input("Doctor", sql.VarChar(50), doctor)
        .query(`
          UPDATE Appointments
          SET Date = @Date, StartTime = @StartTime, EndTime = @EndTime, Doctor = @Doctor
          WHERE AppointmentID = @ID;
        `);
    } catch (err) {
      console.error("updateAppointment SQL error:", err);
      throw err;
    }
  },

  async deleteAppointment(id) {
    const pool = await getPool();
    try {
      await pool.request()
        .input("ID", sql.Int, id)
        .query(`DELETE FROM Appointments WHERE AppointmentID = @ID`);
    } catch (err) {
      console.error("deleteAppointment SQL error:", err);
      throw err;
    }
  }
};
