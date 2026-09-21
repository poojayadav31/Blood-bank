const express = require('express');
const router = express.Router();
const quotaController = require('../controllers/quotaController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/', verifyToken, requireRole(['super_admin', 'org_admin']), quotaController.submitQuotaRequest);
router.get('/', verifyToken, requireRole(['super_admin', 'org_admin']), quotaController.getQuotaRequests);
router.put('/:id/review', verifyToken, requireRole(['super_admin']), quotaController.reviewQuotaRequest);

module.exports = router;
