import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: false,
    },
    title: {
      type: String,
      required: [true, 'A title or text content is required for your post.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: false, // Now optional for text-only posts
    },
    mediaType: {
      type: String,
      enum: ['Photo', 'Video'],
      required: false, // Now optional for text-only posts
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // 👇 ADDED: To store emoji reactions
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
