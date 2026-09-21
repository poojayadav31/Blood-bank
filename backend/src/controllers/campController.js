const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');
const { checkEligibility } = require('../utils/eligibility');

// List Camps (Public or Filtered)
exports.getCamps = async (req, res) => {
  try {
    const { status, organization_id, city, date, search } = req.query;
    let sql = `
      SELECT c.*, o.name as organization_name, o.phone as organization_phone, o.email as organization_email
      FROM camps c
      JOIN organizations o ON c.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    if (organization_id) {
      params.push(organization_id);
      sql += ` AND c.organization_id = $${params.length}`;
    }

    if (city) {
      params.push(`%${city.trim()}%`);
      sql += ` AND (c.city LIKE $${params.length} OR c.location LIKE $${params.length})`;
    }

    if (date) {
      params.push(date);
      sql += ` AND c.date = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (c.name LIKE $${params.length} OR c.location LIKE $${params.length} OR c.city LIKE $${params.length} OR o.name LIKE $${params.length})`;
    }

    sql += ` ORDER BY c.date ASC, c.start_time ASC`;

    const result = await query(sql, params);
    return res.json({ success: true, camps: result.rows });
  } catch (err) {
    console.error('Get camps error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching camps.' });
  }
};

// Get single camp by ID
exports.getCampById = async (req, res) => {
  try {
    const { id } = req.params;
    const campRes = await query(`
      SELECT c.*, o.name as organization_name, o.phone as organization_phone, o.email as organization_email, o.collection_limit as org_collection_limit
      FROM camps c
      JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = $1;
    `, [id]);

    if (campRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp not found.' });
    }

    const camp = campRes.rows[0];

    // Registrations count
    const regRes = await query(`
      SELECT cr.*, d.name as donor_name, d.blood_group, d.mobile as donor_mobile, d.email as donor_email
      FROM camp_registrations cr
      JOIN donors d ON cr.donor_id = d.id
      WHERE cr.camp_id = $1
      ORDER BY cr.id DESC;
    `, [id]);

    return res.json({
      success: true,
      camp: {
        ...camp,
        registrations: regRes.rows,
        totalRegistered: regRes.rows.length,
      },
    });
  } catch (err) {
    console.error('Get camp by id error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching camp details.' });
  }
};

// Create Camp (Strict 300-bag collection limit check & violation logging)
exports.createCamp = async (req, res) => {
  try {
    const {
      name,
      organizer,
      location,
      address,
      city,
      state,
      date,
      start_time,
      end_time,
      expected_donors,
      expected_blood_bags,
      description,
      poster_url,
      organization_id: targetOrgId,
    } = req.body;

    // Determine organization ID
    let orgId = req.user.role === 'super_admin' ? (targetOrgId || req.user.organization_id) : req.user.organization_id;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required to create a camp.' });
    }

    if (!name || !organizer || !location || !address || !city || !state || !date || !start_time || !end_time || expected_donors === undefined || expected_blood_bags === undefined) {
      return res.status(400).json({ success: false, message: 'All camp scheduling fields are required.' });
    }

    // Fetch organization to verify current approved collection limit
    const orgRes = await query(`SELECT id, name, status, collection_limit FROM organizations WHERE id = $1;`, [orgId]);
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const org = orgRes.rows[0];
    if (org.status !== 'approved') {
      return res.status(403).json({ success: false, message: `Organization is currently ${org.status}. Only approved organizations can schedule camps.` });
    }

    const collectionLimit = Math.min(parseInt(org.collection_limit || 300), 300);
    const requestedBags = parseInt(expected_blood_bags);

    // STRICT BLOOD COLLECTION LIMIT ENFORCEMENT (Strict 300-bag maximum)
    if (requestedBags > 300 || requestedBags > collectionLimit) {
      // Log violation attempt
      await logAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'CAMP_CREATION_ATTEMPT_LIMIT_EXCEEDED',
        entityType: 'Camp',
        entityId: 'NEW',
        details: `Organization "${org.name}" (ID: ${org.id}) attempted to create camp "${name}" with ${requestedBags} expected blood bags, exceeding the maximum allowed limit of 300 blood bags. Request blocked.`,
        ipAddress: req.ip,
        status: 'violation_attempt',
      });

      return res.status(400).json({
        success: false,
        error_type: 'COLLECTION_LIMIT_EXCEEDED',
        limit: Math.min(collectionLimit, 300),
        attempted: requestedBags,
        message: `Maximum allowed collection limit is 300 blood bags. Target cannot exceed 300 blood bags.`,
      });
    }

    // STRICT SCHEDULE CONFLICT PREVENTION: No two camps can be scheduled on the same date and overlapping time slot
    const conflictRes = await query(`
      SELECT c.id, c.name, c.date, c.start_time, c.end_time, c.location, c.city, o.name as organization_name
      FROM camps c
      JOIN organizations o ON c.organization_id = o.id
      WHERE c.date = $1 
        AND c.status NOT IN ('cancelled')
        AND (
          (c.start_time < $2 AND c.end_time > $3) OR
          (c.start_time = $3 AND c.end_time = $2)
        );
    `, [date, end_time, start_time]);

    if (conflictRes.rows.length > 0) {
      const conflict = conflictRes.rows[0];
      return res.status(409).json({
        success: false,
        error_type: 'CAMP_SCHEDULE_CONFLICT',
        conflicting_camp: {
          id: conflict.id,
          name: conflict.name,
          organization: conflict.organization_name,
          date: conflict.date,
          start_time: conflict.start_time,
          end_time: conflict.end_time,
          location: conflict.location,
          city: conflict.city
        },
        message: `Schedule Conflict: Another blood camp "${conflict.name}" by "${conflict.organization_name}" is already scheduled on ${date} between ${conflict.start_time} and ${conflict.end_time}. Camps cannot be scheduled on the same date and time. Please select a different date or non-overlapping time slot.`
      });
    }

    // Insert Camp
    const campRes = await query(`
      INSERT INTO camps (
        organization_id, name, organizer, location, address, city, state,
        date, start_time, end_time, expected_donors, expected_blood_bags,
        description, poster_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id;
    `, [
      orgId,
      name,
      organizer,
      location,
      address,
      city,
      state,
      date,
      start_time,
      end_time,
      parseInt(expected_donors),
      requestedBags,
      description || '',
      poster_url || '',
      'scheduled'
    ]);

    const campId = campRes.rows[0]?.id || campRes.insertId;

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CAMP_CREATED',
      entityType: 'Camp',
      entityId: campId,
      details: `Camp "${name}" scheduled on ${date} (${start_time}-${end_time}) with target ${requestedBags} bags (Limit: ${collectionLimit}).`,
      ipAddress: req.ip,
      status: 'success',
    });

    return res.status(201).json({
      success: true,
      message: 'Blood donation camp scheduled successfully.',
      campId,
    });
  } catch (err) {
    console.error('Create camp error:', err);
    res.status(500).json({ success: false, message: 'Server error scheduling camp.' });
  }
};

// Update Camp details & status
exports.updateCamp = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      organizer,
      location,
      address,
      city,
      state,
      date,
      start_time,
      end_time,
      expected_donors,
      expected_blood_bags,
      description,
      status,
    } = req.body;

    const campRes = await query(`SELECT * FROM camps WHERE id = $1;`, [id]);
    if (campRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp not found.' });
    }

    const currentCamp = campRes.rows[0];

    // Verify ownership if org_admin
    if (req.user.role === 'org_admin' && req.user.organization_id !== currentCamp.organization_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify another organization\'s camp.' });
    }

    // Check limit if expected_blood_bags is updated
    if (expected_blood_bags !== undefined) {
      const orgRes = await query(`SELECT collection_limit, name FROM organizations WHERE id = $1;`, [currentCamp.organization_id]);
      const limit = Math.min(parseInt(orgRes.rows[0]?.collection_limit || 300), 300);
      const newBags = parseInt(expected_blood_bags);

      if (newBags > 300 || newBags > limit) {
        await logAudit({
          userId: req.user.id,
          userRole: req.user.role,
          action: 'CAMP_UPDATE_ATTEMPT_LIMIT_EXCEEDED',
          entityType: 'Camp',
          entityId: id,
          details: `Attempted to update camp "${currentCamp.name}" to ${newBags} bags exceeding maximum limit of 300 bags.`,
          ipAddress: req.ip,
          status: 'violation_attempt',
        });

        return res.status(400).json({
          success: false,
          error_type: 'COLLECTION_LIMIT_EXCEEDED',
          limit: Math.min(limit, 300),
          attempted: newBags,
          message: `Maximum allowed collection limit is 300 blood bags. Target cannot exceed 300 blood bags.`,
        });
      }
    }

    // Check for scheduling conflict if updating date or times
    const targetDate = date || currentCamp.date;
    const targetStart = start_time || currentCamp.start_time;
    const targetEnd = end_time || currentCamp.end_time;
    const targetStatus = status || currentCamp.status;

    if (targetStatus !== 'cancelled') {
      const conflictRes = await query(`
        SELECT c.id, c.name, c.date, c.start_time, c.end_time, c.location, c.city, o.name as organization_name
        FROM camps c
        JOIN organizations o ON c.organization_id = o.id
        WHERE c.id != $1
          AND c.date = $2 
          AND c.status NOT IN ('cancelled')
          AND (
            (c.start_time < $3 AND c.end_time > $4) OR
            (c.start_time = $4 AND c.end_time = $3)
          );
      `, [id, targetDate, targetEnd, targetStart]);

      if (conflictRes.rows.length > 0) {
        const conflict = conflictRes.rows[0];
        return res.status(409).json({
          success: false,
          error_type: 'CAMP_SCHEDULE_CONFLICT',
          conflicting_camp: {
            id: conflict.id,
            name: conflict.name,
            organization: conflict.organization_name,
            date: conflict.date,
            start_time: conflict.start_time,
            end_time: conflict.end_time
          },
          message: `Schedule Conflict: Another camp "${conflict.name}" by "${conflict.organization_name}" is already scheduled on ${targetDate} between ${conflict.start_time} and ${conflict.end_time}. Please select a different date or non-overlapping time slot.`
        });
      }
    }

    await query(`
      UPDATE camps
      SET name = COALESCE($1, name),
          organizer = COALESCE($2, organizer),
          location = COALESCE($3, location),
          address = COALESCE($4, address),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          date = COALESCE($7, date),
          start_time = COALESCE($8, start_time),
          end_time = COALESCE($9, end_time),
          expected_donors = COALESCE($10, expected_donors),
          expected_blood_bags = COALESCE($11, expected_blood_bags),
          description = COALESCE($12, description),
          status = COALESCE($13, status)
      WHERE id = $14;
    `, [
      name || null,
      organizer || null,
      location || null,
      address || null,
      city || null,
      state || null,
      date || null,
      start_time || null,
      end_time || null,
      expected_donors ? parseInt(expected_donors) : null,
      expected_blood_bags ? parseInt(expected_blood_bags) : null,
      description || null,
      status || null,
      id
    ]);

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CAMP_UPDATED',
      entityType: 'Camp',
      entityId: id,
      details: `Camp "${currentCamp.name}" updated. Status: ${status || currentCamp.status}`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Camp updated successfully.' });
  } catch (err) {
    console.error('Update camp error:', err);
    res.status(500).json({ success: false, message: 'Server error updating camp.' });
  }
};

// Register for a Camp (Donor)
exports.registerForCamp = async (req, res) => {
  try {
    const { camp_id } = req.body;
    let donorId = null;

    if (req.user && req.user.role === 'donor') {
      const donorRes = await query(`SELECT * FROM donors WHERE user_id = $1;`, [req.user.id]);
      if (donorRes.rows.length > 0) {
        donorId = donorRes.rows[0].id;
      }
    }

    if (!donorId && req.body.donor_id) {
      donorId = req.body.donor_id;
    }

    if (!camp_id || !donorId) {
      return res.status(400).json({ success: false, message: 'Camp ID and Donor profile required.' });
    }

    // Check camp exists
    const campRes = await query(`SELECT * FROM camps WHERE id = $1;`, [camp_id]);
    if (campRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp not found.' });
    }

    // Check duplicate registration
    const existing = await query(`SELECT id, qr_code_token FROM camp_registrations WHERE camp_id = $1 AND donor_id = $2;`, [camp_id, donorId]);
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'You are already registered for this blood donation camp.',
        registration: existing.rows[0],
      });
    }

    // Check donor eligibility rules
    const donorRes = await query(`SELECT * FROM donors WHERE id = $1;`, [donorId]);
    const donor = donorRes.rows[0];
    const eligibility = checkEligibility({
      dob: donor.dob,
      weight: donor.weight,
      lastDonationDate: donor.last_donation_date,
    });

    const qrToken = `QR-BBMS-C${camp_id}-D${donorId}-${Date.now().toString(36).toUpperCase()}`;

    const regRes = await query(`
      INSERT INTO camp_registrations (camp_id, donor_id, qr_code_token, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, [camp_id, donorId, qrToken, 'registered']);

    const regId = regRes.rows[0]?.id || regRes.insertId;

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for blood donation camp!',
      registration: {
        id: regId,
        camp_id,
        donor_id: donorId,
        qr_code_token: qrToken,
        status: 'registered',
        eligibility,
      },
    });
  } catch (err) {
    console.error('Register camp error:', err);
    res.status(500).json({ success: false, message: 'Server error registering for camp.' });
  }
};

