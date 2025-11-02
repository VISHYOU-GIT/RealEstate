const Chat = require('../models/Chat.model');
const Property = require('../models/Property.model');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get or create chat for a property
// @route   POST /api/chat/property/:propertyId
// @access  Private
exports.getOrCreateChat = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      property: propertyId,
      participants: { $all: [req.user.id, property.owner] }
    }).populate('participants', 'name profileImage')
      .populate('property', 'title images');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        property: propertyId,
        participants: [req.user.id, property.owner],
        messages: []
      });

      chat = await Chat.findById(chat._id)
        .populate('participants', 'name profileImage')
        .populate('property', 'title images');
    }

    res.status(200).json({
      status: 'success',
      data: { chat }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats for logged in user
// @route   GET /api/chat
// @access  Private
exports.getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    })
      .populate('participants', 'name profileImage')
      .populate('property', 'title images')
      .populate('lastMessage.sender', 'name')
      .sort('-lastMessageAt')
      .lean();

    // Add unread count for each chat
    const chatsWithUnread = chats.map(chat => {
      const unreadCount = chat.messages.filter(msg => 
        msg.sender.toString() !== req.user.id && 
        (!msg.readBy || !msg.readBy.some(id => id.toString() === req.user.id))
      ).length;
      
      return {
        ...chat,
        unreadCount
      };
    });

    res.status(200).json({
      status: 'success',
      data: { chats: chatsWithUnread }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single chat
// @route   GET /api/chat/:id
// @access  Private
exports.getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name profileImage')
      .populate('property', 'title images owner')
      .populate('messages.sender', 'name profileImage');

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this chat'
      });
    }

    // Mark messages as read by adding current user to readBy array
    let hasUnreadMessages = false;
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user.id) {
        if (!message.readBy) {
          message.readBy = [];
        }
        if (!message.readBy.some(id => id.toString() === req.user.id)) {
          message.readBy.push(req.user.id);
          message.isRead = true;
          message.readAt = new Date();
          hasUnreadMessages = true;
        }
      }
    });

    if (hasUnreadMessages) {
      await chat.save();
    }

    res.status(200).json({
      status: 'success',
      data: { chat }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chat/:id/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, type = 'text' } = req.body;
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    // Handle file upload if present
    if (req.file) {
      fileUrl = req.file.path; // Cloudinary URL
      fileName = req.file.originalname;
      fileSize = req.file.size;
    } else if (req.body.fileUrl) {
      // Handle base64 file upload from frontend
      const base64Data = req.body.fileUrl;
      fileName = req.body.fileName || 'file';
      fileSize = req.body.fileSize || 0;
      
      try {
        // Upload base64 to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64Data, {
          folder: type === 'image' ? 'realstate/chat/images' : 
                  type === 'video' ? 'realstate/chat/videos' : 
                  'realstate/chat/documents',
          resource_type: type === 'video' ? 'video' : 
                         type === 'pdf' ? 'raw' : 'auto',
          transformation: type === 'image' 
            ? [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }]
            : undefined
        });
        
        fileUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to upload file'
        });
      }
    }

    if (!content && !fileUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content or file is required'
      });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to send message in this chat'
      });
    }

    // Add message
    const message = {
      sender: req.user.id,
      content: content || (fileName ? `Sent ${fileName}` : 'File'),
      type,
      fileUrl,
      fileName,
      fileSize
    };

    chat.messages.push(message);
    chat.updateLastMessage();
    await chat.save();

    // Populate the new message
    await chat.populate('messages.sender', 'name profileImage');
    const newMessage = chat.messages[chat.messages.length - 1];

    // Broadcast message via Socket.IO to all participants in the room
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('receive_message', {
        roomId: req.params.id,
        message: newMessage.toObject()
      });
    }

    res.status(201).json({
      status: 'success',
      data: { message: newMessage }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat
// @route   DELETE /api/chat/:id
// @access  Private
exports.deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this chat'
      });
    }

    // Soft delete
    chat.isActive = false;
    await chat.save();

    res.status(200).json({
      status: 'success',
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
