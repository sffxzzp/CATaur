const jwt = require('jsonwebtoken');
const config = require('../config');

function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRecruiter(req, res, next) {
  if (req.user?.role !== 'recruiter') {
    return res.status(403).json({ message: 'Recruiter access required' });
  }
  next();
}

module.exports = {
  authRequired,
  requireRecruiter
};
