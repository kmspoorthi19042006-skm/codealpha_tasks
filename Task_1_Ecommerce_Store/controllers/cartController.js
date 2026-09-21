const { pool } = require("../config/db");

// ADD PRODUCT TO CART
const addToCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: "product_id and quantity are required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const [products] = await pool.execute(
            `SELECT id, name, price, stock
             FROM products
             WHERE id = ?`,
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = products[0];

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        const [existingItems] = await pool.execute(
            `SELECT id, quantity
             FROM cart_items
             WHERE user_id = ? AND product_id = ?`,
            [user_id, product_id]
        );

        if (existingItems.length > 0) {

            const newQuantity =
                existingItems[0].quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock"
                });
            }

            await pool.execute(
                `UPDATE cart_items
                 SET quantity = ?
                 WHERE user_id = ? AND product_id = ?`,
                [newQuantity, user_id, product_id]
            );

            return res.status(200).json({
                success: true,
                message: "Cart quantity updated successfully"
            });
        }

        await pool.execute(
            `INSERT INTO cart_items
                (user_id, product_id, quantity)
             VALUES (?, ?, ?)`,
            [user_id, product_id, quantity]
        );

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully"
        });

    } catch (error) {

        console.error("Add to cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding product to cart"
        });
    }
};


// GET LOGGED-IN USER'S CART
const getCart = async (req, res) => {
    try {

        const user_id = req.user.id;

        const [cartItems] = await pool.execute(
            `SELECT
                c.id,
                c.product_id,
                p.name,
                p.price,
                p.image_url,
                p.category,
                c.quantity,
                (p.price * c.quantity) AS subtotal
             FROM cart_items c
             JOIN products p
                ON c.product_id = p.id
             WHERE c.user_id = ?
             ORDER BY c.id DESC`,
            [user_id]
        );

        let total = 0;

        cartItems.forEach(item => {
            total += Number(item.subtotal);
        });

        res.status(200).json({
            success: true,
            item_count: cartItems.length,
            total: total.toFixed(2),
            cart: cartItems
        });

    } catch (error) {

        console.error("Get cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching cart"
        });
    }
};


// UPDATE CART QUANTITY
const updateCartQuantity = async (req, res) => {
    try {

        const user_id = req.user.id;
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: "product_id and quantity are required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const [products] = await pool.execute(
            `SELECT stock
             FROM products
             WHERE id = ?`,
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > products[0].stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        const [result] = await pool.execute(
            `UPDATE cart_items
             SET quantity = ?
             WHERE user_id = ? AND product_id = ?`,
            [quantity, user_id, product_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart quantity updated successfully"
        });

    } catch (error) {

        console.error("Update cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating cart"
        });
    }
};


// REMOVE PRODUCT FROM CART
const removeFromCart = async (req, res) => {
    try {

        const user_id = req.user.id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "product_id is required"
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM cart_items
             WHERE user_id = ? AND product_id = ?`,
            [user_id, product_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product removed from cart successfully"
        });

    } catch (error) {

        console.error("Remove cart item error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing product from cart"
        });
    }
};


// CLEAR CART
const clearCart = async (req, res) => {
    try {

        const user_id = req.user.id;

        await pool.execute(
            `DELETE FROM cart_items
             WHERE user_id = ?`,
            [user_id]
        );

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });

    } catch (error) {

        console.error("Clear cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while clearing cart"
        });
    }
};


module.exports = {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};