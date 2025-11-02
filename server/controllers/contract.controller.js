const Contract = require('../models/Contract.model');
const Property = require('../models/Property.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Create contract
// @route   POST /api/contracts
// @access  Private
exports.createContract = async (req, res, next) => {
  try {
    const {
      propertyId,
      tenantId,
      contractType,
      startDate,
      endDate,
      amount,
      securityDeposit,
      paymentFrequency,
      terms,
      specialConditions
    } = req.body;

    // Validate required fields
    if (!propertyId || !tenantId || !contractType || !startDate || !endDate || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if user is the owner
    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only property owner can create contract'
      });
    }

    // Create contract
    const contract = await Contract.create({
      property: propertyId,
      owner: req.user.id,
      tenant: tenantId,
      contractType,
      startDate,
      endDate,
      amount,
      securityDeposit,
      paymentFrequency,
      terms,
      specialConditions,
      status: 'pending'
    });

    await contract.populate([
      { path: 'property', select: 'title location images' },
      { path: 'owner', select: 'name email phone' },
      { path: 'tenant', select: 'name email phone' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Contract created successfully',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create contract request (for tenants/buyers)
// @route   POST /api/contracts/request
// @access  Private
exports.requestContract = async (req, res, next) => {
  try {
    const {
      propertyId,
      contractType,
      moveInDate,
      duration,
      message
    } = req.body;

    // Validate required fields
    if (!propertyId || !contractType || !moveInDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Get property
    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check if user is trying to request their own property
    if (property.owner._id.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot request a contract for your own property'
      });
    }

    // Calculate end date for rental properties
    let endDate = new Date(moveInDate);
    if (contractType === 'rent' && duration) {
      endDate.setMonth(endDate.getMonth() + parseInt(duration));
    } else {
      // For sale, set end date to 30 days from move-in
      endDate.setDate(endDate.getDate() + 30);
    }

    // Create draft contract
    const contract = await Contract.create({
      property: propertyId,
      owner: property.owner._id,
      tenant: req.user.id,
      contractType,
      startDate: moveInDate,
      endDate: endDate,
      amount: property.price,
      securityDeposit: contractType === 'rent' ? property.price : 0,
      paymentFrequency: contractType === 'rent' ? 'monthly' : 'one-time',
      specialConditions: message || '',
      status: 'draft'
    });

    await contract.populate([
      { path: 'property', select: 'title location images price' },
      { path: 'owner', select: 'name email phone' },
      { path: 'tenant', select: 'name email phone' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Contract request submitted successfully. The owner will review your request.',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contracts for user
// @route   GET /api/contracts
// @access  Private
exports.getMyContracts = async (req, res, next) => {
  try {
    const contracts = await Contract.find({
      $or: [{ owner: req.user.id }, { tenant: req.user.id }]
    })
      .populate('property', 'title location images')
      .populate('owner', 'name email phone profileImage')
      .populate('tenant', 'name email phone profileImage')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      status: 'success',
      data: { contracts }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contract
// @route   GET /api/contracts/:id
// @access  Private
exports.getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('property', 'title location images propertyType')
      .populate('owner', 'name email phone profileImage')
      .populate('tenant', 'name email phone profileImage');

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found'
      });
    }

    // Check if user is owner or tenant
    if (
      contract.owner._id.toString() !== req.user.id &&
      contract.tenant._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this contract'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sign contract
// @route   PUT /api/contracts/:id/sign
// @access  Private
exports.signContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found'
      });
    }

    // Check if user is owner or tenant
    const isOwner = contract.owner.toString() === req.user.id;
    const isTenant = contract.tenant.toString() === req.user.id;

    if (!isOwner && !isTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to sign this contract'
      });
    }

    // Sign contract
    const signatureData = {
      signed: true,
      signedAt: new Date(),
      ipAddress: req.ip
    };

    if (isOwner) {
      if (contract.ownerSignature.signed) {
        return res.status(400).json({
          status: 'error',
          message: 'Owner has already signed this contract'
        });
      }
      contract.ownerSignature = signatureData;
    } else {
      if (contract.tenantSignature.signed) {
        return res.status(400).json({
          status: 'error',
          message: 'Tenant has already signed this contract'
        });
      }
      contract.tenantSignature = signatureData;
    }

    await contract.save();

    res.status(200).json({
      status: 'success',
      message: 'Contract signed successfully',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate PDF for contract
// @route   GET /api/contracts/:id/pdf
// @access  Private
exports.generatePDF = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('property', 'title location propertyType area')
      .populate('owner', 'name email phone')
      .populate('tenant', 'name email phone');

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found'
      });
    }

    // Check authorization
    if (
      contract.owner._id.toString() !== req.user.id &&
      contract.tenant._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to download this contract'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=contract-${contract._id}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('Rental/Sale Agreement', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Contract ID: ${contract._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Property details
    doc.fontSize(14).text('Property Details:', { underline: true });
    doc.fontSize(12).text(`Title: ${contract.property.title}`);
    doc.text(`Type: ${contract.property.propertyType}`);
    doc.text(`Address: ${contract.property.location.address}`);
    doc.text(`Area: ${contract.property.area} sqft`);
    doc.moveDown();

    // Owner details
    doc.fontSize(14).text('Owner Details:', { underline: true });
    doc.fontSize(12).text(`Name: ${contract.owner.name}`);
    doc.text(`Email: ${contract.owner.email}`);
    doc.text(`Phone: ${contract.owner.phone}`);
    doc.moveDown();

    // Tenant details
    doc.fontSize(14).text('Tenant/Buyer Details:', { underline: true });
    doc.fontSize(12).text(`Name: ${contract.tenant.name}`);
    doc.text(`Email: ${contract.tenant.email}`);
    doc.text(`Phone: ${contract.tenant.phone}`);
    doc.moveDown();

    // Contract terms
    doc.fontSize(14).text('Contract Terms:', { underline: true });
    doc.fontSize(12).text(`Type: ${contract.contractType}`);
    doc.text(`Start Date: ${new Date(contract.startDate).toLocaleDateString()}`);
    doc.text(`End Date: ${new Date(contract.endDate).toLocaleDateString()}`);
    doc.text(`Amount: ${contract.currency} ${contract.amount}`);
    doc.text(`Security Deposit: ${contract.currency} ${contract.securityDeposit}`);
    doc.text(`Payment Frequency: ${contract.paymentFrequency}`);
    doc.moveDown();

    // Terms and conditions
    if (contract.terms) {
      doc.fontSize(14).text('Terms and Conditions:', { underline: true });
      doc.fontSize(10).text(contract.terms, { align: 'justify' });
      doc.moveDown();
    }

    // Special conditions
    if (contract.specialConditions) {
      doc.fontSize(14).text('Special Conditions:', { underline: true });
      doc.fontSize(10).text(contract.specialConditions, { align: 'justify' });
      doc.moveDown();
    }

    // Signatures
    doc.moveDown(2);
    doc.fontSize(12).text('Signatures:', { underline: true });
    doc.moveDown();

    if (contract.ownerSignature.signed) {
      doc.text(`Owner Signature: Signed on ${new Date(contract.ownerSignature.signedAt).toLocaleDateString()}`);
    } else {
      doc.text('Owner Signature: _____________________');
    }

    doc.moveDown();

    if (contract.tenantSignature.signed) {
      doc.text(`Tenant Signature: Signed on ${new Date(contract.tenantSignature.signedAt).toLocaleDateString()}`);
    } else {
      doc.text('Tenant Signature: _____________________');
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Update contract
// @route   PUT /api/contracts/:id
// @access  Private
exports.updateContract = async (req, res, next) => {
  try {
    let contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found'
      });
    }

    // Only owner can update before signing
    if (contract.owner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only owner can update contract'
      });
    }

    // Can't update if already signed
    if (contract.ownerSignature.signed || contract.tenantSignature.signed) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update signed contract'
      });
    }

    contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Contract updated successfully',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contract
// @route   DELETE /api/contracts/:id
// @access  Private
exports.deleteContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found'
      });
    }

    // Only owner can delete
    if (contract.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this contract'
      });
    }

    // Can't delete if signed
    if (contract.ownerSignature.signed || contract.tenantSignature.signed) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete signed contract'
      });
    }

    await contract.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
