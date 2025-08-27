import { Request, Response, NextFunction } from 'express';
import Service from '@/models/Service.model';
import { AppError, catchAsync, successResponse } from '@/middleware/error.middleware';
import { IAuthenticatedRequest, ISearchQuery } from '@/types';
import logger from '@/config/logger';

/**
 * @desc    Get all services with filtering, sorting, and pagination
 * @route   GET /api/v1/services
 * @access  Public
 */
export const getAllServices = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-popularity',
    category,
    minPrice,
    maxPrice,
    minRating,
    search
  } = req.query as any;

  // Build query
  const query = { isActive };

  // Filter by category
  if (category) {
    query.category = category.toLowerCase();
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
  }

  // Filter by rating
  if (minRating) {
    query.averageRating = { $gte(minRating) };
  }

  // Search functionality
  if (search) {
    query.$text = { $search };
  }

  // Calculate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const [services, totalServices] = await Promise.all([
    Service.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Service.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalServices / limitNum);
  const hasNext = pageNum < totalPages;
  const hasPrev = pageNum > 1;

  successResponse(res, 'Services retrieved successfully', {
    services,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNext,
      hasPrev
    }
  });
});

/**
 * @desc    Get service by ID
 * @route   GET /api/v1/services/
 * @access  Public
 */
export const getServiceById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  if (!service.isActive) {
    return next(new AppError('Service is not available', 404));
  }

  // Increment popularity (view count)
  service.incrementPopularity();

  successResponse(res, 'Service retrieved successfully', { service });
});

/**
 * @desc    Get services by category
 * @route   GET /api/v1/services/category/
 * @access  Public
 */
export const getServicesByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const { limit = 20, page = 1, sort = '-averageRating' } = req.query as any;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const query = {
    category.toLowerCase(),
    isActive
  };

  const [services, totalServices] = await Promise.all([
    Service.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Service.countDocuments(query)
  ]);

  if (services.length === 0) {
    return next(new AppError('No services found in this category', 404));
  }

  const totalPages = Math.ceil(totalServices / limitNum);

  successResponse(res, `Services in ${category} category retrieved successfully`, {
    services,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNext < totalPages,
      hasPrev > 1
    }
  });
});

/**
 * @desc    Search services
 * @route   GET /api/v1/services/search
 * @access  Public
 */
export const searchServices = catchAsync(async (req, res, next) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    minRating,
    page = 1,
    limit = 20,
    location
  } = req.query as any;

  if (!searchQuery) {
    return next(new AppError('Search query is required', 400));
  }

  const filters = {
    category?.toLowerCase(),
    minPrice ? parseFloat(minPrice) ,
    maxPrice ? parseFloat(maxPrice) ,
    minRating ? parseFloat(minRating) 
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => 
    filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
  );

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  try {
    // Use the static search method from the Service model
    const services = await (Service as any).searchServices(
      searchQuery,
      filters,
      pageNum,
      limitNum
    );

    // Get total count for pagination (simplified for now)
    const totalCount = await Service.countDocuments({
      isActive,
      $text: { $search }
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    successResponse(res, 'Search results retrieved successfully', {
      services,
      searchQuery,
      filters,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNext < totalPages,
        hasPrev > 1
      }
    });
  } catch (error) {
    logger.error('Service search error:', error);
    return next(new AppError('Error performing search', 500));
  }
});

/**
 * @desc    Get popular services
 * @route   GET /api/v1/services/popular
 * @access  Public
 */
export const getPopularServices = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

  const services = await (Service as any).getPopularServices(limitNum);

  successResponse(res, 'Popular services retrieved successfully', { services });
});

/**
 * @desc    Get service categories with counts
 * @route   GET /api/v1/services/categories
 * @access  Public
 */
export const getServiceCategories = catchAsync(async (req, res) => {
  const categories = await Service.aggregate([
    { $match: { isActive } },
    {
      $group: {
        _id: '$category',
        count: { $sum },
        averagePrice: { $avg: '$basePrice' },
        averageRating: { $avg: '$averageRating' }
      }
    },
    {
      $project: {
        category: '$_id',
        count,
        averagePrice: { $round: ['$averagePrice', 0] },
        averageRating: { $round: ['$averageRating', 2] },
        _id
      }
    },
    { $sort: { count: -1 } }
  ]);

  successResponse(res, 'Service categories retrieved successfully', { categories });
});

