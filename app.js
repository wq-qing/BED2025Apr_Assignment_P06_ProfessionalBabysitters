// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

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
  res.sendFile(path.join(__dirname, "..", "html", "calendar.html"));
});

// Connect to DB and mount routes
sql.connect(dbConfig)
  .then(() => {
    console.log("MSSQL Connected");

    // Reminder CRUD
    app.get("/api/reminders", listReminders);
    app.post("/api/reminders", validateReminder, addReminder);
    app.put("/api/reminders/:id", validateReminder, editReminder);
    app.delete("/api/reminders/:id", removeReminder);

    // Notifications / wallet / payment
    app.get("/elderlyUserHome/notifications", notificationsController.getNotifications);
    app.post("/mark-read", notificationsController.markAsRead);
    app.post("/pay", paymentController.postPayment);
    app.get("/elderlyUserHome/wallet", walletController.serveWalletPage);
    app.get("/balance", walletController.getBalance);
    app.post("/topup", walletController.postTopUp);
    app.get("/transactions", walletController.getTransactions);
    app.get("/last-card", walletController.getLastCard);

    // Error handler (after all routes)
    app.use(errorHandler);

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
