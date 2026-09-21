const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', verifyToken, requireRole(['super_admin', 'org_admin']), reportController.getReportData);

module.exports = router;
