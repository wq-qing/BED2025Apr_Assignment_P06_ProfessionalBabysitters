// models/appointmentModel.js
const sql = require("mssql");
const dbConfig = require("../../dbConfig");

// reuse a single global pool instead of reconnecting every time
let poolPromise = null;
function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch(err => {
      // reset so future calls can retry
      poolPromise = null;
      console.error("MSSQL connection failed:", err);
      throw err;
    });
  }
  return poolPromise;
}

module.exports = {
  async createAppointment({ date, startTime, endTime, doctor }) {
    const pool = await getPool();
    try {
      const result = await pool.request()
        .input("Date", sql.Date, date)
        .input("StartTime", sql.Char(5), startTime)
        .input("EndTime", sql.Char(5), endTime)
        .input("Doctor", sql.VarChar(50), doctor)
        .query(`
          INSERT INTO Appointments (Date, StartTime, EndTime, Doctor)
          OUTPUT INSERTED.AppointmentID
          VALUES (@Date, @StartTime, @EndTime, @Doctor);
        `);
      // ensure we got the inserted ID
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
