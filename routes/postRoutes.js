import express from 'express';
import { 
  createPost, 
  getPosts, 
  likePost, 
  addComment,
  deleteComment,
  reactToPost, 
  deletePost, 
  updatePost,
  upload,
  getGroupPosts 
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to get all posts and create a new post (with file upload)
router
  .route('/')
  .get(protect, getPosts)
  .post(protect, upload.single('file'), createPost);

// Routes for a specific post by ID (delete and update)
router
  .route('/:id')
  .delete(protect, deletePost)
  .put(protect, updatePost);

// Route to like/unlike a post
router.route('/:id/like').put(protect, likePost);

// Route to add a comment to a post
router.route('/:id/comment').post(protect, addComment);

// Route to delete a comment
router.route('/:postId/comment/:commentId').delete(protect, deleteComment);

// Route to react to a post with an emoji
router.route('/:id/react').post(protect, reactToPost);

// Note: The getGroupPosts route is typically handled in groupRoutes.js
// to follow a clean RESTful pattern, like GET /api/groups/:id/posts.
// If you intend to use it here, you would add a specific route for it.

export default router;
