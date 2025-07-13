// reminder-server.js
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dbConfig = {
  user: 'reminder-edit',
  password: 'reminder123',
  server: 'localhost',
  database: 'SPM_BED_Assg',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

sql.connect(dbConfig).then(() => {
  console.log("✅ MSSQL Connected");

  // GET all reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const result = await sql.query(`
        SELECT ReminderID, MedName, MedDosage,
        CONVERT(VARCHAR(5), ReminderTime, 108) AS ReminderTime,
        Frequency FROM Reminders
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error("❌ GET error:", err);
      res.status(500).send("Server error");
    }
  });

  // PUT update reminder
  app.put("/api/reminders/:id", async (req, res) => {
    const { id } = req.params;
    const { MedName, MedDosage, ReminderTime, Frequency } = req.body;

    try {
      const result = await sql.query`
        UPDATE Reminders SET
        MedName = ${MedName},
        MedDosage = ${MedDosage},
        ReminderTime = ${ReminderTime},
        Frequency = ${Frequency}
        WHERE ReminderID = ${id}
      `;

      if (result.rowsAffected[0] === 0) {
        return res.status(404).send("Reminder not found");
      }

      res.send("Reminder updated successfully");
    } catch (err) {
      console.error("❌ PUT error:", err);
      res.status(500).send("Failed to update reminder");
    }
  });

  // DELETE reminder
  app.delete("/api/reminders/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const result = await sql.query`
        DELETE FROM Reminders WHERE ReminderID = ${id}
      `;

      if (result.rowsAffected[0] === 0) {
        return res.status(404).send("Reminder not found");
      }

      res.send("Reminder deleted successfully");
    } catch (err) {
      console.error("❌ DELETE error:", err);
      res.status(500).send("Failed to delete reminder");
    }
  });

  app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
}).catch(err => console.error("❌ DB connection failed:", err));
