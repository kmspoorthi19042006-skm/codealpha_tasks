const pool = require("../config/db");

/*
=====================================================
GET TASK ACCESS
=====================================================
*/
async function getTaskAccess(taskId, userId) {
    const [rows] = await pool.query(
        `
        SELECT
            t.id,
            t.project_id,
            t.creator_id,
            t.assignee_id,
            p.owner_id
        FROM tasks t
        INNER JOIN projects p
            ON p.id = t.project_id
        WHERE t.id = ?
        `,
        [taskId]
    );

    if (!rows.length) {
        return null;
    }

    const task = rows[0];

    const [memberRows] = await pool.query(
        `
        SELECT
            role
        FROM project_members
        WHERE project_id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [
            task.project_id,
            userId
        ]
    );

    const isMember =
        memberRows.length > 0;

    const isOwner =
        Number(task.owner_id) ===
        Number(userId);

    return {
        ...task,
        isMember,
        isOwner,
        role:
            memberRows[0]?.role ||
            null
    };
}


/*
=====================================================
GET COMMENTS
=====================================================
*/
async function getComments(req, res) {

    try {

        const taskId =
            Number(
                req.params.taskId
            );

        const userId =
            Number(
                req.user.id
            );

        if (!taskId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid task ID"
            });
        }

        const access =
            await getTaskAccess(
                taskId,
                userId
            );

        if (!access) {

            return res.status(404).json({
                success: false,
                message:
                    "Task not found"
            });
        }

        if (
            !access.isMember &&
            !access.isOwner
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this task"
            });
        }

        const [comments] =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.task_id,
                    c.user_id,
                    c.body,
                    c.created_at,

                    u.full_name,
                    u.username,
                    u.avatar_color

                FROM comments c

                INNER JOIN users u
                    ON u.id = c.user_id

                WHERE c.task_id = ?

                ORDER BY
                    c.created_at ASC
                `,
                [taskId]
            );

        return res.json({
            success: true,
            comments
        });

    } catch (error) {

        console.error(
            "Get comments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load comments"
        });
    }
}


/*
=====================================================
CREATE COMMENT
=====================================================
*/
async function createComment(req, res) {

    try {

        const taskId =
            Number(
                req.params.taskId
            );

        const userId =
            Number(
                req.user.id
            );

        const body =
            typeof req.body.body === "string"
                ? req.body.body.trim()
                : "";

        if (!taskId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid task ID"
            });
        }

        if (!body) {

            return res.status(400).json({
                success: false,
                message:
                    "Comment cannot be empty"
            });
        }

        if (body.length > 1000) {

            return res.status(400).json({
                success: false,
                message:
                    "Comment cannot exceed 1000 characters"
            });
        }


        /*
        =============================================
        CHECK TASK ACCESS
        =============================================
        */

        const access =
            await getTaskAccess(
                taskId,
                userId
            );

        if (!access) {

            return res.status(404).json({
                success: false,
                message:
                    "Task not found"
            });
        }

        if (
            !access.isMember &&
            !access.isOwner
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this task"
            });
        }


        /*
        =============================================
        CREATE COMMENT
        =============================================
        */

        const [result] =
            await pool.query(
                `
                INSERT INTO comments
                (
                    task_id,
                    user_id,
                    body
                )
                VALUES (?, ?, ?)
                `,
                [
                    taskId,
                    userId,
                    body
                ]
            );

        const commentId =
            result.insertId;


        /*
        =============================================
        GET CREATED COMMENT
        =============================================
        */

        const [commentRows] =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.task_id,
                    c.user_id,
                    c.body,
                    c.created_at,

                    u.full_name,
                    u.username,
                    u.avatar_color

                FROM comments c

                INNER JOIN users u
                    ON u.id = c.user_id

                WHERE c.id = ?

                LIMIT 1
                `,
                [commentId]
            );

        const comment =
            commentRows[0];


        /*
        =============================================
        PROJECT ACTIVITY
        =============================================
        */

        await pool.query(
            `
            INSERT INTO project_activity
            (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                access.project_id,
                userId,
                "comment_created",
                `${comment.full_name || comment.username || "A user"} commented on a task`,
                taskId
            ]
        );


        /*
        =============================================
        NOTIFICATION
        =============================================

        Notify the task assignee.

        Do NOT notify the commenter themselves.

        If the commenter is the assignee,
        no notification is created.

        =============================================
        */

        const assigneeId =
            access.assignee_id
                ? Number(
                    access.assignee_id
                )
                : null;

        if (
            assigneeId &&
            assigneeId !== userId
        ) {

            const commenterName =
                comment.full_name ||
                comment.username ||
                "A user";


            /*
            Get task title for
            a useful notification.
            */

            const [taskRows] =
                await pool.query(
                    `
                    SELECT
                        title
                    FROM tasks
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [taskId]
                );

            const taskTitle =
                taskRows[0]?.title ||
                "your task";


            await pool.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    type,
                    title,
                    body,
                    project_id,
                    task_id,
                    is_read
                )
                VALUES (?, ?, ?, ?, ?, ?, FALSE)
                `,
                [
                    assigneeId,
                    "comment",
                    "New comment on your task",
                    `${commenterName} commented on "${taskTitle}".`,
                    access.project_id,
                    taskId
                ]
            );


            /*
            =========================================
            REALTIME NOTIFICATION
            =========================================
            */

            if (req.io) {

                req.io.to(
                    `user:${assigneeId}`
                ).emit(
                    "notification:new",
                    {
                        type:
                            "comment",

                        title:
                            "New comment on your task",

                        body:
                            `${commenterName} commented on "${taskTitle}".`,

                        project_id:
                            access.project_id,

                        task_id:
                            taskId
                    }
                );
            }
        }


        /*
        =============================================
        REALTIME COMMENT EVENT
        =============================================
        */

        if (req.io) {

            req.io.to(
                `project:${access.project_id}`
            ).emit(
                "comment:new",
                {
                    comment,
                    project_id:
                        access.project_id,
                    task_id:
                        taskId
                }
            );
        }


        return res.status(201).json({
            success: true,
            message:
                "Comment added successfully",
            comment
        });

    } catch (error) {

        console.error(
            "Create comment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create comment"
        });
    }
}