/**
 * @desc    Create new service (Admin only)
 * @route   POST /api/v1/services
 * @access  Private/Admin
 */
export const createService = catchAsync(async (req, res, next) => {
  const {
    name,
    category,
    subcategory,
    description,
    longDescription,
    basePrice,
    priceUnit,
    duration,
    tags,
    requirements,
    images,
    icon
  } = req.body;

  // Check if service with same name and category already exists
  const existingService = await Service.findOne({
    name: { $regex RegExp(name, 'i') },
    category.toLowerCase()
  });

  if (existingService) {
    return next(new AppError('Service with this name already exists in this category', 409));
  }

  const service = await Service.create({
    name,
    category.toLowerCase(),
    subcategory,
    description,
    longDescription,
    basePrice,
    priceUnit,
    duration,
    tags || [],
    requirements || [],
    images || [],
    icon
  });

  successResponse(res, 'Service created successfully', { service }, 201);
});

/**
 * @desc    Update service (Admin only)
 * @route   PUT /api/v1/services/
 * @access  Private/Admin
 */
export const updateService = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  // Update allowed fields
  const allowedUpdates = [
    'name', 'category', 'subcategory', 'description', 'longDescription',
    'basePrice', 'priceUnit', 'duration', 'tags', 'requirements',
    'images', 'icon', 'isActive'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'category' && req.body[field]) {
        service[field] = req.body[field].toLowerCase();
      } else {
        service[field] = req.body[field];
      }
    }
  });

  await service.save();

  successResponse(res, 'Service updated successfully', { service });
});

/**
 * @desc    Delete service (Admin only)
 * @route   DELETE /api/v1/services/
 * @access  Private/Admin
 */
export const deleteService = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  // Soft delete - just mark as inactive
  service.isActive = false;
  await service.save();

  successResponse(res, 'Service deleted successfully');
});

/**
 * @desc    Toggle service active status (Admin only)
 * @route   PATCH /api/v1/services//toggle-status
 * @access  Private/Admin
 */
export const toggleServiceStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  service.isActive = !service.isActive;
  await service.save();

  successResponse(res, `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`, {
    service: {
      id._id,
      name.name,
      isActive.isActive
    }
  });
});

/**
 * @desc    Get service statistics (Admin only)
 * @route   GET /api/v1/services/stats
 * @access  Private/Admin
 */
export const getServiceStats = catchAsync(async (req, res) => {
  const stats = await Service.aggregate([
    {
      $group: {
        _id,
        totalServices: { $sum },
        activeServices: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveServices: { $sum: { $cond: ['$isActive', 0, 1] } },
        averagePrice: { $avg: '$basePrice' },
        averageRating: { $avg: '$averageRating' },
        totalReviews: { $sum: '$totalReviews' }
      }
    }
  ]);

  const categoryStats = await Service.aggregate([
    { $match: { isActive } },
    {
      $group: {
        _id: '$category',
        count: { $sum },
        averagePrice: { $avg: '$basePrice' },
        averageRating: { $avg: '$averageRating' },
        totalReviews: { $sum: '$totalReviews' }
      }
    },
    {
      $project: {
        category: '$_id',
        count,
        averagePrice: { $round: ['$averagePrice', 0] },
        averageRating: { $round: ['$averageRating', 2] },
        totalReviews,
        _id
      }
    },
    { $sort: { count: -1 } }
  ]);

  const popularServices = await Service.find({ isActive })
    .sort({ popularity: -1 })
    .limit(10)
    .select('name category popularity averageRating totalReviews')
    .lean();

  successResponse(res, 'Service statistics retrieved successfully', {
    overview[0] || {
      totalServices,
      activeServices,
      inactiveServices,
      averagePrice,
      averageRating,
      totalReviews
    },
    byCategory,
    popularServices
  });
});

export default {
  getAllServices,
  getServiceById,
  getServicesByCategory,
  searchServices,
  getPopularServices,
  getServiceCategories,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceStats
};
