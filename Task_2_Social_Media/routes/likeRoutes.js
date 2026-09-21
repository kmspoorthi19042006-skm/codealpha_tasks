const express = require("express");

const {
    toggleLike,
    getLikeCount
} = require("../controllers/likeController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Like / unlike
router.post("/:postId", toggleLike);

// Get like count
router.get("/:postId", getLikeCount);

module.exports = router;