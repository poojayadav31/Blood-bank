const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db');
const { logAudit } = require('../utils/auditLogger');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Register Donor
exports.registerDonor = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, blood_group, weight, address, city, state, pincode, medical_history, emergency_contact_name, emergency_contact_phone } = req.body;

    if (!name || !email || !password || !blood_group || !dob || !weight) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password, dob, blood_group, weight).' });
    }

    // Check existing email
    const existing = await query(`SELECT id FROM users WHERE email = $1;`, [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userRes = await query(`
      INSERT INTO users (name, email, password, role, phone, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `, [name, email.toLowerCase().trim(), hashedPassword, 'donor', phone, 'active']);

    const userId = userRes.rows[0]?.id || userRes.insertId;

    // Create donor profile
    const donorRes = await query(`
      INSERT INTO donors (user_id, name, dob, gender, blood_group, weight, mobile, email, address, city, state, pincode, medical_history, emergency_contact_name, emergency_contact_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id;
    `, [userId, name, dob, gender || 'Other', blood_group, parseFloat(weight), phone || '', email.toLowerCase().trim(), address || '', city || '', state || '', pincode || '', medical_history || '', emergency_contact_name || '', emergency_contact_phone || '']);

    const donorId = donorRes.rows[0]?.id || donorRes.insertId;

    const userObj = { id: userId, email: email.toLowerCase().trim(), name, role: 'donor', organization_id: null };
    const token = generateToken(userObj);

    await logAudit({
      userId,
      userRole: 'donor',
      action: 'DONOR_REGISTRATION',
      entityType: 'Donor',
      entityId: donorId,
      details: `New donor registered: ${name} (${blood_group})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Donor account registered successfully.',
      token,
      user: {
        id: userId,
        donor_id: donorId,
        name,
        email: email.toLowerCase().trim(),
        role: 'donor',
        blood_group,
      },
    });
  } catch (err) {
    console.error('Register donor error:', err);
    res.status(500).json({ success: false, message: 'Server error during donor registration.' });
  }
};

// Login (All Roles)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const userRes = await query(`SELECT * FROM users WHERE email = $1;`, [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];

    // Check status
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your organization account registration is pending Super Admin review.' });
    }
    if (user.status === 'suspended' || user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated or suspended.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If org_admin or volunteer, fetch org details
    let orgDetails = null;
    if (user.organization_id) {
      const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [user.organization_id]);
      if (orgRes.rows.length > 0) {
        orgDetails = orgRes.rows[0];
        if (orgDetails.status === 'pending') {
          return res.status(403).json({ success: false, message: 'Your organization registration is awaiting Super Admin approval.' });
        }
        if (orgDetails.status === 'suspended' || orgDetails.status === 'rejected') {
          return res.status(403).json({ success: false, message: `Organization is ${orgDetails.status}. Contact administrator.` });
        }
      }
    }

    // If donor, fetch donor profile
    let donorDetails = null;
    if (user.role === 'donor') {
      const donorRes = await query(`SELECT * FROM donors WHERE user_id = $1;`, [user.id]);
      if (donorRes.rows.length > 0) {
        donorDetails = donorRes.rows[0];
      }
    }

    const token = generateToken(user);

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: `User logged in: ${user.email} (${user.role})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization_id: user.organization_id,
        organization: orgDetails,
        donor: donorDetails,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Get current profile
exports.getMe = async (req, res) => {
  try {
    const userRes = await query(`SELECT id, name, email, role, phone, organization_id, status FROM users WHERE id = $1;`, [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRes.rows[0];
    let organization = null;
    let donor = null;

    if (user.organization_id) {
      const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [user.organization_id]);
      organization = orgRes.rows[0] || null;
    }

    if (user.role === 'donor') {
      const donorRes = await query(`SELECT * FROM donors WHERE user_id = $1;`, [user.id]);
      donor = donorRes.rows[0] || null;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        organization,
        donor,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// Demo quick-login helper for instant evaluator role testing
exports.demoLogin = async (req, res) => {
  try {
    const { role, email } = req.body;
    let targetEmail = email;

    if (!targetEmail && role) {
      const roleMap = {
        super_admin: 'admin@bloodbank.org',
        org_admin: 'admin@redcross.org',
        volunteer: 'volunteer@redcross.org',
        donor: 'john.donor@gmail.com',
      };
      targetEmail = roleMap[role];
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Specify role or email for demo login.' });
    }

    const userRes = await query(`SELECT * FROM users WHERE email = $1;`, [targetEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Demo user ${targetEmail} not found. Please run seed script.` });
    }

    const user = userRes.rows[0];
    let orgDetails = null;
    if (user.organization_id) {
      const orgRes = await query(`SELECT * FROM organizations WHERE id = $1;`, [user.organization_id]);
      orgDetails = orgRes.rows[0] || null;
    }

    let donorDetails = null;
    if (user.role === 'donor') {
      const donorRes = await query(`SELECT * FROM donors WHERE user_id = $1;`, [user.id]);
      donorDetails = donorRes.rows[0] || null;
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Switched demo context to ${user.role} (${user.name})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization_id: user.organization_id,
        organization: orgDetails,
        donor: donorDetails,
      },
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, message: 'Server error in demo login.' });
  }
};
