import { Request, Response } from 'express';
import { User, Service, ServiceProvider, Booking, Review } from '@/models';
import { AppError } from '@/utils/AppError';
import { catchAsync } from '@/utils/catchAsync';
import { APIFeatures } from '@/utils/APIFeatures';
import { emailService } from '@/services/email.service';

// Get dashboard overview statistics
export const getDashboardStats = catchAsync(async (req, res) => {
  const [
    userStats,
    serviceStats,
    providerStats,
    bookingStats,
    reviewStats,
    revenueStats
  ] = await Promise.all([
    // User Statistics
    User.aggregate([
      {
        $group: {
          _id,
          totalUsers: { $sum },
          activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
          providers: { $sum: { $cond: [{ $eq: ['$role', 'provider'] }, 1, 0] } }
        }
      }
    ]),

    // Service Statistics
    Service.aggregate([
      {
        $group: {
          _id,
          totalServices: { $sum },
          activeServices: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          avgPrice: { $avg: '$price' }
        }
      }
    ]),

    // Provider Statistics
    ServiceProvider.aggregate([
      {
        $group: {
          _id,
          totalProviders: { $sum },
          activeProviders: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          verifiedProviders: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } }
        }
      }
    ]),

    // Booking Statistics
    Booking.aggregate([
      {
        $group: {
          _id,
          totalBookings: { $sum },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]),

    // Review Statistics
    Review.aggregate([
      {
        $group: {
          _id,
          totalReviews: { $sum },
          averageRating: { $avg: '$rating' },
          reportedReviews: { $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] } }
        }
      }
    ]),

    // Revenue Statistics (from completed bookings)
    Booking.aggregate([
      {
        $match: { status: 'completed', 'payment.status': 'completed' }
      },
      {
        $group: {
          _id,
          totalRevenue: { $sum: '$totalAmount' },
          platformFee: { $sum: '$platformFee' },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      }
    ])
  ]);

  // Calculate growth rates (comparing to last month)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [lastMonthUsers, lastMonthBookings] = await Promise.all([
    User.countDocuments({ createdAt: { $gte } }),
    Booking.countDocuments({ createdAt: { $gte } })
  ]);

  res.status(200).json({
    success,
    data: {
      users[0] || {
        totalUsers,
        activeUsers,
        verifiedUsers,
        customers,
        providers
      },
      services[0] || {
        totalServices,
        activeServices,
        avgPrice
      },
      providers[0] || {
        totalProviders,
        activeProviders,
        verifiedProviders
      },
      bookings[0] || {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings
      },
      reviews[0] || {
        totalReviews,
        averageRating,
        reportedReviews
      },
      revenue[0] || {
        totalRevenue,
        platformFee,
        averageBookingValue
      },
      growth: {
        newUsers,
        newBookings
      }
    }
  });
});

// Get analytics data for charts
export const getAnalytics = catchAsync(async (req, res) => {
  const { period = '6months' } = req.query;

  let startDate;
  let groupBy;

  switch (period) {
    case '7days' = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      break;
    case '30days' = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      break;
    case '3months' = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      groupBy = { $dateToString: { format: "%Y-%U", date: "$createdAt" } };
      break;
    case '6months' = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
      break;
    case '1year' = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
      break;
  }

  const [userGrowth, bookingTrends, revenueTrends] = await Promise.all([
    // User growth over time
    User.aggregate([
      { $match: { createdAt: { $gte } } },
      {
        $group: {
          _id,
          count: { $sum }
        }
      },
      { $sort: { _id } }
    ]),

    // Booking trends
    Booking.aggregate([
      { $match: { createdAt: { $gte } } },
      {
        $group: {
          _id: {
            period,
            status: '$status'
          },
          count: { $sum }
        }
      },
      { $sort: { '_id.period' } }
    ]),

    // Revenue trends
    Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte },
          status: 'completed',
          'payment.status': 'completed'
        } 
      },
      {
        $group: {
          _id,
          revenue: { $sum: '$totalAmount' },
          platformFee: { $sum: '$platformFee' },
          count: { $sum }
        }
      },
      { $sort: { _id } }
    ])
  ]);

  res.status(200).json({
    success,
    data: {
      userGrowth,
      bookingTrends,
      revenueTrends,
      period
    }
  });
});

