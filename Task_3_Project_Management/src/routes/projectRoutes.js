const express = require("express");

const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getProjects);

router.post("/", createProject);

router.get("/:id", getProject);

router.put("/:id", updateProject);

router.delete("/:id", deleteProject);

router.post("/:id/members", addMember);

router.delete(
    "/:id/members/:userId",
    removeMember
);

module.exports = router;