import express from 'express';
import { 
  createPost, 
  getPosts, 
  likePost, 
  addComment,
  deleteComment,
  reactToPost, 
  deletePost, 
  updatePost, // 👈 Import updatePost
  upload,
  getGroupPosts // Import if not already imported, for completeness
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to get all posts and create a new post
router
  .route('/')
  .get(protect, getPosts)
  .post(protect, upload.single('file'), createPost);

// Route to like/unlike a post
router.route('/:id/like').put(protect, likePost);

// Route to add a comment to a post
router.route('/:id/comment').post(protect, addComment);

// Route to delete a comment
router.route('/:postId/comment/:commentId').delete(protect, deleteComment);

// Route to react to a post with an emoji
router.route('/:id/react').post(protect, reactToPost);

// Route to delete a post
router.route('/:id').delete(protect, deletePost);

// Route to update a post
router.route('/:id').put(protect, updatePost); // 👈 Add the new PUT route for updating posts

// If you have getGroupPosts route, ensure it's here or in a separate group-specific route file
// router.route('/group/:id/posts').get(protect, getGroupPosts); 

export default router;
