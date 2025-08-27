import mongoose, { Schema, Model } from 'mongoose';
import { IServiceProvider, IAvailability, ITimeSlot, IVerificationDocument, IPortfolioItem } from '@/types';

// TimeSlot Schema
const TimeSlotSchema = new Schema({
  start: {
    type,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH format']
  },
  end: {
    type,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH format']
  },
  isAvailable: {
    type,
    default
  }
}, { _id });

// Availability Schema
const AvailabilitySchema = new Schema({
  monday: [TimeSlotSchema],
  tuesday: [TimeSlotSchema],
  wednesday: [TimeSlotSchema],
  thursday: [TimeSlotSchema],
  friday: [TimeSlotSchema],
  saturday: [TimeSlotSchema],
  sunday: [TimeSlotSchema]
}, { _id });

// Verification Document Schema
const VerificationDocumentSchema = new Schema({
  type: {
    type,
    required: [true, 'Document type is required'],
    enum: {
      values: ['identity', 'address', 'professional', 'other'],
      message: 'Document type must be identity, address, professional, or other'
    }
  },
  documentNumber: {
    type,
    required: [true, 'Document number is required'],
    trim
  },
  imageUrl: {
    type,
    required: [true, 'Document image is required']
  },
  isVerified: {
    type,
    default
  },
  verifiedBy: {
    type.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type
  },
  remarks: {
    type,
    trim
  }
}, { _id, timestamps });

