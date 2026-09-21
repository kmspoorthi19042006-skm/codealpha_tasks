const express = require("express");

const {
    getQuizQuestions,
    submitQuizAnswer,
    getQuizStats
} = require("../controllers/quizController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Get random quiz questions
router.get("/questions", getQuizQuestions);

// Submit an answer
router.post("/answer", submitQuizAnswer);

// Get logged-in user's statistics
router.get("/stats", getQuizStats);

module.exports = router;