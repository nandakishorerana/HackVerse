import { Request, Response } from 'express';
import { Review, Booking, User, Service, ServiceProvider } from '@/models';
import { AppError } from '@/utils/AppError';
import { catchAsync } from '@/utils/catchAsync';
import { APIFeatures } from '@/utils/APIFeatures';

interface AuthRequest extends Request {
  user?;
}

// Create a new review
export const createReview = catchAsync(async (req, res) => {
  const { bookingId, serviceId, providerId, rating, comment, images } = req.body;
  const customerId = req.user.id;

  // Check if booking exists and belongs to the user
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.customer.toString() !== customerId) {
    throw new AppError('You can only review your own bookings', 403);
  }

  if (booking.status !== 'completed') {
    throw new AppError('You can only review completed bookings', 400);
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking });
  if (existingReview) {
    throw new AppError('You have already reviewed this booking', 400);
  }

  const review = await Review.create({
    customer,
    service,
    provider,
    booking,
    rating,
    comment,
    images || []
  });

  await review.populate('customer', 'name avatar');

  // Update service and provider ratings
  await updateServiceRating(serviceId);
  await updateProviderRating(providerId);

  res.status(201).json({
    success,
    message: 'Review submitted successfully',
    data
  });
});

// Get reviews for a service
export const getServiceReviews = catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  
  const features = new APIFeatures(
    Review.find({ service })
      .populate('customer', 'name avatar')
      .populate('booking', 'scheduledDate')
      .sort('-createdAt'),
    req.query
  ).paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ service });

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { service } },
    {
      $group: {
        _id: '$rating',
        count: { $sum }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const avgRating = await Review.aggregate([
    { $match: { service } },
    {
      $group: {
        _id,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum }
      }
    }
  ]);

  res.status(200).json({
    success,
    results.length,
    total,
    data: {
      reviews,
      stats: {
        averageRating[0]?.averageRating || 0,
        totalReviews[0]?.totalReviews || 0,
        ratingDistribution
      }
    }
  });
});

// Get reviews for a provider
export const getProviderReviews = catchAsync(async (req, res) => {
  const { providerId } = req.params;
  
  const features = new APIFeatures(
    Review.find({ provider })
      .populate('customer', 'name avatar')
      .populate('service', 'name')
      .populate('booking', 'scheduledDate')
      .sort('-createdAt'),
    req.query
  ).paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ provider });

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { provider } },
    {
      $group: {
        _id: '$rating',
        count: { $sum }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const avgRating = await Review.aggregate([
    { $match: { provider } },
    {
      $group: {
        _id,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum }
      }
    }
  ]);

  res.status(200).json({
    success,
    results.length,
    total,
    data: {
      reviews,
      stats: {
        averageRating[0]?.averageRating || 0,
        totalReviews[0]?.totalReviews || 0,
        ratingDistribution
      }
    }
  });
});

// Get user's reviews (reviews written by the user)
export const getUserReviews = catchAsync(async (req, res) => {
  const customerId = req.user.id;
  
  const features = new APIFeatures(
    Review.find({ customer })
      .populate('service', 'name images')
      .populate('provider', 'name avatar')
      .populate('booking', 'scheduledDate')
      .sort('-createdAt'),
    req.query
  ).paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ customer });

  res.status(200).json({
    success,
    results.length,
    total,
    data
  });
});

// Update a review
export const updateReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, images } = req.body;
  const customerId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.customer.toString() !== customerId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  // Check if it's within edit window (e.g., 7 days)
  const daysSinceReview = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReview > 7) {
    throw new AppError('Reviews can only be edited within 7 days', 400);
  }

  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { rating, comment, images, updatedAt Date() },
    { new, runValidators }
  ).populate('customer', 'name avatar');

  // Update service and provider ratings if rating changed
  if (review.rating !== rating) {
    await updateServiceRating(review.service.toString());
    await updateProviderRating(review.provider.toString());
  }

  res.status(200).json({
    success,
    message: 'Review updated successfully',
    data
  });
});

