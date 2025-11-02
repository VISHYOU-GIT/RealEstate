const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertiesNear,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  addReview,
  getMyProperties,
  toggleSaveProperty,
  getSavedProperties,
  requestPhoneUnlock,
  respondToPhoneRequest,
  getPhoneUnlockRequests
} = require('../controllers/property.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProperties);
router.get('/near', getPropertiesNear);
router.get('/:id', getProperty);

// Protected routes - all users
router.post('/:id/reviews', protect, addReview);
router.put('/:id/save', protect, toggleSaveProperty);
router.get('/my/saved', protect, getSavedProperties);
router.post('/:id/request-phone', protect, requestPhoneUnlock);
router.get('/my/phone-requests', protect, getPhoneUnlockRequests);
router.put('/phone-requests/:requestId/respond', protect, respondToPhoneRequest);

// Protected routes - owner only
router.get('/my/listings', protect, authorize('owner', 'admin'), getMyProperties);
router.post('/', protect, authorize('owner', 'admin'), createProperty);
router.put('/:id', protect, authorize('owner', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProperty);

module.exports = router;
