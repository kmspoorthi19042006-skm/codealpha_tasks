const { pool } = require("../config/db");

// FOLLOW / UNFOLLOW USER
const toggleFollow = async (req, res) => {
    try {
        const followingId = req.params.userId;
        const followerId = req.userId;

        if (Number(followingId) === Number(followerId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        // Check whether target user exists
        const [users] = await pool.execute(
            `SELECT id FROM users WHERE id = ?`,
            [followingId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check existing follow
        const [existingFollow] = await pool.execute(
            `SELECT id
             FROM follows
             WHERE follower_id = ?
             AND following_id = ?`,
            [followerId, followingId]
        );

        if (existingFollow.length > 0) {
            await pool.execute(
                `DELETE FROM follows
                 WHERE follower_id = ?
                 AND following_id = ?`,
                [followerId, followingId]
            );

            return res.json({
                success: true,
                following: false,
                message: "User unfollowed"
            });
        }

        await pool.execute(
            `INSERT INTO follows
             (follower_id, following_id)
             VALUES (?, ?)`,
            [followerId, followingId]
        );

        res.json({
            success: true,
            following: true,
            message: "User followed"
        });

    } catch (error) {
        console.error("Toggle follow error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating follow"
        });
    }
};


// GET FOLLOW STATUS
const getFollowStatus = async (req, res) => {
    try {
        const followingId = req.params.userId;

        const [result] = await pool.execute(
            `SELECT id
             FROM follows
             WHERE follower_id = ?
             AND following_id = ?`,
            [req.userId, followingId]
        );

        res.json({
            success: true,
            following: result.length > 0
        });

    } catch (error) {
        console.error("Follow status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while checking follow status"
        });
    }
};


// GET FOLLOWERS
const getFollowers = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [followers] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.username,
                u.bio,
                u.profile_image
             FROM follows f
             JOIN users u
                ON f.follower_id = u.id
             WHERE f.following_id = ?
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            count: followers.length,
            followers
        });

    } catch (error) {
        console.error("Get followers error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading followers"
        });
    }
};


// GET FOLLOWING
const getFollowing = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [following] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.username,
                u.bio,
                u.profile_image
             FROM follows f
             JOIN users u
                ON f.following_id = u.id
             WHERE f.follower_id = ?
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            count: following.length,
            following
        });

    } catch (error) {
        console.error("Get following error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading following"
        });
    }
};


module.exports = {
    toggleFollow,
    getFollowStatus,
    getFollowers,
    getFollowing
};