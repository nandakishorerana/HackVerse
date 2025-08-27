import express from 'express';
import {
  getDashboardStats,
  getAnalytics,
  getSystemHealth,
  getRecentActivities,
  sendAnnouncement,
  getPlatformReport,
  updateSettings,
  exportData,
  getPendingApprovals
} from '@/controllers/admin.controller';
import { protect, restrictTo } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { body, query } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard and analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', [
  query('period').optional().isIn(['7days', '30days', '3months', '6months', '1year']),
  validateRequest
], getAnalytics);

// System monitoring
router.get('/system/health', getSystemHealth);
router.get('/system/activities', getRecentActivities);

// Platform management
router.get('/pending-approvals', getPendingApprovals);

// Communications
router.post('/announcement', [
  body('title').notEmpty().withMessage('Announcement title is required'),
  body('message').notEmpty().withMessage('Announcement message is required'),
  body('userType').optional().isIn(['all', 'customer', 'provider', 'admin']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  validateRequest
], sendAnnouncement);

// Reports and exports
router.get('/reports/platform', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validateRequest
], getPlatformReport);

router.get('/export', [
  query('dataType').isIn(['users', 'bookings', 'reviews']).withMessage('Valid data type is required'),
  query('format').optional().isIn(['json', 'csv']),
  validateRequest
], exportData);

// Settings management
router.put('/settings', [
  body('platformFeePercentage').optional().isFloat({ min, max }),
  body('maxBookingDays').optional().isInt({ min, max }),
  body('reviewEditWindow').optional().isInt({ min, max }),
  body('maintenanceMode').optional().isBoolean(),
  body('allowNewRegistrations').optional().isBoolean(),
  validateRequest
], updateSettings);

export default router;
