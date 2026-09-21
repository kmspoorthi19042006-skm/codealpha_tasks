const { pool } = require("../config/db");


/* =========================================================
   GET CHAT HISTORY
   GET /api/chat/:userId
========================================================= */

const getChatHistory = async (req, res) => {

    try {

        const currentUserId =
            Number(req.userId);

        const otherUserId =
            Number(req.params.userId);


        if (!currentUserId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }


        if (!otherUserId) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });

        }


        if (
            currentUserId ===
            otherUserId
        ) {

            return res.status(400).json({
                success: false,
                message: "You cannot chat with yourself."
            });

        }


        /* -----------------------------------------
           CHECK OTHER USER
        ----------------------------------------- */

        const [users] =
            await pool.execute(
                `
                    SELECT
                        id,
                        name,
                        username,
                        profile_image
                    FROM users
                    WHERE id = ?
                `,
                [otherUserId]
            );


        if (!users.length) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        /* -----------------------------------------
           FETCH MESSAGES
        ----------------------------------------- */

        const [messages] =
            await pool.execute(
                `
                    SELECT
                        id,
                        sender_id,
                        receiver_id,
                        content,
                        created_at
                    FROM messages

                    WHERE
                        (
                            sender_id = ?
                            AND receiver_id = ?
                        )

                        OR

                        (
                            sender_id = ?
                            AND receiver_id = ?
                        )

                    ORDER BY created_at ASC
                `,
                [
                    currentUserId,
                    otherUserId,
                    otherUserId,
                    currentUserId
                ]
            );


        const formattedMessages =
            messages.map(message => ({

                ...message,

                id:
                    Number(message.id),

                sender_id:
                    Number(message.sender_id),

                receiver_id:
                    Number(message.receiver_id),

                is_mine:
                    Number(message.sender_id) ===
                    currentUserId

            }));


        return res.json({

            success: true,

            user:
                users[0],

            messages:
                formattedMessages

        });

    } catch (error) {

        console.error(
            "Get chat history error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load chat history."

        });

    }

};


/* =========================================================
   SEND MESSAGE
   POST /api/chat/:userId
========================================================= */

const sendMessage = async (req, res) => {

    try {

        const senderId =
            Number(req.userId);

        const receiverId =
            Number(req.params.userId);


        if (!senderId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }


        if (!receiverId) {

            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID."
            });

        }


        if (
            senderId ===
            receiverId
        ) {

            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself."
            });

        }


        const content =
            String(
                req.body.content || ""
            ).trim();


        if (!content) {

            return res.status(400).json({
                success: false,
                message: "Message cannot be empty."
            });

        }


        if (
            content.length >
            2000
        ) {

            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 2000 characters."
            });

        }


        /* -----------------------------------------
           CHECK RECEIVER
        ----------------------------------------- */

        const [users] =
            await pool.execute(
                `
                    SELECT id
                    FROM users
                    WHERE id = ?
                `,
                [receiverId]
            );


        if (!users.length) {

            return res.status(404).json({
                success: false,
                message: "Receiver not found."
            });

        }


        /* -----------------------------------------
           SAVE MESSAGE
        ----------------------------------------- */

        const [result] =
            await pool.execute(
                `
                    INSERT INTO messages
                    (
                        sender_id,
                        receiver_id,
                        content
                    )
                    VALUES (?, ?, ?)
                `,
                [
                    senderId,
                    receiverId,
                    content
                ]
            );


        /* -----------------------------------------
           FETCH CREATED MESSAGE
        ----------------------------------------- */

        const [rows] =
            await pool.execute(
                `
                    SELECT
                        id,
                        sender_id,
                        receiver_id,
                        content,
                        created_at
                    FROM messages
                    WHERE id = ?
                `,
                [result.insertId]
            );


        const message =
            rows[0];


        message.id =
            Number(message.id);

        message.sender_id =
            Number(message.sender_id);

        message.receiver_id =
            Number(message.receiver_id);

        message.is_mine =
            true;


        return res.status(201).json({

            success: true,

            message:
                message

        });

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send message."

        });

    }

};

/* =========================================================
   DELETE SINGLE MESSAGE
   DELETE /api/chat/message/:messageId
========================================================= */

const deleteMessage = async (req, res) => {

    try {

        const currentUserId =
            Number(req.userId);

        const messageId =
            Number(req.params.messageId);


        if (!currentUserId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }


        if (!messageId) {

            return res.status(400).json({
                success: false,
                message: "Invalid message ID."
            });

        }


        /* -----------------------------------------
           FIND MESSAGE
        ----------------------------------------- */

        const [messages] =
            await pool.execute(
                `
                    SELECT
                        id,
                        sender_id,
                        receiver_id
                    FROM messages
                    WHERE id = ?
                `,
                [messageId]
            );


        if (!messages.length) {

            return res.status(404).json({
                success: false,
                message: "Message not found."
            });

        }


        const message =
            messages[0];


        /* -----------------------------------------
           SECURITY CHECK
           
           A user can delete only a message
           that they sent.
        ----------------------------------------- */

        if (
            Number(message.sender_id) !==
            currentUserId
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "You can only delete your own messages."
            });

        }


        /* -----------------------------------------
           DELETE MESSAGE
        ----------------------------------------- */

        await pool.execute(
            `
                DELETE FROM messages
                WHERE id = ?
                AND sender_id = ?
            `,
            [
                messageId,
                currentUserId
            ]
        );


        return res.json({

            success: true,

            message:
                "Message deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to delete message."

        });

    }

};


/* =========================================================
   DELETE ENTIRE CONVERSATION
   DELETE /api/chat/:userId
========================================================= */

const deleteConversation = async (req, res) => {

    try {

        const currentUserId =
            Number(req.userId);

        const otherUserId =
            Number(req.params.userId);


        if (!currentUserId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });

        }


        if (!otherUserId) {

            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });

        }


        if (
            currentUserId ===
            otherUserId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot delete a conversation with yourself."
            });

        }


        /* -----------------------------------------
           CHECK USER
        ----------------------------------------- */

        const [users] =
            await pool.execute(
                `
                    SELECT id
                    FROM users
                    WHERE id = ?
                `,
                [otherUserId]
            );


        if (!users.length) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }


        /* -----------------------------------------
           DELETE BOTH SIDES
           
           This completely removes the conversation
           from the database.
        ----------------------------------------- */

        const [result] =
            await pool.execute(
                `
                    DELETE FROM messages
                    WHERE
                        (
                            sender_id = ?
                            AND receiver_id = ?
                        )
                        OR
                        (
                            sender_id = ?
                            AND receiver_id = ?
                        )
                `,
                [
                    currentUserId,
                    otherUserId,
                    otherUserId,
                    currentUserId
                ]
            );


        return res.json({

            success: true,

            deletedCount:
                result.affectedRows,

            message:
                "Conversation deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete conversation error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to delete conversation."

        });

    }

};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getChatHistory,

    sendMessage,

    deleteMessage,

    deleteConversation

};