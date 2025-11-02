const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  role: {
    type: String,
    enum: ['buyer', 'owner', 'admin'],
    default: 'buyer'
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true
  },
  facebookId: {
    type: String,
    sparse: true
  },
  // Owner-specific fields
  reputationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // in minutes
    default: 0
  },
  propertiesListed: {
    type: Number,
    default: 0
  },
  // Buyer-specific fields
  savedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  // Push notification subscription
  pushSubscription: {
    type: Object,
    default: null
  },
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  // Only hash if password exists (for OAuth users)
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Update reputation score
UserSchema.methods.updateReputation = async function() {
  const Property = mongoose.model('Property');
  const properties = await Property.find({ owner: this._id });
  
  if (properties.length === 0) {
    this.reputationScore = 0;
    this.totalReviews = 0;
    await this.save();
    return;
  }

  let totalRating = 0;
  let totalReviewCount = 0;

  properties.forEach(property => {
    if (property.reviews && property.reviews.length > 0) {
      property.reviews.forEach(review => {
        totalRating += review.rating;
        totalReviewCount++;
      });
    }
  });

  this.reputationScore = totalReviewCount > 0 ? (totalRating / totalReviewCount).toFixed(1) : 0;
  this.totalReviews = totalReviewCount;
  await this.save();
};

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ facebookId: 1 });

module.exports = mongoose.model('User', UserSchema);
