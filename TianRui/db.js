// db.js
require("dotenv").config();
const sql = require("mssql");

const dbconfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g., ZARIA\SQLEXPRESS or localhost\SQLEXPRESS
  database: process.env.DB_DATABASE, // ASSG2_WalletDB
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false, // local dev usually doesn’t need TLS
    trustServerCertificate: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

const poolPromise = new sql.ConnectionPool(dbconfig)
  .connect()
  .then(pool => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch(err => {
    console.error("MSSQL Connection Failed", err);
    throw err;
  });

module.exports = { sql, poolPromise };
