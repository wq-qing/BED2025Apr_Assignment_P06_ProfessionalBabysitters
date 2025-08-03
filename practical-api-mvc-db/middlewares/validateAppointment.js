module.exports = (req, res, next) => {
  const { date, startTime, endTime, doctor } = req.body;
  if (!date || !startTime || !endTime || !doctor) {
    return res.status(400).json({ error: 'Missing appointment fields' });
  }
  next();
};
