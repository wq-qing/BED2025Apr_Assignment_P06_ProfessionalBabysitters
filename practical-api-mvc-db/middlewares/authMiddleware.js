const jwt = require("jsonwebtoken");

module.exports = {
  requireAuth: (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Normalize to match controller expectation: { id, role }
      req.user = {
        id: payload.userId || payload.id || null,
        role: payload.role || "User"
      };
      if (!req.user.id) return res.status(401).json({ error: "Invalid token payload" });
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  },
};
