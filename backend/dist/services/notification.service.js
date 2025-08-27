import { Notification } from '@/models';
import { User } from '@/models';
import { ServiceProvider } from '@/models';
import { emailService } from './email.service';
import smsService from './sms.service';
import { AppError } from '@/utils/AppError';
import { Types } from 'mongoose';



;
}

class NotificationService {
  private emailService emailService;

  constructor() {
    this.emailService = emailService;
  }

  // Create and send a single notification
  async sendNotification(data) {
    try {
      // Create in-app notification
      const notification = await Notification.create({
        recipient.recipient,
        type.type,
        title.title,
        message.message,
        data.data || {},
        priority.priority || 'normal',
        channels.channels || ['in_app'],
        scheduledFor.scheduledFor || new Date(),
        status.scheduledFor && data.scheduledFor > new Date() ? 'scheduled' : 'sent'
      });

      // If scheduled for future, return early
      if (data.scheduledFor && data.scheduledFor > new Date()) {
        console.log(`Notification scheduled for ${data.scheduledFor}`);
        return;
      }

      // Get recipient details
      const user = await User.findById(data.recipient).select('email phone name preferences');
      if (!user) {
        throw new AppError('Recipient not found', 404);
      }

      // Send through requested channels
      const channels = data.channels || ['in_app'];
      
      await Promise.allSettled([
        // Email notification
        channels.includes('email') && user.preferences?.emailNotifications ? 
          this.sendEmailNotification(user.email, user.name, data) .resolve(),

        // SMS notification
        channels.includes('sms') && user.preferences?.smsNotifications ? 
          this.sendSMSNotification(user.phone, data) .resolve(),

        // Push notification
        channels.includes('push') && user.preferences?.pushNotifications ? 
          this.sendPushNotification(user._id.toString(), data) .resolve()
      ]);

      // Mark as delivered
      notification.deliveredAt = new Date();
      notification.status = 'delivered';
      await notification.save();

    } catch (error) {
      console.error('Notification sending error:', error);
      throw new AppError('Failed to send notification', 500);
    }
  }

