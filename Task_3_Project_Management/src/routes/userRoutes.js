const express = require("express");

const {
    searchUsers,
    getUserProfile
} = require("../controllers/userController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/search",
    searchUsers
);

router.get(
    "/:id",
    getUserProfile
);

module.exports = router;