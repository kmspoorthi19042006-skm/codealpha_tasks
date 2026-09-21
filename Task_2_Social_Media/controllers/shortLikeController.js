const { pool } = require("../config/db");


/* =========================================================
   TOGGLE SHORT LIKE
   POST /api/short-likes/:shortId
========================================================= */

const toggleShortLike = async (req, res) => {

    try {

        const shortId =
            Number(req.params.shortId);

        const userId =
            Number(req.userId);


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        if (!shortId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Short ID."

            });

        }


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        /* -----------------------------------------
           CHECK SHORT
        ----------------------------------------- */

        const [shorts] =
            await pool.execute(
                `
                    SELECT id
                    FROM shorts
                    WHERE id = ?
                `,
                [shortId]
            );


        if (shorts.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Short not found."

            });

        }


        /* -----------------------------------------
           CHECK EXISTING LIKE
        ----------------------------------------- */

        const [existingLike] =
            await pool.execute(
                `
                    SELECT id
                    FROM short_likes

                    WHERE short_id = ?
                    AND user_id = ?
                `,
                [
                    shortId,
                    userId
                ]
            );


        let liked;


        /* -----------------------------------------
           UNLIKE
        ----------------------------------------- */

        if (existingLike.length > 0) {

            await pool.execute(
                `
                    DELETE FROM short_likes

                    WHERE short_id = ?
                    AND user_id = ?
                `,
                [
                    shortId,
                    userId
                ]
            );

            liked = false;

        }


        /* -----------------------------------------
           LIKE
        ----------------------------------------- */

        else {

            await pool.execute(
                `
                    INSERT INTO short_likes
                    (
                        short_id,
                        user_id
                    )

                    VALUES (?, ?)
                `,
                [
                    shortId,
                    userId
                ]
            );

            liked = true;

        }


        /* -----------------------------------------
           GET UPDATED COUNT
        ----------------------------------------- */

        const [countResult] =
            await pool.execute(
                `
                    SELECT
                        COUNT(*) AS like_count

                    FROM short_likes

                    WHERE short_id = ?
                `,
                [shortId]
            );


        const likeCount =
            Number(
                countResult[0].like_count
            );


        /* -----------------------------------------
           SYNC SHORTS TABLE
        ----------------------------------------- */

        await pool.execute(
            `
                UPDATE shorts

                SET likes_count = ?

                WHERE id = ?
            `,
            [
                likeCount,
                shortId
            ]
        );


        return res.json({

            success: true,

            liked,

            like_count:
                likeCount,

            message:
                liked
                    ? "Short liked"
                    : "Short unliked"

        });


    } catch (error) {

        console.error(
            "Toggle Short like error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Server error while updating Short like."

        });

    }

};


/* =========================================================
   GET SHORT LIKE STATUS + COUNT
   GET /api/short-likes/:shortId
========================================================= */

const getShortLikeStatus = async (req, res) => {

    try {

        const shortId =
            Number(req.params.shortId);

        const userId =
            Number(req.userId);


        if (!shortId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Short ID."

            });

        }


        /* -----------------------------------------
           CHECK SHORT
        ----------------------------------------- */

        const [shorts] =
            await pool.execute(
                `
                    SELECT id
                    FROM shorts
                    WHERE id = ?
                `,
                [shortId]
            );


        if (shorts.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Short not found."

            });

        }


        /* -----------------------------------------
           COUNT
        ----------------------------------------- */

        const [countResult] =
            await pool.execute(
                `
                    SELECT
                        COUNT(*) AS like_count

                    FROM short_likes

                    WHERE short_id = ?
                `,
                [shortId]
            );


        const likeCount =
            Number(
                countResult[0].like_count
            );


        /* -----------------------------------------
           CURRENT USER STATUS
        ----------------------------------------- */

        const [existingLike] =
            await pool.execute(
                `
                    SELECT id

                    FROM short_likes

                    WHERE short_id = ?
                    AND user_id = ?
                `,
                [
                    shortId,
                    userId
                ]
            );


        return res.json({

            success: true,

            liked:
                existingLike.length > 0,

            like_count:
                likeCount

        });


    } catch (error) {

        console.error(
            "Get Short like status error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Server error while getting Short likes."

        });

    }

};


module.exports = {

    toggleShortLike,

    getShortLikeStatus

};