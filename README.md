# TaskFlow - Task Management System

A comprehensive task management system built with React, Node.js, Express, MongoDB, JWT authentication, and WebSocket for real-time collaboration.

## Features

- User Authentication with JWT
- Create and manage task boards
- Drag and drop task management (To Do, Ongoing, Done)
- Real-time collaboration using WebSocket
- Task editing, deletion, and due date assignment
- Calendar view with upcoming tasks
- Responsive design with modern UI

## Technology Stack

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- WebSocket for real-time communication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- React Beautiful DND for drag and drop
- Axios for API calls
- WebSocket for real-time updates

## Color Scheme
- Header: #03045e
- Sidebar: #0077b6
- Background: #ade8f4

## Installation

### Backend Setup

```bash
cd backend
npm install
```

Configure `.env` file with MongoDB connection string and JWT secret.

```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/user` - Get current user

### Boards
- POST `/api/boards` - Create board
- GET `/api/boards` - Get user's boards
- GET `/api/boards/:id` - Get board details
- PUT `/api/boards/:id` - Update board
- DELETE `/api/boards/:id` - Delete board

### Tasks
- POST `/api/tasks` - Create task
- GET `/api/tasks/board/:boardId` - Get board's tasks
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

## WebSocket Events

- `JOIN_BOARD` - Join a board for real-time updates
- `BOARD_UPDATE` - Broadcast board changes
- `TASK_MOVED` - Notify task status changes

## Usage

1. Sign up for an account
2. Create a new board
3. Add tasks to your board
4. Drag tasks between columns to change status
5. Set due dates and priorities
6. View all tasks in the calendar
7. Collaborate with team members in real-time
