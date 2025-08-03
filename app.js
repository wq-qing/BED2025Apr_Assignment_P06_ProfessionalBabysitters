// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const cron = require("node-cron");

// PeerJS
const { ExpressPeerServer } = require("peer");

// Reminder MVC
const {
  listReminders,
  addReminder,
  editReminder,
  removeReminder,
} = require("./practical-api-mvc-db/controllers/reminderController");
const validateReminder = require("./practical-api-mvc-db/middleware/validateReminder");
const errorHandler = require("./practical-api-mvc-db/middleware/reminderErrorHandler");

// Other controllers
const walletController = require("./practical-api-mvc-db/controllers/walletController");
const paymentController = require("./practical-api-mvc-db/controllers/paymentController");
const notificationsController = require("./practical-api-mvc-db/controllers/notificationsController");

// Mongo models needed for low-balance cron
const Wallet = require("./practical-api-mvc-db/models/walletModels");

// New call/room models & validation middleware
const callLogModel = require("./practical-api-mvc-db/models/callLogModel");
const roomModel = require("./practical-api-mvc-db/models/roomModel");
const { requireLogStartFields, requireLogEndFields } = require("./practical-api-mvc-db/middleware/validateCall");

// DB config
const dbConfig = require("./dbConfig");

const app = express(); // <-- define app before using it
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Static/html routes
app.get("/reminder", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "reminder.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "jayden", "html", "index.html"));
});
app.get("/elderlyUserHome", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "elderlyUserHome.html"));
});
app.get("/waitingRooms", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "waitingRooms.html"));
});
app.get("/calendar", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "calendar.html"));
});
app.get("/wallet", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "wallet.html"));
});
app.get("/notifications", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "notifications.html"));
});

// Call/room route handlers (integrated inline)

// GET /api/openRooms
app.get("/api/openRooms", async (req, res) => {
  try {
    const roomIds = await callLogModel.getOpenRooms();
    res.json(roomIds);
  } catch (err) {
    console.error('❌ Error fetching open rooms:', err);
    res.status(500).json([]);
  }
});

// POST /api/logCallStart
app.post("/api/logCallStart", requireLogStartFields, async (req, res) => {
  const { roomId, userId, startTime } = req.body;
  try {
    await callLogModel.insertCallStart({ roomId, userId, startTime });
    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Error logging call start:', err);
    res.status(500).send('Failed to log start');
  }
});

// POST /api/logCallEnd
app.post("/api/logCallEnd", requireLogEndFields, async (req, res) => {
  const { roomId, userId, endTime } = req.body;

  console.log('📩 logCallEnd received:', { roomId, userId, endTime });

  if (!roomId || !userId || !endTime) {
    console.log('❌ Missing fields in request');
    return res.status(400).send('Missing fields');
  }

  try {
    const startRecord = await callLogModel.getCallStart({ roomId, userId });

    if (!startRecord) {
      console.log('❌ No call record found for update');
      return res.status(404).send('No call record found');
    }

    const startTime = startRecord.StartTime;
    const duration = Math.floor((endTime - startTime) / 1000); // seconds

    console.log('🕒 Logging end:', { startTime, endTime, duration });

    await callLogModel.updateCallEnd({
      roomId,
      userId,
      endTime,
      duration
    });

    console.log('✅ Call ended and logged');
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ SQL error in logCallEnd:', err);
    res.status(500).send('Server error');
  }
});

// GET /api/callLogs/:userId
app.get("/api/callLogs/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const logs = await callLogModel.getLogsByUser(userId);
    res.json(logs);
  } catch (err) {
    console.error('❌ Error fetching call logs:', err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// PUT /rooms/:roomId/join
app.put("/rooms/:roomId/join", async (req, res) => {
  const roomId = req.params.roomId;
  try {
    await roomModel.markInUse(roomId);
    console.log('→ Room marked in use');
    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.error('❌ Error joining room:', err);
    res.status(500).send('Could not join room');
  }
});

// POST /rooms
app.post("/rooms", async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId || !doctorId.startsWith('D')) {
    return res.status(400).json({ error: 'Invalid doctorId' });
  }
  const { v4: uuidV4 } = require('uuid');
  const roomId = uuidV4().toLowerCase();
  try {
    await roomModel.createRoom({ roomId, doctorId });
    console.log('Inserted room:', roomId, 'for', doctorId);
    return res.json({ roomId });
  } catch (err) {
    console.error('❌ Error creating room:', err);
    return res.status(500).json({ error: 'Could not create room' });
  }
});

