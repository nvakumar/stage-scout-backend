// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import 'dotenv/config';

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary for general media posts (photos/videos)
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'StageScout/posts', // Folder for general posts
    allowed_formats: ['jpeg', 'png', 'jpg', 'mp4', 'mov'],
    resource_type: (req, file) => {
      if (file.mimetype.startsWith('video')) {
        return 'video';
      }
      return 'image';
    },
  },
});

// Configure multer-storage-cloudinary for profile pictures
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'StageScout/avatars', // Dedicated folder for avatars
    allowed_formats: ['jpeg', 'png', 'jpg'], // Only image formats for avatars
    resource_type: 'image',
    public_id: (req, file) => `avatar-${req.user._id}`, // Unique ID for each user's avatar
    overwrite: true, // Overwrite existing avatar for the same user
  },
});

// Configure multer-storage-cloudinary for resumes
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'StageScout/resumes', // Dedicated folder for resumes
    allowed_formats: ['pdf', 'doc', 'docx'], // Allowed document formats for resumes
    resource_type: 'raw', // Treat as raw file
    public_id: (req, file) => `resume-${req.user._id}`, // Unique ID for each user's resume
    overwrite: true, // Overwrite existing resume for the same user
  },
});

// Configure multer-storage-cloudinary for group cover images
const groupCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'StageScout/group_covers',
    allowed_formats: ['jpeg', 'png', 'jpg'],
    resource_type: 'image',
    public_id: (req, file) => `group-cover-${req.params.id}`,
    overwrite: true,
  },
});

// **👇 ADD THIS NEW STORAGE CONFIGURATION FOR USER COVER PHOTOS 👇**
const coverPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'StageScout/covers',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `cover-${req.user._id}`,
    overwrite: true,
  },
});


export { 
    cloudinary, 
    postStorage, 
    avatarStorage, 
    resumeStorage, 
    groupCoverStorage,
    coverPhotoStorage // 👈 Export the new storage
};
