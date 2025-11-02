const Property = require('../models/Property.model');
const User = require('../models/User.model');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      city,
      bedrooms,
      bathrooms,
      furnished,
      accessibilityTags,
      sustainabilityTags,
      sortBy = '-createdAt'
    } = req.query;

    // Build query
    const query = { status: 'approved', isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (bedrooms) query.bedrooms = { $gte: parseInt(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: parseInt(bathrooms) };
    if (furnished) query.furnished = furnished;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (accessibilityTags) {
      const tags = Array.isArray(accessibilityTags) ? accessibilityTags : [accessibilityTags];
      query.accessibilityTags = { $in: tags };
    }

    if (sustainabilityTags) {
      const tags = Array.isArray(sustainabilityTags) ? sustainabilityTags : [sustainabilityTags];
      query.sustainabilityTags = { $in: tags };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const properties = await Property.find(query)
      .populate('owner', 'name email phone profileImage reputationScore')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await Property.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get properties near a location
// @route   GET /api/properties/near
// @access  Public
exports.getPropertiesNear = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10000, limit = 20 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    const properties = await Property.find({
      status: 'approved',
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance) // in meters
        }
      }
    })
      .populate('owner', 'name email phone profileImage reputationScore')
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      status: 'success',
      data: { properties }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone profileImage reputationScore totalReviews responseTime')
      .populate('reviews.user', 'name profileImage');

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Increment view count
    property.views += 1;
    await property.save();

    res.status(200).json({
      status: 'success',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private (Owner)
exports.createProperty = async (req, res, next) => {
  try {
    // Add owner from logged in user
    req.body.owner = req.user.id;

    // Validate coordinates
    if (!req.body.location || !req.body.location.coordinates) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide location coordinates'
      });
    }

    const property = await Property.create(req.body);

    // Update user's properties count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { propertiesListed: 1 }
    });

    res.status(201).json({
      status: 'success',
      message: 'Property created successfully',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner)
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this property'
      });
    }

    // Don't allow updating status unless admin
    if (req.body.status && req.user.role !== 'admin') {
      delete req.body.status;
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Property updated successfully',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner/Admin)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this property'
      });
    }

    await property.deleteOne();

    // Update user's properties count
    await User.findByIdAndUpdate(property.owner, {
      $inc: { propertiesListed: -1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to property
// @route   POST /api/properties/:id/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a rating'
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if already reviewed
    const alreadyReviewed = property.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this property'
      });
    }

    // Add review
    property.reviews.push({
      user: req.user.id,
      rating: Number(rating),
      comment
    });

    await property.save();

    // Update owner reputation
    const owner = await User.findById(property.owner);
    await owner.updateReputation();

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own properties
// @route   GET /api/properties/my/listings
// @access  Private (Owner)
exports.getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user.id })
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      status: 'success',
      data: { properties }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/unsave property
// @route   PUT /api/properties/:id/save
// @access  Private
exports.toggleSaveProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    const user = await User.findById(req.user.id);
    const isSaved = user.savedProperties.includes(req.params.id);

    if (isSaved) {
      // Unsave
      user.savedProperties = user.savedProperties.filter(
        id => id.toString() !== req.params.id
      );
      property.saves = Math.max(0, property.saves - 1);
    } else {
      // Save
      user.savedProperties.push(req.params.id);
      property.saves += 1;
    }

    await user.save();
    await property.save();

    res.status(200).json({
      status: 'success',
      message: isSaved ? 'Property unsaved' : 'Property saved',
      data: { isSaved: !isSaved }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved properties
// @route   GET /api/properties/my/saved
// @access  Private
exports.getSavedProperties = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedProperties',
      populate: { path: 'owner', select: 'name profileImage reputationScore' }
    });

    res.status(200).json({
      status: 'success',
      data: { properties: user.savedProperties }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request phone number unlock
// @route   POST /api/properties/:id/request-phone
// @access  Private
exports.requestPhoneUnlock = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if user is the owner
    if (property.owner.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot request your own phone number'
      });
    }

    // Check if request already exists
    const existingRequest = property.phoneUnlockRequests?.find(
      req => req.user.toString() === req.user.id
    );

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already requested phone number access',
        data: { status: existingRequest.status }
      });
    }

    // Add request
    if (!property.phoneUnlockRequests) {
      property.phoneUnlockRequests = [];
    }

    property.phoneUnlockRequests.push({
      user: req.user.id,
      message: req.body.message || '',
      status: 'pending'
    });

    await property.save();

    // Populate the request with user details
    await property.populate('phoneUnlockRequests.user', 'name email profilePicture');

    res.status(200).json({
      status: 'success',
      message: 'Phone unlock request sent successfully',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get phone unlock requests for user's properties
// @route   GET /api/properties/my/phone-requests
// @access  Private
exports.getPhoneUnlockRequests = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user.id })
      .populate('phoneUnlockRequests.user', 'name email profilePicture')
      .select('title images phoneUnlockRequests');

    const requests = [];
    properties.forEach(property => {
      if (property.phoneUnlockRequests && property.phoneUnlockRequests.length > 0) {
        property.phoneUnlockRequests.forEach(request => {
          requests.push({
            _id: request._id,
            property: {
              _id: property._id,
              title: property.title,
              image: property.images[0]?.url
            },
            user: request.user,
            message: request.message,
            status: request.status,
            createdAt: request.createdAt
          });
        });
      }
    });

    res.status(200).json({
      status: 'success',
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to phone unlock request
// @route   PUT /api/properties/phone-requests/:requestId/respond
// @access  Private
exports.respondToPhoneRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const property = await Property.findOne({
      owner: req.user.id,
      'phoneUnlockRequests._id': req.params.requestId
    });

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found or you are not authorized'
      });
    }

    const request = property.phoneUnlockRequests.id(req.params.requestId);
    request.status = status;
    request.respondedAt = Date.now();

    await property.save();

    res.status(200).json({
      status: 'success',
      message: `Request ${status} successfully`,
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};
