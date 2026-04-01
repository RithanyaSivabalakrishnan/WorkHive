// backend/middleware/auth.js
// JWT Authentication Middleware
// Verifies Bearer token on every protected route.
// On success: attaches req.user = { user_id, tenant_id, role, email }
// On failure: returns 401 (no token) or 403 (invalid/expired token)

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>" → "<token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Token is malformed.',
    });
  }

  // 2. Verify the token against the JWT_SECRET in .env
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach decoded payload to req.user for downstream use
    // decoded contains: { user_id, tenant_id, role, email, iat, exp }
    req.user = {
      user_id:   decoded.user_id,
      tenant_id: decoded.tenant_id,
      role:      decoded.role,
      email:     decoded.email,
    };

    next(); // Token is valid → continue to the route handler

  } catch (err) {
    // Differentiate between expired and invalid tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'Session expired. Please log in again.',
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Invalid token. Authentication failed.',
    });
  }
};

module.exports = authMiddleware;