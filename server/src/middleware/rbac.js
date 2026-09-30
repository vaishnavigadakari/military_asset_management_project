/**
 * Role-Based Access Control (RBAC) middleware for MAMS.
 * Supported Roles:
 *  - Admin: Full access to all data and operations.
 *  - Base Commander: Access to data and operations for their assigned base.
 *  - Logistics Officer: Limited access to purchases and transfers.
 */

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User unauthenticated.' });
    }

    const { role } = req.user;

    if (role === 'Admin') {
      return next(); // Admin has unrestricted access across all roles
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Access denied. Role '${role}' does not have permission to execute this operation.`
      });
    }

    next();
  };
}

/**
 * Validates that non-admin users only operate within their assigned base.
 */
function enforceBaseScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'User unauthenticated.' });
  }

  // Admin can access any base
  if (req.user.role === 'Admin') {
    return next();
  }

  const userBaseId = req.user.base_id;
  const targetBaseId = req.body.base_id || req.body.from_base_id || req.query.baseId || req.params.baseId;

  if (targetBaseId && parseInt(targetBaseId, 10) !== parseInt(userBaseId, 10)) {
    return res.status(403).json({
      message: `RBAC Violation: You are assigned to Base ID ${userBaseId} and cannot modify resources for Base ID ${targetBaseId}.`
    });
  }

  next();
}

module.exports = {
  authorizeRoles,
  enforceBaseScope
};
