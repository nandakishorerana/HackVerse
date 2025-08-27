import { Request, Response } from 'express';
import { User } from '@/models';
import { AppError } from '@/utils/AppError';
import { catchAsync } from '@/utils/catchAsync';
import { APIFeatures } from '@/utils/APIFeatures';
import { emailService } from '@/services/email.service';

interface AuthRequest extends Request {
  user?;
}

// Get current user profile
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success,
    data
  });
});

// Update current user profile
export const updateMe = catchAsync(async (req, res) => {
  // Remove sensitive fields that shouldn't be updated via this route
  const { password, email, role, isVerified, ...updateData } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new, runValidators }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success,
    data
  });
});

// Update user preferences
export const updatePreferences = catchAsync(async (req, res) => {
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { preferences },
    { new, runValidators }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success,
    message: 'Preferences updated successfully',
    data.preferences
  });
});

// Add address
export const addAddress = catchAsync(async (req, res) => {
  const addressData = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.addresses?.push(addressData);
  await user.save();

  res.status(200).json({
    success,
    message: 'Address added successfully',
    data.addresses
  });
});

// Update address
export const updateAddress = catchAsync(async (req, res) => {
  const { addressId } = req.params;
  const updateData = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses?.id(addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  Object.assign(address, updateData);
  await user.save();

  res.status(200).json({
    success,
    message: 'Address updated successfully',
    data.addresses
  });
});

// Delete address
export const deleteAddress = catchAsync(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.addresses?.pull(addressId);
  await user.save();

  res.status(200).json({
    success,
    message: 'Address deleted successfully',
    data.addresses
  });
});

// Deactivate account
export const deactivateAccount = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { 
      isActive,
      deactivatedAt Date()
    },
    { new }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Send account deactivation email
  await emailService.sendAccountDeactivationEmail(user.email, user.name);

  res.status(200).json({
    success,
    message: 'Account deactivated successfully'
  });
});

// Reactivate account
export const reactivateAccount = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { 
      isActive,
      $unset: { deactivatedAt }
    },
    { new }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Send welcome back email
  await emailService.sendWelcomeEmail(user.email, user.name);

  res.status(200).json({
    success,
    message: 'Account reactivated successfully',
    data
  });
});

// Get user activity/stats
export const getUserStats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // This would typically aggregate from multiple collections
  // For now, returning basic user info
  const user = await User.findById(userId).select('createdAt lastLogin loginCount');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const stats = {
    memberSince.createdAt,
    lastLogin.lastLogin,
    totalLogins.loginCount || 0,
    // These would come from other collections
    totalBookings,
    completedBookings,
    totalSpent,
    favoriteServices: []
  };

  res.status(200).json({
    success,
    data
  });
});

// ADMIN ROUTES

// Get all users (admin only)
export const getAllUsers = catchAsync(async (req, res) => {
  const features = new APIFeatures(User.find().select('-password'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;
  const total = await User.countDocuments();

  res.status(200).json({
    success,
    results.length,
    total,
    data
  });
});

// Get user by ID (admin only)
export const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success,
    data
  });
});

// Update user (admin only)
export const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow password updates through this route
  delete updateData.password;

  const user = await User.findByIdAndUpdate(id, updateData, {
    new,
    runValidators
  }).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success,
    data
  });
});

// Delete user (admin only)
export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete
  await User.findByIdAndUpdate(id, { 
    isActive, 
    deletedAt Date() 
  });

  res.status(200).json({
    success,
    message: 'User deleted successfully'
  });
});

// Get user statistics (admin only)
export const getUserStatistics = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id,
        totalUsers: { $sum },
        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
        customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
        providers: { $sum: { $cond: [{ $eq: ['$role', 'provider'] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
      }
    }
  ]);

  const monthlySignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte Date(new Date().getFullYear(), 0, 1) }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum }
      }
    },
    { $sort: { '_id' } }
  ]);

  res.status(200).json({
    success,
    data: {
      overview[0] || {
        totalUsers,
        activeUsers,
        verifiedUsers,
        customers,
        providers,
        admins
      },
      monthlySignups
    }
  });
});

// Block/unblock user (admin only)
export const toggleUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive, reason } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = isActive;
  if (reason) {
    user.statusReason = reason;
  }

  await user.save();

  // Send notification email
  const action = isActive ? 'activated' : 'blocked';
  await emailService.sendAccountStatusEmail(user.email, user.name, action, reason);

  res.status(200).json({
    success,
    message: `User ${action} successfully`,
    data: {
      id._id,
      isActive.isActive,
      statusReason.statusReason
    }
  });
});
