import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', authMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.userId !== req.params.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { username, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username, avatar },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
