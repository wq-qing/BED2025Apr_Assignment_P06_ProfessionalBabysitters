// controllers/appointmentController.js
const appointmentModel = require("../models/appointmentModel");

module.exports = {
  async create(req, res) {
    const { date, startTime, endTime, doctor, userID } = req.body;
    if (!date || !startTime || !endTime || !doctor || !userID) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      const id = await appointmentModel.createAppointment({ userID, date, startTime, endTime, doctor });
      res.status(201).json({ id, message: "Appointment saved successfully" });
    } catch (err) {
      console.error("❌ SQL Error (POST):", err);
      if (err.code === "NO_USER") return res.status(404).json({ error: "User not present" });
      if (err.code === "CONFLICT") return res.status(409).json({ error: "Time slot already booked for this doctor" });
      res.status(500).json({ error: "Database error" });
    }
  },

  async read(req, res) {
    try {
      // if userID query provided, return that user's appointments
      const { userID } = req.query;
      if (userID) {
        const appts = await appointmentModel.getAppointmentsByUser(userID);
        return res.json(appts);
      }
      // fallback: latest appointment
      const appointment = await appointmentModel.getLatestAppointment();
      if (!appointment) return res.status(404).json({ error: "No appointment found" });
      res.json(appointment);
    } catch (err) {
      console.error("❌ SQL Error (GET):", err);
      if (err.code === "NO_USER") return res.status(404).json({ error: "User not present" });
      res.status(500).json({ error: "Database error" });
    }
  },

  async update(req, res) {
    const id = parseInt(req.params.id, 10);
    const { date, startTime, endTime, doctor } = req.body;
    if (!id || !date || !startTime || !endTime || !doctor) {
      return res.status(400).json({ error: "Missing fields or invalid ID" });
    }
    try {
      await appointmentModel.updateAppointment(id, { date, startTime, endTime, doctor });
      res.json({ success: true, message: "Appointment updated successfully" });
    } catch (err) {
      console.error("❌ SQL Error (PUT):", err);
      res.status(500).json({ error: "Database error" });
    }
  },

  async delete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "Invalid ID" });
    try {
      await appointmentModel.deleteAppointment(id);
      res.json({ success: true, message: "Appointment deleted successfully" });
    } catch (err) {
      console.error("❌ SQL Error (DELETE):", err);
      res.status(500).json({ error: "Database error" });
    }
  }
};
