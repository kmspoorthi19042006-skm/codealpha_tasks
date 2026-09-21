const {
    pool
} = require("../config/db");

const fs =
    require("fs");

const path =
    require("path");


/* =========================================================
   GET USER PROFILE
========================================================= */

const getUserProfile =
    async (req, res) => {

        try {

            const userId =
                req.params.userId;


            const [users] =
                await pool.execute(

                    `SELECT
                        u.id,
                        u.name,
                        u.username,
                        u.email,
                        u.bio,
                        u.profile_image,
                        u.created_at,

                        (
                            SELECT COUNT(*)
                            FROM follows
                            WHERE following_id = u.id
                        ) AS followers_count,

                        (
                            SELECT COUNT(*)
                            FROM follows
                            WHERE follower_id = u.id
                        ) AS following_count,

                        (
                            SELECT COUNT(*)
                            FROM posts
                            WHERE user_id = u.id
                        ) AS posts_count

                    FROM users u

                    WHERE u.id = ?`,

                    [userId]

                );


            if (
                users.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            const profile =
                users[0];


            const [follow] =
                await pool.execute(

                    `SELECT id
                     FROM follows
                     WHERE follower_id = ?
                     AND following_id = ?`,

                    [
                        req.userId,
                        userId
                    ]

                );


            profile.following =
                follow.length > 0;


            res.json({

                success: true,

                profile

            });


        } catch (error) {

            console.error(
                "Get profile error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while loading profile"

            });

        }

    };


/* =========================================================
   GET USER POSTS
========================================================= */

