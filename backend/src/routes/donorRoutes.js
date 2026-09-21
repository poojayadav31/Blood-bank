const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/check-eligibility', donorController.checkDonorEligibility);
router.get('/', verifyToken, requireRole(['super_admin', 'org_admin', 'volunteer']), donorController.getDonors);
router.get('/certificate/:certificateId', donorController.getCertificate);
router.get('/:id', optionalToken, donorController.getDonorById);
router.put('/profile', verifyToken, donorController.updateProfile);

module.exports = router;
