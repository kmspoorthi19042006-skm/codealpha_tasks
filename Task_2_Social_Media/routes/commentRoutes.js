const express = require("express");

const {
    addComment,
    getComments,
    deleteComment
} = require("../controllers/commentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Add comment
router.post("/:postId", addComment);

// Get comments
router.get("/:postId", getComments);

// Delete own comment
router.delete("/:commentId", deleteComment);

module.exports = router;