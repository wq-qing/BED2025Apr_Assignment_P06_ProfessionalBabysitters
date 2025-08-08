// practical-api-mvc-db/controllers/healthHistoryController.js
const { sql, poolPromise } = require("../../db");

// GET /api/users (for Doctor dropdown - elderly only)
exports.getElderlyUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT Id, Name, Email FROM Users WHERE Id LIKE 'E%'");

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Failed to fetch elderly users:", err);
    res.status(500).json({ error: "Database error" });
  }
};
