const db = require('../config/database');

function logAudit(req, action, resourceType, resourceId, baseId, detailsObj) {
  try {
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.full_name : 'System';
    const userRole = req.user ? req.user.role : 'System';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const details = detailsObj ? JSON.stringify(detailsObj) : '';

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, base_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, userName, userRole, action, resourceType, String(resourceId || ''), baseId || null, details, String(ipAddress));
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

module.exports = { logAudit };
