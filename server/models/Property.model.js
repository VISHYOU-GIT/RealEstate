const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a property title'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a property description'],
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  propertyType: {
    type: String,
    required: [true, 'Please specify property type'],
    enum: ['apartment', 'house', 'villa', 'studio', 'commercial', 'land', 'other']
  },
  listingType: {
    type: String,
    required: [true, 'Please specify listing type'],
    enum: ['rent', 'sale']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  // Location with GeoJSON
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Please provide coordinates']
    },
    address: {
      type: String,
      required: [true, 'Please provide an address']
    },
    city: {
      type: String,
      required: [true, 'Please provide a city']
    },
    state: {
      type: String,
      required: [true, 'Please provide a state']
    },
    country: {
      type: String,
      default: 'India'
    },
    pincode: {
      type: String,
      required: [true, 'Please provide a pincode']
    }
  },
  // Property details
  area: {
    type: Number,
    required: [true, 'Please provide property area'],
    min: [1, 'Area must be at least 1 sq ft']
  },
  areaUnit: {
    type: String,
    enum: ['sqft', 'sqm', 'acre'],
    default: 'sqft'
  },
  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative'],
    default: 0
  },
  bathrooms: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    default: 0
  },
  furnished: {
    type: String,
    enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
    default: 'unfurnished'
  },
  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    }
  }],
  // Features
  amenities: [{
    type: String
  }],
  // Accessibility tags
  accessibilityTags: [{
    type: String,
    enum: ['wheelchair-ramp', 'elevator', 'tactile-flooring', 'wide-doorways', 'accessible-bathroom', 'hearing-assistance', 'visual-assistance', 'parking']
  }],
  // Sustainability tags
  sustainabilityTags: [{
    type: String,
    enum: ['solar-panels', 'rainwater-harvesting', 'energy-efficient', 'green-building', 'waste-management', 'ev-charging']
  }],
  // Owner information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold', 'rented'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Reviews
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Phone unlock requests
  phoneUnlockRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  }],
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  saves: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  // Co-living specific
  isCoLiving: {
    type: Boolean,
    default: false
  },
  maxOccupants: {
    type: Number,
    min: 1
  },
  // Available dates
  availableFrom: {
    type: Date
  },
  availableUntil: {
    type: Date
  },
  // Admin notes
  adminNotes: {
    type: String
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// GeoJSON index for location-based queries
PropertySchema.index({ 'location.coordinates': '2dsphere' });

// Other indexes
PropertySchema.index({ owner: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ listingType: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ 'location.city': 1 });
PropertySchema.index({ createdAt: -1 });

// Calculate average rating
PropertySchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = (totalRating / this.reviews.length).toFixed(1);
    this.totalReviews = this.reviews.length;
  }
};

// Pre-save middleware to calculate ratings
PropertySchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    this.calculateAverageRating();
  }
  next();
});

module.exports = mongoose.model('Property', PropertySchema);
