const { query } = require('../database/db');

async function logAudit({ userId, userRole, action, entityType, entityId, details, ipAddress, status = 'success' }) {
  try {
    await query(`
      INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      userId || null,
      userRole || 'anonymous',
      action,
      entityType || null,
      entityId ? String(entityId) : null,
      details || '',
      ipAddress || '127.0.0.1',
      status
    ]);
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

module.exports = {
  logAudit,
};
