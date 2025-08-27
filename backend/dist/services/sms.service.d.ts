declare class SMSService {
    private client;
    constructor();
    private formatPhoneNumber;
    sendOTP(phone: string, otp: string): Promise<void>;
    sendBookingConfirmation(phone: string, bookingDetails: {
        bookingId: string;
        serviceName: string;
        providerName: string;
        scheduledDate: Date;
        amount: number;
    }): Promise<void>;
    sendBookingStatusUpdate(phone: string, details: {
        bookingId: string;
        status: string;
        serviceName: string;
        message?: string;
    }): Promise<void>;
    sendPaymentConfirmation(phone: string, details: {
        bookingId: string;
        amount: number;
        paymentId: string;
    }): Promise<void>;
    sendProviderNotification(phone: string, details: {
        type: 'new_booking' | 'booking_cancelled' | 'verification_update';
        message: string;
        bookingId?: string;
    }): Promise<void>;
    sendWelcomeSMS(phone: string, name: string): Promise<void>;
    sendPromotionalSMS(phone: string, message: string): Promise<void>;
    sendBulkSMS(phones: string[], message: string): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    getMessageStatus(messageSid: string): Promise<any>;
    getAccountBalance(): Promise<string>;
    validatePhoneNumber(phone: string): boolean;
    sendOTPWithRateLimit(phone: string, otp: string, rateLimitKey: string): Promise<void>;
}
export { SMSService };
declare const _default: SMSService;
export default _default;
