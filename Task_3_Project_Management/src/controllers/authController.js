const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");


// =====================================================
// CREATE TOKEN
// =====================================================

function createToken(user) {

    return jwt.sign(
        {
            id: Number(user.id),
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}


// =====================================================
// USER RESPONSE DATA
// =====================================================

function getUserData(user) {

    return {

        id:
            Number(user.id),

        full_name:
            user.full_name,

        username:
            user.username,

        email:
            user.email,

        bio:
            user.bio || "",

        profile_picture:
            user.profile_picture || null,

        avatar_color:
            user.avatar_color,

        created_at:
            user.created_at
    };
}


// =====================================================
// REGISTER
// =====================================================

async function register(req, res) {

    try {

        const {
            full_name,
            username,
            email,
            password
        } = req.body;


        if (
            !full_name ||
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All fields are required"
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }


        const cleanName =
            full_name.trim();

        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim();


        const [existing] =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = ?
                   OR username = ?
                LIMIT 1
                `,
                [
                    cleanEmail,
                    cleanUsername
                ]
            );


        if (existing.length) {

            return res.status(409).json({
                success: false,
                message:
                    "Email or username already exists"
            });
        }


        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        const avatarColors = [
            "#111827",
            "#1d4ed8",
            "#7c3aed",
            "#047857",
            "#b45309"
        ];


        const avatarColor =
            avatarColors[
                Math.floor(
                    Math.random() *
                    avatarColors.length
                )
            ];


        const [result] =
            await pool.query(
                `
                INSERT INTO users
                (
                    full_name,
                    username,
                    email,
                    password_hash,
                    avatar_color
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    cleanName,
                    cleanUsername,
                    cleanEmail,
                    passwordHash,
                    avatarColor
                ]
            );


        const user = {

            id:
                result.insertId,

            full_name:
                cleanName,

            username:
                cleanUsername,

            email:
                cleanEmail,

            avatar_color:
                avatarColor
        };


        const token =
            createToken(user);


        return res.status(201).json({

            success: true,

            message:
                "Registration successful",

            token,

            user:
                getUserData(user)
        });

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Registration failed"
        });
    }
}


// =====================================================
// LOGIN
// =====================================================

