const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const taskRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);

const boardConnections = {};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const { type, boardId, payload } = message;

      if (type === 'JOIN_BOARD') {
        ws.userId = payload.userId;
        ws.boardId = boardId;
        
        if (!boardConnections[boardId]) {
          boardConnections[boardId] = [];
        }
        boardConnections[boardId].push(ws);
        
        broadcast(boardId, {
          type: 'USER_JOINED',
          userId: payload.userId
        });
      } else if (type === 'BOARD_UPDATE') {
        broadcast(boardId, {
          type: 'BOARD_UPDATED',
          payload: payload
        });
      } else if (type === 'TASK_MOVED') {
        broadcast(boardId, {
          type: 'TASK_MOVED',
          payload: payload
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.boardId && boardConnections[ws.boardId]) {
      boardConnections[ws.boardId] = boardConnections[ws.boardId].filter(
        client => client !== ws
      );
    }
    console.log('Client disconnected');
  });
});

function broadcast(boardId, message) {
  if (boardConnections[boardId]) {
    boardConnections[boardId].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});