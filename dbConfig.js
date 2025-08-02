module.exports = {
  user:     process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server:   process.env.SQL_SERVER,
  port:     parseInt(process.env.SQL_PORT, 10),
  options: { encrypt: true, trustServerCertificate: true }
};

