import { IBooking } from '@/types';
interface PaymentOrderResponse {
    id: string;
    amount: number;
    currency: string;
    status: string;
}
interface PaymentVerificationData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
declare class PaymentService {
    private razorpay;
    constructor();
    createPaymentOrder(amount: number, currency?: string, receipt?: string, notes?: any): Promise<PaymentOrderResponse>;
    createBookingPaymentOrder(booking: IBooking): Promise<PaymentOrderResponse>;
    verifyPaymentSignature(data: PaymentVerificationData): boolean;
    capturePayment(paymentId: string, amount: number): Promise<any>;
    refundPayment(paymentId: string, amount?: number, notes?: any): Promise<any>;
    getPaymentDetails(paymentId: string): Promise<any>;
    getOrderDetails(orderId: string): Promise<any>;
    getRefundDetails(refundId: string): Promise<any>;
    createPaymentLink(amount: number, description: string, customerDetails: {
        name: string;
        email: string;
        contact: string;
    }, callbackUrl?: string): Promise<any>;
    createQRPayment(amount: number, description: string, notes?: any): Promise<any>;
    validateWebhookSignature(body: string, signature: string, secret: string): boolean;
    processWebhookEvent(event: any): Promise<void>;
    private handlePaymentCaptured;
    private handlePaymentFailed;
    private handleRefundCreated;
    private handleOrderPaid;
    calculatePlatformFee(amount: number): {
        fee: number;
        netAmount: number;
    };
    calculateGST(amount: number, rate?: number): {
        gst: number;
        totalAmount: number;
    };
    isAvailable(): boolean;
    getSupportedPaymentMethods(): string[];
}
export declare const paymentService: PaymentService;
export default paymentService;
