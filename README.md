# MyChatAI - Collaborative Code Editor with AI

A real-time collaborative code editor with AI assistance, built with React, Node.js, Socket.IO, and MongoDB.

## Features

- 🔐 **User Authentication** - Secure login/register system
- 👥 **Real-time Collaboration** - Multiple users can work on the same project simultaneously
- 🤖 **AI Integration** - AI assistance for code generation and help
- 💬 **Chat History** - Persistent chat messages for each project
- 🚀 **Code Execution** - Run code directly in the browser using WebContainer
- 📁 **File Management** - Create and edit multiple files in projects
- 🎨 **Modern UI** - Clean and responsive interface

## Issues Fixed

### 1. Authentication Problem ✅
- **Issue**: After login, users couldn't access dashboard by typing URL directly
- **Fix**: Updated `UserAuth.jsx` to properly verify token with backend on page refresh
- **Solution**: Added token verification API call in authentication middleware

### 2. Project Creation Issues ✅
- **Issue**: New projects weren't immediately visible and modal behavior was inconsistent
- **Fix**: Improved project creation flow with immediate UI updates and better modal handling
- **Solution**: Added loading states, optimistic updates, and better error handling

### 3. Chat History Missing ✅
- **Issue**: Old chat messages weren't accessible when returning to projects
- **Fix**: Created complete message storage system with MongoDB
- **Solution**: 
  - Added `Message` model for storing chat history
  - Created message API endpoints for saving and retrieving messages
  - Updated socket.io to save messages to database
  - Added chat history loading in Project component

### 4. Collaborator Display Issues ✅
- **Issue**: Collaborator emails weren't showing properly in the UI
- **Fix**: Updated user population and display logic
- **Solution**: Enhanced user data handling to properly show emails from populated user objects

### 5. Code Execution Improvements ✅
- **Issue**: Run button functionality needed better error handling and user feedback
- **Fix**: Added proper error handling and user feedback for code execution
- **Solution**: Added try-catch blocks, loading states, and user notifications

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Google Generative AI** for AI assistance
- **WebContainer** for code execution

### Frontend
- **React** with hooks
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time features
- **Axios** for API calls
- **Markdown-to-JSX** for AI response rendering

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Google AI API key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_AI_KEY=your_google_ai_api_key
   PORT=3000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Project**: Click "New Project" to create a new collaborative workspace
3. **Add Collaborators**: Invite other users to collaborate on your project
4. **Chat with AI**: Use `@ai` in messages to get AI assistance
5. **Code Together**: Edit files and see changes in real-time
6. **Run Code**: Click the "Run" button to execute your code in the browser

## API Endpoints

### Authentication
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile

### Projects
- `GET /projects/all` - Get all user projects
- `POST /projects/create` - Create new project
- `GET /projects/get-project/:id` - Get project details
- `PUT /projects/add-user` - Add collaborators
- `PUT /projects/update-file-tree` - Update project files

### Messages
- `GET /messages/project/:projectId` - Get project chat history
- `POST /messages/save` - Save a message

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
# MyChatAI
