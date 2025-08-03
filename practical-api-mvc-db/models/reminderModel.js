// models/reminderModel.js
const sql = require("mssql");

async function getAllReminders() {
  const result = await sql.query(`
    SELECT ReminderID, MedName, MedDosage,
      CONVERT(VARCHAR(5), ReminderTime, 108) AS ReminderTime,
      Frequency
    FROM Reminders
  `);
  return result.recordset;
}

async function createReminder({ userID, MedName, MedDosage, ReminderTime, Frequency }) {
  if (!userID) {
    throw new Error("createReminder: userID is missing or falsy");
  }

  // generate ReminderID like R01, R02...
  const maxRes = await sql.query`
    SELECT MAX(CAST(SUBSTRING(ReminderID, 2, 10) AS INT)) AS maxNum
    FROM Reminders
  `;
  const nextNum = (maxRes.recordset[0].maxNum || 0) + 1;
  const newId = "R" + nextNum.toString().padStart(2, "0");

  console.log("Inserting reminder with:", {
    newId,
    userID,
    MedName,
    MedDosage,
    ReminderTime,
    Frequency,
  });

  // explicit parameterization via tagged template
  await sql.query`
    INSERT INTO Reminders (ReminderID, userID, MedName, MedDosage, ReminderTime, Frequency)
    VALUES (${newId}, ${userID}, ${MedName}, ${MedDosage}, ${ReminderTime}, ${Frequency})
  `;

  return newId;
}

async function updateReminder(id, userID, { MedName, MedDosage, ReminderTime, Frequency }) {
  if (!userID) {
    throw new Error("updateReminder: userID is missing");
  }
  const result = await sql.query`
    UPDATE Reminders SET
      MedName = ${MedName},
      MedDosage = ${MedDosage},
      ReminderTime = ${ReminderTime},
      Frequency = ${Frequency}
    WHERE ReminderID = ${id} AND userID = ${userID}
  `;
  return result.rowsAffected[0];
}

async function deleteReminder(id, userID) {
  if (!userID) {
    throw new Error("deleteReminder: userID is missing");
  }
  const result = await sql.query`
    DELETE FROM Reminders WHERE ReminderID = ${id} AND userID = ${userID}
  `;
  return result.rowsAffected[0];
}

module.exports = {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};