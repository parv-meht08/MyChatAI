import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    sender: {
        _id: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ projectId: 1, timestamp: -1 });

const Message = mongoose.model('message', messageSchema);

export default Message;
