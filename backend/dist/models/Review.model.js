import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '@/types';

// Aspects Schema for detailed ratings
const AspectsSchema = new Schema({
  punctuality: {
    type,
    required: [true, 'Punctuality rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  quality: {
    type,
    required: [true, 'Quality rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  professionalism: {
    type,
    required: [true, 'Professionalism rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  valueForMoney: {
    type,
    required: [true, 'Value for money rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  }
}, { _id });

// Review Schema
const ReviewSchema = new Schema({
  booking: {
    type.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
    unique // One review per booking
  },
  customer: {
    type.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required']
  },
  provider: {
    type.Types.ObjectId,
    ref: 'ServiceProvider',
    required: [true, 'Provider reference is required']
  },
  service: {
    type.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required']
  },
  rating: {
    type,
    required: [true, 'Overall rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  comment: {
    type,
    trim,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    minlength: [10, 'Comment must be at least 10 characters long']
  },
  images: {
    type: [String],
    validate: {
      validator(images) {
        return images.length <= 5;
      },
      message: 'Cannot upload more than 5 images'
    }
  },
  aspects: {
    type,
    required: [true, 'Detailed ratings are required']
  },
  isAnonymous: {
    type,
    default
  },
  isReported: {
    type,
    default
  },
  reportReason: {
    type,
    trim,
    maxlength: [200, 'Report reason cannot exceed 200 characters']
  },
  adminResponse: {
    type,
    trim,
    maxlength: [500, 'Admin response cannot exceed 500 characters']
  },
  helpfulCount: {
    type,
    default,
    min: [0, 'Helpful count cannot be negative']
  }
}, {
  timestamps,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Hide customer info if anonymous
      if (ret.isAnonymous && ret.customer) {
        ret.customer = {
          id.customer.id || ret.customer._id,
          name: 'Anonymous',
          avatar
        };
      }
      
      return ret;
    }
  }
});

// Indexes for better query performance
ReviewSchema.index({ booking });
ReviewSchema.index({ customer });
ReviewSchema.index({ provider });
ReviewSchema.index({ service });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ isReported });
ReviewSchema.index({ helpfulCount: -1 });

// Compound indexes
ReviewSchema.index({ provider, rating: -1, createdAt: -1 });
ReviewSchema.index({ service, rating: -1, createdAt: -1 });
ReviewSchema.index({ isReported, createdAt: -1 });

// Virtual for average aspect rating
ReviewSchema.virtual('averageAspectRating').get(function(this) {
  if (!this.aspects) return 0;
  
  const total = this.aspects.punctuality + 
                this.aspects.quality + 
                this.aspects.professionalism + 
                this.aspects.valueForMoney;
  
  return Number((total / 4).toFixed(2));
});

// Virtual for review age in days
ReviewSchema.virtual('reviewAge').get(function(this) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get reviews by provider
ReviewSchema.statics.getByProvider = function(
  providerId,
  page = 1,
  limit = 20,
  rating?
) {
  const skip = (page - 1) * limit;
  const query = { 
    provider,
    isReported
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  return this.find(query)
    .populate('customer', 'name avatar')
    .populate('service', 'name category')
    .populate('booking', 'bookingNumber scheduledDate')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get reviews by service
ReviewSchema.statics.getByService = function(
  serviceId,
  page = 1,
  limit = 20,
  rating?
) {
  const skip = (page - 1) * limit;
  const query = { 
    service,
    isReported
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  return this.find(query)
    .populate('customer', 'name avatar')
    .populate('provider', 'user', { 
      populate: { path: 'user', select: 'name' }
    })
    .populate('booking', 'bookingNumber scheduledDate')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get recent reviews
ReviewSchema.statics.getRecentReviews = function(limit = 10) {
  return this.find({ isReported })
    .populate('customer', 'name avatar')
    .populate('provider', 'user', { 
      populate: { path: 'user', select: 'name' }
    })
    .populate('service', 'name category')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get top-rated reviews
ReviewSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ 
    isReported,
    rating: { $gte },
    comment: { $exists, $ne: '' }
  })
    .populate('customer', 'name avatar')
    .populate('provider', 'user', { 
      populate: { path: 'user', select: 'name' }
    })
    .populate('service', 'name category')
    .sort({ rating: -1, helpfulCount: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get provider rating statistics
ReviewSchema.statics.getProviderStats = async function(providerId) {
  const stats = await this.aggregate([
    { $match: { provider mongoose.Types.ObjectId(providerId), isReported } },
    {
      $group: {
        _id,
        totalReviews: { $sum },
        averageRating: { $avg: '$rating' },
        averagePunctuality: { $avg: '$aspects.punctuality' },
        averageQuality: { $avg: '$aspects.quality' },
        averageProfessionalism: { $avg: '$aspects.professionalism' },
        averageValueForMoney: { $avg: '$aspects.valueForMoney' },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews,
      averageRating,
      averagePunctuality,
      averageQuality,
      averageProfessionalism,
      averageValueForMoney,
      ratingDistribution: { 5, 4, 3, 2, 1 }
    };
  }
  
  const stat = stats[0];
  return {
    totalReviews.totalReviews,
    averageRating((stat.averageRating || 0).toFixed(2)),
    averagePunctuality((stat.averagePunctuality || 0).toFixed(2)),
    averageQuality((stat.averageQuality || 0).toFixed(2)),
    averageProfessionalism((stat.averageProfessionalism || 0).toFixed(2)),
    averageValueForMoney((stat.averageValueForMoney || 0).toFixed(2)),
    ratingDistribution: {
      5.fiveStars,
      4.fourStars,
      3.threeStars,
      2.twoStars,
      1.oneStar
    }
  };
};

// Static method to get service rating statistics
ReviewSchema.statics.getServiceStats = async function(serviceId) {
  const stats = await this.aggregate([
    { $match: { service mongoose.Types.ObjectId(serviceId), isReported } },
    {
      $group: {
        _id,
        totalReviews: { $sum },
        averageRating: { $avg: '$rating' },
        averagePunctuality: { $avg: '$aspects.punctuality' },
        averageQuality: { $avg: '$aspects.quality' },
        averageProfessionalism: { $avg: '$aspects.professionalism' },
        averageValueForMoney: { $avg: '$aspects.valueForMoney' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews,
      averageRating,
      averagePunctuality,
      averageQuality,
      averageProfessionalism,
      averageValueForMoney
    };
  }
  
  const stat = stats[0];
  return {
    totalReviews.totalReviews,
    averageRating((stat.averageRating || 0).toFixed(2)),
    averagePunctuality((stat.averagePunctuality || 0).toFixed(2)),
    averageQuality((stat.averageQuality || 0).toFixed(2)),
    averageProfessionalism((stat.averageProfessionalism || 0).toFixed(2)),
    averageValueForMoney((stat.averageValueForMoney || 0).toFixed(2))
  };
};

// Static method to get reported reviews
ReviewSchema.statics.getReportedReviews = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ isReported })
    .populate('customer', 'name email phone')
    .populate('provider', 'user', { 
      populate: { path: 'user', select: 'name email phone' }
    })
    .populate('service', 'name category')
    .populate('booking', 'bookingNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to mark as helpful
ReviewSchema.methods.markAsHelpful = function() {
  return this.updateOne({ $inc: { helpfulCount } });
};

// Instance method to report review
ReviewSchema.methods.reportReview = function(reason) {
  this.isReported = true;
  this.reportReason = reason;
  return this.save();
};

// Instance method to add admin response
ReviewSchema.methods.addAdminResponse = function(response) {
  this.adminResponse = response;
  return this.save();
};

// Instance method to unreport review
ReviewSchema.methods.unreportReview = function() {
  this.isReported = false;
  this.reportReason = undefined;
  return this.save();
};

// Pre-save middleware
ReviewSchema.pre('save', function(next) {
  // Ensure comment is provided for ratings below 4
  if (this.rating < 4 && (!this.comment || this.comment.trim().length < 10)) {
    return next(new Error('Comment is required for ratings below 4 stars and must be at least 10 characters long'));
  }
  
  // Calculate overall rating from aspects if not provided
  if (!this.rating && this.aspects) {
    const total = this.aspects.punctuality + 
                  this.aspects.quality + 
                  this.aspects.professionalism + 
                  this.aspects.valueForMoney;
    this.rating = Math.round(total / 4);
  }
  
  next();
});

// Post-save middleware to update provider and service ratings
ReviewSchema.post('save', async function(review) {
  try {
    // Update provider rating
    const ServiceProvider = mongoose.model('ServiceProvider');
    const provider = await ServiceProvider.findById(review.provider);
    if (provider) {
      await provider.updateRating(review.rating);
    }
    
    // Update service rating
    const Service = mongoose.model('Service');
    const service = await Service.findById(review.service);
    if (service) {
      await service.updateRating(review.rating);
    }
  } catch (error) {
    console.error('Error updating ratings after review save:', error);
  }
});

// Post-remove middleware to update provider and service ratings
ReviewSchema.post('deleteOne', async function(review) {
  try {
    // This would require recalculating ratings, which is complex
    // For now, we'll just log that a review was removed
    console.log(`Review was removed, ratings may need recalculation`);
  } catch (error) {
    console.error('Error handling review removal:', error);
  }
});

// Export the model
const Review = mongoose.model('Review', ReviewSchema);
export default Review;
