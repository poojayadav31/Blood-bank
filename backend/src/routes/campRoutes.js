const express = require('express');
const router = express.Router();
const campController = require('../controllers/campController');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', campController.getCamps);
router.get('/:id', campController.getCampById);
router.post('/', verifyToken, requireRole(['super_admin', 'org_admin']), campController.createCamp);
router.put('/:id', verifyToken, requireRole(['super_admin', 'org_admin']), campController.updateCamp);
router.post('/register', optionalToken, campController.registerForCamp);
router.post('/record-donation', verifyToken, requireRole(['super_admin', 'org_admin', 'volunteer']), campController.recordDonation);

module.exports = router;
