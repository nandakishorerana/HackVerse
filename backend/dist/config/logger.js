import winston from 'winston';
import path from 'path';
import { config } from './env';

// Define log levels
const levels = {
  error,
  warn,
  info,
  http,
  debug,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH' }),
  winston.format.errors({ stack }),
  winston.format.colorize({ all }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define format for file logs (without colors)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH' }),
  winston.format.errors({ stack }),
  winston.format.json()
);

// Define which transports the logger must use
const transports.transport[] = [
  // Console transport
  new winston.transports.Console({
    level.nodeEnv === 'development' ? 'debug' : 'info',
    format
  }),
];

// Add file transports in production
if (config.nodeEnv === 'production') {
  // Ensure logs directory exists
  const logsDir = path.dirname(config.logging.file);
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename.join(logsDir, 'error.log'),
      level: 'error',
      format,
      maxsize, // 5MB
      maxFiles,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename.logging.file,
      format,
      maxsize, // 5MB
      maxFiles,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level.logging.level,
  levels,
  format,
  transports,
  exitOnError,
});

// Create a stream for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
} as any;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason | any) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default logger;
