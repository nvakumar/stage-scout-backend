import express from 'express';
import { 
  registerUser, 
  loginUser,
  changePassword, // 👈 Import changePassword
  changeEmail,    // 👈 Import changeEmail
  deleteAccount   // 👈 Import deleteAccount
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router(); // Corrected: `express.Router()` not `express = express.Router()`

// Registration route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Change Password route (protected)
router.put('/change-password', protect, changePassword); // 👈 Add PUT route for password change

// Change Email route (protected)
router.put('/change-email', protect, changeEmail);     // 👈 Add PUT route for email change

// Delete Account route (protected)
// Note: DELETE requests with a body are uncommon but used here for password verification
router.delete('/delete-account', protect, deleteAccount); // 👈 Add DELETE route for account deletion

export default router;
