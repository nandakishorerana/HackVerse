import express from 'express';
import {
  createReview,
  getServiceReviews,
  getProviderReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  reportReview,
  respondToReview,
  getReportedReviews,
  moderateReview,
  getReviewStats
} from '@/controllers/review.controller';
import { protect, restrictTo, optionalAuth } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/service/', [
  param('serviceId').isMongoId().withMessage('Valid service ID is required'),
  query('page').optional().isInt({ min }),
  query('limit').optional().isInt({ min, max }),
  query('rating').optional().isInt({ min, max }),
  validateRequest
], optionalAuth, getServiceReviews);

router.get('/provider/', [
  param('providerId').isMongoId().withMessage('Valid provider ID is required'),
  query('page').optional().isInt({ min }),
  query('limit').optional().isInt({ min, max }),
  query('rating').optional().isInt({ min, max }),
  validateRequest
], optionalAuth, getProviderReviews);

// Protected routes
router.use(protect);

// Create review
router.post('/', [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('rating').isInt({ min, max }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().trim(),
  body('images').optional().isArray(),
  validateRequest
], createReview);

// Get user's reviews
router.get('/my-reviews', [
  query('page').optional().isInt({ min }),
  query('limit').optional().isInt({ min, max }),
  validateRequest
], getUserReviews);

// Update review
router.put('/', [
  param('reviewId').isMongoId().withMessage('Valid review ID is required'),
  body('rating').optional().isInt({ min, max }),
  body('comment').optional().isString().trim(),
  body('images').optional().isArray(),
  validateRequest
], updateReview);

// Delete review
router.delete('/', [
  param('reviewId').isMongoId().withMessage('Valid review ID is required'),
  validateRequest
], deleteReview);

// Report review
router.post('//report', [
  param('reviewId').isMongoId().withMessage('Valid review ID is required'),
  body('reason').isIn(['spam', 'inappropriate', 'fake', 'offensive', 'other']).withMessage('Valid reason is required'),
  body('description').optional().isString().trim(),
  validateRequest
], reportReview);

// Respond to review (providers only)
router.post('//respond', [
  param('reviewId').isMongoId().withMessage('Valid review ID is required'),
  body('response').notEmpty().withMessage('Response is required').trim(),
  validateRequest
], respondToReview);

// Admin routes
router.get('/admin/reported', restrictTo('admin'), [
  query('page').optional().isInt({ min }),
  query('limit').optional().isInt({ min, max }),
  validateRequest
], getReportedReviews);

router.put('/admin//moderate', restrictTo('admin'), [
  param('reviewId').isMongoId().withMessage('Valid review ID is required'),
  body('action').isIn(['approve', 'hide', 'delete']).withMessage('Valid action is required'),
  body('reason').optional().isString().trim(),
  validateRequest
], moderateReview);

router.get('/admin/stats', restrictTo('admin'), getReviewStats);

export default router;
