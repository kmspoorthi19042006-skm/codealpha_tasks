const express = require("express");

const {
    getChatHistory,
    sendMessage,
    deleteMessage,
    deleteConversation
} = require("../controllers/chatController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(protect);


/* =========================================================
   DELETE SINGLE MESSAGE

   DELETE /api/chat/message/:messageId

   Must come BEFORE /:userId
========================================================= */

router.delete(
    "/message/:messageId",
    deleteMessage
);


/* =========================================================
   GET CHAT HISTORY

   GET /api/chat/:userId
========================================================= */

router.get(
    "/:userId",
    getChatHistory
);


/* =========================================================
   SEND MESSAGE

   POST /api/chat/:userId
========================================================= */

router.post(
    "/:userId",
    sendMessage
);


/* =========================================================
   DELETE ENTIRE CONVERSATION

   DELETE /api/chat/:userId
========================================================= */

router.delete(
    "/:userId",
    deleteConversation
);


module.exports = router;