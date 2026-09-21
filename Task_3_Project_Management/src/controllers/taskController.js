const pool = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

async function getMembership(projectId, userId) {
    const [rows] = await pool.query(
        `
        SELECT
            pm.id,
            pm.role,
            p.owner_id
        FROM project_members pm
        INNER JOIN projects p
            ON p.id = pm.project_id
        WHERE pm.project_id = ?
          AND pm.user_id = ?
        LIMIT 1
        `,
        [projectId, userId]
    );

    return rows[0] || null;
}

async function getTaskById(taskId) {
    const [rows] = await pool.query(
        `
        SELECT
            t.*,

            creator.full_name AS creator_name,
            creator.username AS creator_username,
            creator.avatar_color AS creator_avatar_color,

            assignee.full_name AS assignee_name,
            assignee.username AS assignee_username,
            assignee.avatar_color AS assignee_avatar_color,

            p.name AS project_name

        FROM tasks t

        INNER JOIN users creator
            ON creator.id = t.creator_id

        LEFT JOIN users assignee
            ON assignee.id = t.assignee_id

        INNER JOIN projects p
            ON p.id = t.project_id

        WHERE t.id = ?

        LIMIT 1
        `,
        [taskId]
    );

    return rows[0] || null;
}

function cleanTask(task) {
    if (!task) return null;

    return {
        ...task,
        id: Number(task.id),
        project_id: Number(task.project_id),
        creator_id: Number(task.creator_id),
        assignee_id:
            task.assignee_id !== null &&
            task.assignee_id !== undefined
                ? Number(task.assignee_id)
                : null,
        position: Number(task.position)
    };
}

// =====================================================
// CREATE TASK
// =====================================================

