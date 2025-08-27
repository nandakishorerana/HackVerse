import { Request, Response, NextFunction } from 'express';
import Booking from '@/models/Booking.model';
import { AppError, catchAsync, successResponse } from '@/middleware/error.middleware';
import { IAuthenticatedRequest } from '@/types';
import logger from '@/config/logger';
import paymentService from '@/services/payment.service';

/**
 * @desc    Create payment order for booking
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
export const createOrder = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  const user = req.user!;

  if (!bookingId) {
    return next(new AppError('Booking ID is required', 400));
  }

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name email phone')
    .populate('service', 'name');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check if user owns the booking
  if (booking.customer._id.toString() !== user._id.toString()) {
    return next(new AppError('You can only create payment orders for your own bookings', 403));
  }

  // Check if booking is in valid state for payment
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return next(new AppError('Cannot create payment order for this booking status', 400));
  }

  // Check if payment is already completed
  if (booking.payment.status === 'paid') {
    return next(new AppError('Payment already completed for this booking', 400));
  }

  try {
    // Create payment order
    const paymentOrder = await paymentService.createBookingPaymentOrder(booking);

    successResponse(res, 'Payment order created successfully', {
      orderId.id,
      amount.amount,
      currency.currency,
      bookingId._id,
      bookingNumber.bookingNumber
    });
  } catch (error) {
    logger.error('Failed to create payment order:', error);
    return next(new AppError('Failed to create payment order', 500));
  }
});

/**
 * @desc    Verify payment after successful payment
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
export const verifyPayment = catchAsync(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId
  } = req.body;

  const user = req.user!;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    return next(new AppError('All payment verification fields are required', 400));
  }

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name email')
    .populate('service', 'name');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check if user owns the booking
  if (booking.customer._id.toString() !== user._id.toString()) {
    return next(new AppError('You can only verify payments for your own bookings', 403));
  }

  try {
    // Verify payment signature
    const isSignatureValid = paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isSignatureValid) {
      return next(new AppError('Invalid payment signature', 400));
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);

    // Update booking payment status
    await booking.updatePaymentStatus(
      'paid',
      razorpay_payment_id,
      'razorpay',
      paymentDetails.amount / 100 // Convert from paise to rupees
    );

    // Auto-confirm booking after successful payment
    if (booking.status === 'pending') {
      await booking.updateStatus('confirmed', user._id.toString(), 'Payment completed');
    }

    successResponse(res, 'Payment verified successfully', {
      bookingId._id,
      bookingNumber.bookingNumber,
      paymentId,
      amount.amount / 100,
      status: 'paid'
    });

  } catch (error) {
    logger.error('Failed to verify payment:', error);
    return next(new AppError('Failed to verify payment', 500));
  }
});

/**
 * @desc    Create payment link for booking
 * @route   POST /api/v1/payments/create-link
 * @access  Private
 */
export const createPaymentLink = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  const user = req.user!;

  if (!bookingId) {
    return next(new AppError('Booking ID is required', 400));
  }

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name email phone')
    .populate('service', 'name');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check if user owns the booking
  if (booking.customer._id.toString() !== user._id.toString()) {
    return next(new AppError('You can only create payment links for your own bookings', 403));
  }

  try {
    const customer = booking.customer as any;
    const service = booking.service as any;

    // Create payment link
    const paymentLink = await paymentService.createPaymentLink(
      booking.pricing.totalAmount,
      `Payment for ${service.name} - ${booking.bookingNumber}`,
      {
        name.name,
        email.email,
        contact.phone
      }
    );

    successResponse(res, 'Payment link created successfully', {
      paymentLink.short_url,
      linkId.id,
      amount.pricing.totalAmount,
      bookingNumber.bookingNumber
    });

  } catch (error) {
    logger.error('Failed to create payment link:', error);
    return next(new AppError('Failed to create payment link', 500));
  }
});

/**
 * @desc    Process refund for cancelled booking
 * @route   POST /api/v1/payments/refund
 * @access  Private
 */
