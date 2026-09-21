const { pool } = require("../config/db");


/* =========================================================
   HELPER — GET LOGGED-IN USER ID
========================================================= */

function getUserId(req) {

    return Number(
        req.user?.id ??
        req.user?.user_id ??
        req.user?.userId ??
        0
    );

}


/* =========================================================
   GET SHORTS
   GET /api/shorts
========================================================= */

const getShorts = async (req, res) => {

    try {

        const userId =
            getUserId(req);


        const limitValue =
            Number(req.query.limit) || 50;


        const limit =
            Math.min(
                Math.max(
                    limitValue,
                    1
                ),
                100
            );


        const category =
            String(
                req.query.category || ""
            ).trim();


         let query = `
    SELECT
        s.id,
        s.user_id,
        s.title,
        s.content,
        s.category,
        s.image_url,
        s.likes_count,
        s.created_at,

        u.name,
        u.username,
        u.profile_image,

        CASE
            WHEN sl.id IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS liked_by_me

    FROM shorts s

    INNER JOIN users u
        ON u.id = s.user_id

    LEFT JOIN short_likes sl
        ON sl.short_id = s.id
        AND sl.user_id = ?
`;

        const params = [userId];


        /* -----------------------------------------
           CATEGORY FILTER
        ----------------------------------------- */

        if (category) {

            query += `
                WHERE s.category = ?
            `;

            params.push(
                category
            );

        }


        /* -----------------------------------------
           ORDER
        ----------------------------------------- */

        query += `
            ORDER BY s.created_at DESC
            LIMIT ?
        `;

        params.push(
            limit
        );


        const [shorts] =
            await pool.execute(
                query,
                params
            );


        /*
           Convert numeric fields so the frontend
           receives clean values.
        */

        const formattedShorts =
            shorts.map(
                short => ({

                    ...short,

                    id:
                        Number(
                            short.id
                        ),

                    user_id:
                        Number(
                            short.user_id
                        ),

                    likes_count:
                        Number(
                            short.likes_count || 0
                        ),
                        liked_by_me:
    Boolean(
        short.liked_by_me
    ),

                    is_owner:
                        Number(
                            short.user_id
                        ) === userId

                })
            );


        return res.json({

            success: true,

            count:
                formattedShorts.length,

            shorts:
                formattedShorts

        });


    } catch (error) {

        console.error(
            "Get shorts error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load Shorts."

        });

    }

};


/* =========================================================
   CREATE SHORT
   POST /api/shorts
========================================================= */

const createShort = async (req, res) => {

    try {

        const userId =
            getUserId(req);


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        const {
            title,
            content,
            category,
            image_url
        } = req.body;


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        const cleanTitle =
            title
                ? String(title).trim()
                : "";


        const cleanContent =
            content
                ? String(content).trim()
                : "";


        const cleanCategory =
            category
                ? String(category).trim()
                : "";


        const cleanImageUrl =
            image_url
                ? String(image_url).trim()
                : null;


        if (!cleanContent) {

            return res.status(400).json({

                success: false,

                message:
                    "Short content is required."

            });

        }


        if (
            cleanContent.length >
            1000
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Short content cannot exceed 1000 characters."

            });

        }


        if (
            cleanTitle.length >
            200
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Short title cannot exceed 200 characters."

            });

        }


        const allowedCategories = [

            "job",
            "internship",
            "hackathon",
            "scholarship",
            "education",
            "aptitude",
            "coding",
            "riddle",
            "joke",
            "news"

        ];


        if (
            !allowedCategories.includes(
                cleanCategory
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Short category."

            });

        }


        /* -----------------------------------------
           INSERT
        ----------------------------------------- */

        const [result] =
            await pool.execute(
                `
                    INSERT INTO shorts
                    (
                        user_id,
                        title,
                        content,
                        category,
                        image_url,
                        likes_count
                    )
                    VALUES
                    (?, ?, ?, ?, ?, 0)
                `,
                [
                    userId,
                    cleanTitle || null,
                    cleanContent,
                    cleanCategory,
                    cleanImageUrl
                ]
            );


        const shortId =
            result.insertId;


        /* -----------------------------------------
           FETCH CREATED SHORT
        ----------------------------------------- */

        const [rows] =
            await pool.execute(
                `
                    SELECT
                        s.id,
                        s.user_id,
                        s.title,
                        s.content,
                        s.category,
                        s.image_url,
                        s.likes_count,
                        s.created_at,

                        u.name,
                        u.username,
                        u.profile_image

                    FROM shorts s

                    INNER JOIN users u
                        ON u.id = s.user_id

                    WHERE s.id = ?
                `,
                [shortId]
            );


        if (!rows.length) {

            return res.status(201).json({

                success: true,

                message:
                    "Short created successfully.",

                short: {

                    id:
                        shortId,

                    user_id:
                        userId,

                    title:
                        cleanTitle || null,

                    content:
                        cleanContent,

                    category:
                        cleanCategory,

                    image_url:
                        cleanImageUrl,

                    likes_count:
                        0

                }

            });

        }


        const createdShort =
            rows[0];


        createdShort.id =
            Number(
                createdShort.id
            );


        createdShort.user_id =
            Number(
                createdShort.user_id
            );


        createdShort.likes_count =
            Number(
                createdShort.likes_count || 0
            );


        createdShort.is_owner =
            true;


        return res.status(201).json({

            success: true,

            message:
                "Short created successfully.",

            short:
                createdShort

        });


    } catch (error) {

        console.error(
            "Create short error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create Short."

        });

    }

};


/* =========================================================
   DELETE SHORT
   DELETE /api/shorts/:id
========================================================= */

const deleteShort = async (req, res) => {

    try {

        const userId =
            getUserId(req);


        const shortId =
            Number(
                req.params.id
            );


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        if (!shortId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Short ID."

            });

        }


        /* -----------------------------------------
           CHECK OWNERSHIP
        ----------------------------------------- */

        const [rows] =
            await pool.execute(
                `
                    SELECT
                        id,
                        user_id

                    FROM shorts

                    WHERE id = ?
                `,
                [shortId]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Short not found."

            });

        }


        if (
            Number(
                rows[0].user_id
            ) !== userId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You can only delete your own Shorts."

            });

        }


        /* -----------------------------------------
           DELETE
        ----------------------------------------- */

        await pool.execute(
            `
                DELETE FROM shorts
                WHERE id = ?
                AND user_id = ?
            `,
            [
                shortId,
                userId
            ]
        );


        return res.json({

            success: true,

            message:
                "Short deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete short error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to delete Short."

        });

    }

};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getShorts,

    createShort,

    deleteShort

};