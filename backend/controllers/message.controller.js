import messageModel from '../models/message.model.js';
import { validationResult } from 'express-validator';

export const getProjectMessages = async (req, res) => {
    const { projectId } = req.params;
    
    try {
        const messages = await messageModel.find({ projectId })
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages for performance
        
        return res.status(200).json({
            messages
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};

export const saveMessage = async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { projectId, sender, message } = req.body;
        
        const newMessage = new messageModel({
            projectId,
            sender,
            message
        });
        
        const savedMessage = await newMessage.save();
        
        return res.status(201).json({
            message: savedMessage
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};
