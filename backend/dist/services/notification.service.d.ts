interface NotificationData {
    recipient: string;
    type: 'booking' | 'payment' | 'system' | 'promotion' | 'review' | 'provider';
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    channels?: ('in_app' | 'email' | 'sms' | 'push')[];
    scheduledFor?: Date;
}
interface BulkNotificationData {
    recipients: string[];
    type: NotificationData['type'];
    title: string;
    message: string;
    data?: any;
    priority?: NotificationData['priority'];
    channels?: NotificationData['channels'];
    userFilter?: {
        role?: 'customer' | 'provider' | 'admin';
        location?: string;
        isActive?: boolean;
        isVerified?: boolean;
    };
}
declare class NotificationService {
    private emailService;
    constructor();
    sendNotification(data: NotificationData): Promise<void>;
    sendBulkNotification(data: BulkNotificationData): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    private sendEmailNotification;
    private sendSMSNotification;
    private sendPushNotification;
    getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        type?: string;
    }): Promise<{
        notifications: any[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    getNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: {
            [key: string]: number;
        };
        recent: number;
    }>;
    sendBookingNotification(recipientId: string, type: 'created' | 'confirmed' | 'completed' | 'cancelled', bookingData: any): Promise<void>;
    sendPaymentNotification(recipientId: string, type: 'success' | 'failed' | 'refunded', paymentData: any): Promise<void>;
    sendProviderNotification(recipientId: string, type: 'new_booking' | 'verification' | 'review', data: any): Promise<void>;
    processScheduledNotifications(): Promise<void>;
}
export { NotificationService };
declare const _default: NotificationService;
export default _default;
