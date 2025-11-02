const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinary');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer',
      phone,
      authProvider: 'local'
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user used OAuth
    if (user.authProvider !== 'local') {
      return res.status(400).json({
        status: 'error',
        message: `Please login with ${user.authProvider}`
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          phone: user.phone,
          reputationScore: user.reputationScore,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check if user has a password (OAuth users don't)
    if (!user.password) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update password for OAuth accounts'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subscribe to push notifications
// @route   POST /api/auth/push-subscribe
// @access  Private
exports.subscribePush = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide subscription object'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushSubscription: subscription },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Push notification subscription saved',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/upload-profile-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an image'
      });
    }

    // Get current user to check for existing profile image
    const user = await User.findById(req.user.id);
    
    // Delete old profile image from Cloudinary if it exists
    if (user.profileImage && user.profileImage !== 'https://via.placeholder.com/150') {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profileImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `realstate/profiles/${filename.split('.')[0]}`;
        
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted old profile image: ${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Upload new image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'realstate/profiles',
      resource_type: 'auto',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ]
    });

    console.log(`✅ Uploaded new profile image: ${uploadResponse.public_id}`);

    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: { imageUrl: uploadResponse.secure_url }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // On client side, remove token from storage
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};
