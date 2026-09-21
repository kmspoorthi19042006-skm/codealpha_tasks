# E-Commerce Store

A full-stack e-commerce web application developed as part of the **CodeAlpha Full Stack Development Internship – September 2026 Batch**.

The application provides a complete shopping workflow from user authentication and product browsing to cart management, checkout, and order tracking.

## Features

- User registration
- User login
- JWT authentication
- Password hashing with bcrypt
- Product listings
- Product details
- Shopping cart
- Add, update, and remove cart items
- Cart item count
- Stock validation
- Checkout
- Shipping address
- Order processing
- My Orders
- Order details
- User-specific cart and order data
- MySQL database persistence

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Font Awesome
- Inter Font

### Backend
- Node.js
- Express.js
- JWT
- bcrypt.js
- CORS
- dotenv

### Database
- MySQL
- mysql2

## Application Flow

```text
Register / Login
       ↓
Product Listing
       ↓
Product Details
       ↓
Add to Cart
       ↓
Cart Management
       ↓
Checkout
       ↓
Order Processing
       ↓
My Orders
       ↓
Order Details

->Authentication

The application uses JWT-based authentication.

->Protected operations include:
•Cart management
•Checkout
•Order creation
•Order history
•Order details

Passwords are securely hashed using bcrypt before being stored in the database.

->Database

The application uses MySQL for persistent storage of:
•Users
•Products
•Cart items
•Orders
•Order details

The database maintains relationships between users, products, carts, and orders.

->Backend API

Main API routes include:
/api/auth
/api/products
/api/orders

The backend is built using Express.js and provides REST-style API endpoints for the frontend.

->Project Structure

Task_1_Ecommerce_Store/
│
├── public/
├── src/
├── database/
├── package.json
├── package-lock.json
└── README.md

->Running the Project

1. Install dependencies
npm.cmd install

2. Configure environment variables
Create a .env file containing the required MySQL and JWT configuration.

3. Configure MySQL
Create the required database and tables using the SQL files provided in the project.

4. Start the server
npm.cmd start

->For development:
npm.cmd run dev

->Project Highlights

•Complete shopping workflow
•Secure authentication
•Persistent MySQL data
•Stock-aware ordering
•User-specific order management
•Responsive frontend interface
•REST API based backend

->Internship
Developed as Task 1 of the CodeAlpha Full Stack Development Internship – September 2026 Batch.

->Author
Spoorthi K M