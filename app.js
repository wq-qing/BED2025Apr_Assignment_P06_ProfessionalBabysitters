//Jay
// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const sql     = require('mssql');
const bcrypt  = require('bcryptjs');

const app = express();

// ———— MSSQL CONFIG & CONNECTION ————
const dbConfig = {
  user:     process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server:   process.env.SQL_SERVER,
  port:     parseInt(process.env.SQL_PORT, 10),
  options: { trustServerCertificate: true }
};

const poolPromise = sql.connect(dbConfig)
  .then(pool => {
    console.log('✅ MSSQL Connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL Connection Failed:', err);
    throw err;
  });

// ———— MIDDLEWARE ————
app.use(cors());           // allow all origins during dev
app.use(express.json());   // parse JSON bodies
app.use(express.static('public')); // serve signup.html + any JS/CSS in ./public

// ———— ROUTES ————
app.post('/api/register', async (req, res) => {
  const { userId, fullName, email, password, role } = req.body;
  if (!userId || !fullName || !email || !password || !role) {
    return res.status(400).send('Missing fields');
  }

  try {
    const pool   = await poolPromise;
    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('Id',       sql.VarChar(10), userId)
      .input('Name',     sql.NVarChar(100), fullName)
      .input('Email',    sql.VarChar(100), email)
      .input('Password', sql.VarChar(255), hashed)
      .input('Role',     sql.VarChar(20),  role)
      .query(`
        INSERT INTO Users (Id, Name, Email, Password, Role)
        VALUES (@Id, @Name, @Email, @Password, @Role)
      `);

    res.status(201).send('User registered');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ———— START SERVER ————
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