async function createTask(req, res) {
    try {
        const userId = req.user.id;

        const {
            project_id,
            title,
            description,
            assignee_id,
            status = "todo",
            priority = "medium",
            deadline
        } = req.body;

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        if (title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message:
                    "Task title cannot exceed 200 characters"
            });
        }

        const validStatuses = [
            "todo",
            "in_progress",
            "in_review",
            "done"
        ];

        const validPriorities = [
            "low",
            "medium",
            "high",
            "urgent"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status"
            });
        }

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task priority"
            });
        }

        const membership = await getMembership(
            project_id,
            userId
        );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this project"
            });
        }

        let finalAssignee = null;

        if (assignee_id) {
            const assigneeMembership =
                await getMembership(
                    project_id,
                    assignee_id
                );

            if (!assigneeMembership) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Assignee must be a member of this project"
                });
            }

            finalAssignee = Number(assignee_id);
        }

        const [positionRows] = await pool.query(
            `
            SELECT COALESCE(MAX(position), -1) + 1 AS next_position
            FROM tasks
            WHERE project_id = ?
              AND status = ?
            `,
            [project_id, status]
        );

        const position =
            Number(positionRows[0].next_position);

        const [result] = await pool.query(
            `
            INSERT INTO tasks (
                project_id,
                creator_id,
                assignee_id,
                title,
                description,
                status,
                priority,
                position,
                deadline
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                project_id,
                userId,
                finalAssignee,
                title.trim(),
                description
                    ? description.trim()
                    : null,
                status,
                priority,
                position,
                deadline || null
            ]
        );

        const taskId = result.insertId;

        await pool.query(
            `
            INSERT INTO project_activity (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                project_id,
                userId,
                "task_created",
                `created task "${title.trim()}"`,
                taskId
            ]
        );

        if (
            finalAssignee &&
            finalAssignee !== userId
        ) {
            await pool.query(
                `
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    body,
                    project_id,
                    task_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    finalAssignee,
                    "task_assigned",
                    "New task assigned",
                    `You were assigned "${title.trim()}"`,
                    project_id,
                    taskId
                ]
            );
        }

        const task = cleanTask(
            await getTaskById(taskId)
        );

        if (req.io) {
            req.io
                .to(`project:${project_id}`)
                .emit(
                    "task:created",
                    task
                );
        }

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        console.error(
            "Create task error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
}

// =====================================================
// GET TASKS
// =====================================================

async function getTasks(req, res) {
    try {
        const userId = req.user.id;

        const projectId =
            req.query.project_id
                ? Number(req.query.project_id)
                : null;

        const assigneeId =
            req.query.assignee_id
                ? Number(req.query.assignee_id)
                : null;

        const status = req.query.status;

        const validStatuses = [
            "todo",
            "in_progress",
            "in_review",
            "done"
        ];

        // =================================================
        // MY TASKS
        // /tasks?assignee_id=2
        // =================================================

        if (assigneeId) {

            // Users can only request their own
            // assigned tasks.

            if (assigneeId !== Number(userId)) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only view your own assigned tasks"
                });
            }

            let query = `
                SELECT
                    t.*,

                    creator.full_name AS creator_name,
                    creator.username AS creator_username,
                    creator.avatar_color AS creator_avatar_color,

                    assignee.full_name AS assignee_name,
                    assignee.username AS assignee_username,
                    assignee.avatar_color AS assignee_avatar_color,

                    p.name AS project_name,
                    p.color AS project_color

                FROM tasks t

                INNER JOIN users creator
                    ON creator.id = t.creator_id

                LEFT JOIN users assignee
                    ON assignee.id = t.assignee_id

                INNER JOIN projects p
                    ON p.id = t.project_id

                WHERE t.assignee_id = ?
            `;

            const params = [assigneeId];

            if (
                status &&
                validStatuses.includes(status)
            ) {
                query += `
                    AND t.status = ?
                `;

                params.push(status);
            }

            query += `
                ORDER BY
                    FIELD(
                        t.status,
                        'todo',
                        'in_progress',
                        'in_review',
                        'done'
                    ),
                    t.deadline IS NULL,
                    t.deadline ASC,
                    t.created_at DESC
            `;

            const [rows] =
                await pool.query(
                    query,
                    params
                );

            const tasks =
                rows.map(cleanTask);

            return res.json({
                success: true,
                tasks
            });
        }

        // =================================================
        // PROJECT TASKS
        // /tasks?project_id=1
        // =================================================

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message:
                    "project_id or assignee_id is required"
            });
        }

        const membership =
            await getMembership(
                projectId,
                userId
            );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this project"
            });
        }

        let query = `
            SELECT
                t.*,

                creator.full_name AS creator_name,
                creator.username AS creator_username,
                creator.avatar_color AS creator_avatar_color,

                assignee.full_name AS assignee_name,
                assignee.username AS assignee_username,
                assignee.avatar_color AS assignee_avatar_color,

                p.name AS project_name,
                p.color AS project_color

            FROM tasks t

            INNER JOIN users creator
                ON creator.id = t.creator_id

            LEFT JOIN users assignee
                ON assignee.id = t.assignee_id

            INNER JOIN projects p
                ON p.id = t.project_id

            WHERE t.project_id = ?
        `;

        const params = [projectId];

        if (
            status &&
            validStatuses.includes(status)
        ) {
            query += `
                AND t.status = ?
            `;

            params.push(status);
        }

        query += `
            ORDER BY
                FIELD(
                    t.status,
                    'todo',
                    'in_progress',
                    'in_review',
                    'done'
                ),
                t.position ASC,
                t.created_at DESC
        `;

        const [rows] =
            await pool.query(
                query,
                params
            );

        const tasks =
            rows.map(cleanTask);

        return res.json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error(
            "Get tasks error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
}

// =====================================================
// GET SINGLE TASK
// =====================================================

async function getTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = Number(req.params.id);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID"
            });
        }

        const task =
            await getTaskById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const membership =
            await getMembership(
                task.project_id,
                userId
            );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this task"
            });
        }

        return res.json({
            success: true,
            task: cleanTask(task)
        });

    } catch (error) {
        console.error(
            "Get task error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch task"
        });
    }
}

// =====================================================
// UPDATE TASK
// =====================================================

async function updateTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = Number(req.params.id);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID"
            });
        }

        const existingTask =
            await getTaskById(taskId);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const membership =
            await getMembership(
                existingTask.project_id,
                userId
            );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this task"
            });
        }

        const {
            title,
            description,
            assignee_id,
            status,
            priority,
            position,
            deadline
        } = req.body;

        const validStatuses = [
            "todo",
            "in_progress",
            "in_review",
            "done"
        ];

        const validPriorities = [
            "low",
            "medium",
            "high",
            "urgent"
        ];

        const newTitle =
            title !== undefined
                ? title.trim()
                : existingTask.title;

        if (!newTitle) {
            return res.status(400).json({
                success: false,
                message:
                    "Task title cannot be empty"
            });
        }

        if (newTitle.length > 200) {
            return res.status(400).json({
                success: false,
                message:
                    "Task title cannot exceed 200 characters"
            });
        }

        const newDescription =
            description !== undefined
                ? (
                    description
                        ? description.trim()
                        : null
                )
                : existingTask.description;

        const newStatus =
            status !== undefined
                ? status
                : existingTask.status;

        const newPriority =
            priority !== undefined
                ? priority
                : existingTask.priority;

        const newPosition =
            position !== undefined
                ? Number(position)
                : existingTask.position;

        const newDeadline =
            deadline !== undefined
                ? (deadline || null)
                : existingTask.deadline;

        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status"
            });
        }

        if (!validPriorities.includes(newPriority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task priority"
            });
        }

        if (
            !Number.isFinite(newPosition) ||
            newPosition < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid task position"
            });
        }

        let newAssignee =
            existingTask.assignee_id;

        if (assignee_id !== undefined) {

            if (
                assignee_id === null ||
                assignee_id === "" ||
                assignee_id === 0
            ) {
                newAssignee = null;

            } else {

                const assigneeMembership =
                    await getMembership(
                        existingTask.project_id,
                        Number(assignee_id)
                    );

                if (!assigneeMembership) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Assignee must be a project member"
                    });
                }

                newAssignee =
                    Number(assignee_id);
            }
        }

        await pool.query(
            `
            UPDATE tasks
            SET
                title = ?,
                description = ?,
                assignee_id = ?,
                status = ?,
                priority = ?,
                position = ?,
                deadline = ?
            WHERE id = ?
            `,
            [
                newTitle,
                newDescription,
                newAssignee,
                newStatus,
                newPriority,
                newPosition,
                newDeadline,
                taskId
            ]
        );

        let activityMessage =
            `updated task "${newTitle}"`;

        if (
            existingTask.status !== newStatus
        ) {
            activityMessage =
                `moved "${newTitle}" from ${existingTask.status} to ${newStatus}`;
        }

        await pool.query(
            `
            INSERT INTO project_activity (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                existingTask.project_id,
                userId,
                "task_updated",
                activityMessage,
                taskId
            ]
        );

        if (
            newAssignee &&
            newAssignee !== existingTask.assignee_id &&
            newAssignee !== userId
        ) {
            await pool.query(
                `
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    body,
                    project_id,
                    task_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    newAssignee,
                    "task_assigned",
                    "Task assigned to you",
                    `You were assigned "${newTitle}"`,
                    existingTask.project_id,
                    taskId
                ]
            );
        }

        const updatedTask =
            cleanTask(
                await getTaskById(taskId)
            );

        if (req.io) {
            req.io
                .to(
                    `project:${existingTask.project_id}`
                )
                .emit(
                    "task:updated",
                    updatedTask
                );
        }

        return res.json({
            success: true,
            message:
                "Task updated successfully",
            task: updatedTask
        });

    } catch (error) {
        console.error(
            "Update task error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update task"
        });
    }
}

// =====================================================
// DELETE TASK
// =====================================================

async function deleteTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = Number(req.params.id);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID"
            });
        }

        const task =
            await getTaskById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const membership =
            await getMembership(
                task.project_id,
                userId
            );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this task"
            });
        }

        const canDelete =
            task.creator_id === userId ||
            membership.owner_id === userId ||
            membership.role === "admin";

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to delete this task"
            });
        }

        await pool.query(
            `
            DELETE FROM tasks
            WHERE id = ?
            `,
            [taskId]
        );

        await pool.query(
            `
            INSERT INTO project_activity (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                task.project_id,
                userId,
                "task_deleted",
                `deleted task "${task.title}"`,
                taskId
            ]
        );

        if (req.io) {
            req.io
                .to(
                    `project:${task.project_id}`
                )
                .emit(
                    "task:deleted",
                    {
                        id: taskId,
                        project_id:
                            task.project_id
                    }
                );
        }

        return res.json({
            success: true,
            message:
                "Task deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete task error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete task"
        });
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask
};