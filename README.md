# Real-Time Collaborative Chat App

A full-stack real-time chat application built with the MERN stack and WebSockets.

## Tech Stack

- **Frontend**: React.js (Vite), Socket.IO Client, Axios, React Router
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB (Mongoose) — MongoDB Atlas
- **Auth**: JWT (JSON Web Tokens), bcrypt
- **Cache / Pub-Sub**: Redis (coming soon)
- **DevOps**: Docker, Nginx (coming soon)

## Features

- ✅ User registration and login
- ✅ JWT authentication with protected routes
- ✅ Real-time messaging with Socket.IO
- ✅ Socket.IO rooms for group chats
- 🔲 1-to-1 private messaging
- 🔲 Group chats and workspaces
- 🔲 Typing indicators
- 🔲 Read receipts and message delivery status
- 🔲 Online presence tracking
- 🔲 File sharing (AWS S3 / Cloudinary)
- 🔲 Message search, pinning, starring
- 🔲 Push notifications
- 🔲 Redis caching and session management
- 🔲 Docker containerization
- 🔲 CI/CD pipeline

## Project Structure

```
real-time-chat/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page level components
│       ├── hooks/           # Custom React hooks
│       ├── context/         # Auth, Socket context
│       ├── services/        # Axios API instance
│       ├── socket/          # Socket.IO client
│       └── utils/           # Helper functions
│
├── server/                  # Express backend
│   ├── config/              # DB and Redis config
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handling
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── sockets/             # Socket.IO handlers
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
│
├── redis/                   # Redis config
├── docker/                  # Dockerfiles
├── nginx/                   # Nginx config
├── docs/                    # Documentation
└── tests/                   # Tests
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

```bash
# Clone the repo
git clone https://github.com/05kartikey/real-time-chat.git
cd real-time-chat

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

### Running the App

```bash
# Start the server
cd server
npm run dev

# Start the client (new terminal)
cd client
npm run dev
```

- Client → http://localhost:5173
- Server → http://localhost:5000

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register a new user | ❌ |
| POST | /api/auth/login | Login and get token | ❌ |
| GET | /api/me | Get current user | ✅ |
| GET | /api/health | Server health check | ❌ |
