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

app.post('/api/logCallStart', async (req, res) => {
  const { roomId, userId, startTime } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('UserId', sql.NVarChar(20), userId)
      .input('StartTime', sql.BigInt, startTime)
      .query(`
        INSERT INTO CallLogs (RoomId, UserId, StartTime)
        VALUES (@RoomId, @UserId, @StartTime)
      `);
    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Error logging call start:', err);
    res.status(500).send('Failed to log start');
  }
});

app.post('/api/logCallEnd', async (req, res) => {
  const { roomId, userId, endTime } = req.body;

  console.log('📩 logCallEnd received:', { roomId, userId, endTime });

  if (!roomId || !userId || !endTime) {
    console.log('❌ Missing fields in request');
    return res.status(400).send('Missing fields');
  }

  try {
    const pool = await poolPromise;

    // Fetch the start time
    const result = await pool.request()
      .input('RoomId', sql.UniqueIdentifier, roomId)
      .input('UserId', sql.NVarChar(20), userId)
      .query('SELECT StartTime FROM CallLogs WHERE RoomId=@RoomId AND UserId=@UserId');

    if (result.recordset.length === 0) {
      console.log('❌ No call record found for update');
      return res.status(404).send('No call record found');
    }

    const startTime = result.recordset[0].StartTime;
    const duration = Math.floor((endTime - startTime) / 1000); // seconds

    console.log('🕒 Logging end:', { startTime, endTime, duration });

    await pool.request()
      .input('RoomId',   sql.UniqueIdentifier, roomId)
      .input('UserId',   sql.NVarChar(20), userId)
      .input('EndTime',  sql.BigInt, endTime)
      .input('Duration', sql.Int, duration)
      .query(`
        UPDATE CallLogs
        SET EndTime = @EndTime,
            Duration = @Duration
        WHERE RoomId = @RoomId AND UserId = @UserId
      `);

    console.log('✅ Call ended and logged');
    res.sendStatus(200);

  } catch (err) {
    console.error('❌ SQL error in logCallEnd:', err);
    res.status(500).send('Server error');
  }
});



app.get('/api/callLogs/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserId', sql.NVarChar(20), userId)
      .query(`
        SELECT RoomId, StartTime, EndTime, Duration
        FROM CallLogs
        WHERE UserId = @UserId
        ORDER BY StartTime DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error fetching call logs:', err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
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