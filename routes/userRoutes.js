import express from 'express';
import { 
  getUserProfile, 
  searchUsers,
  followUser,    
  unfollowUser,
  updateUserProfile,
  uploadUserAvatar,  // 👈 Import uploadUserAvatar
  uploadUserResume   // 👈 Import uploadUserResume
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer'; // Import multer to use its middleware directly here
import { avatarStorage, resumeStorage } from '../config/cloudinary.js'; // Import storage configs

// Set up multer instances for routes
const uploadAvatarMiddleware = multer({ storage: avatarStorage });
const uploadResumeMiddleware = multer({ storage: resumeStorage });


const router = express.Router();

// Route for searching users
// This must come BEFORE the /:id route, otherwise 'search' will be treated as an ID
router.route('/search').get(protect, searchUsers);

// Route to get a user's own profile (the logged-in user) and update it
router.route('/me').put(protect, updateUserProfile); 

// Route to get a user's profile by their ID (publicly accessible)
router.route('/:id').get(getUserProfile); 

// Route to follow a user
router.route('/:id/follow').post(protect, followUser); 

// Route to unfollow a user
router.route('/:id/follow').delete(protect, unfollowUser); 

// Route to upload user avatar
router.route('/upload/avatar').post(protect, uploadAvatarMiddleware.single('avatar'), uploadUserAvatar); // 👈 Add avatar upload route

// Route to upload user resume
router.route('/upload/resume').post(protect, uploadResumeMiddleware.single('resume'), uploadUserResume); // 👈 Add resume upload route


export default router;
