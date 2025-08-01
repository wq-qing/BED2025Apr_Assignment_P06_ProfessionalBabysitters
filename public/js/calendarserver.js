// calendarserver.js

const express = require('express');
const sql     = require('mssql');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Serve your static files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '..')));

// 2) Serve calendar.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'calendar.html'));
});

// 3) SQL Server configuration
const dbConfig = {
  user: 'abcd',           
  password: '12345',      
  server: 'localhost',
  database: 'BED_ASG',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// 4) CREATE (POST) → insert new appointment
app.post('/api/appointments', async (req, res) => {
  const { date, startTime, endTime, doctor } = req.body;
  if (!date || !startTime || !endTime || !doctor) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('Date',      sql.Date,    date)
      .input('StartTime', sql.Char(5), startTime)   // CHAR(5) HH:MM
      .input('EndTime',   sql.Char(5), endTime)
      .input('Doctor',    sql.VarChar(50), doctor)
      .query(`
        INSERT INTO Appointments (Date, StartTime, EndTime, Doctor)
        VALUES (@Date, @StartTime, @EndTime, @Doctor);
        SELECT SCOPE_IDENTITY() AS AppointmentID;
      `);
    const newId = result.recordset[0].AppointmentID;
    res.json({ id: newId });
  } catch (err) {
    console.error('❌ SQL Error (POST):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 5) READ (GET) → latest appointment
app.get('/api/appointments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`SELECT TOP 1 * FROM Appointments ORDER BY CreatedAt DESC`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No appointment found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('❌ SQL Error (GET):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 6) UPDATE (PUT) → modify an existing appointment
app.put('/api/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { date, startTime, endTime, doctor } = req.body;
  if (!id || !date || !startTime || !endTime || !doctor) {
    return res.status(400).json({ error: 'Missing fields or invalid ID' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('ID',        sql.Int,    id)
      .input('Date',      sql.Date,   date)
      .input('StartTime', sql.Char(5),startTime)
      .input('EndTime',   sql.Char(5),endTime)
      .input('Doctor',    sql.VarChar(50), doctor)
      .query(`
        UPDATE Appointments
        SET Date = @Date,
            StartTime = @StartTime,
            EndTime = @EndTime,
            Doctor = @Doctor
        WHERE AppointmentID = @ID;
      `);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ SQL Error (PUT):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 7) DELETE (DELETE) → remove appointment by ID
app.delete('/api/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('ID', sql.Int, id)
      .query(`DELETE FROM Appointments WHERE AppointmentID = @ID`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ SQL Error (DELETE):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 8) Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Calendar API is running on http://localhost:${PORT}`);
});
