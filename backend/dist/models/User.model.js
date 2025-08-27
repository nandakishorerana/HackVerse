import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '@/types';
import { config } from '@/config/env';

// Address Schema
const AddressSchema = new Schema({
  street: {
    type,
    required: [true, 'Street address is required'],
    trim
  },
  city: {
    type,
    required: [true, 'City is required'],
    trim
  },
  state: {
    type,
    required: [true, 'State is required'],
    trim
  },
  pincode: {
    type,
    required: [true, 'Pincode is required'],
    match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
  },
  country: {
    type,
    default: 'India',
    trim
  },
  coordinates: {
    latitude: {
      type,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  }
}, { _id });

// User Schema
const UserSchema = new Schema({
  name: {
    type,
    required: [true, 'Name is required'],
    trim,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type,
    required: [true, 'Email is required'],
    unique,
    lowercase,
    trim,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type,
    required: [true, 'Phone number is required'],
    unique,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  password: {
    type,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select // Don't include password in queries by default
  },
  role: {
    type,
    enum: {
      values: ['customer', 'provider', 'admin'],
      message: 'Role must be either customer, provider, or admin'
    },
    default: 'customer'
  },
  avatar: {
    type,
    default
  },
  address: {
    type,
    default
  },
  isActive: {
    type,
    default
  },
  isEmailVerified: {
    type,
    default
  },
  isPhoneVerified: {
    type,
    default
  },
  emailVerificationToken: {
    type,
    select
  },
  emailVerificationExpires: {
    type,
    select
  },
  phoneVerificationToken: {
    type,
    select
  },
  phoneVerificationExpires: {
    type,
    select
  },
  passwordResetToken: {
    type,
    select
  },
  passwordResetExpires: {
    type,
    select
  },
  lastLogin: {
    type,
    default
  },
  loginAttempts: {
    type,
    default
  },
  lockUntil: {
    type,
    select
  }
}, {
  timestamps,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.phoneVerificationToken;
      delete ret.phoneVerificationExpires;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Virtual for account locking
UserSchema.virtual('isLocked').get(function(this) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Indexes
UserSchema.index({ email });
UserSchema.index({ phone });
UserSchema.index({ role });
UserSchema.index({ isActive });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  const payload = {
    userId._id.toString(),
    role.role,
    email.email
  };

  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn.jwt.expiresIn as string
  } as jwt.SignOptions);
};

// Instance method to generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  const payload = {
    userId._id.toString(),
    type: 'refresh'
  };

  return jwt.sign(payload, config.jwt.refreshSecret as string, {
    expiresIn.jwt.refreshExpiresIn as string
  } as jwt.SignOptions);
};

// Instance method to check if account is locked
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: {
        loginAttempts,
        lockUntil
      }
    });
  }

  const updates = { $inc: { loginAttempts } };

  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = {
      lockUntil.now() + LOCK_TIME
    };
  }

  return this.updateOne(updates);
};

// Static method to find user by credentials
UserSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email.toLowerCase(),
    isActive
  }).select('+password');

  if (!user) {
    throw new Error('Invalid login credentials');
  }

  // Check if account is locked
  if (user.isLocked()) {
    // Increment attempts to reset lock if it has expired
    await user.incLoginAttempts();
    throw new Error('Account is temporarily locked due to too many failed login attempts. Please try again later.');
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $unset: {
        loginAttempts,
        lockUntil
      }
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return user;
};

// Instance method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time to 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Instance method to generate email verification token
UserSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire time to 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return verificationToken;
};

// Instance method to generate phone verification token (6-digit OTP)
UserSchema.methods.generatePhoneVerificationToken = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.phoneVerificationToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expire time to 10 minutes
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  return otp;
};

// Export the model
const User = mongoose.model('User', UserSchema);
export default User;
