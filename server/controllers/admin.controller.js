const Property = require('../models/Property.model');
const User = require('../models/User.model');
const Contract = require('../models/Contract.model');
const Chat = require('../models/Chat.model');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalContracts = await Contract.countDocuments();
    const totalChats = await Chat.countDocuments();

    // Active contracts count
    const activeContracts = await Contract.countDocuments({ status: 'active' });
    const pendingContracts = await Contract.countDocuments({ status: 'pending' });
    const completedContracts = await Contract.countDocuments({ status: 'completed' });
    const cancelledContracts = await Contract.countDocuments({ status: 'cancelled' });

    // Properties by status
    const approvedProperties = await Property.countDocuments({ status: 'approved' });
    const pendingProperties = await Property.countDocuments({ status: 'pending' });
    const rejectedProperties = await Property.countDocuments({ status: 'rejected' });

    // Active vs Inactive Users
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Users by role
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // User breakdown
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Property breakdown
    const propertiesByStatus = await Property.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const propertiesByType = await Property.aggregate([
      { $group: { _id: '$propertyType', count: { $sum: 1 } } }
    ]);

    const propertiesByListingType = await Property.aggregate([
      { $group: { _id: '$listingType', count: { $sum: 1 } } }
    ]);

    // Contract breakdown
    const contractsByStatus = await Contract.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Revenue calculation (total contract amounts)
    const totalRevenue = await Contract.aggregate([
      { $match: { status: { $in: ['signed', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await Contract.aggregate([
      {
        $match: {
          status: { $in: ['signed', 'active'] },
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent activities
    const recentProperties = await Property.find()
      .sort('-createdAt')
      .limit(10)
      .populate('owner', 'name email')
      .select('title status createdAt owner');

    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(10)
      .select('name email role createdAt');

    const recentContracts = await Contract.find()
      .sort('-createdAt')
      .limit(10)
      .populate('property', 'title')
      .populate('tenant', 'name')
      .select('property tenant status amount createdAt');

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalUsers,
          totalProperties,
          totalContracts,
          totalChats,
          activeContracts,
          pendingContracts,
          completedContracts,
          cancelledContracts,
          approvedProperties,
          pendingProperties,
          rejectedProperties,
          activeUsers,
          inactiveUsers,
          adminUsers,
          regularUsers,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        usersByRole,
        propertiesByStatus,
        propertiesByType,
        propertiesByListingType,
        contractsByStatus,
        monthlyRevenue,
        recentProperties,
        recentUsers,
        recentContracts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        users,
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

// @desc    Get all properties (including pending)
// @route   GET /api/admin/properties
// @access  Private/Admin
exports.getAllProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(query)
      .populate('owner', 'name email phone')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

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

// @desc    Approve property
// @route   PUT /api/admin/properties/:id/approve
// @access  Private/Admin
exports.approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: null },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Property approved successfully',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject property
// @route   PUT /api/admin/properties/:id/reject
// @access  Private/Admin
exports.rejectProperty = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide rejection reason'
      });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Property rejected',
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/admin/properties/:id
// @access  Private/Admin
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    await property.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User activated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contracts
// @route   GET /api/admin/contracts
// @access  Private/Admin
exports.getAllContracts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate('property', 'title location')
      .populate('owner', 'name email')
      .populate('tenant', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Contract.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        contracts,
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

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be either "user" or "admin"'
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User role updated to ${role}`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/system-stats
// @access  Private/Admin
exports.getSystemStats = async (req, res, next) => {
  try {
    const dbStatus = {
      connection: 'healthy',
      responseTime: Date.now()
    };

    // Test database connection
    try {
      await User.findOne().limit(1);
      dbStatus.connection = 'healthy';
      dbStatus.responseTime = Date.now() - dbStatus.responseTime;
    } catch (error) {
      dbStatus.connection = 'error';
      dbStatus.error = error.message;
    }

    res.status(200).json({
      status: 'success',
      data: {
        database: dbStatus,
        server: {
          status: 'online',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk approve properties
// @route   POST /api/admin/properties/bulk-approve
// @access  Private/Admin
exports.bulkApproveProperties = async (req, res, next) => {
  try {
    const { propertyIds } = req.body;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of property IDs'
      });
    }

    const result = await Property.updateMany(
      { _id: { $in: propertyIds } },
      { status: 'approved', rejectionReason: null }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} properties approved`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete properties
// @route   POST /api/admin/properties/bulk-delete
// @access  Private/Admin
exports.bulkDeleteProperties = async (req, res, next) => {
  try {
    const { propertyIds } = req.body;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of property IDs'
      });
    }

    const result = await Property.deleteMany({ _id: { $in: propertyIds } });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} properties deleted`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export users to CSV
// @route   GET /api/admin/users/export
// @access  Private/Admin
exports.exportUsers = async (req, res, next) => {
  try {
    const users = await User.find().lean();

    const csv = [
      ['ID', 'Name', 'Email', 'Role', 'Active', 'Reputation', 'Created At'].join(','),
      ...users.map(u => [
        u._id,
        u.name,
        u.email,
        u.role,
        u.isActive !== false ? 'Yes' : 'No',
        u.reputation || 0,
        new Date(u.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Export properties to CSV
// @route   GET /api/admin/properties/export
// @access  Private/Admin
exports.exportProperties = async (req, res, next) => {
  try {
    const properties = await Property.find()
      .populate('owner', 'name email')
      .lean();

    const csv = [
      ['ID', 'Title', 'Owner', 'Type', 'Listing Type', 'Price', 'Status', 'City', 'Created At'].join(','),
      ...properties.map(p => [
        p._id,
        `"${p.title}"`,
        p.owner?.name || '',
        p.propertyType,
        p.listingType,
        p.price,
        p.status || 'available',
        p.location?.city || '',
        new Date(p.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=properties.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Export contracts to CSV
// @route   GET /api/admin/contracts/export
// @access  Private/Admin
exports.exportContracts = async (req, res, next) => {
  try {
    const contracts = await Contract.find()
      .populate('property', 'title')
      .populate('owner', 'name')
      .populate('tenant', 'name')
      .lean();

    const csv = [
      ['ID', 'Property', 'Owner', 'Tenant', 'Amount', 'Currency', 'Status', 'Start Date', 'End Date'].join(','),
      ...contracts.map(c => [
        c._id,
        `"${c.property?.title || ''}"`,
        c.owner?.name || '',
        c.tenant?.name || '',
        c.amount,
        c.currency,
        c.status,
        c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
        c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contracts.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
