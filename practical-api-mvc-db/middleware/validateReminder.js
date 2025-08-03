// middleware/validateReminder.js
function validateReminder(req, res, next) {
  const { MedName, MedDosage, ReminderTime, Frequency } = req.body;
  if (!MedName || !MedDosage || !ReminderTime || !Frequency) {
    return res.status(400).send("Missing required fields");
  }
  // optional: further format checks (time format, dosage pattern, etc.)
  next();
}

module.exports = validateReminder;
