const pool = require("../config/db");

// =====================================================
// GET NOTIFICATIONS
// =====================================================

async function getNotifications(req, res) {
    try {
        const userId = req.user.id;

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 30,
                1
            ),
            100
        );

        const [rows] = await pool.query(
            `
            SELECT
                n.id,
                n.type,
                n.title,
                n.body,
                n.project_id,
                n.task_id,
                n.is_read,
                n.created_at,

                p.name AS project_name,

                t.title AS task_title

            FROM notifications n

            LEFT JOIN projects p
                ON p.id = n.project_id

            LEFT JOIN tasks t
                ON t.id = n.task_id

            WHERE n.user_id = ?

            ORDER BY n.created_at DESC

            LIMIT ${limit}
            `,
            [userId]
        );

        return res.json({
            success: true,
            notifications: rows.map(item => ({
                ...item,
                id: Number(item.id),
                project_id:
                    item.project_id
                        ? Number(item.project_id)
                        : null,
                task_id:
                    item.task_id
                        ? Number(item.task_id)
                        : null,
                is_read:
                    Boolean(item.is_read)
            }))
        });

    } catch (error) {
        console.error(
            "Get notifications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
}

// =====================================================
// UNREAD COUNT
// =====================================================

async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM notifications
            WHERE user_id = ?
              AND is_read = FALSE
            `,
            [userId]
        );

        return res.json({
            success: true,
            count: Number(rows[0].count)
        });

    } catch (error) {
        console.error(
            "Unread notification count error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notification count"
        });
    }
}

// =====================================================
// MARK ONE AS READ
// =====================================================

async function markAsRead(req, res) {
    try {
        const userId = req.user.id;
        const notificationId =
            Number(req.params.id);

        await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ?
              AND user_id = ?
            `,
            [
                notificationId,
                userId
            ]
        );

        return res.json({
            success: true,
            message:
                "Notification marked as read"
        });

    } catch (error) {
        console.error(
            "Mark notification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update notification"
        });
    }
}

// =====================================================
// MARK ALL AS READ
// =====================================================

async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;

        await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = ?
              AND is_read = FALSE
            `,
            [userId]
        );

        return res.json({
            success: true,
            message:
                "All notifications marked as read"
        });

    } catch (error) {
        console.error(
            "Mark all notifications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update notifications"
        });
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};