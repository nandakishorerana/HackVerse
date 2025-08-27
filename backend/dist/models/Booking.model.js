import mongoose, { Schema, Model } from 'mongoose';
import { IBooking, IStatusChange, IPricing, IAdditionalCharge, IPaymentInfo, IWorkSummary } from '@/types';
import crypto from 'crypto';

// Status Change Schema
const StatusChangeSchema = new Schema({
  status: {
    type,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      message: 'Invalid status'
    }
  },
  changedBy: {
    type.Types.ObjectId,
    ref: 'User',
    required: [true, 'Status changer is required']
  },
  changedAt: {
    type,
    default.now
  },
  reason: {
    type,
    trim
  },
  comments: {
    type,
    trim,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  }
}, { _id });

// Additional Charge Schema
const AdditionalChargeSchema = new Schema({
  name: {
    type,
    required: [true, 'Charge name is required'],
    trim,
    maxlength: [100, 'Charge name cannot exceed 100 characters']
  },
  amount: {
    type,
    required: [true, 'Charge amount is required'],
    min: [0, 'Charge amount cannot be negative']
  },
  description: {
    type,
    trim,
    maxlength: [200, 'Description cannot exceed 200 characters']
  }
}, { _id });

// Pricing Schema
const PricingSchema = new Schema({
  baseAmount: {
    type,
    required: [true, 'Base amount is required'],
    min: [0, 'Base amount cannot be negative']
  },
  additionalCharges: [AdditionalChargeSchema],
  discount: {
    type,
    default,
    min: [0, 'Discount cannot be negative']
  },
  discountType: {
    type,
    enum: {
      values: ['percentage', 'fixed'],
      message: 'Discount type must be percentage or fixed'
    }
  },
  taxAmount: {
    type,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  }
}, { _id });

// Payment Info Schema
const PaymentInfoSchema = new Schema({
  status: {
    type,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      message: 'Invalid payment status'
    },
    default: 'pending'
  },
  method: {
    type,
    enum: {
      values: ['razorpay', 'stripe', 'cash', 'upi'],
      message: 'Invalid payment method'
    }
  },
  transactionId: {
    type,
    trim
  },
  paidAmount: {
    type,
    default,
    min: [0, 'Paid amount cannot be negative']
  },
  paidAt: {
    type
  },
  refundTransactionId: {
    type,
    trim
  },
  refundAmount: {
    type,
    default,
    min: [0, 'Refund amount cannot be negative']
  },
  refundedAt: {
    type
  }
}, { _id });

// Work Summary Schema
const WorkSummarySchema = new Schema({
  workStartTime: {
    type
  },
  workEndTime: {
    type
  },
  workDescription: {
    type,
    trim,
    maxlength: [1000, 'Work description cannot exceed 1000 characters']
  },
  beforeImages: {
    type: [String],
    validate: {
      validator(images) {
        return images.length <= 10;
      },
      message: 'Cannot have more than 10 before images'
    }
  },
  afterImages: {
    type: [String],
    validate: {
      validator(images) {
        return images.length <= 10;
      },
      message: 'Cannot have more than 10 after images'
    }
  },
  materialsUsed: {
    type: [String],
    validate: {
      validator(materials) {
        return materials.length <= 50;
      },
      message: 'Cannot have more than 50 materials'
    }
  },
  additionalNotes: {
    type,
    trim,
    maxlength: [500, 'Additional notes cannot exceed 500 characters']
  }
}, { _id });

