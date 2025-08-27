import { Document, Types } from 'mongoose';
import { Request } from 'express';

// User Types
export interface IUser extends Document {
  _id.ObjectId;
  name;
  email;
  phone;
  password;
  role: 'customer' | 'provider' | 'admin';
  avatar?;
  address?;
  addresses?;
  preferences?: {
    emailNotifications;
    smsNotifications;
    pushNotifications;
    language?;
    currency?;
  };
  isActive;
  isEmailVerified;
  isPhoneVerified;
  emailVerificationToken?;
  emailVerificationExpires?;
  phoneVerificationToken?;
  phoneVerificationExpires?;
  passwordResetToken?;
  passwordResetExpires?;
  lastLogin?;
  loginAttempts;
  loginCount?;
  lockUntil?;
  statusReason?;
  createdAt;
  updatedAt;

  // Methods
  comparePassword(candidatePassword);
  generateAuthToken();
  generateRefreshToken();
  isLocked();
  incLoginAttempts();
  generatePasswordResetToken();
  generateEmailVerificationToken();
  generatePhoneVerificationToken();
}

// Address Interface
export ;
}

// Service Provider Types
export interface IServiceProvider extends Document {
  _id.ObjectId;
  user.ObjectId | IUser;
  services.ObjectId[];
  experience;
  hourlyRate;
  description?;
  skills;
  availability;
  rating;
  totalReviews;
  totalBookings;
  completedBookings;
  isVerified;
  verificationDocuments;
  portfolio;
  serviceArea: {
    cities;
    maxDistance; // in kilometers
  };
  profileViews;
  joinedDate;
  lastActiveDate;
  isAvailable;
  createdAt;
  updatedAt;
  
  // Instance methods
  updateRating(newRating);
  incrementProfileViews();
  addPortfolioItem(portfolioItem);
  updateAvailability(availability);
}

// Availability Schedule
export 

export 

// Verification Document
export 

// Portfolio Item
export 

// Service Types
export interface IService extends Document {
  _id.ObjectId;
  name;
  category;
  subcategory?;
  description;
  longDescription?;
  basePrice;
  priceUnit: 'fixed' | 'hourly' | 'square_foot' | 'per_item';
  duration; // in minutes
  tags;
  requirements;
  images;
  icon?;
  isActive;
  popularity;
  averageRating;
  totalReviews;
  createdAt;
  updatedAt;
  
  // Instance methods
  incrementPopularity();
  updateRating(newRating);
}

// Booking Types
export interface IBooking extends Document {
  _id.ObjectId;
  bookingNumber;
  customer.ObjectId | IUser;
  provider.ObjectId | IServiceProvider;
  service.ObjectId | IService;
  scheduledDate;
  estimatedDuration; // in minutes
  actualDuration?; // in minutes
  address;
  contactPhone;
  specialInstructions?;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  statusHistory;
  pricing;
  payment;
  workSummary?;
  cancelledBy?: 'customer' | 'provider' | 'admin';
  cancellationReason?;
  cancellationDate?;
  refundAmount?;
  createdAt;
  updatedAt;
  
  // Instance methods
  updateStatus(newStatus, changedBy, reason?, comments?);
  calculateRefundAmount();
  addWorkSummary(workSummary);
  updatePaymentStatus(status, transactionId?, method?, amount?);
}

export 

export 

export 

export 

export 

// Review Types
export interface IReview extends Document {
  _id.ObjectId;
  booking.ObjectId | IBooking;
  customer.ObjectId | IUser;
  provider.ObjectId | IServiceProvider;
  service.ObjectId | IService;
  rating;
  comment?;
  images?;
  aspects: {
    punctuality;
    quality;
    professionalism;
    valueForMoney;
  };
  isAnonymous;
  isReported;
  reportReason?;
  adminResponse?;
  helpfulCount;
  status?: 'active' | 'hidden' | 'reported';
  reports?: {
    reportedBy.ObjectId;
    reason;
    reportedAt;
  }[];
  providerResponse?: {
    response;
    respondedAt;
  };
  moderationReason?;
  createdAt;
  updatedAt;
}

// Notification Types
export interface INotification extends Document {
  _id.ObjectId;
  recipient.ObjectId;
  type: 'booking' | 'payment' | 'review' | 'system' | 'promotion';
  title;
  message;
  data?;
  channels: ('push' | 'email' | 'sms')[];
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?;
  sentAt?;
  deliveredAt?;
  readAt?;
  expiresAt?;
  createdAt;
  updatedAt;
}

// Chat Types
export interface IChat extends Document {
  _id.ObjectId;
  booking.ObjectId;
  participants.ObjectId[];
  messages;
  isActive;
  lastMessageAt;
  createdAt;
  updatedAt;
}

export ;
  sentAt;
  readBy: {
    user.ObjectId;
    readAt;
  }[];
  isDeleted;
  deletedAt?;
}

// Coupon Types
export interface ICoupon extends Document {
  _id.ObjectId;
  code;
  title;
  description;
  type: 'percentage' | 'fixed';
  value;
  minimumOrderAmount?;
  maximumDiscountAmount?;
  usageLimit;
  usedCount;
  isActive;
  applicableServices?.ObjectId[];
  applicableCategories?;
  validFrom;
  validUntil;
  userRestrictions?: {
    newUsersOnly?;
    maxUsagePerUser?;
  };
  createdBy.ObjectId;
  createdAt;
  updatedAt;
}

// Analytics Types
export [];
  revenueByMonth: {
    month;
    revenue;
  }[];
  userGrowth: {
    month;
    users;
  }[];
}

// Request Types
export interface IAuthenticatedRequest extends Request {
  user?;
  provider?;
}

export 

export interface ISearchQuery extends IPaginationQuery {
  q?;
  category?;
  city?;
  minPrice?;
  maxPrice?;
  rating?;
  location?: {
    latitude;
    longitude;
    radius;
  };
}

// Response Types
export interface IApiResponse {
  success;
  message;
  data?;
  errors?;
  pagination?: {
    currentPage;
    totalPages;
    totalItems;
    itemsPerPage;
    hasNext;
    hasPrev;
  };
}

// JWT Payload
export 

// File Upload Types
export 

export 

// Email Types
export 

// SMS Types
export 

// Push Notification Types
export 

// All types are exported individually above, no default export needed for interfaces
