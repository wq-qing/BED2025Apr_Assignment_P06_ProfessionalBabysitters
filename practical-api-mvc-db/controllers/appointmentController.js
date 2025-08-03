const appointmentModel = require('../models/appointmentModel');

module.exports = {
  async create(req, res) {
    const { date, startTime, endTime, doctor } = req.body;
    if (!date || !startTime || !endTime || !doctor) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const id = await appointmentModel.createAppointment({ date, startTime, endTime, doctor });
      res.json({ id });
    } catch (err) {
      console.error('❌ SQL Error (POST):', err);
      res.status(500).json({ error: 'Database error' });
    }
  },

  async read(req, res) {
    try {
      const appointment = await appointmentModel.getLatestAppointment();
      if (!appointment) return res.status(404).json({ error: 'No appointment found' });
      res.json(appointment);
    } catch (err) {
      console.error('❌ SQL Error (GET):', err);
      res.status(500).json({ error: 'Database error' });
    }
  },

  async update(req, res) {
    const id = parseInt(req.params.id, 10);
    const { date, startTime, endTime, doctor } = req.body;
    if (!id || !date || !startTime || !endTime || !doctor) {
      return res.status(400).json({ error: 'Missing fields or invalid ID' });
    }
    try {
      await appointmentModel.updateAppointment(id, { date, startTime, endTime, doctor });
      res.json({ success: true });
    } catch (err) {
      console.error('❌ SQL Error (PUT):', err);
      res.status(500).json({ error: 'Database error' });
    }
  },

  async delete(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await appointmentModel.deleteAppointment(id);
      res.json({ success: true });
    } catch (err) {
      console.error('❌ SQL Error (DELETE):', err);
      res.status(500).json({ error: 'Database error' });
    }
  }
};
