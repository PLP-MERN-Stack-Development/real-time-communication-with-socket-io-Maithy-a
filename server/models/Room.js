import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '#'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

roomSchema.index({ members: 1 });
roomSchema.index({ type: 1 });

export default mongoose.model('Room', roomSchema);
