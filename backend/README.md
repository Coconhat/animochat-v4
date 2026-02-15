# AniMoChat Server

Anonymous chat server built with Express, Socket.IO, and Redis for horizontal scaling.

## Features

- **Real-time Messaging**: WebSocket-based communication via Socket.IO
- **Sophisticated Matchmaking**: Random matching with rematch prevention
- **Horizontal Scaling**: Redis adapter for multi-server deployment
- **Race Condition Protection**: Distributed locks for matchmaking
- **Cooldown System**: Prevents spam and back-to-back rematches
- **Typing Indicators**: Real-time typing status

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client 1      │     │   Client 2      │     │   Client 3      │
│  (Browser)      │     │  (Browser)      │     │  (Browser)      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Load Balancer        │
                    │    (Nginx/HAProxy)      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│  Server 1       │     │  Server 2       │     │  Server 3       │
│  (Node.js)      │     │  (Node.js)      │     │  (Node.js)      │
│  Socket.IO      │     │  Socket.IO      │     │  Socket.IO      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Redis Cluster      │
                    │  (Pub/Sub + Storage)    │
                    └─────────────────────────┘
```

## Matchmaking Algorithm

1. **User requests match** → Added to waiting pool
2. **Filter candidates**:
   - Exclude self
   - Exclude users in active rooms
   - Exclude previously matched users (24h history)
   - Exclude users in cooldown
3. **Random selection** from valid candidates
4. **Acquire distributed lock** (prevents race conditions)
5. **Double-check validity** (still available)
6. **Create room** and notify both users
7. **Release lock**

## API Endpoints

### REST
- `GET /health` - Health check
- `GET /stats` - Server statistics (online users, waiting users)

### Socket.IO Events

**Client → Server**
- `find-match` - Start looking for a match
- `cancel-match` - Cancel matchmaking
- `next-match` - Skip current partner and find new match
- `send-message` - Send a message
- `typing` - Send typing indicator
- `leave-room` - Leave current chat room

**Server → Client**
- `matched` - Successfully matched with a partner
- `waiting` - Waiting for a match
- `message` - New message received
- `partner-typing` - Partner is typing
- `partner-disconnected` - Partner left the room
- `match-cancelled` - Matchmaking cancelled
- `error` - Error occurred
- `online-count` - Updated online user count

## Getting Started

### Prerequisites
- Node.js 18+
- Redis server

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build
npm run build

# Start
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t animochat-server .

# Run container
docker run -p 3001:3001 --env-file .env animochat-server
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `CLIENT_URL` | Client URL for CORS | http://localhost:5173 |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |

## Horizontal Scaling

To scale horizontally:

1. Set up Redis Cluster
2. Deploy multiple server instances
3. Use a load balancer (Nginx/HAProxy) with sticky sessions
4. Configure `REDIS_URL` to point to the cluster

The matchmaking algorithm uses Redis distributed locks to prevent race conditions when multiple servers try to match the same users.

## License

MIT