// Delete a review
export const deleteReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const customerId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.customer.toString() !== customerId) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  await Review.findByIdAndDelete(reviewId);

  // Update service and provider ratings
  await updateServiceRating(review.service.toString());
  await updateProviderRating(review.provider.toString());

  res.status(200).json({
    success,
    message: 'Review deleted successfully'
  });
});

// Report a review
export const reportReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { reason, description } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Add report to review
  review.reports.push({
    reportedBy.user.id,
    reason,
    description,
    reportedAt Date()
  });

  // If multiple reports, flag for admin review
  if (review.reports.length >= 3) {
    review.status = 'reported';
  }

  await review.save();

  res.status(200).json({
    success,
    message: 'Review reported successfully'
  });
});

// Respond to a review (for providers)
export const respondToReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { response } = req.body;
  const providerId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.provider.toString() !== providerId) {
    throw new AppError('You can only respond to reviews for your services', 403);
  }

  if (review.providerResponse) {
    throw new AppError('You have already responded to this review', 400);
  }

  review.providerResponse = {
    response,
    respondedAt Date()
  };

  await review.save();

  res.status(200).json({
    success,
    message: 'Response added successfully',
    data
  });
});

// Admin all reviews with reports
export const getReportedReviews = catchAsync(async (req, res) => {
  const features = new APIFeatures(
    Review.find({ 
      $or: [
        { status: 'reported' },
        { 'reports.0': { $exists } }
      ]
    })
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'name')
      .sort('-updatedAt'),
    req.query
  ).paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ 
    $or: [
      { status: 'reported' },
      { 'reports.0': { $exists } }
    ]
  });

  res.status(200).json({
    success,
    results.length,
    total,
    data
  });
});

// Admin action on reported review
export const moderateReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { action, reason } = req.body; // action: 'approve', 'hide', 'delete'

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  switch (action) {
    case 'approve'.status = 'active';
      review.reports = [];
      break;
    case 'hide'.status = 'hidden';
      break;
    case 'delete' Review.findByIdAndDelete(reviewId);
      // Update ratings after deletion
      await updateServiceRating(review.service.toString());
      await updateProviderRating(review.provider.toString());
      
      return res.status(200).json({
        success,
        message: 'Review deleted successfully'
      });
    default new AppError('Invalid action', 400);
  }

  review.moderationReason = reason;
  await review.save();

  res.status(200).json({
    success,
    message: `Review ${action}ed successfully`,
    data
  });
});

// Helper function to update service rating
async function updateServiceRating(serviceId) {
  const stats = await Review.aggregate([
    { $match: { service, status: 'active' } },
    {
      $group: {
        _id,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum }
      }
    }
  ]);

  const rating = stats[0]?.averageRating || 0;
  const reviewCount = stats[0]?.totalReviews || 0;

  await Service.findByIdAndUpdate(serviceId, {
    'rating.average',
    'rating.count'
  });
}

// Helper function to update provider rating
async function updateProviderRating(providerId) {
  const stats = await Review.aggregate([
    { $match: { provider, status: 'active' } },
    {
      $group: {
        _id,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum }
      }
    }
  ]);

  const rating = stats[0]?.averageRating || 0;
  const reviewCount = stats[0]?.totalReviews || 0;

  await ServiceProvider.findByIdAndUpdate(providerId, {
    'rating.average',
    'rating.count'
  });
}

// Get review statistics
export const getReviewStats = catchAsync(async (req, res) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id,
        totalReviews: { $sum },
        averageRating: { $avg: '$rating' },
        activeReviews: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        reportedReviews: { $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] } },
        hiddenReviews: { $sum: { $cond: [{ $eq: ['$status', 'hidden'] }, 1, 0] } }
      }
    }
  ]);

  const ratingDistribution = await Review.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const monthlyReviews = await Review.aggregate([
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
        totalReviews,
        averageRating,
        activeReviews,
        reportedReviews,
        hiddenReviews
      },
      ratingDistribution,
      monthlyReviews
    }
  });
});
