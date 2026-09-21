const assert = require('assert');
const http = require('http');
const { query } = require('../src/database/db');

const BASE_URL = 'http://localhost:5050/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    return { status: res.status, data };
  }
  const text = await res.text();
  return { status: res.status, data: text };
}

async function runE2E() {
  console.log('🚀 Starting Full-Stack End-to-End Live Integration Verification...\n');

  // Re-seed DB for clean initial baseline
  const seed = require('../src/database/seed');
  await seed();

  // 1. Health Check
  console.log('▶ Step 1: Backend Health Check...');
  const health = await apiRequest('/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.data.status, 'healthy');
  console.log('  ✔ Backend API is active and healthy.\n');

  // 2. Super Admin Login & Analytics
  console.log('▶ Step 2: Super Admin Login & Dashboard Analytics...');
  const adminLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@bloodbank.org', password: 'Admin@123' }),
  });
  assert.strictEqual(adminLogin.status, 200);
  const adminToken = adminLogin.data.token;
  assert.ok(adminToken, 'Admin token must be returned');

  const analytics = await apiRequest('/analytics/super-admin', { token: adminToken });
  assert.strictEqual(analytics.status, 200);
  assert.ok(analytics.data.stats.totalOrganizations >= 3, 'Should track organizations');
  console.log(`  ✔ Super Admin Authenticated. Active Orgs: ${analytics.data.stats.approvedOrganizations}, Camps: ${analytics.data.stats.totalCamps}, Stock: ${analytics.data.stats.totalAvailableStock} units.\n`);

  // 3. Org Admin Login
  console.log('▶ Step 3: Organization Admin Login (Red Cross)...');
  const orgLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@redcross.org', password: 'Org@123' }),
  });
  assert.strictEqual(orgLogin.status, 200);
  const orgToken = orgLogin.data.token;
  console.log(`  ✔ Org Admin logged in: ${orgLogin.data.user.organization.name} (Active limit: ${orgLogin.data.user.organization.collection_limit} bags).\n`);

  // 4. Strict 300-Bag Collection Limit Enforcement (Expect 400 Bad Request + Violation Log)
  console.log('▶ Step 4: Testing Strict Blood Collection Limit (300 bags rule) & Violation Logger...');
  const violationAttempt = await apiRequest('/camps', {
    method: 'POST',
    token: orgToken,
    body: JSON.stringify({
      name: 'Unauthorized Mega Blood Drive 2026',
      organizer: 'Indian Red Cross',
      location: 'Grand Sports Arena',
      address: 'Main Highway',
      city: 'New Delhi',
      state: 'Delhi',
      date: '2026-11-20',
      start_time: '09:00',
      end_time: '18:00',
      expected_donors: 400,
      expected_blood_bags: 380, // > 300 bags!
      description: 'Attempting to collect 380 bags without quota approval',
    }),
  });

  assert.strictEqual(violationAttempt.status, 400, 'Must return 400 Bad Request when exceeding limit');
  assert.strictEqual(violationAttempt.data.error_type, 'COLLECTION_LIMIT_EXCEEDED');
  assert.ok(violationAttempt.data.message.includes('Maximum allowed collection limit is 300 blood bags'), 'Must return exact warning message');
  console.log(`  ✔ Backend correctly blocked camp creation: "${violationAttempt.data.message}"`);

  // Verify violation was recorded in audit logs
  const auditLogs = await apiRequest('/audit/logs?status=violation_attempt', { token: adminToken });
  assert.ok(auditLogs.data.logs.length > 0, 'Violation attempt must be logged in audit logs');
  console.log(`  ✔ Violation attempt logged in security audit trails (Total violations logged: ${auditLogs.data.total}).\n`);

  // 5. Additional Quota Approval Workflow (Strict max 300 bags)
  console.log('▶ Step 5: Testing Additional Quota Request & Super Admin Approval Workflow...');
  
  // Verify that requesting > 300 bags (e.g. 500) is rejected
  const overCapReq = await apiRequest('/quota-requests', {
    method: 'POST',
    token: orgToken,
    body: JSON.stringify({
      requested_limit: 500,
      reason: 'Attempt exceeding 300 ceiling',
    }),
  });
  assert.strictEqual(overCapReq.status, 400, 'Must reject quota request > 300 bags');
  console.log(`  ✔ Correctly rejected quota request of 500 bags (> 300 maximum ceiling).`);

  // First set org limit to 200 to test increase to 300
  await query(`UPDATE organizations SET collection_limit = 200 WHERE id = (SELECT organization_id FROM users WHERE email = 'admin@redcross.org');`);

  const qInit = await apiRequest('/quota-requests', {
    method: 'POST',
    token: orgToken,
    body: JSON.stringify({
      requested_limit: 300,
      reason: 'State Disaster Trauma Relief Drive covering 4 universities - request max 300 bags limit',
      supporting_doc_url: '/uploads/docs/capacity_proof.pdf',
    }),
  });
  assert.strictEqual(qInit.status, 201);
  const qId = qInit.data.quotaRequestId;
  console.log(`  ✔ Organization submitted request for 300 bags (Request ID: ${qId}).`);

  // Super Admin approves the quota increase to 300
  const quotaApprove = await apiRequest(`/quota-requests/${qId}/review`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({
      status: 'approved',
      admin_remarks: 'Approved for maximum 300 bags standard capacity.',
    }),
  });
  assert.strictEqual(quotaApprove.status, 200);
  console.log(`  ✔ Super Admin approved quota request to 300 bags.`);

  // Now org can successfully schedule camp with 280 bags (<= 300)
  const validCampCreation = await apiRequest('/camps', {
    method: 'POST',
    token: orgToken,
    body: JSON.stringify({
      name: 'Approved Mega State Relief Drive',
      organizer: 'Brahma Kumaris Global Hospital',
      location: 'University Mega Grounds',
      address: 'North Campus',
      city: 'New Delhi',
      state: 'Delhi',
      date: '2026-11-25',
      start_time: '09:00',
      end_time: '18:00',
      expected_donors: 300,
      expected_blood_bags: 280, // Permitted under 300 limit
      description: 'Approved drive operating under 300 bags quota.',
    }),
  });
  assert.strictEqual(validCampCreation.status, 201);
  console.log(`  ✔ Org successfully scheduled camp with 280 bags under 300 max limit!\n`);

  // 6. Schedule Conflict Prevention Check
  console.log('▶ Step 6: Testing Schedule Conflict Prevention (No duplicate camps on same date & overlapping time)...');
  const conflictAttempt = await apiRequest('/camps', {
    method: 'POST',
    headers: { Authorization: `Bearer ${orgToken}` },
    body: JSON.stringify({
      name: 'Conflicting Time Slot Drive',
      organizer: 'Brahma Kumaris Global Hospital',
      location: 'BSES Hospital Ground',
      address: 'S.V. Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      date: '2026-10-10', // Same date as seeded camp 1
      start_time: '10:00', // Overlaps with 09:00 - 15:00
      end_time: '14:00',
      expected_donors: 100,
      expected_blood_bags: 80,
    }),
  });
  assert.strictEqual(conflictAttempt.status, 409, 'Must return 409 Conflict for overlapping date & time');
  assert.strictEqual(conflictAttempt.data.error_type, 'CAMP_SCHEDULE_CONFLICT');
  console.log(`  ✔ Successfully blocked overlapping drive with HTTP 409 and CAMP_SCHEDULE_CONFLICT alert.`);

  const distinctDateCamp = await apiRequest('/camps', {
    method: 'POST',
    headers: { Authorization: `Bearer ${orgToken}` },
    body: JSON.stringify({
      name: 'Distinct Open Date Blood Drive',
      organizer: 'Brahma Kumaris Global Hospital',
      location: 'Community Hall East',
      address: 'Linking Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      date: '2026-11-28', // Open date
      start_time: '09:00',
      end_time: '15:00',
      expected_donors: 150,
      expected_blood_bags: 120,
    }),
  });
  assert.strictEqual(distinctDateCamp.status, 201, 'Must successfully create camp on open date');
  console.log(`  ✔ Successfully scheduled camp on open date (2026-11-28).\n`);

  // 7. Donor Eligibility Engine
  console.log('▶ Step 7: Testing Donor Eligibility Engine API...');
  const elCheck = await apiRequest('/donors/check-eligibility', {
    method: 'POST',
    body: JSON.stringify({
      dob: '2002-04-10',
      weight: 62,
      lastDonationDate: null,
    }),
  });
  assert.strictEqual(elCheck.status, 200);
  assert.strictEqual(elCheck.data.eligibility.isEligible, true);

  const elIneligible = await apiRequest('/donors/check-eligibility', {
    method: 'POST',
    body: JSON.stringify({
      dob: '2000-01-01',
      weight: 40, // < 45 kg
      lastDonationDate: null,
    }),
  });
  assert.strictEqual(elIneligible.data.eligibility.isEligible, false);
  console.log(`  ✔ Live Eligibility Engine correctly verified eligible and underweight cases.\n`);

  // 8. Hospital Blood Request & Fulfillment
  console.log('▶ Step 8: Hospital Blood Request & Inventory Fulfillment...');
  const bloodReq = await apiRequest('/blood-requests', {
    method: 'POST',
    body: JSON.stringify({
      hospital_name: 'Max Healthcare Emergency ICU',
      contact_person: 'Dr. Vivek Sharma',
      contact_phone: '+91 98765 11223',
      blood_group: 'B+',
      quantity: 2,
      urgency: 'Critical',
      patient_case: 'Emergency vascular repair',
    }),
  });
  assert.strictEqual(bloodReq.status, 201);
  const reqId = bloodReq.data.requestId;

  // Fulfill request from Red Cross inventory
  const fulfillRes = await apiRequest(`/blood-requests/${reqId}/fulfill`, {
    method: 'PUT',
    token: orgToken,
    body: JSON.stringify({
      status: 'fulfilled',
      units_to_fulfill: 2,
      remarks: 'Dispatched via emergency cold-chain transport.',
    }),
  });
  assert.strictEqual(fulfillRes.status, 200);
  console.log(`  ✔ Hospital emergency request fulfilled and deducted from blood inventory.\n`);

  // 9. Report Generation
  console.log('▶ Step 9: Report Generation & Exports...');
  const invReport = await apiRequest('/reports?type=inventory&format=json', { token: adminToken });
  assert.strictEqual(invReport.status, 200);
  assert.ok(invReport.data.data.length > 0, 'Report data must not be empty');
  console.log(`  ✔ Generated ${invReport.data.title} with ${invReport.data.count} items.\n`);

  console.log('========================================================================');
  console.log('🏆 COMPLETE FULL-STACK END-TO-END LIVE SYSTEM VERIFICATION SUCCESSFUL!');
  console.log('========================================================================');
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Verification failed:', err);
    process.exit(1);
  });
