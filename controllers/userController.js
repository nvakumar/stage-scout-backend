import multer from 'multer';
import { avatarStorage, resumeStorage } from '../config/cloudinary.js';
import User from '../models/userModel.js';
import Post from '../models/postModel.js'; // Ensure Post model is imported

// Set up multer for avatar upload
const uploadAvatar = multer({ storage: avatarStorage });

// Set up multer for resume upload
const uploadResume = multer({ storage: resumeStorage });


// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    // Explicitly include all fields needed for profile display, including 'location'
    const user = await User.findById(req.params.id).select('fullName email role bio skills profilePictureUrl resumeUrl followers following location'); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName role avatar'); 

    res.status(200).json({
      user,
      posts,
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Search for users by name or role
// @route   GET /api/users/search?q=query&role=roleFilter&location=locationFilter
// @access  Private
const searchUsers = async (req, res) => {
    const query = req.query.q;
    const roleFilter = req.query.role;
    const locationFilter = req.query.location;

    // Allow search if query is empty BUT any filter is present and not 'All Roles'
    // This condition is crucial to allow filter-only searches.
    if (!query && (!roleFilter || roleFilter === 'All Roles') && !locationFilter) { 
        return res.status(400).json({ message: 'Search query or specific filters are required' });
    }

    try {
        let findQuery = {};

        if (query) {
            const searchQuery = new RegExp(query, 'i');
            findQuery.$or = [
                { fullName: searchQuery },
                { role: searchQuery }
            ];
        }

        if (roleFilter && roleFilter !== 'All Roles') {
            findQuery.role = roleFilter;
        }

        if (locationFilter) {
            findQuery.location = new RegExp(locationFilter, 'i');
        }

        // Explicitly include fields for projection, do not mix exclusion/inclusion
        const users = await User.find(findQuery)
                                .select('fullName role profilePictureUrl location') // Include 'location' here
                                .sort({ fullName: 1 }); // Sort alphabetically by full name for basic ranking

        res.status(200).json(users);

    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const userToFollowId = req.params.id;
    const currentUserId = req.user._id;

    if (userToFollowId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    const currentUser = await User.findById(currentUserId);

    if (currentUser.following.includes(userToFollowId)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    currentUser.following.push(userToFollowId);
    await currentUser.save();

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
    const userToUnfollowId = req.params.id;
    const currentUserId = req.user._id;

    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User to unfollow not found' });
    }

    const currentUser = await User.findById(currentUserId);

    if (!currentUser.following.includes(userToUnfollowId)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollowId.toString()
    );
    await currentUser.save();

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

// @desc    Update user profile (bio, skills, profilePictureUrl, resumeUrl, location)
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bio, skills, profilePictureUrl, resumeUrl, location } = req.body; // Include 'location'

    const user = await User.findById(userId);

    if (user) {
      user.bio = bio !== undefined ? bio : user.bio;
      user.skills = skills !== undefined ? skills : user.skills;
      user.profilePictureUrl = profilePictureUrl !== undefined ? profilePictureUrl : user.profilePictureUrl;
      user.resumeUrl = resumeUrl !== undefined ? resumeUrl : user.resumeUrl;
      user.location = location !== undefined ? location : user.location; // Update 'location'

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        profilePictureUrl: updatedUser.profilePictureUrl,
        resumeUrl: updatedUser.resumeUrl,
        followers: updatedUser.followers,
        following: updatedUser.following,
        location: updatedUser.location, // Include 'location' in response
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
      user.profilePictureUrl = req.file.path;
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
      user.resumeUrl = req.file.path;
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
  uploadUserAvatar, 
  uploadUserResume  
};
