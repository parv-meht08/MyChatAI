import express from 'express';
import { getProjectMessages, saveMessage } from '../controllers/message.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Get project messages
router.get('/project/:projectId', authUser, getProjectMessages);

// Save a message
router.post('/save', authUser, [
    body('projectId').isMongoId().withMessage('Valid project ID is required'),
    body('sender._id').notEmpty().withMessage('Sender ID is required'),
    body('sender.email').isEmail().withMessage('Valid sender email is required'),
    body('message').notEmpty().withMessage('Message content is required')
], saveMessage);

export default router;
