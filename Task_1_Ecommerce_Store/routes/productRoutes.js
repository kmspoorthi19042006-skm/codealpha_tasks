const express = require("express");

const {
    getAllProducts,
    getProductById,
    createProduct
} = require("../controllers/productController");

const router = express.Router();

// GET /api/products
router.get("/", getAllProducts);

// GET /api/products/:id
router.get("/:id", getProductById);

// POST /api/products
router.post("/", createProduct);

module.exports = router;