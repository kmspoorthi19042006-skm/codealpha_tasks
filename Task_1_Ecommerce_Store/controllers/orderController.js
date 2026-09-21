const { pool } = require("../config/db");

// CREATE ORDER FROM CART
const createOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const user_id = req.user.id;
        const { shipping_address } = req.body;

        if (!shipping_address || !shipping_address.trim()) {
            return res.status(400).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        await connection.beginTransaction();

        const [cartItems] = await connection.execute(
            `SELECT
                c.product_id,
                c.quantity,
                p.name,
                p.price,
                p.stock
             FROM cart_items c
             JOIN products p
                ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [user_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        let subtotal = 0;

        for (const item of cartItems) {

            if (item.quantity > item.stock) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}`
                });
            }

            subtotal +=
                Number(item.price) * Number(item.quantity);
        }

        // ₹49 shipping below ₹999
        // Free shipping for ₹999 and above
        const shipping = subtotal >= 999 ? 0 : 49;

        const totalAmount = subtotal + shipping;

        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, shipping_address)
             VALUES (?, ?, ?)`,
            [
                user_id,
                totalAmount,
                shipping_address.trim()
            ]
        );

        const orderId = orderResult.insertId;

        for (const item of cartItems) {

            await connection.execute(
                `INSERT INTO order_items
                    (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );

            await connection.execute(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ?`,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // Clear user's cart
        await connection.execute(
            `DELETE FROM cart_items
             WHERE user_id = ?`,
            [user_id]
        );

        await connection.commit();

        const [orders] = await connection.execute(
            `SELECT
                id,
                user_id,
                total_amount,
                status,
                shipping_address,
                created_at
             FROM orders
             WHERE id = ? AND user_id = ?`,
            [orderId, user_id]
        );

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: orders[0]
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Create order error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while creating order"
        });

    } finally {

        connection.release();
    }
};


// GET LOGGED-IN USER'S ORDERS
const getUserOrders = async (req, res) => {
    try {

        const user_id = req.user.id;

        const [orders] = await pool.execute(
            `SELECT
                id,
                user_id,
                total_amount,
                status,
                shipping_address,
                created_at
             FROM orders
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [user_id]
        );

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {

        console.error(
            "Get orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while fetching orders"
        });
    }
};


// GET SINGLE ORDER
const getOrderById = async (req, res) => {
    try {

        const user_id = req.user.id;
        const { id } = req.params;

        const [orders] = await pool.execute(
            `SELECT
                o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.shipping_address,
                o.created_at
             FROM orders o
             WHERE o.id = ?
               AND o.user_id = ?`,
            [id, user_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const [items] = await pool.execute(
            `SELECT
                oi.id,
                oi.product_id,
                p.name,
                oi.quantity,
                oi.price,
                (oi.quantity * oi.price) AS subtotal
             FROM order_items oi
             JOIN products p
                ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            order: orders[0],
            items
        });

    } catch (error) {

        console.error(
            "Get order error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while fetching order"
        });
    }
};


// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const [result] = await pool.execute(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully"
        });

    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while updating order status"
        });
    }
};


module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus
};