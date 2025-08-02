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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


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