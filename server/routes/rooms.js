import express from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, type, description } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Room name required'
            });
        }

        const room = new Room({
            name,
            type: type || 'public',
            description,
            createdBy: req.userId,
            members: [req.userId]
        });

        await room.save();
        await room.populate('createdBy members', '-password');

        res.status(201).json(room);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to create room'
        });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { type: 'public' },
                { members: req.userId }
            ]
        }).populate('createdBy members', '-password');

        res.json(rooms);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to fetch rooms'
        });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('createdBy members', '-password');

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        res.json(room);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to fetch room'
        });
    }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                error: 'Room not found'
            });
        }

        if (!room.members.includes(req.userId)) {
            room.members.push(req.userId);
            await room.save();
        }

        await room.populate('createdBy members', '-password');
        res.json(room);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to join room'
        });
    }
});

router.post('/:id/leave', authMiddleware, async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: req.userId } },
            { new: true }
        ).populate('createdBy members', '-password');

        res.json(room);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to leave room'
        });
    }
});

router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ room: req.params.id })
            .populate('sender', '-password')
            .populate('reactions.user', '-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({ room: req.params.id });

        res.json({
            messages: messages.reverse(),
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({
            error: 'Failed to fetch messages'
        });
    }
});

export default router;
