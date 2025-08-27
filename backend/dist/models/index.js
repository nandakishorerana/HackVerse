// Model exports
import UserModel from './User.model';
import ServiceModel from './Service.model';
import ServiceProviderModel from './ServiceProvider.model';
import BookingModel from './Booking.model';
import ReviewModel from './Review.model';
import NotificationModel from './Notification.model';

// Export models with both default and named exports for flexibility
export const User = UserModel;
export const Service = ServiceModel;
export const ServiceProvider = ServiceProviderModel;
export const Booking = BookingModel;
export const Review = ReviewModel;
export const Notification = NotificationModel;

// Also export as default for backward compatibility
export default {
  User,
  Service,
  ServiceProvider,
  Booking,
  Review,
  Notification
};
