const express = require("express");

const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE ORDER
router.post("/", authenticateToken, createOrder);


// GET LOGGED-IN USER'S ORDERS
router.get("/", authenticateToken, getUserOrders);


// GET SINGLE ORDER
router.get("/:id", authenticateToken, getOrderById);


// UPDATE ORDER STATUS
router.put("/:id/status", authenticateToken, updateOrderStatus);


module.exports = router;