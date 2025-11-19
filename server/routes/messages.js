import express from 'express';
import Message from '../models/Message.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { text, receiverId, roomId, file } = req.body;

        if (!text && !file) {
            return res.status(400).json({
                error: 'Message or file required'
            });
        }

        const msg = new Message({
            sender: req.userId,
            receiver: receiverId,
            room: roomId,
            text,
            file: file ? {
                filename: file.filename,
                filepath: file.filepath,
                mimetype: file.mimetype
            } : undefined
        });

        await msg.save();
        await msg.populate('sender', '-password');
        await msg.populate('reactions.user', '-password');

        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save message' });
    }
});

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query, roomId } = req.query;

        if (!query) {
            return res.status(400).json({
                error: 'Search query required'
            });
        }

        const filter = {
            $or: [
                { text: { $regex: query, $options: 'i' } }
            ]
        };

        if (roomId) {
            filter.room = roomId;
        }

        const messages = await Message.find(filter)
            .populate('sender', '-password')
            .populate('reactions.user', '-password')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const msg = await Message.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        ).populate('sender', '-password');

        res.json(msg);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to mark as read'
        });
    }
});

router.post('/:id/reaction', authMiddleware, async (req, res) => {
    try {
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ error: 'Emoji required' });
        }

        const msg = await Message.findById(req.params.id);

        const existingReaction = msg.reactions.find(
            r => r.user.toString() === req.userId && r.emoji === emoji
        );

        if (existingReaction) {
            msg.reactions = msg.reactions.filter(
                r => !(r.user.toString() === req.userId && r.emoji === emoji)
            );
        } else {
            msg.reactions.push({
                user: req.userId,
                emoji
            });
        }

        await msg.save();
        await msg.populate('sender', '-password');
        await msg.populate('reactions.user', '-password');

        res.json(msg);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

router.get('/private/:userId', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: req.userId, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.userId }
            ]
        })
            .populate('sender', '-password')
            .populate('reactions.user', '-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({
            $or: [
                { sender: req.userId, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.userId }
            ]
        });

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
