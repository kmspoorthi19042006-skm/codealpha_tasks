const { pool } = require("../config/db");

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT * FROM products ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching products"
        });
    }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.execute(
            `SELECT * FROM products WHERE id = ?`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product: products[0]
        });

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching product"
        });
    }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            image_url,
            category,
            stock
        } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product name and price are required"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO products
            (name, description, price, image_url, category, stock)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                price,
                image_url || null,
                category || null,
                stock || 0
            ]
        );

        const [products] = await pool.execute(
            `SELECT * FROM products WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: products[0]
        });

    } catch (error) {
        console.error("Create product error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating product"
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct
};