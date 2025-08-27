import nodemailer from 'nodemailer';
import { config } from '@/config/env';
import logger from '@/config/logger';
import { IEmailTemplate, IUser, IBooking } from '@/types';



class EmailService {
  private transporter.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host.email.host,
      port.email.port,
      secure, // true for 465, false for other ports
      auth: {
        user.email.user,
        pass.email.pass,
      },
    });
  }

  /**
   * Send email
   */
  private async sendEmail(options) {
    try {
      const mailOptions = {
        from: `${config.email.fromName} `,
        to.to,
        subject.subject,
        html.html,
        text.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html) {
    return html.replace(/]*>?/gm, '');
  }

  /**
   * Generate email verification email
   */
  async sendEmailVerification(user, token) {
    const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;
    
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #4f46e5; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .button { 
              display-block; 
              background: #4f46e5; 
              color; 
              padding 24px; 
              text-decoration; 
              border-radius; 
              margin 0; 
            }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Welcome to Deshi Sahayak Hub!
            
            
              Hi ${user.name},
              Thank you for registering with Deshi Sahayak Hub. Please verify your email address to get started.
              Click the button below to verify your email:
              Verify Email
              Or copy and paste this link in your browser:
              ${verificationUrl}
              This link will expire in 24 hours.
              If you didn't create an account with us, please ignore this email.
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: 'Verify Your Email - Deshi Sahayak Hub',
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, token) {
    const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
    
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #ef4444; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .button { 
              display-block; 
              background: #ef4444; 
              color; 
              padding 24px; 
              text-decoration; 
              border-radius; 
              margin 0; 
            }
            .footer { padding; text-align; color: #666; font-size; }
            .warning { background: #fef2f2; border solid #fecaca; padding; border-radius; margin 0; }
          
        
        
          
            
              Password Reset Request
            
            
              Hi ${user.name},
              We received a request to reset your password for your Deshi Sahayak Hub account.
              Click the button below to reset your password:
              Reset Password
              Or copy and paste this link in your browser:
              ${resetUrl}
              
                Security Notice:
                
                  This link will expire in 10 minutes
                  If you didn't request this reset, please ignore this email
                  Never share this link with anyone
                
              
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: 'Reset Your Password - Deshi Sahayak Hub',
      html
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(user, booking) {
    const bookingUrl = `${config.frontendUrl}/bookings/${booking._id}`;
    
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #10b981; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .booking-details { background; padding; border-radius; margin 0; }
            .button { 
              display-block; 
              background: #10b981; 
              color; 
              padding 24px; 
              text-decoration; 
              border-radius; 
              margin 0; 
            }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Booking Confirmed!
            
            
              Hi ${user.name},
              Your service booking has been confirmed. Here are the details:
              
              
                Booking Details
                Booking Number: ${booking.bookingNumber}
                Service: ${booking.service?.name || 'N/A'}
                Date & Time: ${new Date(booking.scheduledDate).toLocaleString()}
                Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}
                Total Amount: ₹${booking.pricing.totalAmount}
                Contact Phone: ${booking.contactPhone}
                ${booking.specialInstructions ? `Special Instructions: ${booking.specialInstructions}` : ''}
              
              
              You can view and manage your booking by clicking below:
              View Booking
              
              We'll send you updates about your booking status. Thank you for choosing Deshi Sahayak Hub!
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: `Booking Confirmed - ${booking.bookingNumber}`,
      html
    });
  }

  /**
   * Send booking status update email
   */
  async sendBookingStatusUpdate(user, booking, newStatus) {
    const statusMessages = {
      confirmed: 'Your booking has been confirmed by the service provider.',
      'in-progress': 'Your service provider has started working on your booking.',
      completed: 'Your booking has been completed successfully.',
      cancelled: 'Your booking has been cancelled.',
      'no-show': 'Your booking was marked as no-show.'
    };

    const statusColors = {
      confirmed: '#10b981',
      'in-progress': '#3b82f6',
      completed: '#059669',
      cancelled: '#ef4444',
      'no-show': '#f59e0b'
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your booking status has been updated.';
    const color = statusColors[newStatus as keyof typeof statusColors] || '#6b7280';
    
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: ${color}; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .status-badge { 
              display-block; 
              background: ${color}; 
              color; 
              padding 15px; 
              border-radius; 
              font-weight; 
              text-transform; 
            }
            .booking-details { background; padding; border-radius; margin 0; }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Booking Status Update
            
            
              Hi ${user.name},
              ${message}
              
              
                Booking Details
                Booking Number: ${booking.bookingNumber}
                Status: ${newStatus.replace('-', ' ')}
                Service: ${booking.service?.name || 'N/A'}
                Scheduled Date: ${new Date(booking.scheduledDate).toLocaleString()}
              
              
              If you have any questions, please don't hesitate to contact us.
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: `Booking ${newStatus.replace('-', ' ')} - ${booking.bookingNumber}`,
      html
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const user = { email, name };
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #4f46e5; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .services-grid { display; flex-wrap; gap; margin 0; }
            .service-item { 
              background; 
              padding; 
              border-radius; 
              flex; 
              min-width; 
              text-align; 
            }
            .button { 
              display-block; 
              background: #4f46e5; 
              color; 
              padding 24px; 
              text-decoration; 
              border-radius; 
              margin 0; 
            }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Welcome to Deshi Sahayak Hub! 🎉
            
            
              Hi ${user.name},
              Welcome to Deshi Sahayak Hub - your trusted platform for local home services in tier-2 and tier-3 cities!
              
              What can you do with Deshi Sahayak Hub?
              
                
                  🏠 House Cleaning
                  Professional cleaning services
                
                
                  🔧 Plumbing
                  Expert repair and maintenance
                
                
                  ⚡ Electrical
                  Safe electrical repairs
                
                
                  🔨 Carpentry
                  Custom woodwork services
                
              
              
              Getting Started:
              
                Browse our services or search for what you need
                Choose a verified service provider
                Schedule your service at your convenience
                Pay securely after the work is completed
                Leave a review to help others
              
              
              Browse Services
              
              If you have any questions, our support team is here to help!
              Email@deshisahayak.com
              Phone: +91 98765 43210
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
              Building trust in local communities, one service at a time.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: 'Welcome to Deshi Sahayak Hub!',
      html
    });
  }

  /**
   * Send service provider application confirmation
   */
  async sendProviderApplicationConfirmation(user) {
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #f59e0b; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .status-box { background: #fef3c7; border solid #f59e0b; padding; border-radius; margin 0; }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Service Provider Application Received
            
            
              Hi ${user.name},
              Thank you for applying to become a service provider with Deshi Sahayak Hub!
              
              
                Application Status: Under Review
                Review Timeline: 2-3 business days
              
              
              What happens next?
              
                Document Verification: We'll review your submitted documents
                Background Check: We'll verify your professional credentials
                Approval: Upon successful verification, you'll be approved
                Onboarding: We'll help you set up your profile and start receiving bookings
              
              
              Required Documents:
              
                Government-issued ID proof
                Address proof
                Professional certificates (if applicable)
                Experience certificates
              
              
              If you have any questions about the application process, feel free to reach out to our team.
              Email@deshisahayak.com
              Phone: +91 98765 43210
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to.email,
      subject: 'Service Provider Application Received - Deshi Sahayak Hub',
      html
    });
  }

  /**
   * Send system announcement email
   */
  async sendSystemAnnouncementEmail(email, name, title, message) {
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #dc2626; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .announcement-box { background: #fef2f2; border solid #fecaca; padding; border-radius; margin 0; }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              📢 System Announcement
            
            
              Hi ${name},
              
                ${title}
                ${message}
              
              Thank you for using Deshi Sahayak Hub.
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to,
      subject: `System Announcement: ${title}`,
      html
    });
  }

  /**
   * Send account deactivation email
   */
  async sendAccountDeactivationEmail(email, name) {
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: #ef4444; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .warning-box { background: #fef2f2; border solid #fecaca; padding; border-radius; margin 0; }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Account Deactivated
            
            
              Hi ${name},
              
                Your account has been deactivated.
                This means you will no longer be able to access our services or log into your account.
              
              If you believe this is an error or would like to reactivate your account, please contact our support team.
              Email@deshisahayak.com
              Phone: +91 98765 43210
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to,
      subject: 'Account Deactivated - Deshi Sahayak Hub',
      html
    });
  }

  /**
   * Send account status change email
   */
  async sendAccountStatusEmail(email, name, action, reason?) {
    const isActivation = action === 'activate';
    const statusColor = isActivation ? '#10b981' : '#ef4444';
    const statusText = isActivation ? 'Activated' : 'Suspended';
    
    const html = `
      
      
        
          
            body { font-family, sans-serif; line-height.6; color: #333; }
            .container { max-width; margin auto; padding; }
            .header { background: ${statusColor}; color; padding; text-align; }
            .content { padding; background: #f9f9f9; }
            .status-box { background: ${isActivation ? '#f0fdf4' : '#fef2f2'}; border solid ${isActivation ? '#bbf7d0' : '#fecaca'}; padding; border-radius; margin 0; }
            .footer { padding; text-align; color: #666; font-size; }
          
        
        
          
            
              Account ${statusText}
            
            
              Hi ${name},
              
                Your account has been ${statusText.toLowerCase()}.
                ${reason ? `Reason: ${reason}` : ''}
              
              ${isActivation ? 
                'You can now log in and access all our services.' : 
                'You will not be able to access your account until it is reactivated.'
              }
              If you have any questions, please contact our support team.
              Email@deshisahayak.com
              Phone: +91 98765 43210
            
            
              &copy; 2024 Deshi Sahayak Hub. All rights reserved.
            
          
        
      
    `;

    return this.sendEmail({
      to,
      subject: `Account ${statusText} - Deshi Sahayak Hub`,
      html
    });
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();
export default emailService;
