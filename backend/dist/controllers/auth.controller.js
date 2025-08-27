import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '@/models/User.model';
import { AppError, catchAsync, successResponse, errorResponse } from '@/middleware/error.middleware';
import { IAuthenticatedRequest, IUser } from '@/types';
import logger from '@/config/logger';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { email.toLowerCase() },
      { phone }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      return next(new AppError('User already exists with this email', 409));
    }
    if (existingUser.phone === phone) {
      return next(new AppError('User already exists with this phone number', 409));
    }
  }

  // Create user
  const user = await User.create({
    name,
    email.toLowerCase(),
    phone,
    password,
    role
  });

  // Generate verification tokens
  const emailVerificationToken = user.generateEmailVerificationToken();
  const phoneVerificationToken = user.generatePhoneVerificationToken();
  await user.save({ validateBeforeSave });

  // Generate JWT tokens
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // TODO verification emails and SMS
  logger.info(`Email verification token for ${email}: ${emailVerificationToken}`);
  logger.info(`Phone verification OTP for ${phone}: ${phoneVerificationToken}`);

  // Remove password from output
  const userResponse = user.toJSON();

  successResponse(res, 'User registered successfully', {
    user,
    token,
    refreshToken,
    emailVerificationRequired,
    phoneVerificationRequired
  }, 201);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    // Find user by credentials (this method handles password validation and account locking)
    const user = await (User as any).findByCredentials(email.toLowerCase(), password);

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Remove sensitive fields from response
    const userResponse = user.toJSON();

    successResponse(res, 'Login successful', {
      user,
      token,
      refreshToken
    });

  } catch (error) {
    logger.error('Login error:', error);
    return next(new AppError(error.message, 401));
  }
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as any;

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    successResponse(res, 'Token refreshed successfully', {
      token,
      refreshToken
    });

  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = catchAsync(async (req, res) => {
  const user = req.user!;
  
  successResponse(res, 'User profile retrieved successfully', {
    user.toJSON()
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
export const updateMe = catchAsync(async (req, res, next) => {
  const { name, email, phone, address, avatar } = req.body;
  const user = req.user!;

  // Check if email is being changed and if it's already taken
  if (email && email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('Email already taken', 409));
    }
    user.email = email.toLowerCase();
    user.isEmailVerified = false; // Reset email verification
  }

  // Check if phone is being changed and if it's already taken
  if (phone && phone !== user.phone) {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new AppError('Phone number already taken', 409));
    }
    user.phone = phone;
    user.isPhoneVerified = false; // Reset phone verification
  }

  // Update other fields
  if (name) user.name = name;
  if (address) user.address = address;
  if (avatar) user.avatar = avatar;

  await user.save();

  successResponse(res, 'Profile updated successfully', {
    user.toJSON()
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current password and new password', 400));
  }

  // Get user with password
  const userWithPassword = await User.findById(user._id).select('+password');
  if (!userWithPassword) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  const isCurrentPasswordCorrect = await userWithPassword.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  userWithPassword.password = newPassword;
  await userWithPassword.save();

  successResponse(res, 'Password changed successfully');
});

/**
 * @desc    Forgot password - send reset token
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide email address', 400));
  }

  // Find user by email
  const user = await User.findOne({ email.toLowerCase() });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave });

  // TODO email with reset link
  logger.info(`Password reset token for ${email}: ${resetToken}`);

  successResponse(res, 'Password reset token sent to email');
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password/
 * @access  Public
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new AppError('Please provide new password', 400));
  }

  if (!token) {
    return next(new AppError('Token is required', 400));
  }

  // Hash the token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new tokens
  const authToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  successResponse(res, 'Password reset successful', {
    token,
    refreshToken
  });
});

/**
 * @desc    Verify email with token
 * @route   POST /api/v1/auth/verify-email/
 * @access  Public
 */
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError('Token is required', 400));
  }

  // Hash the token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpires: { $gt.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave });

  successResponse(res, 'Email verified successfully');
});

/**
 * @desc    Verify phone with OTP
 * @route   POST /api/v1/auth/verify-phone
 * @access  Private
 */
export const verifyPhone = catchAsync(async (req, res, next) => {
  const { otp } = req.body;
  const user = req.user!;

  if (!otp) {
    return next(new AppError('Please provide OTP', 400));
  }

  // Hash the OTP and compare
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  
  const userWithOtp = await User.findOne({
    _id._id,
    phoneVerificationToken,
    phoneVerificationExpires: { $gt.now() }
  });

  if (!userWithOtp) {
    return next(new AppError('OTP is invalid or has expired', 400));
  }

  // Mark phone as verified
  userWithOtp.isPhoneVerified = true;
  userWithOtp.phoneVerificationToken = undefined;
  userWithOtp.phoneVerificationExpires = undefined;
  await userWithOtp.save({ validateBeforeSave });

  successResponse(res, 'Phone number verified successfully');
});

/**
 * @desc    Resend email verification
 * @route   POST /api/v1/auth/resend-email-verification
 * @access  Private
 */
export const resendEmailVerification = catchAsync(async (req, res, next) => {
  const user = req.user!;

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const emailVerificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave });

  // TODO verification email
  logger.info(`Email verification token for ${user.email}: ${emailVerificationToken}`);

  successResponse(res, 'Email verification sent successfully');
});

/**
 * @desc    Resend phone verification OTP
 * @route   POST /api/v1/auth/resend-phone-verification
 * @access  Private
 */
export const resendPhoneVerification = catchAsync(async (req, res, next) => {
  const user = req.user!;

  if (user.isPhoneVerified) {
    return next(new AppError('Phone number is already verified', 400));
  }

  // Generate new OTP
  const phoneVerificationToken = user.generatePhoneVerificationToken();
  await user.save({ validateBeforeSave });

  // TODO SMS with OTP
  logger.info(`Phone verification OTP for ${user.phone}: ${phoneVerificationToken}`);

  successResponse(res, 'Phone verification OTP sent successfully');
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = catchAsync(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we just send a success response and let the client remove the token
  
  successResponse(res, 'Logged out successfully');
});

export default {
  register,
  login,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification,
  logout
};
