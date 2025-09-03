import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import messageModel from './models/message.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        socket.project = await projectModel.findById(projectId);
        if (!socket.project) {
            return next(new Error('Project not found'));
        }

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        socket.user = decoded;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(error);
    }
});

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {


            const prompt = message.replace('@ai', '');

            const result = await generateResult(prompt);
            let parsedResult;
            
            try {
                // Parse the result to ensure it's a proper object
                parsedResult = JSON.parse(result);
            } catch (e) {
                // If parsing fails, use the result as plain text
                parsedResult = { text: result };
            }

            io.to(socket.roomId).emit('project-message', {
                message: parsedResult,
                sender: {
                    _id: 'ai',
                    email: 'AI Assistant'
                },
                isAI: true,
                timestamp: new Date().toISOString()
            })


            return
        }


    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});