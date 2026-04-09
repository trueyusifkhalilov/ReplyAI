const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token yoxdur' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token etibarsızdır' });
  }
}

function superAdminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'İcazə yoxdur' });
    next();
  });
}

module.exports = { authMiddleware, superAdminMiddleware };
