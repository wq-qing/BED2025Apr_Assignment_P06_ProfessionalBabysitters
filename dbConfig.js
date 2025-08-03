// dbConfig.js
require("dotenv").config();
const sql = require("mssql"); 


const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  trustServerCertificate: true,
  options: {
    port: parseInt(process.env.DB_PORT),
    connectionTimeout: 60000,
  },
};

// ✅ This should come AFTER config is defined
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ MSSQL connected");
    return pool;
  })
  .catch(err => {
    console.error("❌ MSSQL connection failed:", err);
  });

module.exports = {
  sql,
  poolPromise,
};
