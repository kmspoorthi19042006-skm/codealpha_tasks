const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

require("dotenv").config();

require("./src/config/db");

// ========================================
// ROUTES
// ========================================

const authRoutes =
    require("./src/routes/authRoutes");

const projectRoutes =
    require("./src/routes/projectRoutes");

const taskRoutes =
    require("./src/routes/taskRoutes");

const commentRoutes =
    require("./src/routes/commentRoutes");

const userRoutes =
    require("./src/routes/userRoutes");

const notificationRoutes =
    require("./src/routes/notificationRoutes");

// ========================================
// APP
// ========================================

const app = express();

const server =
    http.createServer(app);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE"
        ]
    }
});

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ========================================
// SOCKET.IO ACCESS
// ========================================

app.use(
    (req, res, next) => {
        req.io = io;
        next();
    }
);

// ========================================
// FRONTEND
// ========================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);

// ========================================
// PROFILE UPLOADS
// ========================================
//
// Profile pictures are stored in:
//
// Task_3_Project_Management
// └── uploads
//     └── profiles
//
// They can then be accessed through:
//
// /uploads/profiles/filename.jpg
//
// ========================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

// ========================================
// API ROUTES
// ========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/tasks",
    taskRoutes
);

app.use(
    "/api/comments",
    commentRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success: true,
            message:
                "FlowPilot API is running",
            timestamp:
                new Date().toISOString()
        });

    }
);

// ========================================
// SOCKET.IO
// ========================================

io.on(
    "connection",
    (socket) => {

        console.log(
            `🔌 Socket connected: ${socket.id}`
        );

        // -------------------------------
        // JOIN PROJECT
        // -------------------------------

        socket.on(
            "join:project",
            (projectId) => {

                if (!projectId) {
                    return;
                }

                socket.join(
                    `project:${projectId}`
                );

                console.log(
                    `📁 ${socket.id} joined project:${projectId}`
                );

            }
        );

        // -------------------------------
        // LEAVE PROJECT
        // -------------------------------

        socket.on(
            "leave:project",
            (projectId) => {

                if (!projectId) {
                    return;
                }

                socket.leave(
                    `project:${projectId}`
                );

            }
        );

        // -------------------------------
        // DISCONNECT
        // -------------------------------

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `🔌 Socket disconnected: ${socket.id}`
                );

            }
        );

    }
);

// ========================================
// API 404
// ========================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                "API endpoint not found"
        });

    }
);

// ========================================
// ERROR HANDLER
// ========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "❌ Server error:",
            err
        );

        res.status(
            err.status || 500
        ).json({
            success: false,
            message:
                err.message ||
                "Internal server error"
        });

    }
);

// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT || 5002;

server.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "🚀 FLOWPILOT SERVER"
        );

        console.log(
            "========================================"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `❤️  http://localhost:${PORT}/api/health`
        );

        console.log(
            "⚡ Socket.IO enabled"
        );

        console.log(
            "📋 Tasks + Comments + Notifications enabled"
        );

        console.log(
            "👥 User search enabled"
        );

        console.log(
            "🖼️ Profile picture uploads enabled"
        );

        console.log(
            "========================================"
        );

        console.log("");

    }
);