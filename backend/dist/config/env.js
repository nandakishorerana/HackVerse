import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path.resolve(process.cwd(), envFile) });

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Export configuration object
export const config = {
  nodeEnv.env.NODE_ENV || 'development',
  port(process.env.PORT || '5000', 10),
  apiVersion.env.API_VERSION || 'v1',
  
  // Database
  mongodb: {
    uri.env.MONGODB_URI!,
    testUri.env.MONGODB_TEST_URI || process.env.MONGODB_URI!
  },
  
  // Redis
  redis: {
    url.env.REDIS_URL
  },
  
  // JWT
  jwt: {
    secret.env.JWT_SECRET!,
    expiresIn.env.JWT_EXPIRE || '7d',
    refreshSecret.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    refreshExpiresIn.env.JWT_REFRESH_EXPIRE || '30d'
  },
  
  // Email
  email: {
    host.env.SMTP_HOST || 'smtp.gmail.com',
    port(process.env.SMTP_PORT || '587', 10),
    user.env.SMTP_USER,
    pass.env.SMTP_PASS,
    from.env.FROM_EMAIL || 'noreply@deshisahayak.com',
    fromName.env.FROM_NAME || 'Deshi Sahayak Hub'
  },
  
  // SMS (Twilio)
  twilio: {
    accountSid.env.TWILIO_ACCOUNT_SID,
    authToken.env.TWILIO_AUTH_TOKEN,
    phoneNumber.env.TWILIO_PHONE_NUMBER
  },
  
  // Payment Gateways
  razorpay: {
    keyId.env.RAZORPAY_KEY_ID,
    keySecret.env.RAZORPAY_KEY_SECRET
  },
  
  stripe: {
    publishableKey.env.STRIPE_PUBLISHABLE_KEY,
    secretKey.env.STRIPE_SECRET_KEY,
    webhookSecret.env.STRIPE_WEBHOOK_SECRET
  },
  
  // File Upload (Cloudinary)
  cloudinary: {
    cloudName.env.CLOUDINARY_CLOUD_NAME,
    apiKey.env.CLOUDINARY_API_KEY,
    apiSecret.env.CLOUDINARY_API_SECRET
  },
  
  // Frontend
  frontendUrl.env.FRONTEND_URL || 'http://localhost',
  
  // Admin
  admin: {
    email.env.ADMIN_EMAIL || 'admin@deshisahayak.com',
    phone.env.ADMIN_PHONE || '+919876543210'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  // Logging
  logging: {
    level.env.LOG_LEVEL || 'info',
    file.env.LOG_FILE || 'logs/app.log'
  },
  
  // External APIs
  googleMaps: {
    apiKey.env.GOOGLE_MAPS_API_KEY
  },
  
  // Firebase
  firebase: {
    serverKey.env.FIREBASE_SERVER_KEY,
    projectId.env.FIREBASE_PROJECT_ID
  }
} as const;

export default config;
