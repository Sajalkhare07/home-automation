// middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// ─── Protect: verify JWT on every protected route ─────────
exports.protect = async (req, res, next) => {
  try {
    // Accept token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm user still exists in DB
    const users = await query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.user = users[0];   // attach user to request object
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    next(err);
  }
};

// ─── Restrict: role-based access control ──────────────────
exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this route.`,
      });
    }
    next();
  };
};