const express = require('express');
const router = express.Router();
const {
  getOrCreateChat,
  getMyChats,
  getChat,
  sendMessage,
  deleteChat
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// All routes are protected
router.use(protect);

router.get('/', getMyChats);
router.post('/property/:propertyId', getOrCreateChat);
router.get('/:id', getChat);
router.post('/:id/message', upload.single('file'), sendMessage);
router.delete('/:id', deleteChat);

module.exports = router;
