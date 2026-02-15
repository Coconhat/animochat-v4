# AniMoChat Quick Start Guide

## Option 1: Run Locally (Recommended for Testing)

### Prerequisites
- Node.js 18+ installed
- Redis installed (optional for demo mode)

### Step 1: Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:3001

### Step 2: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

---

## Option 2: Deploy to Production

### Frontend (Vercel)

1. Push the `frontend` folder to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variable:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
   ```
5. Deploy

### Backend (VPS)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed VPS setup.

Quick VPS setup:

```bash
# On your VPS
apt update && apt install -y nodejs npm redis-server nginx

# Start Redis
systemctl start redis

# Setup backend
cd /var/www/animochat/backend
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name animochat
```

---

## File Naming Convention (BBQ Format)

All files use **kebab-case** (BBQ format):

| Old Name | New Name |
|----------|----------|
| `ChatContext.tsx` | `chat-context.tsx` |
| `MessageList.tsx` | `message-list.tsx` |
| `MessageInput.tsx` | `message-input.tsx` |
| `StatusIndicator.tsx` | `status-indicator.tsx` |
| `ChatInterface.tsx` | `chat-interface.tsx` |
| `ChatHeader.tsx` | `chat-header.tsx` |

---

## Demo Mode

Located in `frontend/components/chat-context.tsx`:

```typescript
// ============================================
// DEMO MODE CONFIGURATION
// Set to false to use real Socket.IO server
// ============================================
export const DEMO_MODE = true;  // <-- Change this to false
```

When `DEMO_MODE = true`:
- No backend needed
- Simulated matches
- Fake messages
- Perfect for UI testing

When `DEMO_MODE = false`:
- Requires backend running
- Real Socket.IO connection
- Real matchmaking

---

## Project Structure

```
animochat/
├── frontend/          # Next.js app
│   ├── app/          # Pages
│   ├── components/   # React components (kebab-case)
│   ├── lib/          # Utilities
│   └── types/        # TypeScript types
│
├── backend/          # Express server
│   └── src/
│       ├── services/ # Redis, Matchmaking, Socket
│       └── types/    # TypeScript types
│
├── DEPLOYMENT.md     # Full deployment guide
├── QUICK_START.md    # This file
└── README.md         # Project overview
```

---

## Common Issues

### npm install hangs
```bash
# Try with different registry
npm install --registry https://registry.npmjs.org

# Or use yarn
yarn install
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3002
```

### Redis connection failed
```bash
# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:latest
```

---

## Environment Variables

### Backend .env
```bash
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Frontend .env.local
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Need Help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment
2. Check [README.md](./README.md) for project overview
3. Open an issue on GitHub
