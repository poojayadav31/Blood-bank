const { query } = require('../database/db');

// Super Admin Global Dashboard Analytics
exports.getSuperAdminAnalytics = async (req, res) => {
  try {
    const orgsCountRes = await query(`SELECT COUNT(*) as total, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM organizations;`);
    const campsCountRes = await query(`SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(collected_blood_bags) as total_collected FROM camps;`);
    const donorsCountRes = await query(`SELECT COUNT(*) as total, SUM(total_donations) as total_donations FROM donors;`);
    const stockRes = await query(`SELECT SUM(available_units) as total_available, SUM(issued_units) as total_issued, SUM(expired_units) as total_expired FROM blood_inventory;`);
    const requestsCountRes = await query(`SELECT COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status='fulfilled' THEN 1 ELSE 0 END) as fulfilled FROM blood_requests;`);
    const violationsCountRes = await query(`SELECT COUNT(*) as total FROM audit_logs WHERE status = 'violation_attempt';`);
    const pendingQuotasRes = await query(`SELECT COUNT(*) as count FROM quota_requests WHERE status = 'pending';`);

    // Blood group stock distribution
    const bloodGroupStock = await query(`
      SELECT blood_group, SUM(available_units) as available, SUM(issued_units) as issued
      FROM blood_inventory
      GROUP BY blood_group
      ORDER BY blood_group ASC;
    `);

    // Organization performance
    const orgPerformance = await query(`
      SELECT o.id, o.name, o.city, o.collection_limit,
             COUNT(c.id) as total_camps,
             COALESCE(SUM(c.collected_blood_bags), 0) as total_collected
      FROM organizations o
      LEFT JOIN camps c ON o.id = c.organization_id
      WHERE o.status = 'approved'
      GROUP BY o.id, o.name, o.city, o.collection_limit
      ORDER BY total_collected DESC
      LIMIT 6;
    `);

    // Recent violation attempts
    const recentViolations = await query(`
      SELECT * FROM audit_logs
      WHERE status = 'violation_attempt'
      ORDER BY id DESC
      LIMIT 5;
    `);

    return res.json({
      success: true,
      stats: {
        totalOrganizations: parseInt(orgsCountRes.rows[0]?.total || 0),
        approvedOrganizations: parseInt(orgsCountRes.rows[0]?.approved || 0),
        pendingOrganizations: parseInt(orgsCountRes.rows[0]?.pending || 0),
        activeCamps: parseInt(campsCountRes.rows[0]?.active || 0),
        totalCamps: parseInt(campsCountRes.rows[0]?.total || 0),
        totalBloodCollected: parseInt(campsCountRes.rows[0]?.total_collected || 0),
        totalDonors: parseInt(donorsCountRes.rows[0]?.total || 0),
        totalAvailableStock: parseInt(stockRes.rows[0]?.total_available || 0),
        totalIssuedUnits: parseInt(stockRes.rows[0]?.total_issued || 0),
        pendingRequests: parseInt(requestsCountRes.rows[0]?.pending || 0),
        violationAttemptsCount: parseInt(violationsCountRes.rows[0]?.total || 0),
        pendingQuotaRequests: parseInt(pendingQuotasRes.rows[0]?.count || 0),
      },
      bloodGroupStock: bloodGroupStock.rows,
      orgPerformance: orgPerformance.rows,
      recentViolations: recentViolations.rows,
    });
  } catch (err) {
    console.error('Super admin analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error generating Super Admin analytics.' });
  }
};

// Organization Admin Dashboard Analytics
exports.getOrgAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organization_id || 1;

    const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [orgId]);
    const org = orgRes.rows[0];

    const campsRes = await query(`
      SELECT
        COUNT(*) as total_camps,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active_camps,
        SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as upcoming_camps,
        SUM(collected_blood_bags) as total_collected
      FROM camps
      WHERE organization_id = $1;
    `, [orgId]);

    const inventoryRes = await query(`
      SELECT
        SUM(available_units) as available,
        SUM(reserved_units) as reserved,
        SUM(expired_units) as expired,
        SUM(issued_units) as issued
      FROM blood_inventory
      WHERE organization_id = $1;
    `, [orgId]);

    const bloodGroupStock = await query(`
      SELECT blood_group, available_units, reserved_units, expired_units, issued_units
      FROM blood_inventory
      WHERE organization_id = $1
      ORDER BY blood_group ASC;
    `, [orgId]);

    const registeredDonorsRes = await query(`
      SELECT COUNT(DISTINCT cr.donor_id) as total_donors
      FROM camp_registrations cr
      JOIN camps c ON cr.camp_id = c.id
      WHERE c.organization_id = $1;
    `, [orgId]);

    const pendingRequestsRes = await query(`
      SELECT COUNT(*) as count
      FROM blood_requests
      WHERE status = 'pending';
    `);

    const upcomingCamps = await query(`
      SELECT * FROM camps
      WHERE organization_id = $1 AND status IN ('scheduled', 'active')
      ORDER BY date ASC
      LIMIT 4;
    `, [orgId]);

    return res.json({
      success: true,
      organization: org,
      stats: {
        collectionLimit: org?.collection_limit || 300,
        currentAvailableStock: parseInt(inventoryRes.rows[0]?.available || 0),
        totalBloodCollected: parseInt(campsRes.rows[0]?.total_collected || 0),
        totalIssuedUnits: parseInt(inventoryRes.rows[0]?.issued || 0),
        activeCamps: parseInt(campsRes.rows[0]?.active_camps || 0),
        upcomingCampsCount: parseInt(campsRes.rows[0]?.upcoming_camps || 0),
        registeredDonors: parseInt(registeredDonorsRes.rows[0]?.total_donors || 0),
        pendingBloodRequests: parseInt(pendingRequestsRes.rows[0]?.count || 0),
      },
      bloodGroupStock: bloodGroupStock.rows,
      upcomingCamps: upcomingCamps.rows,
    });
  } catch (err) {
    console.error('Org analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error generating Organization analytics.' });
  }
};
