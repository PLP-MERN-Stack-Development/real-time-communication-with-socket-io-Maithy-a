import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
    },
    text: {
        type: String,
        default: ""
    },
    file: {
        filename: String,
        filepath: String,
        mimetype: String,
    },
    isRead: {
        type: Boolean,
        default: false
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        emoji: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1 });

export default mongoose.model("Message", messageSchema);