// Address Schema (embedded from User model)
const BookingAddressSchema = new Schema({
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

// Booking Schema
const BookingSchema = new Schema({
  bookingNumber: {
    type,
    unique,
    required: [true, 'Booking number is required']
  },
  customer: {
    type.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  provider: {
    type.Types.ObjectId,
    ref: 'ServiceProvider',
    required: [true, 'Provider is required']
  },
  service: {
    type.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  scheduledDate: {
    type,
    required: [true, 'Scheduled date is required'],
    validate: {
      validator(date) {
        return date > new Date();
      },
      message: 'Scheduled date must be in the future'
    }
  },
  estimatedDuration: {
    type,
    required: [true, 'Estimated duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [1440, 'Duration cannot exceed 24 hours']
  },
  actualDuration: {
    type,
    min: [1, 'Actual duration must be at least 1 minute'],
    max: [1440, 'Actual duration cannot exceed 24 hours']
  },
  address: {
    type,
    required: [true, 'Service address is required']
  },
  contactPhone: {
    type,
    required: [true, 'Contact phone is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  specialInstructions: {
    type,
    trim,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },
  status: {
    type,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      message: 'Invalid booking status'
    },
    default: 'pending'
  },
  statusHistory: [StatusChangeSchema],
  pricing: {
    type,
    required: [true, 'Pricing information is required']
  },
  payment: {
    type,
    required: [true, 'Payment information is required']
  },
  workSummary: {
    type
  },
  cancelledBy: {
    type,
    enum: {
      values: ['customer', 'provider', 'admin'],
      message: 'Invalid cancellation source'
    }
  },
  cancellationReason: {
    type,
    trim,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancellationDate: {
    type
  },
  refundAmount: {
    type,
    min: [0, 'Refund amount cannot be negative']
  }
}, {
  timestamps,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
BookingSchema.index({ bookingNumber });
BookingSchema.index({ customer });
BookingSchema.index({ provider });
BookingSchema.index({ service });
BookingSchema.index({ status });
BookingSchema.index({ scheduledDate });
BookingSchema.index({ 'payment.status' });
BookingSchema.index({ createdAt: -1 });

// Compound indexes
BookingSchema.index({ customer, status, scheduledDate: -1 });
BookingSchema.index({ provider, status, scheduledDate: -1 });
BookingSchema.index({ status, scheduledDate });
BookingSchema.index({ 'address.city', status });

// Virtual for booking age
BookingSchema.virtual('bookingAge').get(function(this) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for time until service
BookingSchema.virtual('timeUntilService').get(function(this) {
  const now = new Date();
  const diffTime = this.scheduledDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

// Generate booking number
function generateBookingNumber() {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BK${timestamp.slice(-6)}${randomBytes}`;
}

// Pre-save middleware to generate booking number
BookingSchema.pre('save', function(next) {
  if (!this.bookingNumber) {
    this.bookingNumber = generateBookingNumber();
  }
  
  // Add status to history if status changed
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status.status,
      changedBy.customer, // This should be set properly in the controller
      changedAt Date()
    } as IStatusChange);
  }
  
  next();
});

// Static method to find bookings by customer
BookingSchema.statics.findByCustomer = function(
  customerId,
  status?,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = { customer };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('provider', 'user rating totalReviews')
    .populate({
      path: 'provider',
      populate: {
        path: 'user',
        select: 'name avatar phone'
      }
    })
    .populate('service', 'name category basePrice duration')
    .sort({ scheduledDate: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find bookings by provider
BookingSchema.statics.findByProvider = function(
  providerId,
  status?,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const query = { provider };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('customer', 'name avatar phone email')
    .populate('service', 'name category basePrice duration')
    .sort({ scheduledDate: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get today's bookings
BookingSchema.statics.getTodaysBookings = function(providerId?) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const query = {
    scheduledDate: {
      $gte,
      $lt
    },
    status: { $in: ['confirmed', 'in-progress'] }
  };
  
  if (providerId) {
    query.provider = providerId;
  }
  
  return this.find(query)
    .populate('customer', 'name phone')
    .populate('provider', 'user')
    .populate('service', 'name duration')
    .sort({ scheduledDate });
};

// Static method to get upcoming bookings
BookingSchema.statics.getUpcomingBookings = function(
  userId,
  userType: 'customer' | 'provider',
  limit = 10
) {
  const query = {
    scheduledDate: { $gt Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (userType === 'customer') {
    query.customer = userId;
  } else {
    query.provider = userId;
  }
  
  const populateOptions = userType === 'customer' 
    ? [
        { path: 'provider', select: 'user rating', populate: { path: 'user', select: 'name avatar phone' } },
        { path: 'service', select: 'name category duration' }
      ]
    : [
        { path: 'customer', select: 'name avatar phone' },
        { path: 'service', select: 'name category duration' }
      ];
  
  return this.find(query)
    .populate(populateOptions)
    .sort({ scheduledDate })
    .limit(limit);
};

// Instance method to update status
BookingSchema.methods.updateStatus = function(
  newStatus,
  changedBy,
  reason?,
  comments?
) {
  this.status = newStatus;
  
  // Handle specific status changes
  if (newStatus === 'cancelled') {
    this.cancellationDate = new Date();
    this.cancellationReason = reason;
  }
  
  if (newStatus === 'in-progress' && !this.workSummary?.workStartTime) {
    if (!this.workSummary) {
      this.workSummary = {} as IWorkSummary;
    }
    this.workSummary.workStartTime = new Date();
  }
  
  if (newStatus === 'completed' && this.workSummary && !this.workSummary.workEndTime) {
    this.workSummary.workEndTime = new Date();
    
    // Calculate actual duration
    if (this.workSummary.workStartTime) {
      const durationMs = this.workSummary.workEndTime.getTime() - this.workSummary.workStartTime.getTime();
      this.actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }
  }
  
  // Add to status history
  this.statusHistory.push({
    status,
    changedBy mongoose.Types.ObjectId(changedBy),
    changedAt Date(),
    reason,
    comments
  } as IStatusChange);
  
  return this.save();
};

// Instance method to calculate refund amount
BookingSchema.methods.calculateRefundAmount = function() {
  const now = new Date();
  const scheduledTime = this.scheduledDate.getTime();
  const currentTime = now.getTime();
  const hoursUntilService = (scheduledTime - currentTime) / (1000 * 60 * 60);
  
  let refundPercentage = 0;
  
  if (hoursUntilService > 24) {
    refundPercentage = 1.0; // 100% refund
  } else if (hoursUntilService > 12) {
    refundPercentage = 0.75; // 75% refund
  } else if (hoursUntilService > 2) {
    refundPercentage = 0.5; // 50% refund
  } else {
    refundPercentage = 0.25; // 25% refund
  }
  
  return Math.round(this.pricing.totalAmount * refundPercentage);
};

// Instance method to add work summary
BookingSchema.methods.addWorkSummary = function(workSummary) {
  if (!this.workSummary) {
    this.workSummary = {} as IWorkSummary;
  }
  
  Object.assign(this.workSummary, workSummary);
  return this.save();
};

// Instance method to update payment status
BookingSchema.methods.updatePaymentStatus = function(
  status,
  transactionId?,
  method?,
  amount?
) {
  this.payment.status = status as any;
  
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  
  if (method) {
    this.payment.method = method as any;
  }
  
  if (amount) {
    this.payment.paidAmount = amount;
    this.payment.paidAt = new Date();
  }
  
  return this.save();
};

// Export the model
const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
