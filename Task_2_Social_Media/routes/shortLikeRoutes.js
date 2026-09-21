const express = require("express");

const {
    toggleShortLike,
    getShortLikeStatus
} = require("../controllers/shortLikeController");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();


/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(protect);


/* =========================================================
   LIKE / UNLIKE SHORT
========================================================= */

router.post(
    "/:shortId",
    toggleShortLike
);


/* =========================================================
   GET LIKE STATUS + COUNT
========================================================= */

router.get(
    "/:shortId",
    getShortLikeStatus
);


module.exports = router;