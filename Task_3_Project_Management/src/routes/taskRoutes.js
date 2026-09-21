const express = require("express");

const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks?project_id=1
router.get("/", getTasks);

// POST /api/tasks
router.post("/", createTask);

// GET /api/tasks/1
router.get("/:id", getTask);

// PUT /api/tasks/1
router.put("/:id", updateTask);

// DELETE /api/tasks/1
router.delete("/:id", deleteTask);

module.exports = router;