const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);

// Configure storage for different file types
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'realstate/chat';
    let resourceType = 'auto';
    let allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'avi'];

    // Determine folder based on file type
    if (file.mimetype.startsWith('image/')) {
      folder = 'realstate/chat/images';
      allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'realstate/chat/videos';
      resourceType = 'video';
      allowedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    } else if (file.mimetype === 'application/pdf') {
      folder = 'realstate/chat/documents';
      resourceType = 'raw';
      allowedFormats = ['pdf'];
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      transformation: file.mimetype.startsWith('image/') 
        ? [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }]
        : undefined
    };
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteFromCloudinary
};
