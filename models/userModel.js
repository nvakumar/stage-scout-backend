import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true, // Every email must be unique
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6, // Enforce a minimum password length
    },
    role: {
      type: String,
      enum: [
        'Actor',
        'Model',
        'Filmmaker',
        'Director',
        'Writer',
        'Photographer',
        'Editor',
        'Musician',
        'Creator',
        'Student',
        'Production House'
      ],
      required: [true, 'Please select a role'],
    },
    bio: {
      type: String,
      maxlength: 500, // Limit bio length
      default: ''
    },
    skills: {
      type: [String], // Array of strings for skills
      default: []
    },
    profilePictureUrl: {
      type: String,
      default: 'https://placehold.co/150x150/1a202c/ffffff?text=Avatar' // Default avatar placeholder
    },
    // New field for resume URL
    resumeUrl: {
      type: String,
      default: ''
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to other User documents
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to other User documents
      },
    ],
  },
  {
    timestamps: true, // This automatically adds `createdAt` and `updatedAt` fields
  }
);

const User = mongoose.model('User', userSchema);

export default User;
