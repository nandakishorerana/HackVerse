import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification,
  logout
} from '@/controllers/auth.controller';
import { protect } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *       properties:
 *         name:
 *           type
 *           description name of the user
 *         email:
 *           type
 *           format
 *           description address
 *         phone:
 *           type
 *           description phone number (10 digits)
 *         password:
 *           type
 *           minLength
 *           description (minimum 8 characters)
 *         role:
 *           type
 *           enum: [customer, provider]
 *           default
 *           description role
 *     LoginRequest:
 *       type
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type
 *           format
 *         password:
 *           type
 *     AuthResponse:
 *       type
 *       properties:
 *         success:
 *           type
 *         message:
 *           type
 *         data:
 *           type
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type
 *             refreshToken:
 *               type
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('name')
    .isLength({ min, max })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  body('password')
    .isLength({ min })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['customer', 'provider'])
    .withMessage('Role must be either customer or provider'),
  validateRequest
], register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary user
 *     tags: [Authentication]
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description credentials or account locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest
], login);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary access token
 *     tags: [Authentication]
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type
 *     responses:
 *       200:
 *         description refreshed successfully
 *       401:
 *         description refresh token
 */
router.post('/refresh-token', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validateRequest
], refreshToken);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     summary current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             properties:
 *               name:
 *                 type
 *               email:
 *                 type
 *                 format
 *               phone:
 *                 type
 *               address:
 *                 type
 *               avatar:
 *                 type
 *     responses:
 *       200:
 *         description updated successfully
 *       401:
 *         description
 *       409:
 *         description or phone already taken
 */
router.put('/me', [
  protect,
  body('name')
    .optional()
    .isLength({ min, max })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  validateRequest
], updateMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type
 *               newPassword:
 *                 type
 *                 minLength
 *     responses:
 *       200:
 *         description changed successfully
 *       401:
 *         description password is incorrect
 */
router.put('/change-password', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validateRequest
], changePassword);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type
 *                 format
 *     responses:
 *       200:
 *         description reset token sent
 *       404:
 *         description not found
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  validateRequest
], forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary password with token
 *     tags: [Authentication]
 *     parameters:
 *       - in
 *         name
 *         required
 *         schema:
 *           type
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type
 *                 minLength
 *     responses:
 *       200:
 *         description reset successful
 *       400:
 *         description or expired token
 */
router.post('/reset-password/', [
  body('password')
    .isLength({ min })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validateRequest
], resetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-email/{token}:
 *   post:
 *     summary email address
 *     tags: [Authentication]
 *     parameters:
 *       - in
 *         name
 *         required
 *         schema:
 *           type
 *     responses:
 *       200:
 *         description verified successfully
 *       400:
 *         description or expired token
 */
router.post('/verify-email/', verifyEmail);

/**
 * @swagger
 * /api/v1/auth/verify-phone:
 *   post:
 *     summary phone number with OTP
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required
 *       content:
 *         application/json:
 *           schema:
 *             type
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type
 *                 minLength
 *                 maxLength
 *     responses:
 *       200:
 *         description verified successfully
 *       400:
 *         description or expired OTP
 */
router.post('/verify-phone', [
  protect,
  body('otp')
    .isLength({ min, max })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  validateRequest
], verifyPhone);

/**
 * @swagger
 * /api/v1/auth/resend-email-verification:
 *   post:
 *     summary email verification
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description verification sent successfully
 *       400:
 *         description is already verified
 */
router.post('/resend-email-verification', protect, resendEmailVerification);

/**
 * @swagger
 * /api/v1/auth/resend-phone-verification:
 *   post:
 *     summary phone verification OTP
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description verification OTP sent successfully
 *       400:
 *         description is already verified
 */
router.post('/resend-phone-verification', protect, resendPhoneVerification);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description out successfully
 */
router.post('/logout', protect, logout);

export default router;
