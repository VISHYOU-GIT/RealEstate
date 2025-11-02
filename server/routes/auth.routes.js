const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  uploadProfileImage,
  subscribePush,
  logout
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/upload-profile-image', protect, uploadProfileImage);
router.post('/push-subscribe', protect, subscribePush);
router.post('/logout', protect, logout);

module.exports = router;
