const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/logs', verifyToken, requireRole(['super_admin']), auditController.getAuditLogs);
router.get('/notifications', verifyToken, auditController.getNotifications);
router.put('/notifications/:id/read', verifyToken, auditController.markAsRead);

module.exports = router;
