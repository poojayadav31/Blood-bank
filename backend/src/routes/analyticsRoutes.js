const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/super-admin', verifyToken, requireRole(['super_admin']), analyticsController.getSuperAdminAnalytics);
router.get('/organization', verifyToken, requireRole(['org_admin', 'volunteer']), analyticsController.getOrgAnalytics);

module.exports = router;
