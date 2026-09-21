const { query } = require('../database/db');
const { checkEligibility } = require('../utils/eligibility');
const { logAudit } = require('../utils/auditLogger');

// Public/Donor Live Eligibility Checker
exports.checkDonorEligibility = async (req, res) => {
  try {
    const { dob, weight, lastDonationDate } = req.body;
    if (!dob || !weight) {
      return res.status(400).json({ success: false, message: 'Date of Birth (DOB) and Weight are required for eligibility check.' });
    }

    const result = checkEligibility({ dob, weight, lastDonationDate });
    return res.json({
      success: true,
      eligibility: result,
    });
  } catch (err) {
    console.error('Check eligibility error:', err);
    res.status(500).json({ success: false, message: 'Server error checking eligibility.' });
  }
};

// Search & List Donors
exports.getDonors = async (req, res) => {
  try {
    const { blood_group, city, search, eligible_only } = req.query;
    let sql = `SELECT * FROM donors WHERE 1=1`;
    const params = [];

    if (blood_group) {
      params.push(blood_group);
      sql += ` AND blood_group = $${params.length}`;
    }

    if (city) {
      params.push(`%${city.trim()}%`);
      sql += ` AND (city LIKE $${params.length} OR state LIKE $${params.length})`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name LIKE $${params.length} OR email LIKE $${params.length} OR mobile LIKE $${params.length})`;
    }

    sql += ` ORDER BY id DESC`;

    const result = await query(sql, params);

    // Compute eligibility status for each donor
    const donorsWithEligibility = result.rows.map(donor => {
      const el = checkEligibility({
        dob: donor.dob,
        weight: donor.weight,
        lastDonationDate: donor.last_donation_date,
      });
      return {
        ...donor,
        is_eligible: el.isEligible,
        eligibility_reason: el.reason,
        days_remaining: el.daysRemaining,
        next_eligible_date: el.nextEligibleDate,
      };
    });

    const filtered = eligible_only === 'true'
      ? donorsWithEligibility.filter(d => d.is_eligible)
      : donorsWithEligibility;

    return res.json({
      success: true,
      donors: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error('Get donors error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching donors.' });
  }
};

// Get single donor by ID with donation history
exports.getDonorById = async (req, res) => {
  try {
    const { id } = req.params;
    const donorRes = await query(`SELECT * FROM donors WHERE id = $1;`, [id]);
    if (donorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const donor = donorRes.rows[0];

    // Fetch donation history & camp registrations
    const historyRes = await query(`
      SELECT cr.*, c.name as camp_name, c.date as camp_date, c.location as camp_location, o.name as organization_name
      FROM camp_registrations cr
      JOIN camps c ON cr.camp_id = c.id
      JOIN organizations o ON c.organization_id = o.id
      WHERE cr.donor_id = $1
      ORDER BY cr.id DESC;
    `, [id]);

    const eligibility = checkEligibility({
      dob: donor.dob,
      weight: donor.weight,
      lastDonationDate: donor.last_donation_date,
    });

    return res.json({
      success: true,
      donor: {
        ...donor,
        eligibility,
        history: historyRes.rows,
      },
    });
  } catch (err) {
    console.error('Get donor by id error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching donor.' });
  }
};

// Get Certificate Data by Certificate ID
exports.getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certRes = await query(`
      SELECT
        cr.id as registration_id,
        cr.certificate_id,
        cr.donation_timestamp,
        cr.blood_bags_collected,
        cr.vital_bp,
        cr.vital_hb,
        d.name as donor_name,
        d.blood_group,
        d.email as donor_email,
        d.mobile as donor_mobile,
        c.name as camp_name,
        c.date as camp_date,
        c.location as camp_location,
        c.city as camp_city,
        o.name as organization_name,
        o.registration_number as org_reg_number,
        o.contact_person as org_officer
      FROM camp_registrations cr
      JOIN donors d ON cr.donor_id = d.id
      JOIN camps c ON cr.camp_id = c.id
      JOIN organizations o ON c.organization_id = o.id
      WHERE cr.certificate_id = $1;
    `, [certificateId]);

    if (certRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Verified donor certificate not found.' });
    }

    return res.json({
      success: true,
      certificate: certRes.rows[0],
    });
  } catch (err) {
    console.error('Get certificate error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving certificate.' });
  }
};

// Update Donor Profile
exports.updateProfile = async (req, res) => {
  try {
    let donorId = null;
    if (req.user.role === 'donor') {
      const donorRes = await query(`SELECT id FROM donors WHERE user_id = $1;`, [req.user.id]);
      if (donorRes.rows.length > 0) {
        donorId = donorRes.rows[0].id;
      }
    } else if (req.body.id) {
      donorId = req.body.id;
    }

    if (!donorId) {
      return res.status(404).json({ success: false, message: 'Donor profile not found.' });
    }

    const { name, weight, mobile, address, city, state, pincode, medical_history, emergency_contact_name, emergency_contact_phone } = req.body;

    await query(`
      UPDATE donors
      SET name = COALESCE($1, name),
          weight = COALESCE($2, weight),
          mobile = COALESCE($3, mobile),
          address = COALESCE($4, address),
          city = COALESCE($5, city),
          state = COALESCE($6, state),
          pincode = COALESCE($7, pincode),
          medical_history = COALESCE($8, medical_history),
          emergency_contact_name = COALESCE($9, emergency_contact_name),
          emergency_contact_phone = COALESCE($10, emergency_contact_phone)
      WHERE id = $11;
    `, [
      name || null,
      weight ? parseFloat(weight) : null,
      mobile || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      medical_history || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      donorId
    ]);

    return res.json({ success: true, message: 'Donor profile updated successfully.' });
  } catch (err) {
    console.error('Update donor profile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};
