const express = require("express");

const {
    getComments,
    createComment,
    deleteComment
} = require("../controllers/commentController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/task/:taskId",
    getComments
);

router.post(
    "/task/:taskId",
    createComment
);

router.delete(
    "/:commentId",
    deleteComment
);

module.exports = router;