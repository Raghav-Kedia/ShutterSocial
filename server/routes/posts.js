const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validation middleware
const validatePost = [
  body('caption')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Caption must be between 1 and 1000 characters')
];

const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, upload.single('image'), validatePost, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: 'Image is required' 
      });
    }

    const { caption } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;

    // Create new post
    const post = new Post({
      author: req.user._id,
      image: imagePath,
      caption: caption
    });

    await post.save();

    // Populate author details
    await post.populate('author', 'username profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      message: 'Server error while creating post' 
    });
  }
});

// @route   GET /api/posts
// @desc    Get paginated feed of posts
// @access  Public (with optional auth for like status)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { caption: searchRegex },
        { 'author.username': searchRegex }
      ];
    }

    // Get posts with pagination
    const posts = await Post.find(query)
      .populate('author', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    // Add like status for authenticated users
    if (req.user) {
      posts.forEach(post => {
        post.isLiked = post.isLikedBy(req.user._id);
      });
    }

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching posts' 
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public (with optional auth for like status)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture bio')
      .populate('comments.user', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    // Add like status for authenticated users
    if (req.user) {
      post.isLiked = post.isLikedBy(req.user._id);
    }

    res.json({ post });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching post' 
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post (only by author)
// @access  Private
router.put('/:id', authenticateToken, validatePost, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { caption } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only edit your own posts.' 
      });
    }

    // Update post
    post.caption = caption;
    await post.save();

    // Populate author details
    await post.populate('author', 'username profilePicture');

    res.json({
      message: 'Post updated successfully',
      post
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ 
      message: 'Server error while updating post' 
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (only by author)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own posts.' 
      });
    }

    // Delete image file
    if (post.image) {
      const imagePath = path.join(__dirname, '..', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Post deleted successfully' 
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting post' 
    });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Toggle like on a post
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    const wasLiked = post.toggleLike(req.user._id);
    await post.save();

    res.json({
      message: wasLiked ? 'Post liked' : 'Post unliked',
      isLiked: !wasLiked,
      likeCount: post.likeCount
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      message: 'Server error while toggling like' 
    });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', authenticateToken, validateComment, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    const comment = post.addComment(req.user._id, content);
    await post.save();

    // Populate comment user details
    await post.populate('comments.user', 'username profilePicture');

    // Get the newly added comment
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      message: 'Server error while adding comment' 
    });
  }
});

// @route   DELETE /api/posts/:id/comments/:commentId
// @desc    Delete a comment (only by comment author)
// @access  Private
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        message: 'Post not found' 
      });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        message: 'Comment not found' 
      });
    }

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own comments.' 
      });
    }

    const removed = post.removeComment(req.params.commentId);
    if (removed) {
      await post.save();
      res.json({ 
        message: 'Comment deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        message: 'Comment not found' 
      });
    }

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting comment' 
    });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Public (with optional auth for like status)
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: req.params.userId });

    // Add like status for authenticated users
    if (req.user) {
      posts.forEach(post => {
        post.isLiked = post.isLikedBy(req.user._id);
      });
    }

    res.json({
      posts,
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user posts' 
    });
  }
});

module.exports = router; 