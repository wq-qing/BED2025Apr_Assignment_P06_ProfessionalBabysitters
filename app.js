// server.js
const dotenv = require("dotenv");
const express = require('express');
const router = express.Router();
const cors    = require('cors');
const sql     = require('mssql');
const bcrypt  = require('bcryptjs');
const app    = express();
const http      = require('http');
const socketIO  = require('socket.io');
const server = http.createServer(app);
const io     = socketIO(server);
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');
const path      = require('path');
const dbConfig = require('./dbConfig');
dotenv.config();

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
  res.sendFile(path.join(__dirname, 'jayden','html', 'index.html'));
});

app.get('/elderlyUserHome', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'elderlyUserHome.html'));
});

app.get('/waitingRooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','html', 'waitingRooms.html'));
});

app.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'calendar.html'));
});

const wc = require("../controllers/walletController");  // ← your wallet controller
const pc = require("../controllers/paymentController");
const nc = require("../controllers/notificationsController");

router.get("/elderlyUserHome", nc.getNotifications);
router.post("/mark-read", nc.markAsRead);
router.post("/pay", pc.postPayment);
router.get("/elderlyUserHome", wc.serveWalletPage);
router.get("/balance", wc.getBalance);
router.post("/topup", wc.postTopUp);
router.get("/transactions", wc.getTransactions);
router.get("/last-card", wc.getLastCard);


// Start server
app.listen(port, () => { 
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});