// Check-in Donor & Record Blood Donation (Volunteer or Org Admin)
exports.recordDonation = async (req, res) => {
  try {
    const { registration_id, qr_code_token, vital_bp, vital_hb, vital_weight, blood_bags_collected = 1, status = 'donated', rejection_reason } = req.body;

    let reg = null;
    if (registration_id) {
      const r = await query(`SELECT * FROM camp_registrations WHERE id = $1;`, [registration_id]);
      reg = r.rows[0];
    } else if (qr_code_token) {
      const r = await query(`SELECT * FROM camp_registrations WHERE qr_code_token = $1;`, [qr_code_token]);
      reg = r.rows[0];
    }

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Camp registration pass not found.' });
    }

    const campRes = await query(`SELECT * FROM camps WHERE id = $1;`, [reg.camp_id]);
    const camp = campRes.rows[0];

    const donorRes = await query(`SELECT * FROM donors WHERE id = $1;`, [reg.donor_id]);
    const donor = donorRes.rows[0];

    if (status === 'donated') {
      const certId = `CERT-${new Date().getFullYear()}-BBMS-${Math.floor(100000 + Math.random() * 900000)}`;
      const units = parseInt(blood_bags_collected) || 1;

      // Update registration
      await query(`
        UPDATE camp_registrations
        SET status = 'donated',
            vital_bp = $1,
            vital_hb = $2,
            vital_weight = $3,
            blood_bags_collected = $4,
            certificate_id = $5,
            donation_timestamp = CURRENT_TIMESTAMP
        WHERE id = $6;
      `, [vital_bp || '120/80', parseFloat(vital_hb) || 13.5, parseFloat(vital_weight) || donor.weight, units, certId, reg.id]);

      // Increment camp collected blood bags
      await query(`
        UPDATE camps
        SET collected_blood_bags = collected_blood_bags + $1
        WHERE id = $2;
      `, [units, camp.id]);

      // Update donor total donations and last donation date
      const todayStr = new Date().toISOString().split('T')[0];
      await query(`
        UPDATE donors
        SET total_donations = total_donations + $1,
            last_donation_date = $2
        WHERE id = $3;
      `, [units, todayStr, donor.id]);

      // Add to organization's blood inventory
      const invCheck = await query(`
        SELECT id, available_units FROM blood_inventory
        WHERE organization_id = $1 AND blood_group = $2;
      `, [camp.organization_id, donor.blood_group]);

      if (invCheck.rows.length > 0) {
        await query(`
          UPDATE blood_inventory
          SET available_units = available_units + $1,
              last_updated = CURRENT_TIMESTAMP
          WHERE organization_id = $2 AND blood_group = $3;
        `, [units, camp.organization_id, donor.blood_group]);
      } else {
        await query(`
          INSERT INTO blood_inventory (organization_id, blood_group, available_units, reserved_units, expired_units, issued_units)
          VALUES ($1, $2, $3, 0, 0, 0);
        `, [camp.organization_id, donor.blood_group, units]);
      }

      // Add batch (expiry: 42 days for whole blood)
      const expiryDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await query(`
        INSERT INTO blood_batches (organization_id, camp_id, donor_id, blood_group, units, collection_date, expiry_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'available');
      `, [camp.organization_id, camp.id, donor.id, donor.blood_group, units, todayStr, expiryDate]);

      await logAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'DONATION_RECORDED',
        entityType: 'CampRegistration',
        entityId: reg.id,
        details: `Donation recorded: Donor ${donor.name} (${donor.blood_group}) donated ${units} bag(s) at camp "${camp.name}". Certificate ID: ${certId}.`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Donation successfully recorded! Blood inventory updated and Certificate generated.',
        certificate_id: certId,
        units,
      });
    } else {
      // Deferred or rejected
      await query(`
        UPDATE camp_registrations
        SET status = $1, rejection_reason = $2
        WHERE id = $3;
      `, [status, rejection_reason || 'Medical deferral', reg.id]);

      return res.json({
        success: true,
        message: `Donor status updated to ${status}.`,
      });
    }
  } catch (err) {
    console.error('Record donation error:', err);
    res.status(500).json({ success: false, message: 'Server error recording donation.' });
  }
};
