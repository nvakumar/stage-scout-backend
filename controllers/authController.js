import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new user in the database
    const user = await User.create({
      fullName,
      email,
      role,
      password: hashedPassword,
    });

    // 4. If user was created, send back user data and a token
    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl, // Include profilePictureUrl
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check for user by email
    const user = await User.findOne({ email });

    // 2. If user exists, compare the provided password with the stored hashed password
    if (user && (await bcrypt.compare(password, user.password))) {
      // 3. If passwords match, send back user data and a new token
      res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl, // Include profilePictureUrl
        token: generateToken(user._id),
      });
    } else {
      // 4. If user doesn't exist or passwords don't match, send an error
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id; // User ID from protect middleware

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Change user email
// @route   PUT /api/auth/change-email
// @access  Private
export const changeEmail = async (req, res) => {
  const { newEmail, password } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password for security
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Check if new email already exists
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists && emailExists._id.toString() !== userId.toString()) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: 'Email updated successfully', newEmail: user.email });
  } catch (error) {
    console.error("Error changing email:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password for security before deletion
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    await user.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token will expire in 30 days
  });
};
