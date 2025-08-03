// module.exports = {
//   user: "reminder-edit",
//   password: "reminder123",
//   server: "localhost",
//   database: "SPM_BED_Assg",
//   options: {
//     encrypt: false,
//     trustServerCertificate: true,
//   },
// };
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