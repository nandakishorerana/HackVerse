import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Basic swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Deshi Sahayak Hub API',
    version: '1.0.0',
    description: `
# Deshi Sahayak Hub API Documentation

Welcome to the Deshi Sahayak Hub API! This platform connects customers with trusted local service providers in Indian tier-2 and tier-3 cities.

## Features
- **User Authentication**-based authentication with role-based access
- **Service Discovery** search and filtering for services
- **Booking Management** booking lifecycle from creation to completion
- **Payment Processing** payment integration with Razorpay
- **Review System** reviews and provider ratings
- **Real-time Notifications**, SMS, and push notifications
- **Admin Dashboard** admin tools and analytics

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization 
\`\`\`

## Rate Limiting
API requests are rate-limited. Check the response headers for current limits:
- \`X-RateLimit-Limit\` limit per window
- \`X-RateLimit-Remaining\` requests in current window
- \`X-RateLimit-Reset\` when the rate limit resets

## Error Handling
All endpoints return consistent error responses:
\`\`\`json
{
  "success",
  "message": "Error description",
  "statusCode",
  "stack": "Error stack (development only)"
}
\`\`\`

## Pagination
List endpoints support pagination with query parameters:
- \`page\` number (default)
- \`limit\` per page (default, max)
    `,
    contact: {
      name: 'Deshi Sahayak Hub Support',
      email: 'support@deshisahayakhub.com',
      url: 'https://deshisahayakhub.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url.env.NODE_ENV === 'production' 
        ? 'https://api.deshisahayakhub.com'
        : `http://localhost:${process.env.PORT || 5000}`,
      description.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token'
      }
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          role: { type: 'string', enum: ['customer', 'provider', 'admin'] },
          isVerified: { type: 'boolean' },
          isActive: { type: 'boolean' },
          avatar: { type: 'string', format: 'uri' },
          addresses: {
            type: 'array',
            items: { $ref: '#/components/schemas/Address' }
          },
          preferences: {
            type: 'object',
            properties: {
              language: { type: 'string', default: 'en' },
              currency: { type: 'string', default: 'INR' },
              emailNotifications: { type: 'boolean', default },
              smsNotifications: { type: 'boolean', default },
              pushNotifications: { type: 'boolean', default }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Address schema
      Address: {
        type: 'object',
        required: ['type', 'street', 'city', 'state', 'pincode'],
        properties: {
          type: { type: 'string', enum: ['home', 'work', 'other'] },
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          pincode: { type: 'string', pattern: '^\\d{6}$' },
          landmark: { type: 'string' },
          coordinates: {
            type: 'array',
            items: { type: 'number' },
            minItems,
            maxItems
          }
        }
      },

      // Service schemas
      Service: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          price: { type: 'number', minimum },
          duration: { type: 'number', minimum },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          tags: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
          provider: { $ref: '#/components/schemas/ServiceProvider' },
          rating: {
            type: 'object',
            properties: {
              average: { type: 'number', minimum, maximum },
              count: { type: 'integer', minimum }
            }
          },
          popularity: { type: 'number', minimum },
          bookingCount: { type: 'integer', minimum },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Service Provider schema
      ServiceProvider: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          avatar: { type: 'string', format: 'uri' },
          bio: { type: 'string' },
          experience: { type: 'integer', minimum },
          services: { type: 'array', items: { type: 'string' } },
          certifications: { type: 'array', items: { type: 'string' } },
          address: { $ref: '#/components/schemas/Address' },
          isVerified: { type: 'boolean' },
          isActive: { type: 'boolean' },
          rating: {
            type: 'object',
            properties: {
              average: { type: 'number', minimum, maximum },
              count: { type: 'integer', minimum }
            }
          },
          availability: {
            type: 'object',
            properties: {
              weeklySchedule: { type: 'object' },
              isActive: { type: 'boolean' }
            }
          },
          settings: {
            type: 'object',
            properties: {
              autoAcceptBookings: { type: 'boolean' },
              serviceRadius: { type: 'integer', minimum, maximum }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Booking schema
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          customer: { $ref: '#/components/schemas/User' },
          provider: { $ref: '#/components/schemas/ServiceProvider' },
          service: { $ref: '#/components/schemas/Service' },
          scheduledDate: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']
          },
          address: { $ref: '#/components/schemas/Address' },
          serviceAmount: { type: 'number', minimum },
          platformFee: { type: 'number', minimum },
          gstAmount: { type: 'number', minimum },
          totalAmount: { type: 'number', minimum },
          specialInstructions: { type: 'string' },
          workSummary: {
            type: 'object',
            properties: {
              workDescription: { type: 'string' },
              beforeImages: { type: 'array', items: { type: 'string', format: 'uri' } },
              afterImages: { type: 'array', items: { type: 'string', format: 'uri' } },
              completedAt: { type: 'string', format: 'date-time' }
            }
          },
          payment: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['razorpay', 'cash'] },
              status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
              transactionId: { type: 'string' },
              paidAt: { type: 'string', format: 'date-time' }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Review schema
      Review: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          customer: { $ref: '#/components/schemas/User' },
          provider: { $ref: '#/components/schemas/ServiceProvider' },
          service: { $ref: '#/components/schemas/Service' },
          booking: { type: 'string', format: 'objectId' },
          rating: { type: 'integer', minimum, maximum },
          comment: { type: 'string' },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          status: { type: 'string', enum: ['active', 'reported', 'hidden'] },
          providerResponse: {
            type: 'object',
            properties: {
              response: { type: 'string' },
              respondedAt: { type: 'string', format: 'date-time' }
            }
          },
          reports: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                reportedBy: { type: 'string', format: 'objectId' },
                reason: { type: 'string', enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'] },
                description: { type: 'string' },
                reportedAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Notification schema
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string', format: 'objectId' },
          recipient: { type: 'string', format: 'objectId' },
          type: { type: 'string', enum: ['booking', 'payment', 'system', 'promotion', 'review', 'provider'] },
          title: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'object' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
          channels: {
            type: 'array',
            items: { type: 'string', enum: ['in_app', 'email', 'sms', 'push'] }
          },
          status: { type: 'string', enum: ['scheduled', 'sent', 'delivered', 'failed'] },
          readAt: { type: 'string', format: 'date-time' },
          deliveredAt: { type: 'string', format: 'date-time' },
          scheduledFor: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      // Common response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },

      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default },
          message: { type: 'string' },
          statusCode: { type: 'integer' },
          stack: { type: 'string', description: 'Available only in development mode' }
        }
      },

      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default },
          results: { type: 'integer' },
          total: { type: 'integer' },
          page: { type: 'integer' },
          totalPages: { type: 'integer' },
          data: { type: 'array', items: { type: 'object' } }
        }
      },

      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength }
        }
      },

      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'phone', 'password'],
        properties: {
          name: { type: 'string', minLength },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          password: { type: 'string', minLength },
          role: { type: 'string', enum: ['customer', 'provider'], default: 'customer' }
        }
      },

      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string' },
              refreshToken: { type: 'string' }
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required,
        schema: {
          type: 'integer',
          minimum,
          default
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required,
        schema: {
          type: 'integer',
          minimum,
          maximum,
          default
        }
      },
      ObjectIdParam: {
        name: 'id',
        in: 'path',
        description: 'MongoDB ObjectId',
        required,
        schema: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$'
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success,
              message: 'Authentication required. Please login.',
              statusCode
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success,
              message: 'You do not have permission to access this resource.',
              statusCode
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success,
              message: 'Resource not found.',
              statusCode
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success,
              message: 'Validation failed.',
              statusCode
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success,
              message: 'Internal server error.',
              statusCode
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management and profile operations'
    },
    {
      name: 'Services',
      description: 'Service discovery and management'
    },
    {
      name: 'Providers',
      description: 'Service provider management and registration'
    },
    {
      name: 'Bookings',
      description: 'Booking lifecycle management'
    },
    {
      name: 'Payments',
      description: 'Payment processing and transaction management'
    },
    {
      name: 'Reviews',
      description: 'Review and rating system'
    },
    {
      name: 'Admin',
      description: 'Administrative functions and dashboard'
    },
    {
      name: 'Notifications',
      description: 'Notification management'
    }
  ]
};

const options = {
  definition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};

export const specs = swaggerJsdoc(options);

export const swaggerSetup = {
  explorer,
  customCss: `
    .swagger-ui .topbar { display }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Deshi Sahayak Hub API Documentation',
  customfavIcon: '/favicon.ico'
};

export { swaggerUi };
