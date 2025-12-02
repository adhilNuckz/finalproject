# Digital Ocean Droplet Deployment Guide

## Server Details
- **IP Address**: 142.93.220.168
- **Environment**: Testing/Production

## Architecture Overview
Your application has 3 components:
1. **Backend API** (Port 5000) - Express.js server with Socket.IO
2. **Terminal Service** (Port 3000) - PTY terminal via Socket.IO
3. **Frontend** (Port 5173 for dev, or serve static build via nginx)

---

## Pre-Deployment Checklist

### 1. Required Software on Droplet
SSH into your droplet first:
```bash
ssh root@142.93.220.168
```

Then install required packages:
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install build essentials (required for node-pty)
apt install -y build-essential python3

# Install nginx (for serving frontend)
apt install -y nginx

# Install UFW firewall (if not already installed)
apt install -y ufw
```

### 2. Configure Firewall
```bash
# Allow SSH (important!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow backend API
ufw allow 5000/tcp

# Allow terminal service
ufw allow 3000/tcp

# Allow frontend dev server (optional, for testing)
ufw allow 5173/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## Step-by-Step Deployment

### Step 1: Upload Your Code to Droplet

From your local machine:
```bash
# Create tar archive (exclude node_modules)
cd /home/kali
tar --exclude='node_modules' --exclude='.git' -czf localed-app.tar.gz LOCALED/

# Copy to droplet
scp localed-app.tar.gz root@142.93.220.168:/root/

# SSH into droplet
ssh root@142.93.220.168

# Extract
cd /root
tar -xzf localed-app.tar.gz
cd LOCALED
```

### Step 2: Update Configuration Files

#### A. Update Backend Server IP
File: `back/server.js` (line 211)
Change from:
```javascript
console.log(`Access from: http://140.238.243.150:${PORT}`);
```
To:
```javascript
console.log(`Access from: http://142.93.220.168:${PORT}`);
```

#### B. Update Terminal CORS Origins
File: `terminal/server.js` (lines 14-18)
Add your droplet IP:
```javascript
const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://142.93.220.168:5173',
  'http://142.93.220.168',
  'http://142.93.220.168:80'
];
```

#### C. Update Terminal Server Binding
File: `terminal/server.js` (line 93)
Change from:
```javascript
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
```
To:
```javascript
server.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`)
);
```

#### D. Create Frontend Environment File
Create: `front/.env.production`
```env
VITE_API_URL=http://142.93.220.168:5000
```

### Step 3: Install Dependencies

On the droplet:
```bash
cd /root/LOCALED

# Install backend dependencies
cd back
npm install

# Install terminal dependencies
cd ../terminal
npm install

# Install frontend dependencies
cd ../front
npm install
```

### Step 4: Build Frontend for Production

```bash
cd /root/LOCALED/front
npm run build
```

This creates a `dist/` folder with optimized static files.

### Step 5: Start Services with PM2

```bash
cd /root/LOCALED

# Start backend
pm2 start back/server.js --name "backend-api"

# Start terminal service (ES module)
pm2 start terminal/server.js --name "terminal-service" --interpreter node --node-args="--experimental-modules"

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you
```

### Step 6: Configure Nginx (Optional but Recommended)

Create nginx config: `/etc/nginx/sites-available/localed`
```nginx
server {
    listen 80;
    server_name 142.93.220.168;

    # Serve frontend static files
    location / {
        root /root/LOCALED/front/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy Socket.IO for backend
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy terminal service
    location /terminal/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/localed /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
```

### Step 7: Alternative - Run Frontend Dev Server (For Testing)

If you want to test without nginx:
```bash
cd /root/LOCALED/front

# Run with environment variable
VITE_API_URL=http://142.93.220.168:5000 npm run dev
```

Or use PM2:
```bash
cd /root/LOCALED/front
pm2 start npm --name "frontend-dev" -- run dev
```

---

## Access Your Application

### With Nginx (Recommended):
- **Frontend**: http://142.93.220.168
- **API**: http://142.93.220.168/api/
- **Backend Direct**: http://142.93.220.168:5000
- **Terminal Service**: http://142.93.220.168:3000

### Without Nginx (Direct Access):
- **Frontend**: http://142.93.220.168:5173
- **Backend**: http://142.93.220.168:5000
- **Terminal**: http://142.93.220.168:3000

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs

# View specific service logs
pm2 logs backend-api
pm2 logs terminal-service

# Restart service
pm2 restart backend-api

# Stop service
pm2 stop backend-api

# Delete service
pm2 delete backend-api

# Monitor services
pm2 monit

# List all services
pm2 list

# Restart all services
pm2 restart all
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using a port
lsof -i :5000
lsof -i :3000

# Kill process by PID
kill -9 <PID>
```

### Check Service Status
```bash
# Check if services are listening
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000

# Or use ss
ss -tlnp | grep :5000
```

### View Application Logs
```bash
# PM2 logs
pm2 logs --lines 100

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Firewall Issues
```bash
# Check firewall status
ufw status verbose

# Temporarily disable (for testing only)
ufw disable

# Re-enable
ufw enable
```

### Node-pty Installation Issues
If terminal service fails to start:
```bash
cd /root/LOCALED/terminal
npm rebuild node-pty
```

---

## Security Recommendations

1. **Change SSH Port** (optional but recommended)
2. **Setup SSL Certificate** with Let's Encrypt:
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```
3. **Setup proper authentication** for your app
4. **Restrict file system access** in your application
5. **Use environment variables** for sensitive data:
   ```bash
   # Create .env files
   cd /root/LOCALED/back
   nano .env
   ```

---

## Updating Your Application

When you make changes:
```bash
# On local machine - create new archive
cd /home/kali
tar --exclude='node_modules' --exclude='.git' -czf localed-app.tar.gz LOCALED/
scp localed-app.tar.gz root@142.93.220.168:/root/

# On droplet
ssh root@142.93.220.168
cd /root
tar -xzf localed-app.tar.gz
cd LOCALED

# Reinstall dependencies if needed
cd back && npm install
cd ../terminal && npm install
cd ../front && npm install && npm run build

# Restart services
pm2 restart all
```

---

## Quick Start Script

Create this script on your droplet: `/root/start-localed.sh`
```bash
#!/bin/bash
cd /root/LOCALED

# Start backend
pm2 start back/server.js --name "backend-api"

# Start terminal service
pm2 start terminal/server.js --name "terminal-service"

# Build and serve frontend (if using nginx)
cd front && npm run build

# Or start frontend dev server
# pm2 start npm --name "frontend-dev" -- run dev

pm2 save
```

Make it executable:
```bash
chmod +x /root/start-localed.sh
```

Run it:
```bash
/root/start-localed.sh
```
