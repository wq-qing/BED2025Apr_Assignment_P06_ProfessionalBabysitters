const express   = require('express');
const { ExpressPeerServer } = require('peer');
const http      = require('http');
const socketIO  = require('socket.io');
const { v4: uuidV4 } = require('uuid');
const path      = require('path');
require('dotenv').config();
const sql       = require('mssql');

const dbConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port:     parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const poolPromise = sql.connect(dbConfig)
  .then(pool => {
    console.log('✅ MSSQL pool created');
    pool.request()
      .query('SELECT @@SERVERNAME AS server, DB_NAME() AS db')
      .then(r => console.log(
        '🔗 Connected to SQL instance:', r.recordset[0].server,
        '\n📋 Using database:', r.recordset[0].db
      ))
      .catch(err => console.error('Error verifying DB name:', err));
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL pool error', err);
    process.exit(1);
  });

const app    = express();
const server = http.createServer(app);
const io     = socketIO(server);

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());  // for parsing JSON bodies

// Patient home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'index.html'));
});
// Waiting rooms page
app.get('/waitingRooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'waitingRooms.html'));
});

// API: list open rooms
app.get('/api/openRooms', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query("SELECT RoomId FROM dbo.Rooms WHERE Status='open'");
    res.json(result.recordset.map(r => r.RoomId));
  } catch (err) {
    console.error('❌ Error fetching open rooms:', err);
    res.status(500).json([]);
  }
});

// Patient joins a room (mark in use)
app.post('/rooms/:roomId/join', async (req, res) => {
  const roomId = req.params.roomId;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .query("UPDATE dbo.Rooms SET Status='in use' WHERE RoomId=@RoomId");
    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.error('❌ Error joining room:', err);
    res.status(500).send('Could not join room');
  }
});

// Doctor home (EJS)
app.set('view engine', 'ejs');
app.get('/doctor', (req, res) => {
  res.render('doctorHome');
});

// Doctor creates a room
app.post('/rooms', async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId || !doctorId.startsWith('D')) {
    return res.status(400).json({ error: 'Invalid doctorId' });
  }
  const roomId = uuidV4().toLowerCase();
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId',   sql.UniqueIdentifier, roomId)
      .input('DoctorId', sql.NVarChar(20),     doctorId)
      .query("INSERT INTO dbo.Rooms (RoomId, DoctorId, Status) VALUES (@RoomId,@DoctorId,'open')");
    console.log('Inserted room:', roomId, 'for', doctorId);
    return res.json({ roomId });
  } catch (err) {
    console.error('❌ Error creating room:', err);
    return res.status(500).json({ error: 'Could not create room' });
  }
});

// Soft-delete a room by setting Status='closed'
app.delete('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  console.log('DELETE /rooms/' + roomId);
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .query("UPDATE dbo.Rooms SET Status='closed' WHERE RoomId=@RoomId");
    console.log('→ Room marked closed (soft-deleted)');
    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error in DELETE /rooms/:roomId:', err);
    return res.sendStatus(500);
  }
});

// if someone visits /room/ABCDEF... redirect to lowercase version
app.use('/room/:roomId', (req, res, next) => {
  const original = req.params.roomId;
  const canonical = original.toLowerCase();
  if (original !== canonical) {
    // preserve any query string
    const qs = req.url.slice(req.path.length); // includes ?...
    return res.redirect(303, `/room/${canonical}${qs}`);
  }
  next();
});

// Room page (EJS)
app.get('/room/:roomId', (req, res) => {
  res.render('room', { roomId: req.params.roomId });
});

// PeerJS signaling
const peerServer = ExpressPeerServer(server, { debug: true });
app.use('/peerjs', peerServer);

// WebRTC via Socket.IO
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
    socket.on('disconnect', () =>
      socket.to(roomId).emit('user-disconnected', userId)
    );
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Jay
function authenticateToken(req,res,next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Kua Zi Liang(PIG)

app.use(express.static(path.join(__dirname, '..')));

// 2) Serve calendar.html at root
app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'calendar.html'));
});

// 3) CREATE (POST) → insert new appointment
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

// 4) READ (GET) → latest appointment
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

// 5) UPDATE (PUT) → modify an existing appointment
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

// 6) DELETE (DELETE) → remove appointment by ID
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