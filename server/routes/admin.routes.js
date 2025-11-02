const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllUsers,
  getAllProperties,
  approveProperty,
  rejectProperty,
  deleteProperty,
  deactivateUser,
  activateUser,
  getAllContracts,
  deleteUser,
  updateUserRole,
  getSystemStats,
  bulkApproveProperties,
  bulkDeleteProperties,
  exportUsers,
  exportProperties,
  exportContracts
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// Analytics and Stats
router.get('/analytics', getAnalytics);
router.get('/stats', getAnalytics); // Alias for backward compatibility
router.get('/system-stats', getSystemStats);

// Users management
router.get('/users', getAllUsers);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/export', exportUsers);

// Properties management
router.get('/properties', getAllProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteProperty);
router.post('/properties/bulk-approve', bulkApproveProperties);
router.post('/properties/bulk-delete', bulkDeleteProperties);
router.get('/properties/export', exportProperties);

// Contracts management
router.get('/contracts', getAllContracts);
router.get('/contracts/export', exportContracts);

module.exports = router;
