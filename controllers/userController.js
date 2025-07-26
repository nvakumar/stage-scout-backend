import multer from 'multer'; // Import multer
import { avatarStorage, resumeStorage } from '../config/cloudinary.js'; // Import new storage configs
import User from '../models/userModel.js';
import Post from '../models/postModel.js';

// Set up multer for avatar upload
const uploadAvatar = multer({ storage: avatarStorage });

// Set up multer for resume upload
const uploadResume = multer({ storage: resumeStorage });


// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    // Find the user by their ID from the URL parameter
    // We exclude the password for security
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all posts created by this user
    const posts = await Post.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName role avatar'); // Populate user details for each post

    // Send back the user's profile information and their posts
    res.status(200).json({
      user,
      posts,
    });

  } catch (error) {
    // Handle cases where the provided ID is not a valid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Search for users by name or role
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res) => {
    // Get the search query from the URL, e.g., ?q=John
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        // Create a case-insensitive regular expression for searching
        const searchQuery = new RegExp(query, 'i');

        // Find users where either the fullName or the role matches the search query
        const users = await User.find({
            $or: [
                { fullName: searchQuery },
                { role: searchQuery }
            ]
        }).select('-password'); // Exclude passwords from the result

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const userToFollowId = req.params.id; // The ID of the user to be followed
    const currentUserId = req.user._id; // The ID of the currently logged-in user

    // Ensure user cannot follow themselves
    if (userToFollowId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Find the user to be followed
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    // Find the current user
    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Add to following list of current user
    currentUser.following.push(userToFollowId);
    await currentUser.save();

    // Add to followers list of the user being followed
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();

    res.status(200).json({ message: 'User followed successfully', followersCount: userToFollow.followers.length });

  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const userToUnfollowId = req.params.id; // The ID of the user to be unfollowed
    const currentUserId = req.user._id; // The ID of the currently logged-in user

    // Find the user to be unfollowed
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User to unfollow not found' });
    }

    // Find the current user
    const currentUser = await User.findById(currentUserId);

    // Check if not following
    if (!currentUser.following.includes(userToUnfollowId)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Remove from following list of current user
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollowId.toString()
    );
    await currentUser.save();

    // Remove from followers list of the user being unfollowed
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );
    await userToUnfollow.save();

    res.status(200).json({ message: 'User unfollowed successfully', followersCount: userToUnfollow.followers.length });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user profile (bio, skills, profilePictureUrl, resumeUrl)
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Get the logged-in user's ID from the protect middleware
    const { bio, skills, profilePictureUrl, resumeUrl } = req.body; // Added resumeUrl

    const user = await User.findById(userId);

    if (user) {
      user.bio = bio !== undefined ? bio : user.bio;
      user.skills = skills !== undefined ? skills : user.skills;
      user.profilePictureUrl = profilePictureUrl !== undefined ? profilePictureUrl : user.profilePictureUrl;
      user.resumeUrl = resumeUrl !== undefined ? resumeUrl : user.resumeUrl; // Update resumeUrl

      const updatedUser = await user.save();

      // Return the updated user data (excluding password)
      res.status(200).json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        profilePictureUrl: updatedUser.profilePictureUrl,
        resumeUrl: updatedUser.resumeUrl, // Include resumeUrl in response
        followers: updatedUser.followers,
        following: updatedUser.following,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/upload/avatar
// @access  Private
const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user) {
      user.profilePictureUrl = req.file.path; // Cloudinary URL
      await user.save();
      res.status(200).json({ message: 'Avatar uploaded successfully', profilePictureUrl: user.profilePictureUrl });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Upload user resume
// @route   POST /api/users/upload/resume
// @access  Private
const uploadUserResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user) {
      user.resumeUrl = req.file.path; // Cloudinary URL
      await user.save();
      res.status(200).json({ message: 'Resume uploaded successfully', resumeUrl: user.resumeUrl });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


export { 
  getUserProfile, 
  searchUsers, 
  followUser, 
  unfollowUser, 
  updateUserProfile,
  uploadUserAvatar, // Export new upload functions
  uploadUserResume  // Export new upload functions
};
