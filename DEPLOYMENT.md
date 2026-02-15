# AniMoChat Deployment Guide

This guide covers deploying AniMoChat with:
- **Frontend**: Vercel (free tier)
- **Backend**: Hostinger VPS (or any VPS)
- **Database**: Redis (on VPS)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Hostinger VPS)](#backend-deployment-hostinger-vps)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Environment Variables](#environment-variables)
5. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need

1. **Domain Name** (optional but recommended)
   - Buy from Namecheap, Cloudflare, or any registrar
   
2. **Hostinger VPS** (or any VPS provider)
   - Recommended: KVM 2 plan ($6.99/month) or higher
   - Ubuntu 22.04 LTS
   
3. **Vercel Account**
   - Free tier is sufficient
   - Connect your GitHub account

4. **Redis**
   - Will be installed on the VPS

---

## Backend Deployment (Hostinger VPS)

### Step 1: Buy and Setup VPS

1. Go to [Hostinger](https://www.hostinger.com/vps-hosting)
2. Select **KVM 2** plan or higher
3. Choose **Ubuntu 22.04 LTS**
4. Complete the purchase
5. Note down the VPS IP address

### Step 2: Connect to VPS

```bash
# On Windows (PowerShell) or Mac/Linux
ssh root@YOUR_VPS_IP

# Enter the password provided by Hostinger
```

### Step 3: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl wget git nginx ufw

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x

# Install Redis
apt install -y redis-server

# Start Redis
systemctl start redis
systemctl enable redis

# Verify Redis
redis-cli ping  # Should return PONG
```

### Step 4: Setup Firewall

```bash
# Allow SSH
ufw allow 22

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Allow your backend port
ufw allow 3001

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 5: Create App Directory

```bash
# Create directory
mkdir -p /var/www/animochat

# Set permissions
chown -R $USER:$USER /var/www/animochat
```

### Step 6: Upload Backend Code

**Option A: Using Git (Recommended)**

```bash
cd /var/www/animochat

# Clone your repository (if you pushed to GitHub)
git clone https://github.com/YOUR_USERNAME/animochat.git backend

# Or create manually
mkdir backend
cd backend
```

**Option B: Using SCP (from your local machine)**

```bash
# On your local machine, run:
scp -r /path/to/animochat/backend root@YOUR_VPS_IP:/var/www/animochat/
```

### Step 7: Install Dependencies and Build

```bash
cd /var/www/animochat/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app
REDIS_URL=redis://localhost:6379
EOF
```

### Step 8: Setup PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
cd /var/www/animochat/backend
pm2 start dist/index.js --name "animochat"

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd

# Run the command that PM2 outputs (it will be something like):
# systemctl enable pm2-root
```

### Step 9: Setup Nginx Reverse Proxy

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/animochat << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;  # Or use your VPS IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/animochat /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 10: Setup SSL (HTTPS) with Certbot

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Follow the prompts
# Choose to redirect HTTP to HTTPS
```

### Step 11: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs animochat

# Test the API
curl https://api.yourdomain.com/health
# Should return: {"status":"ok",...}
```

---

## Frontend Deployment (Vercel)

### Step 1: Push Code to GitHub

```bash
# On your local machine
cd /path/to/animochat/frontend

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/animochat-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (if your repo has both frontend and backend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
   ```
6. Click **Deploy**

### Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your domain: `yourdomain.com`
3. Follow Vercel's DNS instructions
4. Wait for DNS propagation (can take up to 24 hours)

---

## Environment Variables

### Backend (.env on VPS)

```bash
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app
REDIS_URL=redis://localhost:6379
```

### Frontend (Vercel Environment Variables)

```bash
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

---

## Connecting Frontend to Backend

### 1. Update CORS in Backend

In `/var/www/animochat/backend/src/index.ts`, update the CORS configuration:

```typescript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
```

Then restart:
```bash
pm2 restart animochat
```

### 2. Update Frontend Socket URL

In `frontend/components/chat-context.tsx`, the `SOCKET_URL` is already set to use the environment variable:

```typescript
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
```

### 3. Disable Demo Mode

In `frontend/components/chat-context.tsx`, change:

```typescript
// ============================================
// DEMO MODE CONFIGURATION
// Set to false to use real Socket.IO server
// ============================================
export const DEMO_MODE = false;  // <-- Change this
```

Redeploy to Vercel after this change.

---

## Troubleshooting

### Backend Issues

**Problem**: PM2 shows "errored" status
```bash
# Check logs
pm2 logs animochat

# Restart
pm2 restart animochat

# If still failing, rebuild
cd /var/www/animochat/backend
npm run build
pm2 restart animochat
```

**Problem**: Redis connection failed
```bash
# Check Redis status
systemctl status redis

# Restart Redis
systemctl restart redis

# Check if Redis is listening
redis-cli ping
```

**Problem**: Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

### Frontend Issues

**Problem**: Socket connection failed
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Ensure backend CORS allows your frontend domain

**Problem**: Build fails on Vercel
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

---

## Useful Commands

### Backend Management

```bash
# View logs
pm2 logs animochat

# Restart backend
pm2 restart animochat

# Stop backend
pm2 stop animochat

# View PM2 dashboard
pm2 monit

# Update code and restart
cd /var/www/animochat/backend
git pull
npm install
npm run build
pm2 restart animochat
```

### Server Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check active connections
netstat -tuln
```

---

## Cost Breakdown

| Service | Cost/Month |
|---------|------------|
| Hostinger VPS (KVM 2) | ~$7 |
| Domain Name | ~$10/year |
| Vercel (Pro if needed) | $0 (free tier) |
| **Total** | **~$8/month** |

---

## Security Checklist

- [ ] Firewall enabled (UFW)
- [ ] SSH key authentication (disable password login)
- [ ] SSL certificate installed
- [ ] Regular system updates
- [ ] PM2 running as non-root user (optional but recommended)
- [ ] Redis bound to localhost only
- [ ] Environment variables not exposed in code

---

## Next Steps

1. Set up monitoring (e.g., UptimeRobot for free monitoring)
2. Configure log rotation
3. Set up automated backups
4. Consider using Docker for easier deployments
5. Add rate limiting for production use

---

## Support

If you encounter issues:
1. Check the logs first (`pm2 logs`, browser console)
2. Verify all environment variables are set
3. Ensure ports are open in firewall
4. Test Redis connection
5. Check Nginx configuration
