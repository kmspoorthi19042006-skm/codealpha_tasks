const { pool } = require("../config/db");

// ADD COMMENT
const addComment = async (req, res) => {
    try {
        const postId = req.params.postId;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        if (content.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 500 characters"
            });
        }

        // Check post exists
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

        const [result] = await pool.execute(
            `INSERT INTO comments
             (post_id, user_id, content)
             VALUES (?, ?, ?)`,
            [postId, req.userId, content.trim()]
        );

        const [comments] = await pool.execute(
            `SELECT
                c.id,
                c.post_id,
                c.user_id,
                c.content,
                c.created_at,
                u.name,
                u.username,
                u.profile_image
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: comments[0]
        });

    } catch (error) {
        console.error("Add comment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding comment"
        });
    }
};


// GET COMMENTS
const getComments = async (req, res) => {
    try {
        const postId = req.params.postId;

        const [comments] = await pool.execute(
            `SELECT
                c.id,
                c.post_id,
                c.user_id,
                c.content,
                c.created_at,
                u.name,
                u.username,
                u.profile_image
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );

        res.json({
            success: true,
            count: comments.length,
            comments
        });

    } catch (error) {
        console.error("Get comments error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading comments"
        });
    }
};


// DELETE OWN COMMENT
const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;

        const [comments] = await pool.execute(
            `SELECT id
             FROM comments
             WHERE id = ? AND user_id = ?`,
            [commentId, req.userId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or you are not authorized"
            });
        }

        await pool.execute(
            `DELETE FROM comments
             WHERE id = ?`,
            [commentId]
        );

        res.json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Delete comment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting comment"
        });
    }
};


module.exports = {
    addComment,
    getComments,
    deleteComment
};