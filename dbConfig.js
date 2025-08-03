require("dotenv").config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  trustServerCertificate: true,
  options: {
    port: parseInt(process.env.DB_PORT), // Default SQL Server port
    connectionTimeout: 60000, // Connection timeout in milliseconds
  },
};

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