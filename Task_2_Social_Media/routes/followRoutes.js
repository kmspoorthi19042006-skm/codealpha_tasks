const express = require("express");

const {
    toggleFollow,
    getFollowStatus,
    getFollowers,
    getFollowing
} = require("../controllers/followController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Follow / unfollow
router.post("/:userId", toggleFollow);

// Check follow status
router.get("/:userId/status", getFollowStatus);

// Get followers
router.get("/:userId/followers", getFollowers);

// Get following
router.get("/:userId/following", getFollowing);

module.exports = router;