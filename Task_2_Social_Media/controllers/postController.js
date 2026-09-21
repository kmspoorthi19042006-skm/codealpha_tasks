const { pool } = require("../config/db");


// =========================================================
// CREATE POST
// =========================================================

const createPost = async (req, res) => {
    try {

        const {
            content,
            image_url
        } = req.body;


        if (!content || !content.trim()) {

            return res.status(400).json({
                success: false,
                message: "Post content is required"
            });
        }


        if (content.trim().length > 2000) {

            return res.status(400).json({
                success: false,
                message: "Post cannot exceed 2000 characters"
            });
        }


        const [result] =
            await pool.execute(
                `INSERT INTO posts
                    (user_id, content, image_url)
                 VALUES (?, ?, ?)`,
                [
                    req.userId,
                    content.trim(),
                    image_url || null
                ]
            );


        const [posts] =
            await pool.execute(
                `SELECT
                    p.id,
                    p.user_id,
                    p.content,
                    p.image_url,
                    p.created_at,
                    u.name,
                    u.username,
                    u.profile_image
                 FROM posts p
                 JOIN users u
                    ON p.user_id = u.id
                 WHERE p.id = ?`,
                [result.insertId]
            );


        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: posts[0]
        });


    } catch (error) {

        console.error(
            "Create post error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Server error while creating post"
        });
    }
};



// =========================================================
// GET FEED
// =========================================================

const getFeed = async (req, res) => {

    try {

        const [posts] =
            await pool.execute(
                `SELECT
                    p.id,
                    p.user_id,
                    p.content,
                    p.image_url,
                    p.created_at,

                    u.name,
                    u.username,
                    u.profile_image,


                    /* ---------------------------------
                       TOTAL LIKES
                    --------------------------------- */

                    (
                        SELECT COUNT(*)
                        FROM likes l
                        WHERE l.post_id = p.id
                    ) AS like_count,


                    /* ---------------------------------
                       TOTAL COMMENTS
                    --------------------------------- */

                    (
                        SELECT COUNT(*)
                        FROM comments c
                        WHERE c.post_id = p.id
                    ) AS comment_count,


                    /* ---------------------------------
                       DID CURRENT USER LIKE IT?
                    --------------------------------- */

                    EXISTS(
                        SELECT 1
                        FROM likes l2
                        WHERE l2.post_id = p.id
                        AND l2.user_id = ?
                    ) AS liked_by_me,


                    /* ---------------------------------
                       DOES CURRENT USER FOLLOW AUTHOR?
                    --------------------------------- */

                    EXISTS(
                        SELECT 1
                        FROM follows f
                        WHERE f.follower_id = ?
                        AND f.following_id = p.user_id
                    ) AS following_by_me


                 FROM posts p

                 JOIN users u
                    ON p.user_id = u.id

                 ORDER BY p.created_at DESC`,
                [
                    req.userId,
                    req.userId
                ]
            );


        res.json({
            success: true,
            count: posts.length,
            posts
        });


    } catch (error) {

        console.error(
            "Get feed error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Server error while loading feed"
        });
    }
};



// =========================================================
// DELETE POST
// =========================================================

const deletePost = async (req, res) => {

    try {

        const postId =
            req.params.id;


        /*
         * Make sure the post belongs
         * to the currently logged-in user.
         */

        const [posts] =
            await pool.execute(
                `SELECT id
                 FROM posts
                 WHERE id = ?
                 AND user_id = ?`,
                [
                    postId,
                    req.userId
                ]
            );


        if (posts.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Post not found or you are not authorized to delete it"
            });
        }


        /*
         * Delete the post.
         *
         * Because your database uses
         * ON DELETE CASCADE, its likes
         * and comments are also removed.
         */

        await pool.execute(
            `DELETE FROM posts
             WHERE id = ?`,
            [postId]
        );


        res.json({
            success: true,
            message:
                "Post deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete post error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Server error while deleting post"
        });
    }
};



// =========================================================
// EXPORT CONTROLLERS
// =========================================================

module.exports = {
    createPost,
    getFeed,
    deletePost
};