const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "flowpilot_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL connected successfully");
        console.log("📊 Database: flowpilot_db");

        connection.release();
    } catch (error) {
        console.error("❌ MySQL connection failed:");
        console.error(error.message);
    }
}

testConnection();

module.exports = pool;