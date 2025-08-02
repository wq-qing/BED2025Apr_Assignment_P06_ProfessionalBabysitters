// testDb.js
const { poolPromise } = require("./db");

(async () => {
  try {
    console.log("Attempting MSSQL connection...");
    const pool = await poolPromise;
    console.log("Pool resolved, querying...");
    const result = await pool.request().query("SELECT DB_NAME() AS CurrentDB");
    console.log("Connected to database:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("🔥 Connection test failed:", err);
    process.exit(1);
  }
})();