// Get system health and performance metrics
export const getSystemHealth = catchAsync(async (req, res) => {
  // Database connection status
  const dbStatus = 'connected'; // You would check actual DB connection here

  // Recent errors (you would typically store these in a separate collection)
  const recentErrors = []; // Placeholder

  // API performance metrics (you would typically use a monitoring service)
  const apiMetrics = {
    averageResponseTime, // ms
    requestsPerMinute,
    errorRate.02 // 2%
  };

  // Queue status (if using job queues)
  const queueStatus = {
    emailQueue,
    notificationQueue,
    processingQueue
  };

  res.status(200).json({
    success,
    data: {
      database: {
        status,
        connections, // active connections
        responseTime // ms
      },
      api,
      queues,
      recentErrors,
      uptime.uptime(),
      memory.memoryUsage(),
      timestamp Date()
    }
  });
});

// Get recent activities/audit log
export const getRecentActivities = catchAsync(async (req, res) => {
  // This would typically come from an audit log collection
  // For now, we'll get recent entities from different collections
  const [recentUsers, recentBookings, recentProviders, recentReviews] = await Promise.all([
    User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
    Booking.find().sort('-createdAt').limit(5).populate('customer', 'name').populate('service', 'name'),
    ServiceProvider.find().sort('-createdAt').limit(3).select('name email createdAt'),
    Review.find().sort('-createdAt').limit(5).populate('customer', 'name').populate('service', 'name')
  ]);

  const activities = [
    ...(recentUsers as any[]).map(user => ({
      type: 'user_registered',
      description: `New user ${user.name} registered`,
      timestamp.createdAt,
      metadata: { userId._id, role.role }
    })),
    ...(recentBookings as any[]).map(booking => ({
      type: 'booking_created',
      description: `New booking created by ${typeof booking.customer === 'object' && booking.customer as any ? booking.customer.name : 'customer'}`,
      timestamp.createdAt,
      metadata: { bookingId._id }
    })),
    ...(recentProviders as any[]).map(provider => ({
      type: 'provider_registered',
      description: `New service provider ${typeof provider.user === 'object' && provider.user as any ? provider.user.name : 'provider'} registered`,
      timestamp.createdAt,
      metadata: { providerId._id }
    })),
    ...(recentReviews as any[]).map(review => ({
      type: 'review_created',
      description: `New review posted for ${typeof review.service === 'object' && review.service as any ? review.service.name : 'service'}`,
      timestamp.createdAt,
      metadata: { reviewId._id }
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

  res.status(200).json({
    success,
    data
  });
});

// Send system announcement
export const sendAnnouncement = catchAsync(async (req, res) => {
  const { title, message, userType, priority = 'normal' } = req.body;

  let userFilter = { isActive };
  
  if (userType && userType !== 'all') {
    userFilter.role = userType;
  }

  const users = await User.find(userFilter).select('email name');

  // Send emails to all matching users
  const emailPromises = (users as any[]).map(user => 
    emailService.sendSystemAnnouncementEmail(user.email, user.name, title, message)
  );

  await Promise.all(emailPromises);

  // Log the announcement (in a real app, you'd save this to an announcements collection)
  console.log(`Announcement sent to ${users.length} users:`, { title, message, userType });

  res.status(200).json({
    success,
    message: `Announcement sent to ${users.length} users successfully`,
    data: {
      recipientCount.length,
      title,
      userType
    }
  });
});

// Get platform statistics for reports
export const getPlatformReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string)  Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string)  Date();

  const [
    periodStats,
    topServices,
    topProviders,
    locationStats
  ] = await Promise.all([
    // Overall period statistics
    Promise.all([
      User.countDocuments({ createdAt: { $gte, $lte } }),
      Booking.countDocuments({ createdAt: { $gte, $lte } }),
      Booking.aggregate([
        { 
          $match: { 
            createdAt: { $gte, $lte },
            status: 'completed',
            'payment.status': 'completed'
          } 
        },
        {
          $group: {
            _id,
            totalRevenue: { $sum: '$totalAmount' },
            platformFee: { $sum: '$platformFee' }
          }
        }
      ])
    ]),

    // Top performing services
    Booking.aggregate([
      { $match: { createdAt: { $gte, $lte } } },
      {
        $group: {
          _id: '$service',
          bookings: { $sum },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      }
    ]),

    // Top performing providers
    Booking.aggregate([
      { $match: { createdAt: { $gte, $lte } } },
      {
        $group: {
          _id: '$provider',
          bookings: { $sum },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit },
      {
        $lookup: {
          from: 'serviceproviders',
          localField: '_id',
          foreignField: '_id',
          as: 'providerInfo'
        }
      }
    ]),

    // Location-based statistics
    Booking.aggregate([
      { $match: { createdAt: { $gte, $lte } } },
      {
        $group: {
          _id: '$address.city',
          bookings: { $sum },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit }
    ])
  ]);

  res.status(200).json({
    success,
    data: {
      period: { start, end },
      overview: {
        newUsers[0],
        totalBookings[1],
        revenue[2][0] || { totalRevenue, platformFee }
      },
      topServices,
      topProviders,
      locationStats
    }
  });
});

// Manage platform settings
export const updateSettings = catchAsync(async (req, res) => {
  const settings = req.body;

  // In a real app, you'd store these in a settings collection or configuration service
  // For now, we'll just validate and return success
  const validSettings = [
    'platformFeePercentage',
    'maxBookingDays',
    'reviewEditWindow',
    'maintenanceMode',
    'allowNewRegistrations'
  ];

  const validatedSettings = {};
  for (const [key, value] of Object.entries(settings)) {
    if (validSettings.includes(key)) {
      validatedSettings[key] = value;
    }
  }

  // Here you would typically save to a settings collection
  console.log('Updated platform settings:', validatedSettings);

  res.status(200).json({
    success,
    message: 'Settings updated successfully',
    data
  });
});

// Export data for compliance/backup
export const exportData = catchAsync(async (req, res) => {
  const { dataType, format = 'json' } = req.query;

  let data;
  let filename;

  switch (dataType) {
    case 'users' = await User.find().select('-password');
      filename = `users_export_${Date.now()}`;
      break;
    case 'bookings' = await Booking.find().populate('customer service provider');
      filename = `bookings_export_${Date.now()}`;
      break;
    case 'reviews' = await Review.find().populate('customer service provider');
      filename = `reviews_export_${Date.now()}`;
      break;
    default new AppError('Invalid data type for export', 400);
  }

  if (format === 'csv') {
    // You would typically use a CSV library here
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.status(200).send('CSV export not implemented yet');
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.status(200).json({
      exportedAt Date(),
      dataType,
      count.length,
      data
    });
  }
});

// Get pending approvals (providers, services, etc.)
export const getPendingApprovals = catchAsync(async (req, res) => {
  const [pendingProviders, reportedReviews, flaggedContent] = await Promise.all([
    ServiceProvider.find({ isVerified, isActive })
      .select('name email phone services createdAt')
      .limit(20),
    
    Review.find({ status: 'reported' })
      .populate('customer', 'name')
      .populate('service', 'name')
      .limit(20),

    // Add other types of content that need approval
    []
  ]);

  res.status(200).json({
    success,
    data: {
      pendingProviders.length,
      reportedReviews.length,
      flaggedContent.length,
      details: {
        providers,
        reviews,
        content
      }
    }
  });
});
