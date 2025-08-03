// db.js
const sql = require("mssql");
const dbConfig = require("./dbConfig");

const poolPromise = sql.connect(dbConfig)
  .then(pool => {
    console.log("✅ Connected to MSSQL");
    return pool;
  })
  .catch(err => {
    console.error("❌ MSSQL connection error:", err);
  });

module.exports = {
  sql,
  poolPromise,
};
