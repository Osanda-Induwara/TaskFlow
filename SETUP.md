# TaskFlow - Task Management System

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (running locally or connection string configured)

### Quick Start

1. **Install all dependencies:**
   ```bash
   npm run dev
   ```
   This will install dependencies for both frontend and backend.

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` at the root level
   - Copy `backend/.env.example` to `backend/.env` and configure:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure secret for JWT tokens
   - Copy `frontend/.env.example` to `frontend/.env`

3. **Run the development servers:**

   **Terminal 1 - Backend:**
   ```bash
   npm run dev:backend
   ```
   Backend runs on `http://localhost:5000`

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev:frontend
   ```
   Frontend runs on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Install all dependencies
- `npm run dev:backend` - Start backend dev server with hot-reload
- `npm run dev:frontend` - Start frontend dev server
- `npm run build` - Build frontend and prepare backend

### Project Structure

```
TaskFlow/
├── backend/           # Express.js API server
│   ├── routes/        # API routes
│   ├── models/        # MongoDB models
│   ├── middleware/    # Express middleware
│   └── server.js      # Main server file
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── styles/      # CSS files
│   └── public/          # Static assets
└── package.json       # Root package.json
```

### Environment Variables

**Backend (.env):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT authentication
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

**Frontend (.env):**
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000)

### Troubleshooting

**npm install fails with certificate error:**
- The `npm run dev` command uses `--legacy-peer-deps` flag to work around certificate issues
- If you get SSL errors, the setup script handles this automatically

**MongoDB connection fails:**
- Ensure MongoDB is running: `mongod`
- Check your `MONGODB_URI` in `.env`

**Port already in use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Run with `PORT=3001 npm run dev:frontend`

### Building for Production

```bash
npm run build
```

This builds the React frontend and prepares the backend for production deployment.