async function login(req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        const [rows] =
            await pool.query(
                `
                SELECT *
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [email.trim()]
            );


        if (!rows.length) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        const user =
            rows[0];


        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!validPassword) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        const token =
            createToken(user);


        return res.json({

            success: true,

            message:
                "Login successful",

            token,

            user:
                getUserData(user)
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Login failed"
        });
    }
}


// =====================================================
// GET CURRENT USER
// =====================================================

async function getMe(req, res) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    username,
                    email,
                    bio,
                    profile_picture,
                    avatar_color,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [req.user.id]
            );


        if (!rows.length) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found"
            });
        }


        return res.json({

            success: true,

            user:
                getUserData(
                    rows[0]
                )
        });

    } catch (error) {

        console.error(
            "Get me error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load profile"
        });
    }
}


// =====================================================
// UPDATE PROFILE
// =====================================================

async function updateProfile(req, res) {

    try {

        const userId =
            Number(req.user.id);


        const requestedName =
            typeof req.body.full_name === "string"
                ? req.body.full_name.trim()
                : null;

        const requestedUsername =
            typeof req.body.username === "string"
                ? req.body.username.trim()
                : null;

        const requestedBio =
            typeof req.body.bio === "string"
                ? req.body.bio.trim()
                : null;


        // =============================================
        // GET CURRENT VALUES
        // =============================================

        const [currentRows] =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    username,
                    email,
                    bio,
                    profile_picture,
                    avatar_color,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (!currentRows.length) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found"
            });
        }


        const currentUser =
            currentRows[0];


        // =============================================
        // KEEP OLD VALUES WHEN NOT PROVIDED
        // =============================================

        const cleanName =
            requestedName !== null
                ? requestedName
                : currentUser.full_name;

        const cleanUsername =
            requestedUsername !== null
                ? requestedUsername
                : currentUser.username;

        const cleanBio =
            requestedBio !== null
                ? requestedBio
                : (currentUser.bio || "");


        // =============================================
        // VALIDATION
        // =============================================

        if (!cleanName) {

            return res.status(400).json({
                success: false,
                message:
                    "Name is required"
            });
        }


        if (!cleanUsername) {

            return res.status(400).json({
                success: false,
                message:
                    "Username is required"
            });
        }


        if (cleanUsername.length < 3) {

            return res.status(400).json({
                success: false,
                message:
                    "Username must be at least 3 characters"
            });
        }


        if (
            !/^[a-zA-Z0-9_]+$/.test(
                cleanUsername
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Username can contain only letters, numbers and underscore"
            });
        }


        if (cleanBio.length > 500) {

            return res.status(400).json({
                success: false,
                message:
                    "Bio cannot exceed 500 characters"
            });
        }


        // =============================================
        // USERNAME DUPLICATE CHECK
        // =============================================

        const [existingRows] =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE username = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    cleanUsername,
                    userId
                ]
            );


        if (existingRows.length) {

            return res.status(409).json({
                success: false,
                message:
                    "Username is already taken"
            });
        }


        // =============================================
        // UPDATE
        // =============================================

        const [updateResult] =
            await pool.query(
                `
                UPDATE users
                SET
                    full_name = ?,
                    username = ?,
                    bio = ?
                WHERE id = ?
                `,
                [
                    cleanName,
                    cleanUsername,
                    cleanBio,
                    userId
                ]
            );


        console.log(
            "PROFILE UPDATE:",
            {
                userId,
                affectedRows:
                    updateResult.affectedRows
            }
        );


        // =============================================
        // GET UPDATED USER
        // =============================================

        const [updatedRows] =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    username,
                    email,
                    bio,
                    profile_picture,
                    avatar_color,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (!updatedRows.length) {

            return res.status(404).json({
                success: false,
                message:
                    "Profile was updated but user could not be loaded"
            });
        }


        return res.json({

            success: true,

            message:
                "Profile updated successfully",

            user:
                getUserData(
                    updatedRows[0]
                )
        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update profile"
        });
    }
}


// =====================================================
// PROFILE PICTURE UPLOAD
// =====================================================

async function uploadProfilePicture(
    req,
    res
) {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message:
                    "Please select an image"
            });
        }


        const newPath =
            `/uploads/profiles/${req.file.filename}`;


        const [rows] =
            await pool.query(
                `
                SELECT profile_picture
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [req.user.id]
            );


        const oldPicture =
            rows[0]?.profile_picture;


        await pool.query(
            `
            UPDATE users
            SET profile_picture = ?
            WHERE id = ?
            `,
            [
                newPath,
                req.user.id
            ]
        );


        // =============================================
        // DELETE OLD IMAGE
        // =============================================

        if (
            oldPicture &&
            oldPicture.startsWith(
                "/uploads/profiles/"
            )
        ) {

            const fs =
                require("fs");

            const path =
                require("path");

            const oldFile =
                path.join(
                    __dirname,
                    "../../",
                    oldPicture.replace(
                        "/uploads/",
                        "uploads/"
                    )
                );


            try {

                if (
                    fs.existsSync(oldFile)
                ) {
                    fs.unlinkSync(oldFile);
                }

            } catch (deleteError) {

                console.warn(
                    "Could not delete old profile picture:",
                    deleteError.message
                );
            }
        }


        // =============================================
        // RETURN UPDATED USER
        // =============================================

        const [updatedRows] =
            await pool.query(
                `
                SELECT
                    id,
                    full_name,
                    username,
                    email,
                    bio,
                    profile_picture,
                    avatar_color,
                    created_at
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [req.user.id]
            );


        return res.json({

            success: true,

            message:
                "Profile picture updated",

            user:
                getUserData(
                    updatedRows[0]
                )
        });

    } catch (error) {

        console.error(
            "Profile picture error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to upload profile picture"
        });
    }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    uploadProfilePicture
};