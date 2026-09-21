const express = require("express");

const {
    createPost,
    getFeed,
    deletePost
} = require("../controllers/postController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All post routes require authentication
router.use(protect);

// Create a post
router.post("/", createPost);

// Get feed
router.get("/", getFeed);

// Delete own post
router.delete("/:id", deletePost);

module.exports = router;