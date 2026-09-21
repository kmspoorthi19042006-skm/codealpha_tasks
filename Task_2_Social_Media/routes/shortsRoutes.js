const express = require("express");

const {
    getShorts,
    createShort,
    deleteShort
} = require("../controllers/shortsController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Get shorts
router.get("/", getShorts);

// Create short
router.post("/", createShort);

// Delete own short
router.delete("/:id", deleteShort);

module.exports = router;