export const processRefund = catchAsync(async (req, res, next) => {
  const { bookingId, reason } = req.body;
  const user = req.user!;

  if (!bookingId) {
    return next(new AppError('Booking ID is required', 400));
  }

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name email');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check permissions (customer, provider, or admin can request refund)
  const canRefund = user.role === 'admin' || 
                   booking.customer._id.toString() === user._id.toString() ||
                   user.role === 'provider';

  if (!canRefund) {
    return next(new AppError('You do not have permission to process this refund', 403));
  }

  // Check if booking is eligible for refund
  if (booking.status !== 'cancelled') {
    return next(new AppError('Only cancelled bookings are eligible for refund', 400));
  }

  if (booking.payment.status !== 'paid') {
    return next(new AppError('No payment found to refund', 400));
  }

  if (booking.payment.refundAmount && booking.payment.refundAmount > 0) {
    return next(new AppError('Refund already processed for this booking', 400));
  }

  try {
    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();

    if (refundAmount === 0) {
      return next(new AppError('No refund amount calculated for this booking', 400));
    }

    // Process refund through payment gateway
    const refund = await paymentService.refundPayment(
      booking.payment.transactionId!,
      refundAmount,
      {
        booking_id._id.toString(),
        booking_number.bookingNumber,
        reason || 'Booking cancellation'
      }
    );

    // Update booking with refund details
    booking.payment.refundTransactionId = refund.id;
    booking.payment.refundAmount = refund.amount / 100; // Convert from paise
    booking.payment.refundedAt = new Date();
    booking.payment.status = refund.amount === (booking.pricing.totalAmount * 100) ? 'refunded' : 'partially_refunded';
    await booking.save();

    successResponse(res, 'Refund processed successfully', {
      bookingId._id,
      bookingNumber.bookingNumber,
      refundId.id,
      refundAmount.amount / 100,
      status.payment.status
    });

  } catch (error) {
    logger.error('Failed to process refund:', error);
    return next(new AppError('Failed to process refund', 500));
  }
});

/**
 * @desc    Get payment transactions for user
 * @route   GET /api/v1/payments/transactions
 * @access  Private
 */
export const getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const user = req.user!;

  const query = { customer._id };

  if (status) {
    query['payment.status'] = status;
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, totalCount] = await Promise.all([
    Booking.find(query)
      .select('bookingNumber service pricing payment scheduledDate createdAt')
      .populate('service', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  // Format transactions for response
  const formattedTransactions = transactions.map(transaction => ({
    id._id,
    bookingNumber.bookingNumber,
    service.service,
    amount.pricing.totalAmount,
    paymentStatus.payment.status,
    transactionId.payment.transactionId,
    paidAmount.payment.paidAmount,
    paidAt.payment.paidAt,
    refundAmount.payment.refundAmount,
    refundedAt.payment.refundedAt,
    scheduledDate.scheduledDate,
    createdAt.createdAt
  }));

  successResponse(res, 'Transactions retrieved successfully', {
    transactions,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNext < totalPages,
      hasPrev > 1
    }
  });
});

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/v1/payments/webhook/razorpay
 * @access  Public (but secured with signature validation)
 */
export const handleRazorpayWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);

  if (!signature) {
    return next(new AppError('Missing webhook signature', 400));
  }

  try {
    // Validate webhook signature (you should set RAZORPAY_WEBHOOK_SECRET in env)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your-webhook-secret';
    const isValidSignature = paymentService.validateWebhookSignature(body, signature, webhookSecret);

    if (!isValidSignature) {
      logger.warn('Invalid webhook signature received');
      return next(new AppError('Invalid webhook signature', 400));
    }

    // Process webhook event
    await paymentService.processWebhookEvent(req.body);

    res.status(200).json({ status: 'success' });

  } catch (error) {
    logger.error('Failed to process webhook:', error);
    return next(new AppError('Failed to process webhook', 500));
  }
});

/**
 * @desc    Get payment statistics (Admin only)
 * @route   GET /api/v1/payments/stats
 * @access  Private/Admin
 */
export const getPaymentStats = catchAsync(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id,
        totalTransactions: { $sum },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        paidTransactions: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0] } },
        pendingTransactions: { $sum: { $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0] } },
        failedTransactions: { $sum: { $cond: [{ $eq: ['$payment.status', 'failed'] }, 1, 0] } },
        refundedAmount: { $sum: '$payment.refundAmount' },
        averageTransactionValue: { $avg: '$pricing.totalAmount' }
      }
    }
  ]);

  const monthlyRevenue = await Booking.aggregate([
    { $match: { 'payment.status': 'paid' } },
    {
      $group: {
        _id: {
          year: { $year: '$payment.paidAt' },
          month: { $month: '$payment.paidAt' }
        },
        revenue: { $sum: '$pricing.totalAmount' },
        transactions: { $sum }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit }
  ]);

  // Calculate platform fees
  const platformFees = stats[0] ? paymentService.calculatePlatformFee(stats[0].totalRevenue) : { fee, netAmount };

  successResponse(res, 'Payment statistics retrieved successfully', {
    overview[0] || {
      totalTransactions,
      totalRevenue,
      paidTransactions,
      pendingTransactions,
      failedTransactions,
      refundedAmount,
      averageTransactionValue
    },
    monthlyRevenue,
    platformFees: {
      totalFees.fee,
      netRevenue.netAmount
    }
  });
});

// Add alias for webhook handler
export const razorpayWebhook = handleRazorpayWebhook;

export default {
  createOrder,
  verifyPayment,
  createPaymentLink,
  processRefund,
  getTransactions,
  handleRazorpayWebhook,
  razorpayWebhook,
  getPaymentStats
};
