const sql = require("mssql");

async function getRemindersByUser(userID) {
  if (!userID) throw new Error("getRemindersByUser: userID missing");

  const userExists = await ensureUserExists(userID);
  if (!userExists) {
    const err = new Error("User not present");
    err.code = "NO_USER";
    throw err;
  }

  const result = await sql.query`
    SELECT ReminderID, MedName, MedDosage,
      CONVERT(VARCHAR(5), ReminderTime, 108) AS ReminderTime,
      Frequency
    FROM Reminders
    WHERE UserID = ${userID}
  `;
  return result.recordset;
}

async function ensureUserExists(userID) {
  const res = await sql.query`
    SELECT 1 FROM Users WHERE ID = ${userID}
  `;
  return res.recordset.length > 0;
}

async function createReminder({ userID, MedName, MedDosage, ReminderTime, Frequency }) {
  if (!userID) {
    throw new Error("createReminder: userID is missing or falsy");
  }

  const userExists = await ensureUserExists(userID);
  if (!userExists) {
    const err = new Error("User not present");
    err.code = "NO_USER";
    throw err;
  }

  // generate ReminderID like R01, R02...
  const maxRes = await sql.query`
    SELECT MAX(CAST(SUBSTRING(ReminderID, 2, 10) AS INT)) AS maxNum
    FROM Reminders
  `;
  const nextNum = (maxRes.recordset[0].maxNum || 0) + 1;
  const newId = "R" + nextNum.toString().padStart(2, "0");

  await sql.query`
    INSERT INTO Reminders (ReminderID, UserID, MedName, MedDosage, ReminderTime, Frequency)
    VALUES (${newId}, ${userID}, ${MedName}, ${MedDosage}, ${ReminderTime}, ${Frequency})
  `;

  return newId;
}

async function updateReminder(id, userID, { MedName, MedDosage, ReminderTime, Frequency }) {
  if (!userID) {
    throw new Error("updateReminder: userID is missing");
  }

  const userExists = await ensureUserExists(userID);
  if (!userExists) {
    const err = new Error("User not present");
    err.code = "NO_USER";
    throw err;
  }

  const result = await sql.query`
    UPDATE Reminders SET
      MedName = ${MedName},
      MedDosage = ${MedDosage},
      ReminderTime = ${ReminderTime},
      Frequency = ${Frequency}
    WHERE ReminderID = ${id} AND UserID = ${userID}
  `;
  return result.rowsAffected[0];
}

async function deleteReminder(id, userID) {
  if (!userID) {
    throw new Error("deleteReminder: userID is missing");
  }

  const userExists = await ensureUserExists(userID);
  if (!userExists) {
    const err = new Error("User not present");
    err.code = "NO_USER";
    throw err;
  }

  const result = await sql.query`
    DELETE FROM Reminders WHERE ReminderID = ${id} AND UserID = ${userID}
  `;
  return result.rowsAffected[0];
}

module.exports = {
  createReminder,
  updateReminder,
  deleteReminder,
  getRemindersByUser,
};