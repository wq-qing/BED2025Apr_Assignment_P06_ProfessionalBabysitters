// server2.js
require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SQL Server configuration
const dbConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// CRUD: Create new condition
app.post('/api/conditions', async (req, res) => {
  const { name, startDate, status, notes } = req.body;
  try {
    await poolConnect;
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('startDate', sql.Date, startDate)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes)
      .query('INSERT INTO Conditions (name, startDate, status, notes) VALUES (@name, @startDate, @status, @notes)');

    res.status(201).json({ message: 'Condition created' });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD: Read all conditions
app.get('/api/conditions', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM Conditions');
    res.json(result.recordset);
  } catch (err) {
    console.error('Read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD: Update condition by ID
app.put('/api/conditions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, startDate, status, notes } = req.body;
  try {
    await poolConnect;
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('startDate', sql.Date, startDate)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes)
      .query('UPDATE Conditions SET name=@name, startDate=@startDate, status=@status, notes=@notes WHERE id=@id');

    res.json({ message: 'Condition updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD: Delete condition by ID
app.delete('/api/conditions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await poolConnect;
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Conditions WHERE id=@id');

    res.json({ message: 'Condition deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ server2.js running on http://localhost:${PORT}`);
});