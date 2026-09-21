require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb, query } = require('./db');

async function seed() {
  console.log('🌱 Starting database seeding...');
  await initDb();

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const orgAdminHash = await bcrypt.hash('Org@123', 10);
  const volHash = await bcrypt.hash('Vol@123', 10);
  const donorHash = await bcrypt.hash('Donor@123', 10);

  // 1. Seed Organizations
  console.log('🏢 Seeding Organizations...');
  await query(`DELETE FROM audit_logs;`);
  await query(`DELETE FROM notifications;`);
  await query(`DELETE FROM quota_requests;`);
  await query(`DELETE FROM blood_requests;`);
  await query(`DELETE FROM blood_batches;`);
  await query(`DELETE FROM blood_inventory;`);
  await query(`DELETE FROM camp_registrations;`);
  await query(`DELETE FROM donors;`);
  await query(`DELETE FROM camps;`);
  await query(`DELETE FROM users;`);
  await query(`DELETE FROM organizations;`);

  const org1Res = await query(`
    INSERT INTO organizations (name, registration_number, type, address, city, state, pincode, contact_person, phone, email, website, status, collection_limit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id;
  `, [
    'Brahma Kumaris Global Hospital & Blood Bank',
    'ORG-BK-2024-001',
    'Charitable Trust Blood Bank',
    'BSES MG Hospital, S.V. Road, Andheri West',
    'Mumbai',
    'Maharashtra',
    '400058',
    'Dr. Ashok Mehta',
    '+91 98765 43210',
    'admin@redcross.org',
    'https://ghrc-bk.org',
    'approved',
    300
  ]);
  const org1Id = org1Res.rows[0]?.id || org1Res.insertId || 1;

  const org2Res = await query(`
    INSERT INTO organizations (name, registration_number, type, address, city, state, pincode, contact_person, phone, email, website, status, collection_limit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id;
  `, [
    'Shakti Social Welfare Foundation Blood Centre',
    'ORG-SHAKTI-2024-002',
    'Social Welfare NGO',
    'Plot 12, Institutional Area, Sector 62',
    'Noida',
    'Uttar Pradesh',
    '201301',
    'Dr. Sunita Sharma',
    '+91 98220 12345',
    'admin@lifecare.org',
    'https://shaktifoundation.org.in',
    'approved',
    300
  ]);
  const org2Id = org2Res.rows[0]?.id || org2Res.insertId || 2;

  const org3Res = await query(`
    INSERT INTO organizations (name, registration_number, type, address, city, state, pincode, contact_person, phone, email, website, status, collection_limit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id;
  `, [
    'Sant Nirankari Charitable Blood Centre',
    'ORG-SNCF-2024-003',
    'Charitable Foundation',
    'Nirankari Chowk, Burari Road',
    'New Delhi',
    'Delhi',
    '110009',
    'Dr. Harish Kumar',
    '+91 98450 67890',
    'admin@apexblood.org',
    'https://nirankarifoundation.org',
    'pending',
    300
  ]);
  const org3Id = org3Res.rows[0]?.id || org3Res.insertId || 3;

  const org4Res = await query(`
    INSERT INTO organizations (name, registration_number, type, address, city, state, pincode, contact_person, phone, email, website, status, collection_limit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id;
  `, [
    'Sankalp India Foundation Blood Bank',
    'ORG-SIF-2024-004',
    'Voluntary Blood Foundation',
    '460/G, 8th Main Road, Jayanagar 4th Block',
    'Bengaluru',
    'Karnataka',
    '560011',
    'Dr. Suresh Shastri',
    '+91 97555 11223',
    'admin@citycare.org',
    'https://sankalpindia.net',
    'approved',
    300
  ]);
  const org4Id = org4Res.rows[0]?.id || org4Res.insertId || 4;

  // 2. Seed Users
  console.log('👤 Seeding Users for all Roles...');
  // Super Admin
  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Central Super Admin', 'admin@bloodbank.org', passwordHash, 'super_admin', '+91 90000 00001', null, 'active']);

  // Org 1 Admin & Volunteer (Brahma Kumaris)
  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Dr. Ashok Mehta (Brahma Kumaris)', 'admin@redcross.org', orgAdminHash, 'org_admin', '+91 98765 43210', org1Id, 'active']);

  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Rahul Sharma (Volunteer)', 'volunteer@redcross.org', volHash, 'volunteer', '+91 98765 43211', org1Id, 'active']);

  // Org 2 Admin (Shakti Foundation)
  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Dr. Sunita Sharma (Shakti Foundation)', 'admin@lifecare.org', orgAdminHash, 'org_admin', '+91 98220 12345', org2Id, 'active']);

  // Org 3 Admin (Sant Nirankari - Pending Org)
  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Dr. Harish Kumar (Sant Nirankari)', 'admin@apexblood.org', orgAdminHash, 'org_admin', '+91 98450 67890', org3Id, 'pending']);

  // Org 4 Admin (Sankalp India Foundation)
  await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `, ['Dr. Suresh Shastri (Sankalp India)', 'admin@citycare.org', orgAdminHash, 'org_admin', '+91 97555 11223', org4Id, 'active']);

  // Donors
  const donor1User = await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
  `, ['John Doe', 'john.donor@gmail.com', donorHash, 'donor', '+91 99887 76655', null, 'active']);
  const donor1UserId = donor1User.rows[0]?.id || donor1User.insertId || 6;

  const donor2User = await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
  `, ['Sarah Connor', 'sarah.donor@gmail.com', donorHash, 'donor', '+91 99887 76656', null, 'active']);
  const donor2UserId = donor2User.rows[0]?.id || donor2User.insertId || 7;

  const donor3User = await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
  `, ['Michael Smith', 'michael.donor@gmail.com', donorHash, 'donor', '+91 99887 76657', null, 'active']);
  const donor3UserId = donor3User.rows[0]?.id || donor3User.insertId || 8;

  const donor4User = await query(`
    INSERT INTO users (name, email, password, role, phone, organization_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
  `, ['Priya Sharma', 'priya.donor@gmail.com', donorHash, 'donor', '+91 99887 76658', null, 'active']);
  const donor4UserId = donor4User.rows[0]?.id || donor4User.insertId || 9;

  // 3. Seed Donors Profile
  console.log('🩸 Seeding Donors Profile & Eligibility stats...');
  // Eligible Donor (Last donated 120 days ago)
  const d1Res = await query(`
    INSERT INTO donors (user_id, name, dob, gender, blood_group, weight, mobile, email, address, city, state, pincode, last_donation_date, medical_history, emergency_contact_name, emergency_contact_phone, total_donations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id;
  `, [donor1UserId, 'John Doe', '1998-05-14', 'Male', 'O+', 68.5, '+91 99887 76655', 'john.donor@gmail.com', 'Flat 402, Green Park', 'New Delhi', 'Delhi', '110016', '2026-05-20', 'No chronic illnesses, non-smoker.', 'Mary Doe', '+91 99887 76600', 3]);
  const donor1Id = d1Res.rows[0]?.id || d1Res.insertId || 1;

  // Ineligible Donor (Last donated 45 days ago -> violates 90-day gap rule)
  const d2Res = await query(`
    INSERT INTO donors (user_id, name, dob, gender, blood_group, weight, mobile, email, address, city, state, pincode, last_donation_date, medical_history, emergency_contact_name, emergency_contact_phone, total_donations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id;
  `, [donor2UserId, 'Sarah Connor', '1994-08-22', 'Female', 'A+', 56.0, '+91 99887 76656', 'sarah.donor@gmail.com', '12 Palms Street, Bandra', 'Mumbai', 'Maharashtra', '400050', '2026-08-07', 'None', 'Kyle Reese', '+91 99887 76601', 5]);
  const donor2Id = d2Res.rows[0]?.id || d2Res.insertId || 2;

  // Ineligible Donor (Underweight: 42 kg < 45 kg)
  const d3Res = await query(`
    INSERT INTO donors (user_id, name, dob, gender, blood_group, weight, mobile, email, address, city, state, pincode, last_donation_date, medical_history, emergency_contact_name, emergency_contact_phone, total_donations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id;
  `, [donor3UserId, 'Michael Smith', '2007-02-10', 'Male', 'B+', 42.5, '+91 99887 76657', 'michael.donor@gmail.com', '54 MG Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', null, 'Mild seasonal allergy', 'Robert Smith', '+91 99887 76602', 0]);
  const donor3Id = d3Res.rows[0]?.id || d3Res.insertId || 3;

  // Eligible Donor (First time donor, 24 years old)
  const d4Res = await query(`
    INSERT INTO donors (user_id, name, dob, gender, blood_group, weight, mobile, email, address, city, state, pincode, last_donation_date, medical_history, emergency_contact_name, emergency_contact_phone, total_donations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id;
  `, [donor4UserId, 'Priya Sharma', '2002-11-03', 'Female', 'AB+', 58.0, '+91 99887 76658', 'priya.donor@gmail.com', '7 Shankar Nagar', 'Raipur', 'Chhattisgarh', '492007', null, 'Healthy', 'Amit Sharma', '+91 99887 76603', 0]);
  const donor4Id = d4Res.rows[0]?.id || d4Res.insertId || 4;

  // 4. Seed Camps (Ensuring distinct, non-overlapping dates & times)
  console.log('⛺ Seeding Blood Donation Camps with distinct conflict-free dates...');
  const camp1Res = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, collected_blood_bags, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id;
  `, [
    org1Id,
    'Brahma Kumaris Mega Voluntary Blood Camp 2026',
    'Brahma Kumaris Global Hospital',
    'BSES MG Hospital Auditorium',
    'S.V. Road, Andheri West',
    'Mumbai',
    'Maharashtra',
    '2026-10-10',
    '09:00',
    '15:00',
    250,
    200,
    145,
    'Annual mega voluntary blood donation drive organized by Brahma Kumaris Global Hospital. Providing safe blood for emergency surgeries and thalassemia patients.',
    'active'
  ]);
  const camp1Id = camp1Res.rows[0]?.id || camp1Res.insertId || 1;

  // Camp 2 on DISTINCT Date (15 Oct 2026, 10:00 - 16:00)
  const camp2Res = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, collected_blood_bags, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id;
  `, [
    org2Id,
    'Shakti Foundation Health & Blood Drive',
    'Shakti Social Welfare Foundation',
    'Institutional Area Community Centre',
    'Sector 62, Near Metro Station',
    'Noida',
    'Uttar Pradesh',
    '2026-10-15',
    '10:00',
    '16:00',
    300,
    280,
    192,
    'Voluntary community drive powering regional hospital reserves during the festive period.',
    'active'
  ]);
  const camp2Id = camp2Res.rows[0]?.id || camp2Res.insertId || 2;

  // Camp 3 on DISTINCT Date (22 Oct 2026, 09:30 - 15:30)
  const camp3Res = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, collected_blood_bags, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id;
  `, [
    org1Id,
    'Sant Nirankari Voluntary Youth Drive',
    'Sant Nirankari Charitable Foundation',
    'Nirankari Grounds Complex',
    'Burari Road, Model Town',
    'New Delhi',
    'Delhi',
    '2026-10-22',
    '09:30',
    '15:30',
    180,
    150,
    0,
    'Youth voluntary blood drive providing free health checkup, refreshment packs, and authenticated digital certificates.',
    'scheduled'
  ]);
  const camp3Id = camp3Res.rows[0]?.id || camp3Res.insertId || 3;

  // Camp 4 (Completed Past Drive)
  const camp4Res = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, collected_blood_bags, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id;
  `, [
    org4Id,
    'Sankalp Thalassemia Lifeline Blood Camp',
    'Sankalp India Foundation Blood Bank',
    'Town Hall Auditorium',
    'Jayanagar 4th Block',
    'Bengaluru',
    'Karnataka',
    '2026-09-15',
    '08:30',
    '15:30',
    250,
    220,
    210,
    'Completed community drive with 210 collected units dedicated to thalassemia patient transfusions.',
    'completed'
  ]);
  const camp4Id = camp4Res.rows[0]?.id || camp4Res.insertId || 4;

  // 5. Seed Camp Registrations & QR Passes
  console.log('🎫 Seeding Camp Registrations & QR Passes...');
  await query(`
    INSERT INTO camp_registrations (camp_id, donor_id, qr_code_token, status, vital_bp, vital_hb, vital_weight, blood_bags_collected, certificate_id, donation_timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
  `, [
    camp1Id,
    donor1Id,
    'QR-PASS-CAMP1-D1-987123',
    'donated',
    '120/80',
    14.2,
    68.5,
    1,
    'CERT-2026-RC-009182',
    '2026-09-20 11:30:00'
  ]);

  await query(`
    INSERT INTO camp_registrations (camp_id, donor_id, qr_code_token, status, rejection_reason)
    VALUES ($1, $2, $3, $4, $5);
  `, [
    camp1Id,
    donor2Id,
    'QR-PASS-CAMP1-D2-554411',
    'deferred',
    'Recent donation within 90 days (last donated 45 days ago).'
  ]);

  await query(`
    INSERT INTO camp_registrations (camp_id, donor_id, qr_code_token, status)
    VALUES ($1, $2, $3, $4);
  `, [
    camp3Id,
    donor4Id,
    'QR-PASS-CAMP3-D4-771122',
    'registered'
  ]);

  // 6. Seed Blood Inventory for all 8 Blood Groups across Organizations
  console.log('🧪 Seeding Blood Inventories...');
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const orgsList = [org1Id, org2Id, org4Id];

  for (const orgId of orgsList) {
    for (const bg of bloodGroups) {
      const avail = Math.floor(Math.random() * 25) + 8; // 8 to 32 units
      const reserved = Math.floor(Math.random() * 4);
      const expired = Math.floor(Math.random() * 3);
      const issued = Math.floor(Math.random() * 30) + 10;

      await query(`
        INSERT INTO blood_inventory (organization_id, blood_group, available_units, reserved_units, expired_units, issued_units)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [orgId, bg, avail, reserved, expired, issued]);

      // Seed batches
      await query(`
        INSERT INTO blood_batches (organization_id, camp_id, blood_group, units, collection_date, expiry_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [orgId, camp1Id, bg, avail, '2026-09-10', '2026-10-22', 'available']);
    }
  }

  // 7. Seed Quota Requests
  console.log('📊 Seeding Quota Requests (Approval Workflow)...');
  // Pending request for Brahma Kumaris: 300 bags
  await query(`
    INSERT INTO quota_requests (organization_id, current_limit, requested_limit, reason, supporting_doc_url, status)
    VALUES ($1, $2, $3, $4, $5, $6);
  `, [
    org1Id,
    200,
    300,
    'Conducting State Mega Disaster Preparedness & Trauma Camp covering 4 university campuses. Requesting approval for maximum 300 bags.',
    '/uploads/quota_docs/bk_expansion_letter.pdf',
    'pending'
  ]);

  // Approved request for Sankalp India: 300 bags
  await query(`
    INSERT INTO quota_requests (organization_id, current_limit, requested_limit, reason, supporting_doc_url, status, admin_remarks, reviewed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `, [
    org4Id,
    200,
    300,
    'City-wide festival health drive in partnership with local municipal corporation and 6 charitable clinics.',
    '/uploads/quota_docs/sankalp_annual_fest.pdf',
    'approved',
    'Approved for maximum standard limit of 300 bags based on certified storage capacity.',
    '2026-09-01 14:00:00'
  ]);

  // 8. Seed Hospital Blood Requests
  console.log('🏥 Seeding Hospital Blood Requests...');
  await query(`
    INSERT INTO blood_requests (hospital_name, contact_person, contact_phone, contact_email, blood_group, quantity, urgency, patient_case, required_by_date, status, fulfilled_by_org_id, fulfilled_units)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
  `, [
    'Apollo Multi-Specialty Hospital',
    'Dr. K. S. Mehra (Trauma ICU)',
    '+91 98111 22334',
    'icu@apollohospitals.org',
    'O-',
    4,
    'Critical',
    'Multiple trauma emergency road accident surgery, immediate whole blood required.',
    '2026-09-21',
    'pending',
    null,
    0
  ]);

  await query(`
    INSERT INTO blood_requests (hospital_name, contact_person, contact_phone, contact_email, blood_group, quantity, urgency, patient_case, required_by_date, status, fulfilled_by_org_id, fulfilled_units, remarks)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
  `, [
    'Fortis Memorial Research Institute',
    'Dr. Neha Kapoor (Blood Bank In-Charge)',
    '+91 98222 33445',
    'bloodbank@fortishealthcare.com',
    'A+',
    6,
    'Urgent',
    'Cardiovascular bypass graft surgery scheduled for 3 elderly patients.',
    '2026-09-22',
    'fulfilled',
    org1Id,
    6,
    'Fulfilled in full by Brahma Kumaris Global Hospital & Blood Bank.'
  ]);

  await query(`
    INSERT INTO blood_requests (hospital_name, contact_person, contact_phone, contact_email, blood_group, quantity, urgency, patient_case, required_by_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
  `, [
    'Max Super Speciality Hospital',
    'Dr. Arvinder Singh (Oncology Ward)',
    '+91 98333 44556',
    'oncology@maxhealthcare.com',
    'B+',
    3,
    'Normal',
    'Chemotherapy supportive transfusion for leukemia patient.',
    '2026-09-24',
    'pending'
  ]);

  // 9. Seed Audit Logs (Including logged 300-bag violation attempt!)
  console.log('🛡️ Seeding Audit Logs & Violation attempts...');
  await query(`
    INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip_address, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `, [
    2,
    'org_admin',
    'CAMP_CREATION_ATTEMPT_LIMIT_EXCEEDED',
    'Camp',
    'NEW',
    'Organization "Brahma Kumaris" attempted to create a camp with 380 expected blood bags exceeding the maximum limit of 300 bags. Request blocked.',
    '127.0.0.1',
    'violation_attempt'
  ]);

  await query(`
    INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip_address, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `, [
    1,
    'super_admin',
    'QUOTA_APPROVAL',
    'QuotaRequest',
    '2',
    'Super Admin approved standard quota of 300 bags for Sankalp India Foundation Blood Bank.',
    '127.0.0.1',
    'success'
  ]);

  await query(`
    INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip_address, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `, [
    1,
    'super_admin',
    'ORGANIZATION_APPROVED',
    'Organization',
    '1',
    'Super Admin approved registration for Brahma Kumaris Global Hospital & Blood Bank.',
    '127.0.0.1',
    'success'
  ]);

  // 10. Seed Notifications
  console.log('🔔 Seeding Notifications...');
  await query(`
    INSERT INTO notifications (user_id, role, organization_id, title, message, type)
    VALUES ($1, $2, $3, $4, $5, $6);
  `, [
    1,
    'super_admin',
    null,
    'New Quota Request Submitted',
    'Brahma Kumaris Global Hospital & Blood Bank has requested collection limit of 300 blood bags.',
    'quota'
  ]);

  await query(`
    INSERT INTO notifications (user_id, role, organization_id, title, message, type)
    VALUES ($1, $2, $3, $4, $5, $6);
  `, [
    null,
    'org_admin',
    org1Id,
    'Emergency Blood Request Pending',
    'Apollo Multi-Specialty Hospital has requested 4 units of critical O- blood.',
    'request'
  ]);

  console.log('✅ Database seeded successfully with realistic data!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seed;
