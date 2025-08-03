module.exports = function (req, res, next) {
  const { name, startDate, status } = req.body;
  if (!name || !startDate || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  next();
};
