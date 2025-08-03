// controllers/reminderController.js
const {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../models/reminderModel");

// controllers/reminderController.js
const { getRemindersByUser } = require("../models/reminderModel");

async function listRemindersForUser(req, res, next) {
  try {
    const userID = req.params.userID;
    const reminders = await getRemindersByUser(userID);
    res.json(reminders);
  } catch (e) {
    next(e);
  }
}
module.exports = { listRemindersForUser };


async function listReminders(req, res, next) {
  try {
    const reminders = await getAllReminders();
    res.json(reminders);
  } catch (err) {
    next(err);
  }
}

async function addReminder(req, res, next) {
  try {
    console.log("Incoming create body:", req.body);
    const { MedName, MedDosage, ReminderTime, Frequency, userID } = req.body;
    const newId = await createReminder({ MedName, MedDosage, ReminderTime, Frequency, userID });
    res.status(201).json({ ReminderID: newId });
  } catch (err) {
    next(err);
  }
}

async function editReminder(req, res, next) {
  try {
    const { id } = req.params;
    const { MedName, MedDosage, ReminderTime, Frequency } = req.body;
    const affected = await updateReminder(id, { MedName, MedDosage, ReminderTime, Frequency });
    if (affected === 0) return res.status(404).send("Reminder not found");
    res.send("Reminder updated");
  } catch (err) {
    next(err);
  }
}

async function removeReminder(req, res, next) {
  try {
    const { id } = req.params;
    const affected = await deleteReminder(id);
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
