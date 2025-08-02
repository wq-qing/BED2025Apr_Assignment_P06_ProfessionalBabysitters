//Jayden (signup)
// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const sql     = require('mssql');
const bcrypt  = require('bcryptjs');
const app    = express();
const http      = require('http');
const server = http.createServer(app);
const socketIO  = require('socket.io');
const io     = socketIO(server);
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');
const path      = require('path');

// ———— MSSQL CONFIG & CONNECTION ————
const dbConfig = {
  user:     process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server:   process.env.SQL_SERVER,
  port:     parseInt(process.env.SQL_PORT, 10),
  options: { encrypt: true, trustServerCertificate: true }
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


// ———— MIDDLEWARE ————
app.use(cors());           // allow all origins during dev
app.use(express.json());   // parse JSON bodies
//app.use(express.static('public')); // serve signup.html + any JS/CSS in ./public
app.use(express.static(path.join(__dirname, 'public')));


// ———— ROUTES ————
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'index.html'));
});

app.get('/waitingRooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'waitingRooms.html'));
});

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

app.put('/rooms/:roomId/join', async (req, res) => {
  const roomId = req.params.roomId;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .query("UPDATE dbo.Rooms SET Status='in use' WHERE RoomId=@RoomId");
      console.log('→ Room marked in use');
    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.error('❌ Error joining room:', err);
    res.status(500).send('Could not join room');
  }
});

app.set('view engine', 'ejs');
app.get('/doctor', (req, res) => {
  res.render('doctorHome');
});

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

app.use('/room/:roomId', (req, res, next) => {
  const original = req.params.roomId;
  const canonical = original.toLowerCase();
  if (original !== canonical) {
    const qs = req.url.slice(req.path.length); 
    return res.redirect(303, `/room/${canonical}${qs}`);
  }
  next();
});

app.get('/room/:roomId', (req, res) => {
  res.render('room', { roomId: req.params.roomId });
});

const peerServer = ExpressPeerServer(server, { debug: true });
app.use('/peerjs', peerServer);

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
    socket.on('disconnect', () =>
      socket.to(roomId).emit('user-disconnected', userId)
    );
  });
});

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
