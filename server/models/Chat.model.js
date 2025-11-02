const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'pdf', 'link', 'file'],
      default: 'text'
    },
    fileUrl: {
      type: String
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    readAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: {
      type: String
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'pdf', 'link', 'file'],
      default: 'text'
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ChatSchema.index({ property: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });

// Update last message
ChatSchema.methods.updateLastMessage = function() {
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.content,
      type: lastMsg.type || 'text',
      sender: lastMsg.sender
    };
    this.lastMessageAt = lastMsg.createdAt;
  }
};

// Get unread count for a specific user
ChatSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(msg => 
    msg.sender.toString() !== userId.toString() && 
    !msg.readBy.includes(userId)
  ).length;
};

module.exports = mongoose.model('Chat', ChatSchema);
