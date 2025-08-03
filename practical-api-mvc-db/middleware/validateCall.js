// middleware/validateCall.js

module.exports = {
  requireLogStartFields(req, res, next) {
    const { roomId, userId, startTime } = req.body;
    if (!roomId || !userId || !startTime) {
      return res.status(400).send('Missing required fields for call start');
    }
    next();
  },

  requireLogEndFields(req, res, next) {
    const { roomId, userId, endTime } = req.body;
    if (!roomId || !userId || !endTime) {
      return res.status(400).send('Missing required fields for call end');
    }
    next();
  }
};
