// reminder-server.js
const express = require("express");
const sql     = require("mssql");
const cors    = require("cors");
const path    = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 1) Serve HTML & JS from this folder
app.use(express.static(path.join(__dirname)));

// 2) Serve CSS from ../public/css
app.use('/css', express.static(path.join(__dirname, '..', 'css')));

// 3) Route to load the page
app.get("/reminder", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', "reminder.html"));
});

const dbConfig = {
  user: 'reminder-edit',
  password: 'reminder123',
  server: 'localhost',
  database: 'SPM_BED_Assg',
  options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(dbConfig)
  .then(() => {
    console.log("MSSQL Connected");

    // GET all reminders
    app.get("/api/reminders", async (req, res) => {
      try {
        const result = await sql.query(`
          SELECT ReminderID, MedName, MedDosage,
                 CONVERT(VARCHAR(5), ReminderTime, 108) AS ReminderTime,
                 Frequency
          FROM Reminders
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("GET error:", err);
        res.status(500).send("Server error");
      }
    });

    // POST new reminder (Option A: generate ReminderID ourselves)
    app.post("/api/reminders", async (req, res) => {
      const { MedName, MedDosage, ReminderTime, Frequency } = req.body;
      try {
        // 1) find current max numeric part of ReminderID (assumes format 'R01','R02',…)
        const maxRes = await sql.query`
          SELECT MAX(CAST(SUBSTRING(ReminderID,2,10) AS INT)) AS maxNum
          FROM Reminders
        `;
        const nextNum = (maxRes.recordset[0].maxNum || 0) + 1;
        const newId   = "R" + nextNum.toString().padStart(2, '0');

        // 2) insert using that new ID
        await sql.query`
          INSERT INTO Reminders (ReminderID, MedName, MedDosage, ReminderTime, Frequency)
          VALUES (${newId}, ${MedName}, ${MedDosage}, ${ReminderTime}, ${Frequency})
        `;

        // 3) return the generated ID
        res.status(201).json({ ReminderID: newId });
      } catch (err) {
        console.error("POST error:", err);
        res.status(500).send("Failed to create reminder");
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
        res.send("Reminder updated");
      } catch (err) {
        console.error("PUT error:", err);
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
        res.send("Reminder deleted");
      } catch (err) {
        console.error("DELETE error:", err);
        res.status(500).send("Failed to delete reminder");
      }
    });

    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
  })
  .catch(err => console.error("DB connection failed:", err));
