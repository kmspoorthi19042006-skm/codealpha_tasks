const pool = require("../config/db");

// =====================================================
// SEARCH USERS
// =====================================================

async function searchUsers(req, res) {
    try {
        const userId = Number(req.user.id);

        const q =
            typeof req.query.q === "string"
                ? req.query.q.trim()
                : "";

        if (!q) {
            return res.json({
                success: true,
                users: []
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                id,
                full_name,
                username,
                email,
                avatar_color
            FROM users
            WHERE id <> ?
              AND (
                    full_name LIKE ?
                    OR username LIKE ?
                    OR email LIKE ?
              )
            ORDER BY full_name ASC
            LIMIT 10
            `,
            [
                userId,
                `%${q}%`,
                `%${q}%`,
                `%${q}%`
            ]
        );

        return res.json({
            success: true,
            users: rows.map(user => ({
                ...user,
                id: Number(user.id)
            }))
        });

    } catch (error) {

        console.error(
            "Search users error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to search users"
        });
    }
}


// =====================================================
// GET USER PROFILE
// =====================================================

async function getUserProfile(req, res) {

    try {

        const userId =
            Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }


        // =============================================
        // USER
        // =============================================

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    username,
                    email,
                    bio,
                    profile_picture,
                    avatar_color,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (!rows.length) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        const user =
            rows[0];


        // =============================================
        // PROJECT COUNT
        // =============================================
        /*
         * Count a project when:
         *
         * 1. The user owns it
         * OR
         *
         * 2. The user is a project member.
         *
         * DISTINCT prevents double counting.
         */

        const [projectRows] =
            await pool.query(
                `
                SELECT COUNT(DISTINCT p.id) AS project_count
                FROM projects p
                LEFT JOIN project_members pm
                    ON pm.project_id = p.id
                   AND pm.user_id = ?
                WHERE
                    p.owner_id = ?
                    OR pm.user_id = ?
                `,
                [
                    userId,
                    userId,
                    userId
                ]
            );


        // =============================================
        // ASSIGNED TASK COUNT
        // =============================================

        const [taskRows] =
            await pool.query(
                `
                SELECT COUNT(*) AS assigned_task_count
                FROM tasks
                WHERE assignee_id = ?
                `,
                [userId]
            );


        const projectCount =
            Number(
                projectRows[0]?.project_count || 0
            );

        const assignedTaskCount =
            Number(
                taskRows[0]?.assigned_task_count || 0
            );


        // =============================================
        // RESPONSE
        // =============================================

        return res.json({

            success: true,

            user: {

                ...user,

                id:
                    Number(user.id),

                project_count:
                    projectCount,

                assigned_task_count:
                    assignedTaskCount
            }
        });

    } catch (error) {

        console.error(
            "Get user profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch user profile"
        });
    }
}


module.exports = {
    searchUsers,
    getUserProfile
};