const express = require("express");

const {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ADD PRODUCT TO CART
router.post("/", authenticateToken, addToCart);


// GET LOGGED-IN USER'S CART
router.get("/", authenticateToken, getCart);


// UPDATE CART QUANTITY
router.put("/", authenticateToken, updateCartQuantity);


// REMOVE PRODUCT FROM CART
router.delete("/", authenticateToken, removeFromCart);


// CLEAR LOGGED-IN USER'S CART
router.delete("/clear", authenticateToken, clearCart);


module.exports = router;