# FlowPilot – Smart Project Management Tool

FlowPilot is a full-stack project management platform developed as part of the **CodeAlpha Full Stack Development Internship – September 2026 Batch**.

It helps teams organize projects, assign tasks, collaborate with team members, track progress, and receive project-related notifications.

## Features

### Authentication

- User registration
- User login
- JWT authentication
- Password hashing
- Protected API routes

### User Profiles

- User profile
- Bio
- Profile picture
- Profile statistics

### Project Management

- Create projects
- Update projects
- Delete projects
- Project descriptions
- Project status
- Start dates
- Deadlines
- Project members
- Member roles

### Task Management

- Kanban-style task management
- Create tasks
- Assign tasks
- Task status
- Task priority
- Task deadlines
- Update tasks
- Delete tasks
- My Tasks view

### Collaboration

- Task comments
- Project activity
- Team member management
- User-specific notifications

### Real-Time Features

- Socket.IO integration
- Real-time project events
- Real-time task and comment events
- Notification events

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Responsive SaaS-style UI

### Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt.js
- Multer
- CORS
- dotenv

### Database

- MySQL
- mysql2

## Architecture

```text
                    FlowPilot
                       │
              ┌────────┴────────┐
              │                 │
          Frontend           Backend
              │                 │
       HTML/CSS/JS         Express.js
                                │
                    ┌───────────┼───────────┐
                    │           │           │
               REST APIs     JWT Auth    Socket.IO
                    │
                    ↓
                 MySQL
                    │
        ┌───────────┼────────────┐
        │           │            │
      Users      Projects       Tasks
        │           │            │
        │        Members       Comments
        │           │            │
        └───────────┴────────────┘
                    │
              Notifications

->Database

The MySQL database contains relational tables for:
•Users
•Projects
•Project members
•Tasks
•Comments
•Notifications
•Project activity

Foreign keys are used to maintain relationships between users, projects, tasks, comments, and notifications.

->Authentication & Security

FlowPilot uses:
•JWT authentication
•Protected API routes
•Password hashing using bcrypt
•User-specific data access
•Project membership checks
•Owner and admin permission checks

->Real-Time Communication

Socket.IO is integrated for real-time application events.
The system supports real-time updates for project and collaboration activities without requiring a full page refresh.

->Profile Pictures

Users can upload profile pictures using Multer.
Supported image formats include:
•JPG
•PNG
•WebP

Uploaded profile images are served through the application's /uploads route.

->Project Structure

Task_3_Project_Management/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── projects.html
│   ├── project.html
│   ├── my-tasks.html
│   ├── notifications.html
│   └── profile.html
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   └── routes/
│
├── database/
├── package.json
├── package-lock.json
└── README.md

->Running the Project

1. Install dependencies
npm.cmd install

2. Configure environment variables
Create a .env file with the required MySQL and JWT configuration.

Example:
PORT=5002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=flowpilot_db
JWT_SECRET=your_secret_key

3. Configure MySQL
Create the flowpilot_db database and execute the SQL schema provided in the database directory.

4. Start the server
npm.cmd start

•For development:
npm.cmd run dev

The application runs on:
http://localhost:5002

->Project Highlights

•Full-stack project management system
•Kanban-style task workflow
•Team collaboration
•Role-based project access
•JWT authentication
•MySQL relational database
•Task assignment and tracking
•Comments and project activity
•Notifications
•Real-time Socket.IO events
•Profile picture uploads
•Responsive SaaS-style interface

->Internship

Developed as Task 3 of the CodeAlpha Full Stack Development Internship – September 2026 Batch.

->Author
Spoorthi K M              

