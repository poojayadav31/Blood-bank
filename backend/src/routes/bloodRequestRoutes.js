const express = require('express');
const router = express.Router();
const bloodRequestController = require('../controllers/bloodRequestController');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/', optionalToken, bloodRequestController.submitBloodRequest);
router.get('/', optionalToken, bloodRequestController.getBloodRequests);
router.put('/:id/fulfill', verifyToken, requireRole(['super_admin', 'org_admin']), bloodRequestController.fulfillBloodRequest);

module.exports = router;
