import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';

import { socketAuthMiddleware } from './middleware/auth.js';
import { uploadMiddleware } from './middleware/upload.js';

import {
    handleConnection,
    handleDisconnect,
    handleJoinRoom,
    handleLeaveRoom,
    handleSendMessage,
    handleTyping,
    handleMessageRead,
    handleReaction
} from './socket/handlers.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

app.post('/api/upload', uploadMiddleware.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = {
            filename: req.file.filename,
            filepath: `/uploads/${req.file.filename}`,
            mimetype: req.file.mimetype
        };

        res.json(file);
    } catch (err) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    handleConnection(socket, io);

    socket.on('join_room', (roomId) => {
        handleJoinRoom(socket, roomId, io);
    });

    socket.on('leave_room', (roomId) => {
        handleLeaveRoom(socket, roomId, io);
    });

    socket.on('send_message', (data) => {
        handleSendMessage(socket, data, io);
    });

    socket.on('typing', (data) => {
        handleTyping(socket, data, io);
    });

    socket.on('message_read', (messageId) => {
        handleMessageRead(socket, messageId, io);
    });

    socket.on('reaction', (data) => {
        handleReaction(socket, data, io);
    });

    socket.on('disconnect', () => {
        handleDisconnect(socket, io);
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Chat server running on port: ${PORT}`);
});
