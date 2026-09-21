const express = require("express");

const {
    register,
    login,
    getMe,
    updateProfile,
    uploadProfilePicture
} = require("../controllers/authController");

const authMiddleware =
    require("../middleware/authMiddleware");

const multer =
    require("multer");

const path =
    require("path");

const fs =
    require("fs");

const router =
    express.Router();


// ============================================
// PROFILE UPLOAD DIRECTORY
// ============================================

const uploadDirectory =
    path.join(
        __dirname,
        "../../uploads/profiles"
    );

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );
}


// ============================================
// MULTER STORAGE
// ============================================

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadDirectory
                );
            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();

                const filename =
                    `profile-${req.user.id}-${Date.now()}${extension}`;

                cb(
                    null,
                    filename
                );
            }
    });


// ============================================
// FILE FILTER
// ============================================

const fileFilter =
    function (
        req,
        file,
        cb
    ) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only JPG, PNG and WebP images are allowed"
                )
            );
        }
    };


const upload =
    multer({
        storage,
        fileFilter,
        limits: {
            fileSize:
                5 * 1024 * 1024
        }
    });


// ============================================
// AUTH
// ============================================

router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);

router.get(
    "/me",
    authMiddleware,
    getMe
);


// ============================================
// PROFILE
// ============================================

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

router.post(
    "/profile/picture",
    authMiddleware,
    function (
        req,
        res,
        next
    ) {

        upload.single("profile_picture")(
            req,
            res,
            function (error) {

                if (error) {

                    return res.status(400).json({
                        success: false,
                        message:
                            error.message ||
                            "Image upload failed"
                    });
                }

                next();
            }
        );
    },
    uploadProfilePicture
);


module.exports = router;