/*
=====================================================
DELETE COMMENT
=====================================================
*/
async function deleteComment(req, res) {

    try {

        const commentId =
            Number(
                req.params.commentId
            );

        const userId =
            Number(
                req.user.id
            );

        if (!commentId) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid comment ID"
            });
        }


        /*
        =============================================
        GET COMMENT + PROJECT INFORMATION
        =============================================
        */

        const [rows] =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.task_id,
                    c.user_id,
                    c.body,

                    t.project_id,

                    p.owner_id

                FROM comments c

                INNER JOIN tasks t
                    ON t.id = c.task_id

                INNER JOIN projects p
                    ON p.id = t.project_id

                WHERE c.id = ?

                LIMIT 1
                `,
                [commentId]
            );

        if (!rows.length) {

            return res.status(404).json({
                success: false,
                message:
                    "Comment not found"
            });
        }

        const comment =
            rows[0];


        /*
        =============================================
        CHECK PROJECT ROLE
        =============================================
        */

        const [memberRows] =
            await pool.query(
                `
                SELECT
                    role
                FROM project_members
                WHERE project_id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [
                    comment.project_id,
                    userId
                ]
            );

        const isAuthor =
            Number(
                comment.user_id
            ) ===
            Number(userId);

        const isOwner =
            Number(
                comment.owner_id
            ) ===
            Number(userId);

        const isAdmin =
            memberRows[0]?.role ===
            "admin";


        /*
        =============================================
        ONLY AUTHOR / OWNER / ADMIN
        =============================================
        */

        if (
            !isAuthor &&
            !isOwner &&
            !isAdmin
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to delete this comment"
            });
        }


        /*
        =============================================
        DELETE
        =============================================
        */

        await pool.query(
            `
            DELETE FROM comments
            WHERE id = ?
            `,
            [commentId]
        );


        /*
        =============================================
        PROJECT ACTIVITY
        =============================================
        */

        await pool.query(
            `
            INSERT INTO project_activity
            (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                comment.project_id,
                userId,
                "comment_deleted",
                "A comment was deleted",
                comment.task_id
            ]
        );


        /*
        =============================================
        REALTIME DELETE EVENT
        =============================================
        */

        if (req.io) {

            req.io.to(
                `project:${comment.project_id}`
            ).emit(
                "comment:deleted",
                {
                    comment_id:
                        commentId,

                    project_id:
                        comment.project_id,

                    task_id:
                        comment.task_id
                }
            );
        }


        return res.json({
            success: true,
            message:
                "Comment deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete comment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete comment"
        });
    }
}


module.exports = {
    getComments,
    createComment,
    deleteComment
};