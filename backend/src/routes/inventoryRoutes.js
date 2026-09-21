const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', verifyToken, inventoryController.getOrgInventory);
router.get('/global', verifyToken, requireRole(['super_admin']), inventoryController.getGlobalInventory);
router.put('/update', verifyToken, requireRole(['super_admin', 'org_admin']), inventoryController.updateStock);

module.exports = router;
