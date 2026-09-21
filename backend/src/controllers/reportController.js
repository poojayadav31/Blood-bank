const xlsx = require('xlsx');
const { query } = require('../database/db');

// Generate and Fetch Report Data
exports.getReportData = async (req, res) => {
  try {
    const { type = 'inventory', format = 'json', organization_id } = req.query;
    let data = [];
    let reportTitle = 'Report';

    if (type === 'inventory') {
      reportTitle = 'Blood Inventory Report';
      let sql = `
        SELECT o.name as organization, bi.blood_group, bi.available_units, bi.reserved_units, bi.expired_units, bi.issued_units, bi.last_updated
        FROM blood_inventory bi
        JOIN organizations o ON bi.organization_id = o.id
      `;
      const params = [];
      if (organization_id) {
        params.push(organization_id);
        sql += ` WHERE bi.organization_id = $1`;
      }
      sql += ` ORDER BY o.name, bi.blood_group;`;
      const result = await query(sql, params);
      data = result.rows;
    } else if (type === 'camps' || type === 'collection') {
      reportTitle = 'Blood Camps & Collection Report';
      let sql = `
        SELECT c.id, c.name as camp_name, o.name as organization, c.date, c.start_time, c.end_time, c.location, c.city,
               c.expected_blood_bags, c.collected_blood_bags, c.status
        FROM camps c
        JOIN organizations o ON c.organization_id = o.id
      `;
      const params = [];
      if (organization_id) {
        params.push(organization_id);
        sql += ` WHERE c.organization_id = $1`;
      }
      sql += ` ORDER BY c.date DESC;`;
      const result = await query(sql, params);
      data = result.rows;
    } else if (type === 'donors') {
      reportTitle = 'Blood Donors Master Report';
      const result = await query(`
        SELECT d.id, d.name, d.dob, d.gender, d.blood_group, d.weight, d.mobile, d.email, d.city, d.state,
               d.last_donation_date, d.total_donations, d.created_at
        FROM donors d
        ORDER BY d.id DESC;
      `);
      data = result.rows;
    } else if (type === 'organizations') {
      reportTitle = 'Registered Organizations Report';
      const result = await query(`
        SELECT o.id, o.name, o.registration_number, o.type, o.city, o.state, o.contact_person, o.phone, o.email, o.status, o.collection_limit, o.created_at
        FROM organizations o
        ORDER BY o.id DESC;
      `);
      data = result.rows;
    } else if (type === 'requests') {
      reportTitle = 'Hospital Blood Requests Report';
      const result = await query(`
        SELECT br.id, br.hospital_name, br.contact_person, br.contact_phone, br.blood_group, br.quantity, br.urgency, br.status, br.required_by_date, o.name as fulfilled_by
        FROM blood_requests br
        LEFT JOIN organizations o ON br.fulfilled_by_org_id = o.id
        ORDER BY br.id DESC;
      `);
      data = result.rows;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type.' });
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return res.status(200).send('No data available');
      }
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row =>
        Object.values(row).map(val => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
      return res.send(csv);
    } else if (format === 'xlsx') {
      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, reportTitle.slice(0, 30));
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      reportType: type,
      title: reportTitle,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ success: false, message: 'Server error generating report.' });
  }
};
