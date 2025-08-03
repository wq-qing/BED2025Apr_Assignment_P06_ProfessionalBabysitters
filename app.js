require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const cron = require("node-cron");
const { ExpressPeerServer } = require("peer");

// Reminder MVC
const {
  listReminders,
  addReminder,
  editReminder,
  removeReminder,
} = require("./practical-api-mvc-db/controllers/reminderController");
const validateReminder = require("./practical-api-mvc-db/middlewares/validateReminder");
const errorHandler = require("./practical-api-mvc-db/middlewares/reminderErrorHandler");

// Other controllers
const walletController = require("./practical-api-mvc-db/controllers/walletController");
const paymentController = require("./practical-api-mvc-db/controllers/paymentController");
const notificationsController = require("./practical-api-mvc-db/controllers/notificationsController");
const userController = require("./practical-api-mvc-db/controllers/userController");
const { validateRegisterUser } = require("./practical-api-mvc-db/middlewares/userValidation");
const authController = require("./practical-api-mvc-db/controllers/authController");
const { validateLogin } = require("./practical-api-mvc-db/middlewares/authValidation");

// profile mvc
const { requireAuth } = require("./practical-api-mvc-db/middlewares/authMiddleware");
const profileController = require("./practical-api-mvc-db/controllers/profileController");
app.get("/api/profile", requireAuth, profileController.getProfile);


// DB config
const dbConfig = require("./dbConfig");

// New call/room models & validation
const callLogModel = require("./practical-api-mvc-db/models/callLogModel");
const roomModel = require("./practical-api-mvc-db/models/roomModel");
const { requireLogStartFields, requireLogEndFields } = require("./practical-api-mvc-db/middlewares/validateCall");

// Mongo model
const Wallet = require("./practical-api-mvc-db/models/walletModels");

// ✅ health history tracker
const conditionRoute = require("./practical-api-mvc-db/routes/conditionRoute");
const extractUser = require("./practical-api-mvc-db/middleware/extractUserFromToken");

const app = express(); // ✅ must come before app.use()
const server = http.createServer(app);
const io = socketIO(server);

// ✅ Register condition route AFTER app is declared
app.use("/api/conditions", extractUser, conditionRoute);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Static/html routes
app.get("/reminder", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "reminder.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
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
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "signup.html"));
});
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "profile.html"));
});

// Call/room APIs
app.get("/api/openRooms", async (req, res) => {
  try {
    const roomIds = await callLogModel.getOpenRooms();
    res.json(roomIds);
  } catch (err) {
    console.error("❌ Error fetching open rooms:", err);
    res.status(500).json([]);
  }
});

app.post("/api/logCallStart", requireLogStartFields, async (req, res) => {
  const { roomId, userId, startTime } = req.body;
  try {
    await callLogModel.insertCallStart({ roomId, userId, startTime });
    res.sendStatus(201);
  } catch (err) {
    console.error("❌ Error logging call start:", err);
    res.status(500).send("Failed to log start");
  }
});

app.post("/api/logCallEnd", requireLogEndFields, async (req, res) => {
  const { roomId, userId, endTime } = req.body;
  try {
    const startRecord = await callLogModel.getCallStart({ roomId, userId });
    if (!startRecord) return res.status(404).send("No call record found");

    const startTime = startRecord.StartTime;
    const duration = Math.floor((endTime - startTime) / 1000);
    await callLogModel.updateCallEnd({ roomId, userId, endTime, duration });

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ SQL error in logCallEnd:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/callLogs/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const logs = await callLogModel.getLogsByUser(userId);
    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching call logs:", err);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

app.put("/rooms/:roomId/join", async (req, res) => {
  const roomId = req.params.roomId;
  try {
    await roomModel.markInUse(roomId);
    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.error("❌ Error joining room:", err);
    res.status(500).send("Could not join room");
  }
});

app.post("/rooms", async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId || !doctorId.startsWith("D")) {
    return res.status(400).json({ error: "Invalid doctorId" });
  }
  const { v4: uuidV4 } = require("uuid");
  const roomId = uuidV4().toLowerCase();
  try {
    await roomModel.createRoom({ roomId, doctorId });
    return res.json({ roomId });
  } catch (err) {
    console.error("❌ Error creating room:", err);
    return res.status(500).json({ error: "Could not create room" });
  }
});

app.delete("/rooms/:roomId", async (req, res) => {
  try {
    await roomModel.closeRoom(req.params.roomId);
    return res.sendStatus(204);
  } catch (err) {
    console.error("❌ Error in DELETE /rooms/:roomId:", err);
    return res.sendStatus(500);
  }
});

app.use("/room/:roomId", (req, res, next) => {
  const canonical = req.params.roomId.toLowerCase();
  if (req.params.roomId !== canonical) {
    return res.redirect(303, `/room/${canonical}`);
  }
  next();
});

app.set("view engine", "ejs");
app.get("/doctor", (req, res) => res.render("doctorHome"));
app.get("/room/:roomId", (req, res) => res.render("room", { roomId: req.params.roomId }));

// DB + API route mounting
sql.connect(dbConfig)
  .then(async () => {
    console.log("MSSQL Connected");

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
    } catch (mongoErr) {
      console.error("❌ MongoDB connection failed:", mongoErr);
    }

    // Reminders
    app.get("/api/reminders", listReminders);
    app.post("/api/reminders", validateReminder, addReminder);
    app.put("/api/reminders/:id", validateReminder, editReminder);
    app.delete("/api/reminders/:id", removeReminder);

    // Appointments
    const appointmentController = require("./practical-api-mvc-db/controllers/appointmentController");
    app.post("/api/appointments", appointmentController.create);
    app.get("/api/appointments", appointmentController.read);
    app.put("/api/appointments/:id", appointmentController.update);
    app.delete("/api/appointments/:id", appointmentController.delete);

    // Auth
    app.post("/api/register", validateRegisterUser, userController.registerUser);
    app.post("/api/login", validateLogin, authController.login);

    // Wallet + Notifications
    app.post("/topup", walletController.postTopUp);
    app.get("/balance", walletController.getBalance);
    app.get("/transactions", walletController.getTransactions);
    app.get("/last-card", walletController.getLastCard);
    app.post("/pay", paymentController.postPayment);

    app.get("/notifications", notificationsController.getNotifications);
    app.post("/mark-read", notificationsController.markAsRead);

    // Low balance cron job
    cron.schedule("*/5 * * * *", async () => {
      const lowWallets = await Wallet.find({ balance: { $lt: 50 }, lowBalanceNotified: false });
      for (const w of lowWallets) {
        const msg = `Your wallet balance is low ($${w.balance.toFixed(2)}). Please top up soon.`;
        await new sql.Request()
          .input("userId", sql.VarChar, w.userId)
          .input("message", sql.NVarChar, msg)
          .query("INSERT INTO Notifications (userId, message) VALUES (@userId, @message)");
        w.lowBalanceNotified = true;
        await w.save();
      }
    });

    // Error handler
    app.use(errorHandler);

    // PeerJS
    const peerServer = ExpressPeerServer(server, { debug: true });
    app.use("/peerjs", peerServer);

    // Socket.IO
    io.on("connection", (socket) => {
      socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
        socket.on("disconnect", () => socket.to(roomId).emit("user-disconnected", userId));
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
