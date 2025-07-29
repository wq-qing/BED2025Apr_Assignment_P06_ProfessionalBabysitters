// calendarserver.js

const express = require('express');
const sql     = require('mssql');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1) SQL Server configuration
const dbConfig = {
  user: 'abcd',              // ← replace with your actual user
  password: '12345',         // ← replace with your actual password
  server: 'localhost',
  database: 'BED_ASG',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}; 

// 2) Test GET route
app.get('/', (req, res) => {
  res.send('Calendar API is running');
});

// 3) POST → create appointment
app.post('/api/appointments', async (req, res) => {
  const { date, startTime, endTime, doctor } = req.body;
  if (!date || !startTime || !endTime || !doctor) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('Date', sql.Date, date)
      .input('StartTime', sql.VarChar(8), startTime)
      .input('EndTime',   sql.VarChar(8), endTime)
      .input('Doctor',    sql.VarChar(50), doctor)
      .query(`
        INSERT INTO Appointments (Date, StartTime, EndTime, Doctor)
        VALUES (@Date, @StartTime, @EndTime, @Doctor);
        SELECT SCOPE_IDENTITY() AS AppointmentID;
      `);
    const newId = result.recordset[0].AppointmentID;
    res.json({ id: newId });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 4) GET → fetch latest appointment
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
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 5) DELETE → remove appointment by ID
app.delete('/api/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('ID', sql.Int, id)
      .query(`DELETE FROM Appointments WHERE AppointmentID = @ID`);
    res.json({ success: true });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 6) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Calendar API is running on http://localhost:${PORT}`);
});
