const { query } = require('../database/db');

// List Audit Logs (Super Admin only)
exports.getAuditLogs = async (req, res) => {
  try {
    const { status, action, search, limit = 50 } = req.query;
    let sql = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND al.status = $${params.length}`;
    }

    if (action) {
      params.push(action);
      sql += ` AND al.action = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (al.details LIKE $${params.length} OR al.action LIKE $${params.length} OR al.entity_type LIKE $${params.length})`;
    }

    sql += ` ORDER BY al.id DESC LIMIT ${parseInt(limit) || 50}`;

    const result = await query(sql, params);
    return res.json({
      success: true,
      total: result.rows.length,
      logs: result.rows,
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
  }
};

// Get Notifications for logged in user or role
exports.getNotifications = async (req, res) => {
  try {
    let sql = `
      SELECT * FROM notifications
      WHERE (user_id = $1 OR role = $2 OR (organization_id = $3 AND organization_id IS NOT NULL))
      ORDER BY id DESC
      LIMIT 30;
    `;
    const result = await query(sql, [req.user.id, req.user.role, req.user.organization_id || 0]);

    return res.json({
      success: true,
      notifications: result.rows,
      unreadCount: result.rows.filter(n => !n.is_read).length,
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
  }
};

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1;`, [id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
};
