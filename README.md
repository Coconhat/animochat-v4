# AniMoChat

Anonymous real-time chat application built with Next.js, Express, Socket.IO, and Redis.

![AniMoChat](https://img.shields.io/badge/AniMoChat-Anonymous%20Chat-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)

## Features

- **Truly Anonymous** - No signup, no email, no phone number required
- **Random Matching** - Get paired with strangers instantly
- **Real-time Chat** - WebSocket-powered messaging with typing indicators
- **Skip Anytime** - Find a new match with one click
- **Mobile Responsive** - Works perfectly on all devices
- **Horizontal Scaling Ready** - Redis-based architecture for multiple servers

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication

### Backend
- **Express.js** - Node.js web framework
- **Socket.IO** - WebSocket library
- **Redis** - In-memory data store
- **TypeScript** - Type-safe development

## Project Structure

```
animochat/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── chat-context.tsx # Chat state management
│   │   ├── chat-header.tsx  # Chat header
│   │   ├── chat-interface.tsx
│   │   ├── message-input.tsx
│   │   ├── message-list.tsx
│   │   ├── status-indicator.tsx
│   │   └── landing/         # Landing page sections
│   ├── components/ui/       # UI components
│   │   └── button.tsx       # Button component
│   ├── lib/                 # Utilities
│   │   └── utils.ts         # Helper functions
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                  # Express backend
│   ├── src/
│   │   ├── index.ts         # Entry point
│   │   ├── types/
│   │   │   └── index.ts     # Type definitions
│   │   └── services/
│   │       ├── redis-service.ts
│   │       ├── matchmaking-service.ts
│   │       └── socket-service.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (for backend)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/animochat.git
cd animochat
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Build TypeScript
npm run build

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Configure Environment Variables

**Backend `.env`:**
```bash
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Demo Mode

The frontend includes a **DEMO_MODE** flag in `components/chat-context.tsx`:

```typescript
export const DEMO_MODE = true;  // Set to false for real server
```

When `DEMO_MODE = true`:
- Simulated matches (no backend needed)
- Fake partner messages
- Perfect for testing UI

When `DEMO_MODE = false`:
- Connects to real Socket.IO server
- Requires backend to be running

## Matchmaking Algorithm

The backend implements a sophisticated matchmaking system:

1. **Random Selection** - Picks from available users
2. **Rematch Prevention** - 24-hour history tracking
3. **Cooldown System** - 5-second delay between skips
4. **Race Condition Protection** - Distributed locks via Redis
5. **Small Pool Handling** - Retries with timeout

### Key Features

| Feature | Implementation |
|---------|---------------|
| Online Users | Redis Set |
| Waiting Pool | Redis Set |
| Active Rooms | Redis Hash |
| Match History | Redis Set (24h TTL) |
| Cooldowns | Redis Key (5s TTL) |
| Locks | Redis Key (5s TTL) |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Deploying backend to Hostinger VPS
- Deploying frontend to Vercel
- Setting up Redis
- Configuring SSL/HTTPS
- Troubleshooting

### Quick Deploy

**Backend (VPS):**
```bash
cd backend
npm install
npm run build
pm2 start dist/index.js --name animochat
```

**Frontend (Vercel):**
```bash
# Push to GitHub, then import to Vercel
# Set environment variable: NEXT_PUBLIC_SOCKET_URL
```

## API Endpoints

### REST
- `GET /health` - Health check
- `GET /stats` - Server statistics

### Socket.IO Events

**Client → Server:**
- `find-match` - Start matchmaking
- `cancel-match` - Cancel search
- `next-match` - Skip current partner
- `send-message` - Send message
- `typing` - Typing indicator
- `leave-room` - Exit chat

**Server → Client:**
- `matched` - Successfully paired
- `waiting` - Searching for match
- `message` - New message
- `partner-typing` - Partner typing status
- `partner-disconnected` - Partner left
- `online-count` - Updated user count

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `CLIENT_URL` | Frontend URL | http://localhost:3000 |
| `REDIS_URL` | Redis connection | redis://localhost:6379 |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Backend URL | http://localhost:3001 |

## Scripts

### Backend
```bash
npm run dev      # Development with hot reload
npm run build    # Build TypeScript
npm start        # Production start
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Open an issue on GitHub
- Check logs: `pm2 logs` (backend) or browser console (frontend)

---

Built with ❤️ for anonymous conversations
