// backend/middleware/rbac.js
// Role-Based Access Control (RBAC) Middleware
// Usage in routes: router.get('/path', auth, rbac('admin'), handler)
//                  router.get('/path', auth, rbac('admin','manager'), handler)
//
// Roles in system: 'admin' | 'manager' | 'employee'

const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by auth.js middleware which must run before rbac
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before role check.',
      });
    }

    const userRole = req.user.role;

    // Check if the user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: [${allowedRoles.join(' or ')}]. Your role: ${userRole}.`,
      });
    }

    next(); // Role is allowed → continue to route handler
  };
};

module.exports = rbac;