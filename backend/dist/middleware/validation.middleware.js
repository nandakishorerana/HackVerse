import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './error.middleware';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field.type === 'field' ? (error as any).path .type,
      message.msg,
      value.type === 'field' ? (error as any).value 
    }));

    return next(new AppError('Validation failed', 400));
  }

  next();
};

export default validateRequest;