  // Send bulk notifications
  async sendBulkNotification(data)<{
    successful;
    failed;
    errors;
  }> {
    const results = {
      successful,
      failed,
      errors: [] as string[]
    };

    let recipients = data.recipients;

    // If userFilter is provided, get filtered users
    if (data.userFilter) {
      const users = await User.find(data.userFilter).select('_id');
      recipients = users.map(user => user._id.toString());
    }

    // Send to each recipient
    const promises = recipients.map(async (recipientId) => {
      try {
        await this.sendNotification({
          recipient,
          type.type,
          title.title,
          message.message,
          data.data,
          priority.priority,
          channels.channels
        });
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${recipientId}: ${error}`);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  // Send email notification
  private async sendEmailNotification(email, name, data) {
    try {
      // Use appropriate email method based on notification type
      if (data.type === 'system') {
        await this.emailService.sendSystemAnnouncementEmail(email, name, data.title, data.message);
      } else {
        // For other notification types, we'll use the system announcement format
        // In a real app, you might want separate email templates for different types
        await this.emailService.sendSystemAnnouncementEmail(email, name, data.title, data.message);
      }
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  // Send SMS notification
  private async sendSMSNotification(phone, data) {
    try {
      const message = `${data.title}\n${data.message}`;
      
      if (data.type === 'booking' && data.data?.bookingDetails) {
        if (data.data.status === 'confirmed') {
          await smsService.sendBookingConfirmation(phone, data.data.bookingDetails);
        } else {
          await smsService.sendBookingStatusUpdate(phone, {
            bookingId.data.bookingDetails.bookingId,
            status.data.status,
            serviceName.data.bookingDetails.serviceName,
            message.message
          });
        }
      } else if (data.type === 'payment' && data.data?.paymentDetails) {
        await smsService.sendPaymentConfirmation(phone, data.data.paymentDetails);
      } else {
        // Generic SMS
        const smsMessage = `${data.title}\n${data.message}\n- Deshi Sahayak`;
        await smsService.sendPromotionalSMS(phone, smsMessage);
      }
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  // Send push notification (placeholder - would integrate with FCM/APNS)
  private async sendPushNotification(userId, data) {
    try {
      // This would integrate with Firebase Cloud Messaging or Apple Push Notification Service
      console.log(`Push notification sent to ${userId}:`, {
        title.title,
        body.message,
        data.data
      });

      // In a real implementation:
      // - Get user's FCM token from database
      // - Send push notification using FCM SDK
      // - Handle device token management
      // - Track delivery status
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  // Get user's notifications with pagination
  async getUserNotifications(userId, options: {
    page?;
    limit?;
    unreadOnly?;
    type?;
  } = {})<{
    notifications;
    total;
    unreadCount;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter = { recipient };
    
    if (options.unreadOnly) {
      filter.readAt = { $exists };
    }
    
    if (options.type) {
      filter.type = options.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Notification.countDocuments(filter),
      
      Notification.countDocuments({ 
        recipient, 
        readAt: { $exists } 
      })
    ]);

    return { notifications, total, unreadCount };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    await Notification.findOneAndUpdate(
      { _id, recipient },
      { readAt Date() }
    );
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient, readAt: { $exists } },
      { readAt Date() }
    );
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({ _id, recipient });
  }

  // Get notification statistics
  async getNotificationStats(userId)<{
    total;
    unread;
    byType: { [key] };
    recent;
  }> {
    const stats = await Notification.aggregate([
      { $match: { recipient Types.ObjectId(userId) } },
      {
        $group: {
          _id,
          total: { $sum },
          unread: { $sum: { $cond: [{ $exists: ['$readAt', false] }, 1, 0] } },
          recent: { 
            $sum: { 
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { recipient Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum } } }
    ]);

    const byType: { [key] } = {};
    typeStats.forEach(stat => {
      byType[stat._id] = stat.count;
    });

    return {
      total[0]?.total || 0,
      unread[0]?.unread || 0,
      recent[0]?.recent || 0,
      byType
    };
  }

  // Predefined notification templates
  async sendBookingNotification(recipientId, type: 'created' | 'confirmed' | 'completed' | 'cancelled', bookingData) {
    const templates = {
      created: {
        title: 'Booking Created',
        message: `Your booking for ${bookingData.serviceName} has been created and is pending confirmation.`
      },
      confirmed: {
        title: 'Booking Confirmed',
        message: `Your booking for ${bookingData.serviceName} has been confirmed by ${bookingData.providerName}.`
      },
      completed: {
        title: 'Service Completed',
        message: `Your ${bookingData.serviceName} service has been completed. Please rate your experience.`
      },
      cancelled: {
        title: 'Booking Cancelled',
        message: `Your booking for ${bookingData.serviceName} has been cancelled.`
      }
    };

    const template = templates[type];
    await this.sendNotification({
      recipient,
      type: 'booking',
      title.title,
      message.message,
      data: { bookingDetails, status },
      channels: ['in_app', 'email', 'sms']
    });
  }

  async sendPaymentNotification(recipientId, type: 'success' | 'failed' | 'refunded', paymentData) {
    const templates = {
      success: {
        title: 'Payment Successful',
        message: `Your payment of ₹${paymentData.amount} has been processed successfully.`
      },
      failed: {
        title: 'Payment Failed',
        message: `Your payment of ₹${paymentData.amount} could not be processed. Please try again.`
      },
      refunded: {
        title: 'Refund Processed',
        message: `Your refund of ₹${paymentData.amount} has been processed and will reflect in your account soon.`
      }
    };

    const template = templates[type];
    await this.sendNotification({
      recipient,
      type: 'payment',
      title.title,
      message.message,
      data: { paymentDetails, status },
      channels: ['in_app', 'email', 'sms']
    });
  }

  async sendProviderNotification(recipientId, type: 'new_booking' | 'verification' | 'review', data) {
    const templates = {
      new_booking: {
        title: 'New Booking Received',
        message: `You have received a new booking for ${data.serviceName}. Please confirm or decline.`
      },
      verification: {
        title: 'Verification Update',
        message.verified ? 'Congratulations! Your account has been verified.' : 'Your account verification is pending review.'
      },
      review: {
        title: 'New Review',
        message: `You have received a new ${data.rating}-star review for ${data.serviceName}.`
      }
    };

    const template = templates[type];
    await this.sendNotification({
      recipient,
      type: 'provider',
      title.title,
      message.message,
      data,
      channels: ['in_app', 'email', 'sms']
    });
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    const now = new Date();
    const scheduledNotifications = await Notification.find({
      status: 'scheduled',
      scheduledFor: { $lte }
    });

    for (const notification of scheduledNotifications) {
      try {
        await this.sendNotification({
          recipient.recipient.toString(),
          type.type,
          title.title,
          message.message,
          data.data,
          priority.priority,
          channels.channels
        });
      } catch (error) {
        console.error('Error processing scheduled notification:', error);
        notification.status = 'failed';
        await notification.save();
      }
    }
  }
}

export { NotificationService };
export default new NotificationService();
