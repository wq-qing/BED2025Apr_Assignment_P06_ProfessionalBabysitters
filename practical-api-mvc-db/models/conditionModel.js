const { poolPromise, sql } = require("../../dbConfig");

const ConditionModel = {
  async getAllByUser(userId, role) {
    const pool = await poolPromise;
    if (role === "Doctor") {
      const result = await pool.request().query("SELECT * FROM Conditions ORDER BY startDate DESC");
      return result.recordset;
    } else {
      const result = await pool.request()
        .input("userId", sql.UniqueIdentifier, userId)
        .query("SELECT * FROM Conditions WHERE userId = @userId ORDER BY startDate DESC");
      return result.recordset;
    }
  },

  async add(condition, userId) {
    const pool = await poolPromise;
    await pool.request()
      .input("name", sql.NVarChar, condition.name)
      .input("startDate", sql.Date, condition.startDate)
      .input("status", sql.NVarChar, condition.status)
      .input("notes", sql.NVarChar, condition.notes || "")
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        INSERT INTO Conditions (name, startDate, status, notes, userId)
        VALUES (@name, @startDate, @status, @notes, @userId)
      `);
  },

  async update(id, condition) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, condition.name)
      .input("startDate", sql.Date, condition.startDate)
      .input("status", sql.NVarChar, condition.status)
      .input("notes", sql.NVarChar, condition.notes || "")
      .query(`
        UPDATE Conditions
        SET name = @name, startDate = @startDate, status = @status, notes = @notes
        WHERE id = @id
      `);
  },

  async remove(id) {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Conditions WHERE id = @id");
  }
};

module.exports = ConditionModel;
