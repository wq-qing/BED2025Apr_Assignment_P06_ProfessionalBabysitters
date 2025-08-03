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
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT, 10),
  options: {
    encrypt: false, // for local dev
    trustServerCertificate: true
  }
};