import mongoose from "mongoose";

const chatScheme = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: false
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: false
    },

    message: {
        type: String,
        require: false
    },
    is_read: {
        type: Boolean,
        require:false,
        default: false
    },
    is_blocked: {
        type: Boolean,
require:false,
        default: false
    },
}, { timestamps: true });

export const Chat = mongoose.model('Chat', chatScheme);
