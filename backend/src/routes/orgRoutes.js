const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/register', orgController.registerOrganization);
router.get('/', optionalToken, orgController.getOrganizations);
router.get('/:id', optionalToken, orgController.getOrganizationById);
router.put('/:id/status', verifyToken, requireRole(['super_admin']), orgController.updateOrgStatus);

module.exports = router;