// Portfolio Item Schema
const PortfolioItemSchema = new Schema({
  title: {
    type,
    required: [true, 'Portfolio title is required'],
    trim,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type,
    required: [true, 'Portfolio description is required'],
    trim,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: {
    type: [String],
    validate: {
      validator(images) {
        return images.length  0;
      },
      message: 'Portfolio must have 1-10 images'
    }
  },
  serviceType: {
    type,
    required: [true, 'Service type is required'],
    trim
  },
  completedDate: {
    type,
    required: [true, 'Completion date is required']
  },
  clientFeedback: {
    type,
    trim,
    maxlength: [300, 'Client feedback cannot exceed 300 characters']
  }
}, { _id, timestamps });

// ServiceProvider Schema
const ServiceProviderSchema = new Schema({
  user: {
    type.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique
  },
  services: [{
    type.Types.ObjectId,
    ref: 'Service'
  }],
  experience: {
    type,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  hourlyRate: {
    type,
    required: [true, 'Hourly rate is required'],
    min: [50, 'Hourly rate must be at least ₹50'],
    max: [10000, 'Hourly rate cannot exceed ₹10,000']
  },
  description: {
    type,
    trim,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  skills: {
    type: [String],
    validate: {
      validator(skills) {
        return skills.length <= 20;
      },
      message: 'Cannot have more than 20 skills'
    }
  },
  availability: {
    type,
    default: () => ({
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    })
  },
  rating: {
    type,
    default,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: {
    type,
    default,
    min: [0, 'Total reviews cannot be negative']
  },
  totalBookings: {
    type,
    default,
    min: [0, 'Total bookings cannot be negative']
  },
  completedBookings: {
    type,
    default,
    min: [0, 'Completed bookings cannot be negative']
  },
  isVerified: {
    type,
    default
  },
  verificationDocuments: [VerificationDocumentSchema],
  portfolio: {
    type: [PortfolioItemSchema],
    validate: {
      validator(portfolio) {
        return portfolio.length <= 20;
      },
      message: 'Cannot have more than 20 portfolio items'
    }
  },
  serviceArea: {
    cities: {
      type: [String],
      validate: {
        validator(cities) {
          return cities.length > 0 && cities.length <= 50;
        },
        message: 'Must specify 1-50 service cities'
      }
    },
    maxDistance: {
      type,
      default,
      min: [1, 'Service distance must be at least 1 km'],
      max: [200, 'Service distance cannot exceed 200 km']
    }
  },
  profileViews: {
    type,
    default,
    min: [0, 'Profile views cannot be negative']
  },
  joinedDate: {
    type,
    default.now
  },
  lastActiveDate: {
    type,
    default.now
  },
  isAvailable: {
    type,
    default
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
ServiceProviderSchema.index({ user });
ServiceProviderSchema.index({ 'serviceArea.cities' });
ServiceProviderSchema.index({ rating: -1 });
ServiceProviderSchema.index({ totalReviews: -1 });
ServiceProviderSchema.index({ isVerified, isAvailable });
ServiceProviderSchema.index({ services });
ServiceProviderSchema.index({ hourlyRate });
ServiceProviderSchema.index({ experience: -1 });
ServiceProviderSchema.index({ createdAt: -1 });

// Compound indexes
ServiceProviderSchema.index({ 
  isVerified, 
  isAvailable, 
  rating: -1, 
  totalReviews: -1 
});

ServiceProviderSchema.index({ 
  'serviceArea.cities', 
  services, 
  isAvailable 
});

// Virtual for completion rate
ServiceProviderSchema.virtual('completionRate').get(function(this) {
  if (this.totalBookings === 0) return 0;
  return Number(((this.completedBookings / this.totalBookings) * 100).toFixed(2));
});

// Virtual for response time (mock data, can be calculated from actual data)
ServiceProviderSchema.virtual('averageResponseTime').get(function(this) {
  // This would be calculated from actual message/booking response data
  return 30; // minutes
});

// Static method to find providers by service and location
ServiceProviderSchema.statics.findByServiceAndLocation = function(
  serviceId,
  city,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  
  return this.find({
    services,
    'serviceArea.cities': { $regex RegExp(city, 'i') },
    isVerified,
    isAvailable
  })
    .populate('user', 'name avatar phone')
    .populate('services', 'name category basePrice')
    .sort({ rating: -1, totalReviews: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get top providers
ServiceProviderSchema.statics.getTopProviders = function(limit = 10) {
  return this.find({
    isVerified,
    isAvailable,
    totalReviews: { $gte }
  })
    .populate('user', 'name avatar')
    .populate('services', 'name category')
    .sort({ rating: -1, totalReviews: -1 })
    .limit(limit);
};

// Instance method to update rating
ServiceProviderSchema.methods.updateRating = async function(newRating) {
  const totalRating = (this.rating * this.totalReviews) + newRating;
  const newTotalReviews = this.totalReviews + 1;
  const newAverageRating = totalRating / newTotalReviews;

  return this.updateOne({
    rating(newAverageRating.toFixed(2)),
    totalReviews
  });
};

// Instance method to increment profile views
ServiceProviderSchema.methods.incrementProfileViews = function() {
  return this.updateOne({ $inc: { profileViews } });
};

// Instance method to add portfolio item
ServiceProviderSchema.methods.addPortfolioItem = function(portfolioItem) {
  if (this.portfolio.length >= 20) {
    throw new Error('Cannot add more than 20 portfolio items');
  }
  
  this.portfolio.push(portfolioItem);
  return this.save();
};

// Instance method to update availability
ServiceProviderSchema.methods.updateAvailability = function(availability) {
  this.availability = availability;
  return this.save();
};

// Pre-save middleware
ServiceProviderSchema.pre('save', function(next) {
  // Update last active date
  this.lastActiveDate = new Date();
  
  // Ensure skills are properly formatted
  if (this.skills) {
    this.skills = this.skills.map(skill => skill.trim().toLowerCase()).filter(Boolean);
  }
  
  // Ensure service area cities are properly formatted
  if (this.serviceArea && this.serviceArea.cities) {
    this.serviceArea.cities = this.serviceArea.cities.map(city => 
      city.trim().toLowerCase()
    ).filter(Boolean);
  }

  next();
});

// Export the model
const ServiceProvider = mongoose.model('ServiceProvider', ServiceProviderSchema);
export default ServiceProvider;
