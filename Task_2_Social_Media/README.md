# Social Media Platform

A full-stack social media platform developed as part of the **CodeAlpha Full Stack Development Internship – September 2026 Batch**.

The application combines social networking features, content interaction, short-form content, quizzes, and real-time messaging.

## Features

### User System

- User registration
- User login
- JWT authentication
- User profiles
- Password hashing

### Social Features

- Create posts
- View posts
- Comments
- Likes
- Follow users
- Persistent social interactions

### Shorts

- Short-form content
- Persistent likes
- Like state stored in MySQL

### Quiz

- Quiz question bank
- Aptitude questions
- Coding questions
- Education questions
- Riddles
- User quiz answers

### Chat

- Real-time messaging
- Socket.IO communication
- Persistent messages
- User-to-user conversations

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt.js
- CORS
- dotenv

### Database

- MySQL
- mysql2

## Architecture

```text
Browser
   │
   ├── HTML / CSS / JavaScript
   │
   ↓
Express.js REST API
   │
   ├── Authentication
   ├── Users
   ├── Posts
   ├── Comments
   ├── Likes
   ├── Follows
   ├── Shorts
   └── Quiz
   │
   ↓
MySQL Database

Socket.IO
   │
   └── Real-Time Chat

->Database

The application uses MySQL with tables for:
•Users
•Posts
•Comments
•Likes
•Follows
•Shorts
•Quiz questions
•User quiz answers
•Short likes
•Messages

->Authentication

JWT authentication is used to protect user-specific API operations.
Passwords are hashed using bcrypt before being stored.

->Real-Time Communication

Socket.IO is used for real-time messaging.

Messages are also stored in MySQL so that conversations persist after refreshing or reopening the application.

->Project Structure

Task_2_Social_Media/
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
Create a .env file with the required MySQL and JWT configuration.

3. Configure MySQL
Create the required database and tables using the SQL files provided in the project.

4. Start the server
npm.cmd start

• For development:
npm.cmd run dev

->Project Highlights

•Full-stack social media workflow
•JWT authentication
•MySQL persistence
•Social interactions
•Short-form content
•Quiz functionality
•Real-time chat
•Socket.IO integration
•Responsive frontend

->Internship
Developed as Task 2 of the CodeAlpha Full Stack Development Internship – September 2026 Batch.

->Author
Spoorthi K M
