// practical-api-mvc-db/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = {
  requireAuth: (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Assume payload.userId matches Users.Id
      req.user = { userId: payload.userId };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  },
};
