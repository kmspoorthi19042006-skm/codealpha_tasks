const pool = require("../config/db");

const allowedStatuses = [
    "planning",
    "active",
    "completed",
    "archived"
];


// ========================================
// CREATE PROJECT
// ========================================

async function createProject(req, res) {
    try {
        const {
            name,
            description,
            status,
            start_date,
            deadline,
            color
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        const projectStatus =
            status && allowedStatuses.includes(status)
                ? status
                : "planning";

        const projectColor = color || "#111827";

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [projectResult] = await connection.query(
                `INSERT INTO projects
                (
                    owner_id,
                    name,
                    description,
                    status,
                    start_date,
                    deadline,
                    color
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user.id,
                    name.trim(),
                    description?.trim() || null,
                    projectStatus,
                    start_date || null,
                    deadline || null,
                    projectColor
                ]
            );

            const projectId = projectResult.insertId;

            await connection.query(
                `INSERT INTO project_members
                (
                    project_id,
                    user_id,
                    role
                )
                VALUES (?, ?, 'owner')`,
                [projectId, req.user.id]
            );

            await connection.query(
                `INSERT INTO project_activity
                (
                    project_id,
                    user_id,
                    activity_type,
                    message,
                    entity_id
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    projectId,
                    req.user.id,
                    "project_created",
                    `Created project "${name.trim()}"`,
                    projectId
                ]
            );

            await connection.commit();

            const [projects] = await pool.query(
                `SELECT
                    p.id,
                    p.owner_id,
                    p.name,
                    p.description,
                    p.status,
                    p.start_date,
                    p.deadline,
                    p.color,
                    p.created_at,
                    p.updated_at,
                    u.full_name AS owner_name,
                    u.username AS owner_username
                 FROM projects p
                 JOIN users u ON u.id = p.owner_id
                 WHERE p.id = ?`,
                [projectId]
            );

            return res.status(201).json({
                success: true,
                message: "Project created successfully",
                project: projects[0]
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Create project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create project"
        });
    }
}


// ========================================
// GET ALL USER PROJECTS
// ========================================

async function getProjects(req, res) {
    try {
        const [projects] = await pool.query(
            `SELECT
                p.id,
                p.owner_id,
                p.name,
                p.description,
                p.status,
                p.start_date,
                p.deadline,
                p.color,
                p.created_at,
                p.updated_at,
                pm.role,

                (
                    SELECT COUNT(*)
                    FROM project_members pm2
                    WHERE pm2.project_id = p.id
                ) AS member_count,

                (
                    SELECT COUNT(*)
                    FROM tasks t
                    WHERE t.project_id = p.id
                ) AS task_count,

                (
                    SELECT COUNT(*)
                    FROM tasks t
                    WHERE t.project_id = p.id
                    AND t.status = 'done'
                ) AS completed_task_count

             FROM projects p

             JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?

             ORDER BY p.updated_at DESC`,
            [req.user.id]
        );

        return res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve projects"
        });
    }
}


// ========================================
// GET SINGLE PROJECT
// ========================================

async function getProject(req, res) {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        const [projects] = await pool.query(
            `SELECT
                p.id,
                p.owner_id,
                p.name,
                p.description,
                p.status,
                p.start_date,
                p.deadline,
                p.color,
                p.created_at,
                p.updated_at,
                u.full_name AS owner_name,
                u.username AS owner_username

             FROM projects p

             JOIN users u
                ON u.id = p.owner_id

             JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?

             WHERE p.id = ?

             LIMIT 1`,
            [req.user.id, projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const project = projects[0];

        const [members] = await pool.query(
            `SELECT
                pm.id,
                pm.user_id,
                pm.role,
                pm.joined_at,
                u.full_name,
                u.username,
                u.email,
                u.avatar_color

             FROM project_members pm

             JOIN users u
                ON u.id = pm.user_id

             WHERE pm.project_id = ?

             ORDER BY
                CASE
                    WHEN pm.role = 'owner' THEN 1
                    WHEN pm.role = 'admin' THEN 2
                    ELSE 3
                END,
                u.full_name`,
            [projectId]
        );

        return res.json({
            success: true,
            project,
            members
        });

    } catch (error) {
        console.error("Get project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve project"
        });
    }
}


// ========================================
// UPDATE PROJECT
// ========================================

