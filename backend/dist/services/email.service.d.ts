import { IUser } from '@/types';
declare class EmailService {
    private transporter;
    constructor();
    private sendEmail;
    private stripHtml;
    sendEmailVerification(user: IUser, token: string): Promise<boolean>;
    sendPasswordReset(user: IUser, token: string): Promise<boolean>;
    sendBookingConfirmation(user: IUser, booking: any): Promise<boolean>;
    sendBookingStatusUpdate(user: IUser, booking: any, newStatus: string): Promise<boolean>;
    sendWelcomeEmail(email: string, name: string): Promise<boolean>;
    sendProviderApplicationConfirmation(user: IUser): Promise<boolean>;
    sendSystemAnnouncementEmail(email: string, name: string, title: string, message: string): Promise<boolean>;
    sendAccountDeactivationEmail(email: string, name: string): Promise<boolean>;
    sendAccountStatusEmail(email: string, name: string, action: string, reason?: string): Promise<boolean>;
    testConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
export default emailService;
