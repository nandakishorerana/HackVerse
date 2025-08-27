import { Service } from '@/models';
import { ServiceProvider } from '@/models';
import { User } from '@/models';
import { Booking } from '@/models';
import { Review } from '@/models';
import { Types } from 'mongoose';

;
  priceRange?: {
    min?;
    max?;
  };
  rating?;
  availability?: {
    date?;
    timeSlots?;
  };
  verified?;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity' | 'distance' | 'newest';
  page?;
  limit?;
}

;
  serviceType?: 'individual' | 'team';
  experience?;
  certifications?;
  languages?;
}

class SearchService {
  
  // Advanced service search with multiple filters
  async searchServices(searchQuery, filters?)<{
    services;
    total;
    page;
    totalPages;
    filters;
  }> {
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const skip = (page - 1) * limit;

    // Build MongoDB aggregation pipeline
    const pipeline = [];

    // Match stage - basic filtering
    const matchStage = { isActive };

    // Text search
    if (searchQuery.query) {
      matchStage.$text = { $search.query };
    }

    // Category filter
    if (searchQuery.category) {
      matchStage.category = new RegExp(searchQuery.category, 'i');
    }

    // Price range filter
    if (searchQuery.priceRange) {
      matchStage.price = {};
      if (searchQuery.priceRange.min) {
        matchStage.price.$gte = searchQuery.priceRange.min;
      }
      if (searchQuery.priceRange.max) {
        matchStage.price.$lte = searchQuery.priceRange.max;
      }
    }

    // Rating filter
    if (searchQuery.rating) {
      matchStage['rating.average'] = { $gte.rating };
    }

    // Duration filter
    if (filters?.duration) {
      matchStage.duration = {};
      if (filters.duration.min) {
        matchStage.duration.$gte = filters.duration.min;
      }
      if (filters.duration.max) {
        matchStage.duration.$lte = filters.duration.max;
      }
    }

    pipeline.push({ $match });

    // Location-based filtering and distance calculation
    if (searchQuery.location?.coordinates) {
      pipeline.push({
        $lookup: {
          from: 'serviceproviders',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerInfo'
        }
      });

      pipeline.push({
        $addFields: {
          distance: {
            $let: {
              vars: {
                providerLocation: { $arrayElemAt: ['$providerInfo.location.coordinates', 0] }
              },
              in: {
                $sqrt: {
                  $add: [
                    { $pow: [{ $subtract: [{ $arrayElemAt: ['$$providerLocation', 0] }, searchQuery.location.coordinates[0]] }, 2] },
                    { $pow: [{ $subtract: [{ $arrayElemAt: ['$$providerLocation', 1] }, searchQuery.location.coordinates[1]] }, 2] }
                  ]
                }
              }
            }
          }
        }
      });

      // Filter by radius if specified
      if (searchQuery.location.radius) {
        pipeline.push({
          $match: {
            distance: { $lte.location.radius }
          }
        });
      }
    } else if (searchQuery.location?.city) {
      pipeline.push({
        $lookup: {
          from: 'serviceproviders',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerInfo'
        }
      });

      pipeline.push({
        $match: {
          'providerInfo.address.city' RegExp(searchQuery.location.city, 'i')
        }
      });
    }

    // Provider verification filter
    if (searchQuery.verified) {
      if (!pipeline.find(stage => stage.$lookup && stage.$lookup.from === 'serviceproviders')) {
        pipeline.push({
          $lookup: {
            from: 'serviceproviders',
            localField: 'provider',
            foreignField: '_id',
            as: 'providerInfo'
          }
        });
      }
      
      pipeline.push({
        $match: {
          'providerInfo.isVerified'
        }
      });
    }

    // Additional filters
    if (filters) {
      if (filters.serviceType) {
        matchStage.serviceType = filters.serviceType;
      }

      if (filters.certifications && filters.certifications.length > 0) {
        pipeline.push({
          $match: {
            'providerInfo.certifications': { $in.certifications }
          }
        });
      }
    }

    // Availability filter
    if (searchQuery.availability?.date) {
      pipeline.push({
        $lookup: {
          from: 'bookings',
          let: { serviceId: '$_id', providerId: '$provider' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$service', '$$serviceId'] },
                    { $eq: ['$provider', '$$providerId'] },
                    { $eq: ['$scheduledDate', searchQuery.availability.date] },
                    { $in: ['$status', ['confirmed', 'in-progress']] }
                  ]
                }
              }
            }
          ],
          as: 'existingBookings'
        }
      });

      pipeline.push({
        $match: {
          existingBookings: { $size }
        }
      });
    }

    // Sorting
    const sortStage = {};
    switch (searchQuery.sortBy) {
      case 'price_low'.price = 1;
        break;
      case 'price_high'.price = -1;
        break;
      case 'rating'['rating.average'] = -1;
        break;
      case 'popularity'.bookingCount = -1;
        break;
      case 'distance' (searchQuery.location?.coordinates) {
          sortStage.distance = 1;
        }
        break;
      case 'newest'.createdAt = -1;
        break;
      case 'relevance' (searchQuery.query) {
          sortStage.score = { $meta: 'textScore' };
        } else {
          sortStage['rating.average'] = -1;
          sortStage.bookingCount = -1;
        }
        break;
    }

    pipeline.push({ $sort });

    // Add pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip }, { $limit });

    // Populate provider information
    pipeline.push({
      $lookup: {
        from: 'serviceproviders',
        localField: 'provider',
        foreignField: '_id',
        as: 'provider',
        pipeline: [
          {
            $project: {
              name,
              avatar,
              rating,
              isVerified,
              experience,
              address
            }
          }
        ]
      }
    });

    pipeline.push({
      $unwind: '$provider'
    });

    // Execute queries
    const [services, totalResult] = await Promise.all([
      Service.aggregate(pipeline),
      Service.aggregate(totalPipeline)
    ]);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get available filters for frontend
    const availableFilters = await this.getAvailableFilters(searchQuery);

    return {
      services,
      total,
      page,
      totalPages,
      filters
    };
  }

  // Search service providers
  async searchProviders(searchQuery)<{
    providers;
    total;
    page;
    totalPages;
  }> {
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const skip = (page - 1) * limit;

    const pipeline = [];
    const matchStage = { isActive };

    // Text search
    if (searchQuery.query) {
      matchStage.$text = { $search.query };
    }

    // Location filter
    if (searchQuery.location?.city) {
      matchStage['address.city'] = new RegExp(searchQuery.location.city, 'i');
    }

    // Rating filter
    if (searchQuery.rating) {
      matchStage['rating.average'] = { $gte.rating };
    }

    // Verification filter
    if (searchQuery.verified) {
      matchStage.isVerified = true;
    }

    pipeline.push({ $match });

    // Sorting
    const sortStage = {};
    switch (searchQuery.sortBy) {
      case 'rating'['rating.average'] = -1;
        break;
      case 'newest'.createdAt = -1;
        break;
      default['rating.average'] = -1;
        sortStage.totalBookings = -1;
        break;
    }

    pipeline.push({ $sort });

    // Pagination
    const totalPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip }, { $limit });

    // Add service count
    pipeline.push({
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: 'provider',
        as: 'services'
      }
    });

    pipeline.push({
      $addFields: {
        serviceCount: { $size: '$services' }
      }
    });

    pipeline.push({
      $project: {
        services,
        password
      }
    });

    const [providers, totalResult] = await Promise.all([
      ServiceProvider.aggregate(pipeline),
      ServiceProvider.aggregate(totalPipeline)
    ]);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return { providers, total, page, totalPages };
  }

  // Get personalized recommendations
  async getRecommendations(userId, options: {
    type: 'popular' | 'nearby' | 'similar' | 'trending';
    limit?;
    location?: { city; coordinates?: [number, number] };
  }) {
    const limit = options.limit || 10;
    let pipeline = [];

    switch (options.type) {
      case 'popular' = [
          { $match: { isActive } },
          { $sort: { bookingCount: -1, 'rating.average': -1 } },
          { $limit }
        ];
        break;

      case 'nearby' (options.location?.coordinates) {
          pipeline = [
            { $match: { isActive } },
            {
              $lookup: {
                from: 'serviceproviders',
                localField: 'provider',
                foreignField: '_id',
                as: 'provider'
              }
            },
            {
              $addFields: {
                distance: {
                  $sqrt: {
                    $add: [
                      { $pow: [{ $subtract: [{ $arrayElemAt: ['$provider.location.coordinates', 0] }, options.location.coordinates[0]] }, 2] },
                      { $pow: [{ $subtract: [{ $arrayElemAt: ['$provider.location.coordinates', 1] }, options.location.coordinates[1]] }, 2] }
                    ]
                  }
                }
              }
            },
            { $sort: { distance, 'rating.average': -1 } },
            { $limit }
          ];
        } else if (options.location?.city) {
          pipeline = [
            { $match: { isActive } },
            {
              $lookup: {
                from: 'serviceproviders',
                localField: 'provider',
                foreignField: '_id',
                as: 'provider'
              }
            },
            {
              $match: {
                'provider.address.city' RegExp(options.location.city, 'i')
              }
            },
            { $sort: { 'rating.average': -1, bookingCount: -1 } },
            { $limit }
          ];
        }
        break;

      case 'similar':
        // Get user's booking history to find similar services
        const userBookings = await Booking.find({ customer })
          .populate('service')
          .limit(10)
          .sort({ createdAt: -1 });

        const categories = [...new Set((userBookings as any[]).map(b => b.service?.category).filter(Boolean))];
        
        pipeline = [
          { $match: { isActive, category: { $in } } },
          { $sort: { 'rating.average': -1, bookingCount: -1 } },
          { $limit }
        ];
        break;

      case 'trending':
        // Services with high recent booking activity
        const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const trendingServices = await Booking.aggregate([
          {
            $match: {
              createdAt: { $gte },
              status: { $in: ['completed', 'confirmed'] }
            }
          },
          {
            $group: {
              _id: '$service',
              recentBookings: { $sum }
            }
          },
          { $sort: { recentBookings: -1 } },
          { $limit }
        ]);

        const serviceIds = (trendingServices as any[]).map(t => t._id);
        
        pipeline = [
          { $match: { _id: { $in }, isActive } },
          {
            $addFields: {
              trendingScore: {
                $indexOfArray: [serviceIds, '$_id']
              }
            }
          },
          { $sort: { trendingScore } }
        ];
        break;
    }

    // Add provider information
    pipeline.push({
      $lookup: {
        from: 'serviceproviders',
        localField: 'provider',
        foreignField: '_id',
        as: 'provider',
        pipeline: [
          {
            $project: {
              name,
              avatar,
              rating,
              isVerified
            }
          }
        ]
      }
    });

    pipeline.push({ $unwind: '$provider' });

    return await Service.aggregate(pipeline);
  }

  // Get available filters for current search
  async getAvailableFilters(searchQuery)<{
    categories;
    priceRanges: { min; max }[];
    locations: { city; count }[];
    ratings;
  }> {
    const baseMatch = { isActive };

    // Add existing filters to base match
    if (searchQuery.category) {
      baseMatch['category'] = new RegExp(searchQuery.category, 'i');
    }

    const [categories, priceStats, locations, ratings] = await Promise.all([
      // Available categories
      Service.distinct('category', baseMatch),

      // Price statistics
      Service.aggregate([
        { $match },
        {
          $group: {
            _id,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' }
          }
        }
      ]),

      // Available locations
      Service.aggregate([
        { $match },
        {
          $lookup: {
            from: 'serviceproviders',
            localField: 'provider',
            foreignField: '_id',
            as: 'provider'
          }
        },
        { $unwind: '$provider' },
        {
          $group: {
            _id: '$provider.address.city',
            count: { $sum }
          }
        },
        { $sort: { count: -1 } },
        { $limit }
      ]),

      // Available ratings
      Service.distinct('rating.average', baseMatch)
    ]);

    const priceRanges = [];
    if (priceStats[0]) {
      const { minPrice, maxPrice } = priceStats[0];
      const range = maxPrice - minPrice;
      const step = Math.ceil(range / 5);
      
      for (let i = 0; i < 5; i++) {
        priceRanges.push({
          min + (i * step),
          max.min(minPrice + ((i + 1) * step), maxPrice)
        });
      }
    }

    return {
      categories.filter(Boolean),
      priceRanges,
      locations: (locations as any[]).map(l => ({ city._id, count.count })),
      ratings.filter(r => r && r > 0).sort((a, b) => b - a)
    };
  }

  // Auto-complete search suggestions
  async getSearchSuggestions(query, limit = 10)<{
    services;
    categories;
    providers;
  }> {
    const searchRegex = new RegExp(query, 'i');

    const [serviceNames, categories, providerNames] = await Promise.all([
      Service.find({ 
        name, 
        isActive 
      }).distinct('name').limit(limit),

      Service.find({ 
        category, 
        isActive 
      }).distinct('category').limit(5),

      ServiceProvider.find({ 
        name, 
        isActive 
      }).distinct('name').limit(5)
    ]);

    return {
      services.slice(0, limit),
      categories.slice(0, 5),
      providers: (providerNames as string[]).slice(0, 5)
    };
  }

  // Search analytics
  async trackSearch(userId | null, query, filters, results) {
    // In a real implementation, you would save this to a search analytics collection
    console.log('Search tracked:', {
      userId,
      query,
      filters,
      results,
      timestamp Date()
    });
  }

  // Get popular search terms
  async getPopularSearches(limit = 10) {
    // In a real implementation, this would come from search analytics
    return [
      'home cleaning',
      'plumber',
      'electrician',
      'ac repair',
      'painter',
      'carpenter',
      'appliance repair',
      'pest control',
      'salon at home',
      'massage'
    ].slice(0, limit);
  }
}

export { SearchService };
export default new SearchService();
