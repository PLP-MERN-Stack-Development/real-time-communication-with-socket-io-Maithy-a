import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email },
                { username }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: user.toJSON()
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        const token = generateToken(user._id);
        res.json({
            token,
            user: user.toJSON()
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, {
            isOnline: false,
            lastSeen: new Date()
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({
            error: 'Logout failed'
        });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user.toJSON());
    } catch (err) {
        res.status(500).json({
            error: 'Failed to get user'
        });
    }
});

export default router;
