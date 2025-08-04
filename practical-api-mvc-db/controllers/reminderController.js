// controllers/reminderController.js
const {
  getRemindersByUser,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../models/reminderModel");

async function listRemindersForUser(req, res, next) {
  try {
    const userID = req.params.userID;
    if (!userID) return res.status(400).json({ error: "userID required" });
    const reminders = await getRemindersByUser(userID);
    res.json(reminders);
  } catch (e) {
    next(e);
  }
}

async function listReminders(req, res, next) {
  try {
    // expect userID to come from query parameter (fallback) or body if front-end uses /api/reminders
    const userID = req.query.userID || req.body.userID;
    if (!userID) return res.status(400).json({ error: "userID required" });
    const reminders = await getRemindersByUser(userID);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
}

async function addReminder(req, res, next) {
  try {
    console.log("Incoming create body:", req.body);
    const { MedName, MedDosage, ReminderTime, Frequency, userID } = req.body;
    if (!userID) return res.status(400).json({ error: "userID required" });
    const newId = await createReminder({ MedName, MedDosage, ReminderTime, Frequency, userID });
    res.status(201).json({ ReminderID: newId });
  } catch (err) {
    next(err);
  }
}

async function editReminder(req, res, next) {
  try {
    const { id } = req.params;
    const { MedName, MedDosage, ReminderTime, Frequency, userID } = req.body;
    if (!userID) return res.status(400).json({ error: "userID required" });
    const affected = await updateReminder(id, userID, { MedName, MedDosage, ReminderTime, Frequency });
    if (affected === 0) return res.status(404).send("Reminder not found");
    res.send("Reminder updated");
  } catch (err) {
    next(err);
  }
}

async function removeReminder(req, res, next) {
  try {
    const { id } = req.params;
    const userID = req.body.userID || req.query.userID;
    if (!userID) return res.status(400).json({ error: "userID required" });
    const affected = await deleteReminder(id, userID);
    if (affected === 0) return res.status(404).send("Reminder not found");
    res.send("Reminder deleted");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRemindersForUser,
  listReminders,
  addReminder,
  editReminder,
  removeReminder,
};
