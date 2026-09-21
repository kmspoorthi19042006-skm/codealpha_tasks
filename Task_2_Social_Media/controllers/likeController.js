const { pool } = require("../config/db");

// LIKE / UNLIKE POST
const toggleLike = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Check whether the post exists
        const [posts] = await pool.execute(
            `SELECT id FROM posts WHERE id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check whether the current user already liked it
        const [existingLike] = await pool.execute(
            `SELECT id FROM likes
             WHERE post_id = ? AND user_id = ?`,
            [postId, req.userId]
        );

        if (existingLike.length > 0) {
            // Unlike
            await pool.execute(
                `DELETE FROM likes
                 WHERE post_id = ? AND user_id = ?`,
                [postId, req.userId]
            );

            return res.json({
                success: true,
                liked: false,
                message: "Post unliked"
            });
        }

        // Like
        await pool.execute(
            `INSERT INTO likes (post_id, user_id)
             VALUES (?, ?)`,
            [postId, req.userId]
        );

        res.json({
            success: true,
            liked: true,
            message: "Post liked"
        });

    } catch (error) {
        console.error("Toggle like error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating like"
        });
    }
};


// GET LIKE COUNT
const getLikeCount = async (req, res) => {
    try {
        const postId = req.params.postId;

        const [result] = await pool.execute(
            `SELECT COUNT(*) AS like_count
             FROM likes
             WHERE post_id = ?`,
            [postId]
        );

        res.json({
            success: true,
            like_count: result[0].like_count
        });

    } catch (error) {
        console.error("Get like count error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while getting likes"
        });
    }
};


module.exports = {
    toggleLike,
    getLikeCount
};