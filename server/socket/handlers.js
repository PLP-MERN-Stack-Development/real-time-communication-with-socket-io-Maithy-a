import User from '../models/User.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';

const userSockets = new Map();

export const handleConnection = async (socket, io) => {
    const userId = socket.userId;
    userSockets.set(userId, socket.id);

    const user = await User.findByIdAndUpdate(
        userId,
        { isOnline: true, lastSeen: new Date() },
        { new: true }
    );

    io.emit('user_online', {
        userId: user._id,
        username: user.username,
        avatar: user.avatar
    });

    socket.emit('connection_success', { userId });
};

export const handleDisconnect = async (socket, io) => {
    const userId = socket.userId;

    const user = await User.findByIdAndUpdate(
        userId,
        { isOnline: false, lastSeen: new Date() },
        { new: true }
    );

    userSockets.delete(userId);

    io.emit('user_offline', {
        userId: user._id,
        lastSeen: user.lastSeen
    });
};

export const handleJoinRoom = async (socket, roomId, io) => {
    try {
        const room = await Room.findByIdAndUpdate(
            roomId,
            { $addToSet: { members: socket.userId } },
            { new: true }
        ).populate('members', '-password');

        socket.join(`room_${roomId}`);

        io.to(`room_${roomId}`).emit('user_joined_room', {
            userId: socket.userId,
            roomId,
            membersCount: room.members.length
        });
    } catch (err) {
        socket.emit('error', { error: 'Failed to join room' });
    }
};

export const handleLeaveRoom = async (socket, roomId, io) => {
    try {
        const room = await Room.findByIdAndUpdate(
            roomId,
            { $pull: { members: socket.userId } },
            { new: true }
        );

        socket.leave(`room_${roomId}`);

        io.to(`room_${roomId}`).emit('user_left_room', {
            userId: socket.userId,
            roomId,
            membersCount: room.members.length
        });
    } catch (err) {
        socket.emit('error', { error: 'Failed to leave room' });
    }
};

export const handleSendMessage = async (socket, data, io) => {
    try {
        const { text, receiverId, roomId, file } = data;

        if (!text && !file) {
            socket.emit('error', { error: 'Message or file required' });
            return;
        }

        const msg = new Message({
            sender: socket.userId,
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

        if (roomId) {
            io.to(`room_${roomId}`).emit('receive_message', msg);
        } else if (receiverId) {
            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit('receive_message', msg);
            }
            socket.emit('receive_message', msg);
        }
    } catch (err) {
        socket.emit('error', { error: 'Failed to send message' });
    }
};

export const handleTyping = (socket, data, io) => {
    const { receiverId, roomId, isTyping } = data;

    if (roomId) {
        socket.to(`room_${roomId}`).emit('user_typing', {
            userId: socket.userId,
            isTyping
        });
    } else if (receiverId) {
        const receiverSocket = userSockets.get(receiverId);
        if (receiverSocket) {
            io.to(receiverSocket).emit('user_typing', {
                userId: socket.userId,
                isTyping
            });
        }
    }
};

export const handleMessageRead = async (socket, messageId, io) => {
    try {
        const msg = await Message.findByIdAndUpdate(
            messageId,
            { isRead: true },
            { new: true }
        ).populate('sender', '-password');

        if (msg.room) {
            io.to(`room_${msg.room}`).emit('message_read', { messageId });
        } else if (msg.receiver) {
            const senderSocket = userSockets.get(msg.sender);
            if (senderSocket) {
                io.to(senderSocket).emit('message_read', { messageId });
            }
        }
    } catch (err) {
        socket.emit('error', { error: 'Failed to mark as read' });
    }
};

export const handleReaction = async (socket, data, io) => {
    try {
        const { messageId, emoji } = data;

        const msg = await Message.findById(messageId);
        const existingReaction = msg.reactions.find(
            r => r.user.toString() === socket.userId && r.emoji === emoji
        );

        if (existingReaction) {
            msg.reactions = msg.reactions.filter(
                r => !(r.user.toString() === socket.userId && r.emoji === emoji)
            );
        } else {
            msg.reactions.push({
                user: socket.userId,
                emoji
            });
        }

        await msg.save();
        await msg.populate('sender', '-password');
        await msg.populate('reactions.user', '-password');

        if (msg.room) {
            io.to(`room_${msg.room}`).emit('reaction_updated', msg);
        } else {
            const receiverSocket = userSockets.get(msg.receiver);
            if (receiverSocket) {
                io.to(receiverSocket).emit('reaction_updated', msg);
            }
            socket.emit('reaction_updated', msg);
        }
    } catch (err) {
        socket.emit('error', { error: 'Failed to add reaction' });
    }
};

export const handleCall = (socket, data, io) => {
    const { receiverId, signalData } = data;
    const receiverSocket = userSockets.get(receiverId);

    if (receiverSocket) {
        io.to(receiverSocket).emit('incoming_call', {
            from: socket.userId,
            signalData
        });
    }
};

export const handleAnswerCall = (socket, data, io) => {
    const { to, signalData } = data;
    const targetSocket = userSockets.get(to);

    if (targetSocket) {
        io.to(targetSocket).emit('call_answered', {
            from: socket.userId,
            signalData
        });
    }
};
