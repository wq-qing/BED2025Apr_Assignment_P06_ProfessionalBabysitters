// dbConfig.js
require("dotenv").config();

const required = ["DB_USER", "DB_PASSWORD", "DB_SERVER", "DB_DATABASE", "DB_PORT"];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
  // Fail fast so you don't proceed with broken config
  process.exit(1);
}

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  trustServerCertificate: true,
  options: {
    port: parseInt(process.env.DB_PORT, 10),
    connectionTimeout: 60000,
  },
};
