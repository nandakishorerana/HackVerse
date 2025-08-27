import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import {} from 'cloudinary';
import { Request } from 'express';
import { AppError } from '@/utils/AppError';

// Configure Cloudinary
cloudinary.config({
  cloud_name.env.CLOUDINARY_CLOUD_NAME as string,
  api_key.env.CLOUDINARY_API_KEY as string,
  api_secret.env.CLOUDINARY_API_SECRET as string
});

// File type validation
const allowedFileTypes = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
};

// Create multer file filter
const createFileFilter = (allowedTypes) => {
  return (req, file.Multer.File, cb.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400));
    }
  };
};

// Cloudinary storage configuration for different upload types
const createCloudinaryStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `deshi-sahayak/${folder}`,
      allowed_formats,
      transformation: [
        { width, height, crop: 'limit' },
        { quality: 'auto' }
      ]
    } as any
  });
};

// Avatar upload configuration
const avatarStorage = createCloudinaryStorage('avatars', ['jpg', 'jpeg', 'png', 'webp']);
export const uploadAvatar = multer({
  storage,
  fileFilter(allowedFileTypes.images),
  limits: {
    fileSize * 1024 * 1024, // 5MB
    files
  }
}).single('avatar');

// Service images upload configuration
const serviceImageStorage = createCloudinaryStorage('services', ['jpg', 'jpeg', 'png', 'webp']);
export const uploadServiceImages = multer({
  storage,
  fileFilter(allowedFileTypes.images),
  limits: {
    fileSize * 1024 * 1024, // 10MB per file
    files // Maximum 5 images
  }
}).array('images', 5);

// Review images upload configuration
const reviewImageStorage = createCloudinaryStorage('reviews', ['jpg', 'jpeg', 'png', 'webp']);
export const uploadReviewImages = multer({
  storage,
  fileFilter(allowedFileTypes.images),
  limits: {
    fileSize * 1024 * 1024, // 5MB per file
    files // Maximum 3 images
  }
}).array('images', 3);

// Provider documents upload configuration
const documentStorage = createCloudinaryStorage('documents', ['jpg', 'jpeg', 'png', 'pdf']);
export const uploadProviderDocuments = multer({
  storage,
  fileFilter([...allowedFileTypes.images, ...allowedFileTypes.documents]),
  limits: {
    fileSize * 1024 * 1024, // 10MB per file
    files // Maximum 5 documents
  }
}).fields([
  { name: 'idProof', maxCount },
  { name: 'addressProof', maxCount },
  { name: 'businessLicense', maxCount },
  { name: 'certificates', maxCount }
]);

// Generic file upload configuration
const genericStorage = createCloudinaryStorage('misc', ['jpg', 'jpeg', 'png', 'webp', 'pdf']);
export const uploadFiles = multer({
  storage,
  fileFilter(allowedFileTypes.all),
  limits: {
    fileSize * 1024 * 1024, // 15MB per file
    files // Maximum 10 files
  }
}).array('files', 10);

// Memory storage for processing before upload (if needed)
export const uploadToMemory = multer({
  storage.memoryStorage(),
  fileFilter(allowedFileTypes.images),
  limits: {
    fileSize * 1024 * 1024, // 5MB
    files
  }
}).array('files', 5);

// Middleware to handle upload errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected file field', 400));
    }
  }
  next(error);
};

// Utility function to delete files from Cloudinary
export const deleteCloudinaryFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

// Utility function to get file URL from Cloudinary
export const getCloudinaryUrl = (publicId, transformation?) => {
  return cloudinary.url(publicId, transformation);
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (cloudinaryUrl) => {
  const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : '';
};

// Middleware wrapper for different upload types
export const uploadMiddleware = {
  avatar,
  serviceImages,
  reviewImages,
  documents,
  files,
  memory
};