// DELETE /rooms/:roomId
app.delete("/rooms/:roomId", async (req, res) => {
  const { roomId } = req.params;
  console.log('DELETE /rooms/' + roomId);
  try {
    await roomModel.closeRoom(roomId);
    console.log('→ Room marked closed (soft-deleted)');
    return res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error in DELETE /rooms/:roomId:', err);
    return res.sendStatus(500);
  }
});

// Canonical lowercase redirect for /room/:roomId
app.use('/room/:roomId', (req, res, next) => {
  const original = req.params.roomId;
  const canonical = original.toLowerCase();
  if (original !== canonical) {
    const qs = req.url.slice(req.path.length);
    return res.redirect(303, `/room/${canonical}${qs}`);
  }
  next();
});

app.set("view engine", "ejs");
app.get("/doctor", (req, res) => {
  res.render("doctorHome");
});
app.get("/room/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

// Connect to databases and mount remaining routes
sql.connect(dbConfig)
  .then(async () => {
    console.log("MSSQL Connected");

    // Connect to MongoDB (walletApp)
    try {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://ZariaLxss:5iPhPZXrEuxqMDBL@wallet.7grkver.mongodb.net/walletApp", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
    } catch (mongoErr) {
      console.error("❌ MongoDB connection failed:", mongoErr);
    }

    // Reminder CRUD
    app.get("/api/reminders", listReminders);
    app.post("/api/reminders", validateReminder, addReminder);
    app.put("/api/reminders/:id", validateReminder, editReminder);
    app.delete("/api/reminders/:id", removeReminder);

    const appointmentController = require("./practical-api-mvc-db/controllers/appointmentController");

    // Calendar appointment CRUD
    app.post("/api/appointments", appointmentController.create);
    app.get("/api/appointments", appointmentController.read);
    app.put("/api/appointments/:id", appointmentController.update);
    app.delete("/api/appointments/:id", appointmentController.delete);

    // Notifications / wallet / payment
    app.get("/elderlyUserHome/notifications", notificationsController.getNotifications);
    app.post("/mark-read", notificationsController.markAsRead);
    app.post("/pay", paymentController.postPayment);
    app.get("/elderlyUserHome/wallet", walletController.serveWalletPage);
    app.get("/balance", walletController.getBalance);
    app.post("/topup", walletController.postTopUp);
    app.get("/transactions", walletController.getTransactions);
    app.get("/last-card", walletController.getLastCard);

    // --- backward-compatible aliases so existing frontend URLs keep working ---
    app.post("/wallet/topup", walletController.postTopUp);
    app.get("/wallet/balance", walletController.getBalance);
    app.get("/wallet/transactions", walletController.getTransactions);
    app.get("/wallet/last-card", walletController.getLastCard);

    app.post("/payment/pay", paymentController.postPayment);
    app.get("/notifications", notificationsController.getNotifications);
    app.post("/notifications/mark-read", notificationsController.markAsRead);
    // -----------------------------------------------------------------------

    // Cron job: low balance notifications
    cron.schedule("*/5 * * * *", async () => {
      try {
        // Find wallets with balance < 50 that haven't been notified
        const lowWallets = await Wallet.find({
          balance: { $lt: 50 },
          lowBalanceNotified: false,
        });

        for (const w of lowWallets) {
          const msg = `Your wallet balance is low ($${w.balance.toFixed(2)}). Please top up soon.`;
          // Insert into MSSQL Notifications table
          await new sql.Request()
            .input("userId", sql.VarChar, w.userId)
            .input("message", sql.NVarChar, msg)
            .query("INSERT INTO Notifications (userId, message) VALUES (@userId, @message)");

          // Mark wallet as notified
          w.lowBalanceNotified = true;
          await w.save();

          console.log(`✅ Low-balance notification sent to ${w.userId}: "${msg}"`);
        }
      } catch (err) {
        console.error("Error sending low-balance notifications:", err);
      }
    });

    // Error handler (after all routes)
    app.use(errorHandler);

    // PeerJS server mount
    const peerServer = ExpressPeerServer(server, { debug: true });
    app.use("/peerjs", peerServer);

    // Socket.io connection logic (for rooms / real-time)
    io.on("connection", (socket) => {
      socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
        socket.on("disconnect", () =>
          socket.to(roomId).emit("user-disconnected", userId)
        );
      });
    });

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is shutting down");
  try {
    await sql.close();
    console.log("Database connections closed");
  } catch (e) {
    console.error("Error closing DB connection:", e);
  }
  process.exit(0);
});