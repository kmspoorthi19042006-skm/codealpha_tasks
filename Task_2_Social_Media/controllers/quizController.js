const { pool } = require("../config/db");

// GET QUIZ QUESTIONS
const getQuizQuestions = async (req, res) => {
    try {
        const { category, difficulty, limit } = req.query;

        let query = `
            SELECT
                id,
                category,
                difficulty,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                points
            FROM quiz_questions
            WHERE 1 = 1
        `;

        const params = [];

        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }

        if (difficulty) {
            query += ` AND difficulty = ?`;
            params.push(difficulty);
        }

        query += ` ORDER BY RAND()`;

        const questionLimit = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            20
        );

        query += ` LIMIT ${questionLimit}`;

        const [questions] = await pool.execute(query, params);

        res.json({
            success: true,
            count: questions.length,
            questions
        });

    } catch (error) {
        console.error("Get quiz questions error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading quiz questions"
        });
    }
};


// SUBMIT QUIZ ANSWER
const submitQuizAnswer = async (req, res) => {
    try {
        const userId = req.userId;

        const { question_id, selected_option } = req.body;

        if (!question_id || !selected_option) {
            return res.status(400).json({
                success: false,
                message: "Question ID and selected option are required"
            });
        }

        const selectedOption =
            selected_option.toString().toUpperCase();

        if (!["A", "B", "C", "D"].includes(selectedOption)) {
            return res.status(400).json({
                success: false,
                message: "Selected option must be A, B, C or D"
            });
        }

        const [questions] = await pool.execute(
            `SELECT
                id,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                explanation,
                points,
                category,
                difficulty
             FROM quiz_questions
             WHERE id = ?`,
            [question_id]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        const question = questions[0];

        const correctOption =
            question.correct_option.toUpperCase();

        const isCorrect =
            selectedOption === correctOption;

        const pointsEarned =
            isCorrect ? question.points : 0;

        await pool.execute(
            `INSERT INTO user_quiz_answers
            (
                user_id,
                question_id,
                selected_option,
                is_correct,
                points_earned
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                question_id,
                selectedOption,
                isCorrect,
                pointsEarned
            ]
        );

        res.json({
            success: true,

            result: {
                question_id: question.id,
                selected_option: selectedOption,
                correct_option: correctOption,
                is_correct: isCorrect,
                points_earned: pointsEarned,
                total_points: question.points,

                explanation: question.explanation
            }
        });

    } catch (error) {
        console.error("Submit quiz answer error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while submitting answer"
        });
    }
};


// GET USER QUIZ STATISTICS
const getQuizStats = async (req, res) => {
    try {
        const userId = req.userId;

        const [stats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_attempts,

                SUM(
                    CASE
                        WHEN is_correct = TRUE
                        THEN 1
                        ELSE 0
                    END
                ) AS correct_answers,

                COALESCE(
                    SUM(points_earned),
                    0
                ) AS total_points

             FROM user_quiz_answers
             WHERE user_id = ?`,
            [userId]
        );

        const totalAttempts =
            Number(stats[0].total_attempts) || 0;

        const correctAnswers =
            Number(stats[0].correct_answers) || 0;

        const accuracy =
            totalAttempts > 0
                ? Math.round(
                    (correctAnswers / totalAttempts) * 100
                )
                : 0;

        res.json({
            success: true,
            stats: {
                total_attempts: totalAttempts,
                correct_answers: correctAnswers,
                accuracy,
                total_points:
                    Number(stats[0].total_points) || 0
            }
        });

    } catch (error) {
        console.error("Get quiz stats error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while loading quiz statistics"
        });
    }
};


module.exports = {
    getQuizQuestions,
    submitQuizAnswer,
    getQuizStats
};