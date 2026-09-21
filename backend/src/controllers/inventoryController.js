const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');

// Get Inventory for an organization or current user's org
exports.getOrgInventory = async (req, res) => {
  try {
    const { organization_id } = req.query;
    let orgId = req.user.role === 'org_admin' || req.user.role === 'volunteer' ? req.user.organization_id : (organization_id || 1);

    const invRes = await query(`
      SELECT bi.*, o.name as organization_name
      FROM blood_inventory bi
      JOIN organizations o ON bi.organization_id = o.id
      WHERE bi.organization_id = $1
      ORDER BY bi.blood_group ASC;
    `, [orgId]);

    // Calculate totals & alerts
    let totalAvailable = 0;
    let totalReserved = 0;
    let totalExpired = 0;
    let totalIssued = 0;
    const lowStockAlerts = [];
    const criticalStockAlerts = [];

    invRes.rows.forEach(item => {
      totalAvailable += parseInt(item.available_units || 0);
      totalReserved += parseInt(item.reserved_units || 0);
      totalExpired += parseInt(item.expired_units || 0);
      totalIssued += parseInt(item.issued_units || 0);

      if (item.available_units <= 3) {
        criticalStockAlerts.push({ blood_group: item.blood_group, available: item.available_units });
      } else if (item.available_units < 10) {
        lowStockAlerts.push({ blood_group: item.blood_group, available: item.available_units });
      }
    });

    // Check expiring batches in next 7 days
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringRes = await query(`
      SELECT * FROM blood_batches
      WHERE organization_id = $1 AND status = 'available' AND expiry_date <= $2
      ORDER BY expiry_date ASC;
    `, [orgId, nextWeek]);

    return res.json({
      success: true,
      inventory: invRes.rows,
      summary: {
        totalAvailable,
        totalReserved,
        totalExpired,
        totalIssued,
        lowStockAlerts,
        criticalStockAlerts,
        expiringBatchesCount: expiringRes.rows.length,
      },
      expiringBatches: expiringRes.rows,
    });
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching inventory.' });
  }
};

// Get Global Aggregate Inventory across all organizations (Super Admin)
exports.getGlobalInventory = async (req, res) => {
  try {
    const aggRes = await query(`
      SELECT
        blood_group,
        SUM(available_units) as available_units,
        SUM(reserved_units) as reserved_units,
        SUM(expired_units) as expired_units,
        SUM(issued_units) as issued_units
      FROM blood_inventory
      GROUP BY blood_group
      ORDER BY blood_group ASC;
    `);

    const byOrgRes = await query(`
      SELECT
        o.id as organization_id,
        o.name as organization_name,
        o.city,
        SUM(bi.available_units) as total_available,
        SUM(bi.issued_units) as total_issued
      FROM organizations o
      LEFT JOIN blood_inventory bi ON o.id = bi.organization_id
      WHERE o.status = 'approved'
      GROUP BY o.id, o.name, o.city
      ORDER BY total_available DESC;
    `);

    return res.json({
      success: true,
      globalInventory: aggRes.rows,
      organizationBreakdown: byOrgRes.rows,
    });
  } catch (err) {
    console.error('Get global inventory error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching global inventory.' });
  }
};

// Update or manually adjust stock units
exports.updateStock = async (req, res) => {
  try {
    const { organization_id, blood_group, available_units, reserved_units, expired_units, issued_units, adjustment_reason } = req.body;
    let orgId = req.user.role === 'org_admin' ? req.user.organization_id : (organization_id || req.user.organization_id);

    if (!orgId || !blood_group) {
      return res.status(400).json({ success: false, message: 'Organization ID and Blood Group are required.' });
    }

    const current = await query(`SELECT * FROM blood_inventory WHERE organization_id = $1 AND blood_group = $2;`, [orgId, blood_group]);

    if (current.rows.length > 0) {
      await query(`
        UPDATE blood_inventory
        SET available_units = COALESCE($1, available_units),
            reserved_units = COALESCE($2, reserved_units),
            expired_units = COALESCE($3, expired_units),
            issued_units = COALESCE($4, issued_units),
            last_updated = CURRENT_TIMESTAMP
        WHERE organization_id = $5 AND blood_group = $6;
      `, [
        available_units !== undefined ? parseInt(available_units) : null,
        reserved_units !== undefined ? parseInt(reserved_units) : null,
        expired_units !== undefined ? parseInt(expired_units) : null,
        issued_units !== undefined ? parseInt(issued_units) : null,
        orgId,
        blood_group
      ]);
    } else {
      await query(`
        INSERT INTO blood_inventory (organization_id, blood_group, available_units, reserved_units, expired_units, issued_units)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        orgId,
        blood_group,
        parseInt(available_units || 0),
        parseInt(reserved_units || 0),
        parseInt(expired_units || 0),
        parseInt(issued_units || 0)
      ]);
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'BloodInventory',
      entityId: `${orgId}-${blood_group}`,
      details: `Manual inventory update for ${blood_group}: Avail=${available_units}, Reserved=${reserved_units}. Reason: ${adjustment_reason || 'Stock audit'}`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Stock updated successfully.' });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ success: false, message: 'Server error updating stock.' });
  }
};
