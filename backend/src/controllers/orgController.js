const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');

// Public Organization Registration
exports.registerOrganization = async (req, res) => {
  try {
    const {
      name,
      registration_number,
      type,
      address,
      city,
      state,
      pincode,
      contact_person,
      phone,
      email,
      website,
      certificate_url,
      license_url,
      admin_password,
    } = req.body;

    if (!name || !registration_number || !type || !address || !city || !state || !pincode || !contact_person || !phone || !email || !admin_password) {
      return res.status(400).json({ success: false, message: 'All mandatory organization and contact fields are required.' });
    }

    // Check duplicate reg number or email
    const existingOrg = await query(`SELECT id FROM organizations WHERE registration_number = $1 OR email = $2;`, [registration_number.trim(), email.toLowerCase().trim()]);
    if (existingOrg.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An organization with this registration number or email already exists.' });
    }

    const existingUser = await query(`SELECT id FROM users WHERE email = $1;`, [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A user account with this email already exists.' });
    }

    // Create organization (Status: pending, Default collection limit = 300)
    const orgRes = await query(`
      INSERT INTO organizations (
        name, registration_number, type, address, city, state, pincode,
        contact_person, phone, email, website, certificate_url, license_url,
        status, collection_limit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id;
    `, [
      name,
      registration_number.trim(),
      type,
      address,
      city,
      state,
      pincode,
      contact_person,
      phone,
      email.toLowerCase().trim(),
      website || '',
      certificate_url || '/uploads/certificates/default_cert.pdf',
      license_url || '/uploads/licenses/default_license.pdf',
      'pending',
      300
    ]);

    const orgId = orgRes.rows[0]?.id || orgRes.insertId;

    // Create Org Admin User (Status: pending)
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    await query(`
      INSERT INTO users (name, email, password, role, phone, organization_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [contact_person, email.toLowerCase().trim(), hashedPassword, 'org_admin', phone, orgId, 'pending']);

    // Log audit
    await logAudit({
      userId: null,
      userRole: 'public',
      action: 'ORGANIZATION_REGISTRATION_SUBMITTED',
      entityType: 'Organization',
      entityId: orgId,
      details: `New organization registration submitted: ${name} (${registration_number}). Awaiting Super Admin review.`,
      ipAddress: req.ip,
    });

    // Create notification for Super Admin
    await query(`
      INSERT INTO notifications (user_id, role, title, message, type)
      VALUES ($1, $2, $3, $4, $5);
    `, [null, 'super_admin', 'New Organization Application', `"${name}" submitted application for verification.`, 'system']);

    return res.status(201).json({
      success: true,
      message: 'Organization application submitted successfully. Super Admin will review your license and approve login access.',
      organizationId: orgId,
    });
  } catch (err) {
    console.error('Org register error:', err);
    res.status(500).json({ success: false, message: 'Server error registering organization.' });
  }
};

// List Organizations (Super Admin: all, Public: approved only)
exports.getOrganizations = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT * FROM organizations WHERE 1=1`;
    const params = [];

    // If user is not super_admin or unauthenticated, restrict to approved only
    if (!req.user || req.user.role !== 'super_admin') {
      sql += ` AND status = 'approved'`;
    } else if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name LIKE $${params.length} OR city LIKE $${params.length} OR registration_number LIKE $${params.length})`;
    }

    sql += ` ORDER BY id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, organizations: result.rows });
  } catch (err) {
    console.error('Get orgs error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching organizations.' });
  }
};

// Get single organization by id
exports.getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [id]);
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const org = orgRes.rows[0];

    // Fetch active camps count & inventory summary
    const campsCount = await query(`SELECT COUNT(*) as count FROM camps WHERE organization_id = $1;`, [id]);
    const inventoryRes = await query(`SELECT blood_group, available_units, reserved_units, expired_units, issued_units FROM blood_inventory WHERE organization_id = $1;`, [id]);

    return res.json({
      success: true,
      organization: {
        ...org,
        totalCamps: parseInt(campsCount.rows[0]?.count || 0),
        inventory: inventoryRes.rows,
      },
    });
  } catch (err) {
    console.error('Get org by id error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching organization details.' });
  }
};

// Approve / Reject / Suspend Organization (Super Admin)
exports.updateOrgStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, collection_limit } = req.body;

    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [id]);
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const currentOrg = orgRes.rows[0];
    const newLimit = collection_limit ? parseInt(collection_limit) : currentOrg.collection_limit;

    await query(`
      UPDATE organizations
      SET status = $1, rejection_reason = $2, collection_limit = $3
      WHERE id = $4;
    `, [status, rejection_reason || null, newLimit, id]);

    // Update associated user status
    const userStatus = status === 'approved' ? 'active' : status === 'pending' ? 'pending' : 'suspended';
    await query(`
      UPDATE users
      SET status = $1
      WHERE organization_id = $2;
    `, [userStatus, id]);

    // If approved, initialize blood inventory for 8 blood groups if not already present
    if (status === 'approved') {
      const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      for (const bg of groups) {
        const check = await query(`SELECT id FROM blood_inventory WHERE organization_id = $1 AND blood_group = $2;`, [id, bg]);
        if (check.rows.length === 0) {
          await query(`
            INSERT INTO blood_inventory (organization_id, blood_group, available_units, reserved_units, expired_units, issued_units)
            VALUES ($1, $2, 0, 0, 0, 0);
          `, [id, bg]);
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: `ORGANIZATION_STATUS_${status.toUpperCase()}`,
      entityType: 'Organization',
      entityId: id,
      details: `Super Admin updated status of "${currentOrg.name}" to "${status}". Reason/Remarks: ${rejection_reason || 'None'}. Limit: ${newLimit}.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Organization status successfully updated to "${status}".`,
    });
  } catch (err) {
    console.error('Update org status error:', err);
    res.status(500).json({ success: false, message: 'Server error updating organization status.' });
  }
};
