import mongoose from 'mongoose';
import logger from './logger';
import { config } from './env';



const options = {
  useNewUrlParser,
  useUnifiedTopology,
  maxPoolSize, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS, // Keep trying to send operations for 5 seconds
  socketTimeoutMS, // Close sockets after 45 seconds of inactivity
  family // Use IPv4, skip trying IPv6
};

export const connectDB = async () => {
  try {
    const mongoUri = config.nodeEnv === 'test' ? config.mongodb.testUri .mongodb.uri;
    
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoUri, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

// Health check function
export const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    // 0, 1, 2, 3
    return state === 1;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export default {
  connectDB,
  disconnectDB,
  checkDBHealth
};
