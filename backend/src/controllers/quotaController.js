const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');

// Submit Additional Quota Request (Organization Admin)
exports.submitQuotaRequest = async (req, res) => {
  try {
    const { requested_limit, reason, supporting_doc_url, organization_id: targetOrgId } = req.body;
    const orgId = req.user.role === 'super_admin' ? (targetOrgId || req.user.organization_id) : req.user.organization_id;

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    if (!requested_limit || !reason) {
      return res.status(400).json({ success: false, message: 'Requested limit and justification reason are required.' });
    }

    const requestedLimitNum = parseInt(requested_limit);
    if (requestedLimitNum > 300) {
      return res.status(400).json({ success: false, message: 'Maximum collection limit across the platform is strictly capped at 300 blood bags.' });
    }

    const orgRes = await query(`SELECT id, name, collection_limit FROM organizations WHERE id = $1;`, [orgId]);
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const org = orgRes.rows[0];
    if (requestedLimitNum <= (org.collection_limit || 200)) {
      return res.status(400).json({ success: false, message: `Requested limit must be greater than your current limit (${org.collection_limit} bags).` });
    }

    const quotaRes = await query(`
      INSERT INTO quota_requests (organization_id, current_limit, requested_limit, reason, supporting_doc_url, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `, [
      orgId,
      org.collection_limit || 300,
      requestedLimitNum,
      reason.trim(),
      supporting_doc_url || '/uploads/quota_docs/default_request.pdf',
      'pending'
    ]);

    const quotaId = quotaRes.rows[0]?.id || quotaRes.insertId;

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'QUOTA_REQUEST_SUBMITTED',
      entityType: 'QuotaRequest',
      entityId: quotaId,
      details: `Organization "${org.name}" requested additional quota limit of ${requestedLimitNum} bags (Current: ${org.collection_limit}). Reason: ${reason}`,
      ipAddress: req.ip,
      status: 'success',
    });

    // Notify Super Admin
    await query(`
      INSERT INTO notifications (user_id, role, title, message, type)
      VALUES ($1, $2, $3, $4, $5);
    `, [null, 'super_admin', 'Additional Quota Request', `"${org.name}" requested limit increase to ${requestedLimitNum} bags.`, 'quota']);

    return res.status(201).json({
      success: true,
      message: 'Additional quota request submitted for Super Admin review.',
      quotaRequestId: quotaId,
    });
  } catch (err) {
    console.error('Submit quota request error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting quota request.' });
  }
};

// List Quota Requests
exports.getQuotaRequests = async (req, res) => {
  try {
    const { status, organization_id } = req.query;
    let sql = `
      SELECT qr.*, o.name as organization_name, o.registration_number, o.city as org_city, u.name as reviewer_name
      FROM quota_requests qr
      JOIN organizations o ON qr.organization_id = o.id
      LEFT JOIN users u ON qr.reviewed_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by organization if org_admin
    if (req.user.role === 'org_admin') {
      params.push(req.user.organization_id);
      sql += ` AND qr.organization_id = $${params.length}`;
    } else if (organization_id) {
      params.push(organization_id);
      sql += ` AND qr.organization_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND qr.status = $${params.length}`;
    }

    sql += ` ORDER BY qr.id DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, quotaRequests: result.rows });
  } catch (err) {
    console.error('Get quota requests error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching quota requests.' });
  }
};

// Review Quota Request (Super Admin: Approve or Reject)
exports.reviewQuotaRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "approved" or "rejected".' });
    }

    const quotaRes = await query(`
      SELECT qr.*, o.name as organization_name
      FROM quota_requests qr
      JOIN organizations o ON qr.organization_id = o.id
      WHERE qr.id = $1;
    `, [id]);

    if (quotaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quota request not found.' });
    }

    const quotaReq = quotaRes.rows[0];

    // Update quota request record
    await query(`
      UPDATE quota_requests
      SET status = $1,
          admin_remarks = $2,
          reviewed_by = $3,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $4;
    `, [status, admin_remarks || null, req.user.id, id]);

    // If approved, update organization's collection_limit immediately
    if (status === 'approved') {
      await query(`
        UPDATE organizations
        SET collection_limit = $1
        WHERE id = $2;
      `, [quotaReq.requested_limit, quotaReq.organization_id]);
    }

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: status === 'approved' ? 'QUOTA_APPROVED' : 'QUOTA_REJECTED',
      entityType: 'QuotaRequest',
      entityId: id,
      details: `Super Admin ${status} quota request for "${quotaReq.organization_name}". New limit: ${status === 'approved' ? quotaReq.requested_limit : quotaReq.current_limit} bags. Remarks: ${admin_remarks || 'None'}`,
      ipAddress: req.ip,
      status: 'success',
    });

    // Notify organization admin
    await query(`
      INSERT INTO notifications (organization_id, role, title, message, type)
      VALUES ($1, $2, $3, $4, $5);
    `, [
      quotaReq.organization_id,
      'org_admin',
      `Quota Request ${status.toUpperCase()}`,
      status === 'approved'
        ? `Your request for ${quotaReq.requested_limit} blood bags limit has been APPROVED by Super Admin.`
        : `Your quota increase request was rejected. Remarks: ${admin_remarks || 'None'}`,
      'quota'
    ]);

    return res.json({
      success: true,
      message: `Quota request successfully ${status}. ${status === 'approved' ? `Organization collection limit updated to ${quotaReq.requested_limit} bags.` : ''}`,
    });
  } catch (err) {
    console.error('Review quota request error:', err);
    res.status(500).json({ success: false, message: 'Server error reviewing quota request.' });
  }
};
