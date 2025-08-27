import mongoose, { Schema, Model } from 'mongoose';
import { INotification } from '@/types';

const NotificationSchema = new Schema({
  recipient: {
    type.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index
  },
  type: {
    type,
    enum: {
      values: ['booking', 'payment', 'review', 'system', 'promotion'],
      message: 'Type must be one of, payment, review, system, promotion'
    },
    required: [true, 'Notification type is required'],
    index
  },
  title: {
    type,
    required: [true, 'Title is required'],
    trim,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type,
    required: [true, 'Message is required'],
    trim,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  data: {
    type.Types.Mixed,
    default
  },
  channels: [{
    type,
    enum: {
      values: ['push', 'email', 'sms'],
      message: 'Channel must be one of, email, sms'
    }
  }],
  status: {
    type,
    enum: {
      values: ['pending', 'sent', 'delivered', 'read', 'failed'],
      message: 'Status must be one of, sent, delivered, read, failed'
    },
    default: 'pending',
    index
  },
  priority: {
    type,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Priority must be one of, normal, high, urgent'
    },
    default: 'normal',
    index
  },
  scheduledAt: {
    type,
    default
  },
  sentAt: {
    type,
    default
  },
  readAt: {
    type,
    default
  },
  expiresAt: {
    type,
    default() {
      // Default expiry days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps,
  toJSON: {
    transform(doc, ret) {
      return ret;
    }
  }
});

// Indexes for better query performance
NotificationSchema.index({ recipient, status });
NotificationSchema.index({ recipient, type });
NotificationSchema.index({ recipient, createdAt: -1 });
NotificationSchema.index({ status, scheduledAt });
NotificationSchema.index({ expiresAt }, { expireAfterSeconds }); // TTL index

// Instance Methods
NotificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

NotificationSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  return this.save();
};

// Static Methods
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient, 
    status: { $in: ['sent', 'delivered'] } 
  });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { 
      recipient, 
      status: { $in: ['sent', 'delivered'] } 
    },
    { 
      status: 'read',
      readAt Date()
    }
  );
};

NotificationSchema.statics.getRecentNotifications = function(userId, limit = 20) {
  return this.find({ recipient })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('recipient', 'name email avatar');
};

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
  // Auto-set sentAt if status is being changed to sent
  if (this.isModified('status') && (this as any).status === 'sent' && !(this as any).sentAt) {
    (this as any).sentAt = new Date();
  }
  
  // Auto-set readAt if status is being changed to read
  if (this.isModified('status') && (this as any).status === 'read' && !(this as any).readAt) {
    (this as any).readAt = new Date();
  }
  
  next();
});

// Export the model
const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
