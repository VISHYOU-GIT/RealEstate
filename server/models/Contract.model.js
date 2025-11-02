const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contractType: {
    type: String,
    enum: ['rent', 'sale'],
    required: true
  },
  // Contract details
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide contract amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  securityDeposit: {
    type: Number,
    default: 0,
    min: [0, 'Security deposit cannot be negative']
  },
  // Payment terms
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank-transfer', 'cheque', 'online'],
    default: 'online'
  },
  // Contract status
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'active', 'expired', 'terminated'],
    default: 'draft'
  },
  // Signatures
  ownerSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: {
      type: Date
    },
    ipAddress: {
      type: String
    }
  },
  tenantSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: {
      type: Date
    },
    ipAddress: {
      type: String
    }
  },
  // Terms and conditions
  terms: {
    type: String,
    maxlength: [5000, 'Terms cannot exceed 5000 characters']
  },
  specialConditions: {
    type: String,
    maxlength: [2000, 'Special conditions cannot exceed 2000 characters']
  },
  // Document
  pdfUrl: {
    type: String
  },
  pdfPublicId: {
    type: String
  },
  // Renewal
  isRenewable: {
    type: Boolean,
    default: false
  },
  renewalNotified: {
    type: Boolean,
    default: false
  },
  // Admin approval
  adminApproved: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
ContractSchema.index({ property: 1 });
ContractSchema.index({ owner: 1 });
ContractSchema.index({ tenant: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ startDate: 1 });
ContractSchema.index({ endDate: 1 });

// Check if contract is fully signed
ContractSchema.virtual('isFullySigned').get(function() {
  return this.ownerSignature.signed && this.tenantSignature.signed;
});

// Pre-save middleware
ContractSchema.pre('save', function(next) {
  // Auto-activate when both parties sign
  if (this.isFullySigned && this.status === 'pending') {
    this.status = 'active';
  }
  
  // Check if expired
  if (this.status === 'active' && this.endDate < new Date()) {
    this.status = 'expired';
  }
  
  next();
});

module.exports = mongoose.model('Contract', ContractSchema);