async function updateProject(req, res) {
    try {
        const projectId = Number(req.params.id);

        const {
            name,
            description,
            status,
            start_date,
            deadline,
            color
        } = req.body;

        if (!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status"
            });
        }

        const [access] = await pool.query(
            `SELECT role
             FROM project_members
             WHERE project_id = ?
             AND user_id = ?
             LIMIT 1`,
            [projectId, req.user.id]
        );

        if (access.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project"
            });
        }

        if (!["owner", "admin"].includes(access[0].role)) {
            return res.status(403).json({
                success: false,
                message: "Only project owners and admins can update the project"
            });
        }

        const [existing] = await pool.query(
            `SELECT *
             FROM projects
             WHERE id = ?
             LIMIT 1`,
            [projectId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const current = existing[0];

        await pool.query(
            `UPDATE projects
             SET
                name = ?,
                description = ?,
                status = ?,
                start_date = ?,
                deadline = ?,
                color = ?
             WHERE id = ?`,
            [
                name?.trim() || current.name,
                description !== undefined
                    ? description?.trim() || null
                    : current.description,
                status || current.status,
                start_date !== undefined
                    ? start_date || null
                    : current.start_date,
                deadline !== undefined
                    ? deadline || null
                    : current.deadline,
                color || current.color,
                projectId
            ]
        );

        await pool.query(
            `INSERT INTO project_activity
            (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                projectId,
                req.user.id,
                "project_updated",
                `Updated project "${name?.trim() || current.name}"`,
                projectId
            ]
        );

        if (req.io) {
            req.io
                .to(`project:${projectId}`)
                .emit("project:updated", {
                    projectId
                });
        }

        return res.json({
            success: true,
            message: "Project updated successfully"
        });

    } catch (error) {
        console.error("Update project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update project"
        });
    }
}


// ========================================
// DELETE PROJECT
// ========================================

async function deleteProject(req, res) {
    try {
        const projectId = Number(req.params.id);

        const [projects] = await pool.query(
            `SELECT id
             FROM projects
             WHERE id = ?
             AND owner_id = ?
             LIMIT 1`,
            [projectId, req.user.id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you are not the owner"
            });
        }

        await pool.query(
            `DELETE FROM projects
             WHERE id = ?`,
            [projectId]
        );

        if (req.io) {
            req.io
                .to(`project:${projectId}`)
                .emit("project:deleted", {
                    projectId
                });
        }

        return res.json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("Delete project error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete project"
        });
    }
}


// ========================================
// ADD MEMBER
// ========================================

async function addMember(req, res) {
    try {
        const projectId = Number(req.params.id);

        const {
            user_id,
            role
        } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const memberRole =
            ["admin", "member"].includes(role)
                ? role
                : "member";

        const [access] = await pool.query(
            `SELECT role
             FROM project_members
             WHERE project_id = ?
             AND user_id = ?
             LIMIT 1`,
            [projectId, req.user.id]
        );

        if (
            access.length === 0 ||
            !["owner", "admin"].includes(access[0].role)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only owners and admins can add members"
            });
        }

        const [users] = await pool.query(
            `SELECT
                id,
                full_name,
                username,
                email,
                avatar_color
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const [existing] = await pool.query(
            `SELECT id
             FROM project_members
             WHERE project_id = ?
             AND user_id = ?
             LIMIT 1`,
            [projectId, user_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User is already a project member"
            });
        }

        await pool.query(
            `INSERT INTO project_members
            (
                project_id,
                user_id,
                role
            )
            VALUES (?, ?, ?)`,
            [projectId, user_id, memberRole]
        );

        await pool.query(
            `INSERT INTO notifications
            (
                user_id,
                type,
                title,
                body,
                project_id
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                "project_invite",
                "Added to a project",
                "You have been added to a FlowPilot project.",
                projectId
            ]
        );

        await pool.query(
            `INSERT INTO project_activity
            (
                project_id,
                user_id,
                activity_type,
                message,
                entity_id
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                projectId,
                req.user.id,
                "member_added",
                `Added ${users[0].full_name} to the project`,
                user_id
            ]
        );

        if (req.io) {
            req.io
                .to(`project:${projectId}`)
                .emit("member:added", {
                    projectId,
                    user: users[0],
                    role: memberRole
                });
        }

        return res.status(201).json({
            success: true,
            message: "Member added successfully",
            member: {
                ...users[0],
                role: memberRole
            }
        });

    } catch (error) {
        console.error("Add member error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add member"
        });
    }
}


// ========================================
// REMOVE MEMBER
// ========================================

async function removeMember(req, res) {
    try {
        const projectId = Number(req.params.id);
        const userId = Number(req.params.userId);

        const [access] = await pool.query(
            `SELECT role
             FROM project_members
             WHERE project_id = ?
             AND user_id = ?
             LIMIT 1`,
            [projectId, req.user.id]
        );

        if (
            access.length === 0 ||
            !["owner", "admin"].includes(access[0].role)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only owners and admins can remove members"
            });
        }

        const [target] = await pool.query(
            `SELECT role
             FROM project_members
             WHERE project_id = ?
             AND user_id = ?
             LIMIT 1`,
            [projectId, userId]
        );

        if (target.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (target[0].role === "owner") {
            return res.status(400).json({
                success: false,
                message: "The project owner cannot be removed"
            });
        }

        await pool.query(
            `DELETE FROM project_members
             WHERE project_id = ?
             AND user_id = ?`,
            [projectId, userId]
        );

        if (req.io) {
            req.io
                .to(`project:${projectId}`)
                .emit("member:removed", {
                    projectId,
                    userId
                });
        }

        return res.json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (error) {
        console.error("Remove member error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove member"
        });
    }
}


// ========================================
// EXPORTS
// ========================================

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember
};