const getUserPosts =
    async (req, res) => {

        try {

            const userId =
                req.params.userId;


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

                        (
                            SELECT COUNT(*)
                            FROM likes l
                            WHERE l.post_id = p.id
                        ) AS like_count,

                        (
                            SELECT COUNT(*)
                            FROM comments c
                            WHERE c.post_id = p.id
                        ) AS comment_count,

                        EXISTS(
                            SELECT 1
                            FROM likes l2
                            WHERE l2.post_id = p.id
                            AND l2.user_id = ?
                        ) AS liked_by_me

                    FROM posts p

                    JOIN users u
                    ON p.user_id = u.id

                    WHERE p.user_id = ?

                    ORDER BY p.created_at DESC`,

                    [
                        req.userId,
                        userId
                    ]

                );


            res.json({

                success: true,

                count:
                    posts.length,

                posts

            });


        } catch (error) {

            console.error(
                "Get user posts error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while loading user posts"

            });

        }

    };


/* =========================================================
   SEARCH USERS
========================================================= */

const searchUsers =
    async (req, res) => {

        try {

            const search =
                req.query.q;


            if (
                !search ||
                !search.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Search query is required"

                });

            }


            const searchTerm =
                `%${search.trim()}%`;


            const [users] =
                await pool.execute(

                    `SELECT
                        id,
                        name,
                        username,
                        bio,
                        profile_image

                    FROM users

                    WHERE
                        name LIKE ?
                        OR username LIKE ?

                    ORDER BY username ASC

                    LIMIT 20`,

                    [
                        searchTerm,
                        searchTerm
                    ]

                );


            res.json({

                success: true,

                count:
                    users.length,

                users

            });


        } catch (error) {

            console.error(
                "Search users error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Server error while searching users"

            });

        }

    };


/* =========================================================
   UPDATE USER PROFILE
========================================================= */

const updateUserProfile =
    async (req, res) => {

        let uploadedFilePath =
            null;


        try {

            const userId =
                req.userId;


            const {
                name,
                username,
                bio
            } = req.body;


            /* =================================================
               VALIDATE NAME
            ================================================= */

            if (
                !name ||
                !name.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name is required"

                });

            }


            const cleanName =
                name.trim();


            if (
                cleanName.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name cannot exceed 100 characters"

                });

            }


            /* =================================================
               VALIDATE USERNAME
            ================================================= */

            if (
                !username ||
                !username.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username is required"

                });

            }


            const cleanUsername =
                username
                    .trim()
                    .toLowerCase();


            if (
                cleanUsername.length < 3 ||
                cleanUsername.length > 50
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username must be between 3 and 50 characters"

                });

            }


            if (
                !/^[a-zA-Z0-9_]+$/.test(
                    cleanUsername
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username can contain only letters, numbers and underscores"

                });

            }


            /* =================================================
               VALIDATE BIO
            ================================================= */

            const cleanBio =
                typeof bio === "string"
                    ? bio.trim()
                    : "";


            if (
                cleanBio.length > 500
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Bio cannot exceed 500 characters"

                });

            }


            /* =================================================
               CHECK USERNAME DUPLICATE
            ================================================= */

            const [existingUsers] =
                await pool.execute(

                    `SELECT id
                     FROM users
                     WHERE username = ?
                     AND id <> ?`,

                    [
                        cleanUsername,
                        userId
                    ]

                );


            if (
                existingUsers.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Username is already taken"

                });

            }


            /* =================================================
               GET CURRENT PROFILE IMAGE
            ================================================= */

            const [currentUsers] =
                await pool.execute(

                    `SELECT
                        profile_image
                     FROM users
                     WHERE id = ?`,

                    [userId]

                );


            if (
                currentUsers.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found"

                });

            }


            const oldProfileImage =
                currentUsers[0]
                    .profile_image;


            /* =================================================
               KEEP OLD IMAGE BY DEFAULT
            ================================================= */

            let profileImage =
                oldProfileImage;


            /* =================================================
               NEW IMAGE UPLOADED
            ================================================= */

            if (req.file) {

                uploadedFilePath =
                    req.file.path;


                profileImage =
                    `/uploads/profiles/${req.file.filename}`;

            }


            /* =================================================
               UPDATE USER
            ================================================= */

            await pool.execute(

                `UPDATE users
                 SET
                    name = ?,
                    username = ?,
                    bio = ?,
                    profile_image = ?
                 WHERE id = ?`,

                [
                    cleanName,
                    cleanUsername,
                    cleanBio || null,
                    profileImage,
                    userId
                ]

            );


            /* =================================================
               DELETE OLD LOCAL IMAGE
            ================================================= */

            if (
                req.file &&
                oldProfileImage &&
                oldProfileImage.startsWith(
                    "/uploads/profiles/"
                )
            ) {

                const oldFileName =
                    path.basename(
                        oldProfileImage
                    );


                const oldFilePath =
                    path.join(
                        __dirname,
                        "..",
                        "uploads",
                        "profiles",
                        oldFileName
                    );


                if (
                    fs.existsSync(
                        oldFilePath
                    )
                ) {

                    fs.unlinkSync(
                        oldFilePath
                    );

                }

            }


            /* =================================================
               GET UPDATED USER
            ================================================= */

            const [users] =
                await pool.execute(

                    `SELECT
                        id,
                        name,
                        username,
                        email,
                        bio,
                        profile_image,
                        created_at

                    FROM users

                    WHERE id = ?`,

                    [userId]

                );


            res.json({

                success: true,

                message:
                    "Profile updated successfully",

                user:
                    users[0]

            });


        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );


            /* =================================================
               DELETE NEW FILE IF DATABASE UPDATE FAILED
            ================================================= */

            if (
                uploadedFilePath &&
                fs.existsSync(
                    uploadedFilePath
                )
            ) {

                try {

                    fs.unlinkSync(
                        uploadedFilePath
                    );

                } catch (deleteError) {

                    console.error(
                        "Unable to delete uploaded file:",
                        deleteError
                    );

                }

            }


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Username is already taken"

                });

            }


            res.status(500).json({

                success: false,

                message:
                    "Server error while updating profile"

            });

        }

    };


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getUserProfile,

    getUserPosts,

    searchUsers,

    updateUserProfile

};