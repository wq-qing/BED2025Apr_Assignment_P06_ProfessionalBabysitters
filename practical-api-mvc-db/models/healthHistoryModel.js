const sql = require("mssql");
const dbConfig = require("../../dbConfig");

module.exports.getAllByUser = async (userId) => {
  const pool = await sql.connect(dbConfig); // ✅ Always connect to config
  const result = await pool
    .request()
    .input("userId", sql.VarChar, userId)
    .query("SELECT * FROM Conditions WHERE userId = @userId");

  return result.recordset;
};
