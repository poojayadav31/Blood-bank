const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');

// Public / Hospital Submit Blood Request
exports.submitBloodRequest = async (req, res) => {
  try {
    const {
      hospital_name,
      contact_person,
      contact_phone,
      contact_email,
      blood_group,
      quantity,
      urgency = 'Normal',
      patient_case,
      required_by_date,
    } = req.body;

    if (!hospital_name || !contact_person || !contact_phone || !blood_group || !quantity) {
      return res.status(400).json({ success: false, message: 'Hospital name, contact person, phone, blood group, and quantity are required.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number of blood units.' });
    }

    const reqRes = await query(`
      INSERT INTO blood_requests (
        hospital_name, contact_person, contact_phone, contact_email,
        blood_group, quantity, urgency, patient_case, required_by_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `, [
      hospital_name,
      contact_person,
      contact_phone,
      contact_email || '',
      blood_group,
      qty,
      urgency,
      patient_case || '',
      required_by_date || new Date().toISOString().split('T')[0],
      'pending'
    ]);

    const reqId = reqRes.rows[0]?.id || reqRes.insertId;

    await logAudit({
      userId: req.user ? req.user.id : null,
      userRole: req.user ? req.user.role : 'hospital',
      action: 'BLOOD_REQUEST_SUBMITTED',
      entityType: 'BloodRequest',
      entityId: reqId,
      details: `Blood request submitted by "${hospital_name}" for ${qty} unit(s) of ${blood_group} (${urgency} urgency).`,
      ipAddress: req.ip,
      status: 'success',
    });

    // Notify all organizations
    await query(`
      INSERT INTO notifications (user_id, role, title, message, type)
      VALUES ($1, $2, $3, $4, $5);
    `, [null, 'org_admin', `Emergency Blood Request: ${blood_group}`, `${hospital_name} needs ${qty} unit(s) of ${blood_group} (${urgency}).`, 'request']);

    return res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully. Organizations and Blood Banks have been notified.',
      requestId: reqId,
    });
  } catch (err) {
    console.error('Submit blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting blood request.' });
  }
};

// List Blood Requests
exports.getBloodRequests = async (req, res) => {
  try {
    const { status, urgency, blood_group } = req.query;
    let sql = `
      SELECT br.*, o.name as fulfilled_by_org_name
      FROM blood_requests br
      LEFT JOIN organizations o ON br.fulfilled_by_org_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND br.status = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency);
      sql += ` AND br.urgency = $${params.length}`;
    }

    if (blood_group) {
      params.push(blood_group);
      sql += ` AND br.blood_group = $${params.length}`;
    }

    sql += ` ORDER BY CASE br.urgency WHEN 'Critical' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END, br.id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, requests: result.rows });
  } catch (err) {
    console.error('Get blood requests error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching blood requests.' });
  }
};

// Fulfill / Update Status of Blood Request
exports.fulfillBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, units_to_fulfill, remarks, organization_id: targetOrgId } = req.body;

    let orgId = req.user.role === 'org_admin' ? req.user.organization_id : (targetOrgId || req.user.organization_id || 1);

    const reqRes = await query(`SELECT * FROM blood_requests WHERE id = $1;`, [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    const bloodReq = reqRes.rows[0];
    const units = parseInt(units_to_fulfill) || bloodReq.quantity;

    if (status === 'fulfilled') {
      // Check inventory availability
      const invCheck = await query(`
        SELECT available_units FROM blood_inventory
        WHERE organization_id = $1 AND blood_group = $2;
      `, [orgId, bloodReq.blood_group]);

      const available = invCheck.rows[0]?.available_units || 0;
      if (available < units) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Organization only has ${available} unit(s) of ${bloodReq.blood_group} available (Requested: ${units}).`,
        });
      }

      // Deduct from available and add to issued
      await query(`
        UPDATE blood_inventory
        SET available_units = available_units - $1,
            issued_units = issued_units + $1,
            last_updated = CURRENT_TIMESTAMP
        WHERE organization_id = $2 AND blood_group = $3;
      `, [units, orgId, bloodReq.blood_group]);

      // Update request record
      await query(`
        UPDATE blood_requests
        SET status = 'fulfilled',
            fulfilled_by_org_id = $1,
            fulfilled_units = $2,
            remarks = $3
        WHERE id = $4;
      `, [orgId, units, remarks || `Fulfilled ${units} units on ${new Date().toLocaleDateString()}`, id]);

      await logAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'BLOOD_REQUEST_FULFILLED',
        entityType: 'BloodRequest',
        entityId: id,
        details: `Organization ID ${orgId} fulfilled ${units} unit(s) of ${bloodReq.blood_group} for "${bloodReq.hospital_name}".`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: `Blood request successfully fulfilled! ${units} units deducted from inventory.`,
      });
    } else {
      // Status update: approved / rejected
      await query(`
        UPDATE blood_requests
        SET status = $1, remarks = $2
        WHERE id = $3;
      `, [status, remarks || null, id]);

      return res.json({ success: true, message: `Blood request status updated to ${status}.` });
    }
  } catch (err) {
    console.error('Fulfill blood request error:', err);
    res.status(500).json({ success: false, message: 'Server error fulfilling request.' });
  }
};
