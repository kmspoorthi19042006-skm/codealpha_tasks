const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();


/* =========================================================
   DATABASE
========================================================= */

const {
    testDatabaseConnection
} = require("./config/db");


/* =========================================================
   ROUTES
========================================================= */

const authRoutes =
    require("./routes/authRoutes");

const postRoutes =
    require("./routes/postRoutes");

const likeRoutes =
    require("./routes/likeRoutes");

const commentRoutes =
    require("./routes/commentRoutes");

const followRoutes =
    require("./routes/followRoutes");

const userRoutes =
    require("./routes/userRoutes");

const quizRoutes =
    require("./routes/quizRoutes");

const shortsRoutes =
    require("./routes/shortsRoutes");

const shortLikeRoutes =
    require("./routes/shortLikeRoutes");

const chatRoutes =
    require("./routes/chatRoutes");


/* =========================================================
   APP
========================================================= */

const app =
    express();

const PORT =
    process.env.PORT || 5001;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


/* =========================================================
   STATIC UPLOADS
========================================================= */

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            message:
                "CodeAlpha Social Media API is running",

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/posts",
    postRoutes
);

app.use(
    "/api/likes",
    likeRoutes
);

app.use(
    "/api/comments",
    commentRoutes
);

app.use(
    "/api/follows",
    followRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/quiz",
    quizRoutes
);

app.use(
    "/api/shorts",
    shortsRoutes
);

app.use(
    "/api/short-likes",
    shortLikeRoutes
);

app.use(
    "/api/chat",
    chatRoutes
);


/* =========================================================
   HTTP SERVER
========================================================= */

const httpServer =
    http.createServer(app);


/* =========================================================
   SOCKET.IO
========================================================= */

const io =
    new Server(
        httpServer,
        {
            cors: {
                origin: "*",
                methods: [
                    "GET",
                    "POST"
                ]
            }
        }
    );


/* =========================================================
   SOCKET AUTHENTICATION
========================================================= */

io.use(
    (socket, next) => {

        try {

            const token =
                socket.handshake.auth?.token;

            if (!token) {

                return next(
                    new Error(
                        "Authentication required."
                    )
                );

            }


            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );


            const userId =
                Number(
                    decoded.id ??
                    decoded.user_id ??
                    decoded.userId
                );


            if (!userId) {

                return next(
                    new Error(
                        "Invalid authentication token."
                    )
                );

            }


            socket.userId =
                userId;


            next();


        } catch (error) {

            console.error(
                "Socket authentication error:",
                error.message
            );

            next(
                new Error(
                    "Invalid or expired token."
                )
            );

        }

    }
);


/* =========================================================
   SOCKET CONNECTION
========================================================= */

io.on(
    "connection",
    socket => {

        const userId =
            Number(socket.userId);


        console.log(
            `🟢 User ${userId} connected to Vibe chat`
        );


        /*
         * Private room for this user.
         */

        const userRoom =
            `user_${userId}`;

        socket.join(
            userRoom
        );


        /*
         * Notify frontend that
         * Socket.IO is connected.
         */

        socket.emit(
            "socket_connected",
            {
                success: true,
                user_id: userId
            }
        );


        /* =================================================
           SEND REAL-TIME MESSAGE
        ================================================= */

        socket.on(
            "send_message",
            data => {

                try {

                    const receiverId =
                        Number(
                            data?.receiver_id
                        );

                    const message =
                        data?.message;


                    if (
                        !receiverId ||
                        !message
                    ) {

                        return;

                    }


                    /*
                     * Only send to the
                     * receiver's private room.
                     */

                    io.to(
                        `user_${receiverId}`
                    ).emit(
                        "receive_message",
                        {
                            id:
                                message.id,

                            sender_id:
                                userId,

                            receiver_id:
                                receiverId,

                            content:
                                message.content,

                            created_at:
                                message.created_at,

                            is_mine:
                                false
                        }
                    );


                } catch (error) {

                    console.error(
                        "Socket send message error:",
                        error.message
                    );

                }

            }
        );


        /* =================================================
           TYPING INDICATOR
        ================================================= */

        socket.on(
            "typing",
            data => {

                const receiverId =
                    Number(
                        data?.receiver_id
                    );

                if (!receiverId) {
                    return;
                }


                io.to(
                    `user_${receiverId}`
                ).emit(
                    "user_typing",
                    {
                        user_id:
                            userId,

                        is_typing:
                            Boolean(
                                data?.is_typing
                            )
                    }
                );

            }
        );


        /* =================================================
           DISCONNECT
        ================================================= */

        socket.on(
            "disconnect",
            reason => {

                console.log(
                    `🔴 User ${userId} disconnected: ${reason}`
                );

            }
        );

    }
);


/* =========================================================
   START SERVER
========================================================= */

httpServer.listen(
    PORT,
    async () => {

        console.log(
            `🚀 Server running on http://localhost:${PORT}`
        );

        console.log(
            `💬 Vibe real-time chat enabled`
        );

        await testDatabaseConnection();

    }
);