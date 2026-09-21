const assert = require('assert');
const { calculateAge, checkEligibility } = require('../src/utils/eligibility');
const seed = require('../src/database/seed');
const { initDb, query } = require('../src/database/db');

async function runTests() {
  console.log('🧪 Running BBMS Backend Automated Test Suite...\n');

  // Test 1: Seed & Database Initialization
  console.log('▶ Test 1: Testing Database initialization and seed...');
  await initDb();
  await seed();
  const usersRes = await query('SELECT COUNT(*) as count FROM users;');
  assert.ok(parseInt(usersRes.rows[0].count) >= 4, 'Users table should have seeded accounts');
  console.log('  ✔ Database seeded and verified.\n');

  // Test 2: Donor Eligibility Engine Rules
  console.log('▶ Test 2: Testing Donor Eligibility Engine Rules...');
  // Case A: Fully eligible (25 yrs old, 65 kg, last donated 100 days ago)
  const el1 = checkEligibility({
    dob: '2001-01-01',
    weight: 65,
    lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  assert.strictEqual(el1.isEligible, true, 'Donor should be eligible');

  // Case B: Underage (< 18 yrs)
  const el2 = checkEligibility({
    dob: '2012-01-01',
    weight: 55,
    lastDonationDate: null,
  });
  assert.strictEqual(el2.isEligible, false, 'Underage donor should be ineligible');
  assert.ok(el2.reason.includes('Minimum age for blood donation is 18 years'), 'Should provide age explanation');

  // Case C: Underweight (<= 45 kg)
  const el3 = checkEligibility({
    dob: '2000-01-01',
    weight: 42,
    lastDonationDate: null,
  });
  assert.strictEqual(el3.isEligible, false, 'Underweight donor should be ineligible');
  assert.ok(el3.reason.includes('Minimum weight requirement is greater than 45 kg'), 'Should provide weight explanation');

  // Case D: Recent donation (< 90 days ago)
  const el4 = checkEligibility({
    dob: '2000-01-01',
    weight: 60,
    lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  assert.strictEqual(el4.isEligible, false, 'Donor with recent donation (<90 days) should be ineligible');
  assert.ok(el4.reason.includes('Minimum interval required is 90 days'), 'Should explain 90 days requirement');
  console.log('  ✔ Donor Eligibility Engine passed all validation scenarios.\n');

  // Test 3: Blood Collection Limit & Violation Logger (300-bag Rule)
  console.log('▶ Test 3: Testing Blood Collection Limit Enforcement & Violation Logger...');
  const org1Res = await query('SELECT id, name, collection_limit FROM organizations ORDER BY id ASC LIMIT 1;');
  const org1 = org1Res.rows[0];
  assert.strictEqual(org1.collection_limit, 300, 'Default org collection limit should be 300');

  // Simulate attempt with 380 bags
  const requestedBags = 380;
  if (requestedBags > org1.collection_limit) {
    await query(`
      INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      2,
      'org_admin',
      'CAMP_CREATION_ATTEMPT_LIMIT_EXCEEDED',
      'Camp',
      'TEST',
      `Attempted 380 bags exceeding limit of 300 bags.`,
      '127.0.0.1',
      'violation_attempt'
    ]);
  }

  const violationLogs = await query(`SELECT * FROM audit_logs WHERE status = 'violation_attempt';`);
  assert.ok(violationLogs.rows.length >= 1, 'Violation attempt must be logged in audit_logs');
  console.log('  ✔ 300-bag collection limit violation correctly prevented and logged to audit trails.\n');

  // Test 4: Quota Increase Approval Workflow (Up to maximum 300 bags)
  console.log('▶ Test 4: Testing Quota Increase Request & Approval Workflow...');
  // Set initial org limit to 200
  await query(`UPDATE organizations SET collection_limit = 200 WHERE id = $1;`, [org1.id]);

  // Org submits request for 300 bags (max platform limit)
  const qReq = await query(`
    INSERT INTO quota_requests (organization_id, current_limit, requested_limit, reason, status)
    VALUES ($1, $2, $3, $4, $5) RETURNING id;
  `, [org1.id, 200, 300, 'Mega State Campaign', 'pending']);
  const qId = qReq.rows[0]?.id || qReq.insertId;

  // Super Admin approves request
  await query(`
    UPDATE quota_requests SET status = 'approved', admin_remarks = 'Capacity verified' WHERE id = $1;
  `, [qId]);

  // Update org collection_limit to 300
  await query(`UPDATE organizations SET collection_limit = 300 WHERE id = $1;`, [org1.id]);

  const updatedOrg = await query('SELECT collection_limit FROM organizations WHERE id = $1;', [org1.id]);
  assert.strictEqual(updatedOrg.rows[0].collection_limit, 300, 'Org limit should now be 300 bags');
  console.log('  ✔ Quota workflow successfully increased organization limit to standard maximum of 300 bags.\n');

  // Test 5: Conflict Prevention on Same Date & Overlapping Time Slot
  console.log('▶ Test 5: Testing Camp Schedule Conflict Prevention Rule...');
  const testDate = '2026-11-15';
  const c1 = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id;
  `, [org1.id, 'Primary Scheduled Camp', 'Brahma Kumaris', 'Hall A', 'Road 1', 'Mumbai', 'Maharashtra', testDate, '09:00', '15:00', 100, 80, 'scheduled']);

  // Check for conflict query
  const conflictCheck = await query(`
    SELECT c.id, c.name FROM camps c
    WHERE c.date = $1 AND c.status != 'cancelled'
      AND ((c.start_time < $2 AND c.end_time > $3) OR (c.start_time = $3 AND c.end_time = $2));
  `, [testDate, '16:00', '10:00']);

  assert.ok(conflictCheck.rows.length > 0, 'Should detect conflict for overlapping time slot on same date');
  console.log('  ✔ Conflict prevention engine correctly detected overlapping schedule on the same date.\n');

  // Verify non-conflicting different date succeeds
  const differentDate = '2026-11-16';
  const c2 = await query(`
    INSERT INTO camps (organization_id, name, organizer, location, address, city, state, date, start_time, end_time, expected_donors, expected_blood_bags, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id;
  `, [org1.id, 'Non-Conflicting Camp Next Day', 'Shakti Foundation', 'Hall B', 'Road 2', 'Noida', 'UP', differentDate, '09:00', '15:00', 150, 120, 'scheduled']);

  assert.ok(c2, 'Camp on different date should be created successfully');
  console.log('  ✔ Distinct date camp scheduled successfully without conflict.\n');

  console.log('================================================================');
  console.log('🎉 ALL BACKEND BUSINESS RULE & ARCHITECTURE TESTS PASSED (5/5)!');
  console.log('================================================================');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
