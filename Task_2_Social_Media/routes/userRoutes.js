const express = require("express");


const {
    getUserProfile,
    getUserPosts,
    searchUsers,
    updateUserProfile
} = require("../controllers/userController");


const protect =
    require("../middleware/authMiddleware");


const upload =
    require("../middleware/uploadMiddleware");


const router =
    express.Router();


/* =========================================================
   PROTECT ALL USER ROUTES
========================================================= */

router.use(
    protect
);


/* =========================================================
   SEARCH USERS
========================================================= */

router.get(
    "/search",
    searchUsers
);


/* =========================================================
   UPDATE OWN PROFILE
========================================================= */

router.put(
    "/profile",
    upload.single(
        "profile_image"
    ),
    updateUserProfile
);


/* =========================================================
   GET USER PROFILE
========================================================= */

router.get(
    "/:userId",
    getUserProfile
);


/* =========================================================
   GET USER POSTS
========================================================= */

router.get(
    "/:userId/posts",
    getUserPosts
);


module.exports =
    router;