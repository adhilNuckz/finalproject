# Quick Deployment Guide - Port 6666

## Server: 142.93.220.168

### Services Overview:
- **Frontend**: Port 6666
- **Backend API**: Port 5000
- **Terminal Service**: Port 3000

---

## On Your Droplet

### 1. Install Prerequisites
```bash
ssh root@142.93.220.168

# Update and install Node.js
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs build-essential python3

# Install PM2
npm install -g pm2
```

### 2. Configure Firewall
```bash
# Allow necessary ports
ufw allow 22/tcp    # SSH
ufw allow 6666/tcp  # Frontend
ufw allow 5000/tcp  # Backend API
ufw allow 3000/tcp  # Terminal Service
ufw --force enable
ufw status
```

### 3. Upload and Extract
```bash
# From local machine:
cd /home/kali/LOCALED
tar --exclude='node_modules' --exclude='.git' -czf app.tar.gz .
scp app.tar.gz root@142.93.220.168:/root/

# On droplet:
ssh root@142.93.220.168
mkdir -p /root/LOCALED
cd /root
tar -xzf app.tar.gz -C LOCALED
cd LOCALED
```

### 4. Install Dependencies
```bash
# Backend
cd /root/LOCALED/back
npm install

# Terminal Service
cd /root/LOCALED/terminal
npm install

# Frontend
cd /root/LOCALED/front
npm install
```

### 5. Start All Services
```bash
cd /root/LOCALED

# Start backend API
pm2 start back/server.js --name "backend-api"

# Start terminal service
pm2 start terminal/server.js --name "terminal-service"

# Start frontend on port 6666
cd front
pm2 start npm --name "frontend" -- run dev

# Save PM2 config
pm2 save
pm2 startup
```

---

## Access Your Application

- **Frontend**: http://142.93.220.168:6666
- **Backend API**: http://142.93.220.168:5000
- **Terminal Service**: http://142.93.220.168:3000

---

## Useful Commands

```bash
# View all services
pm2 list

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor resources
pm2 monit
```

---

## Update Application

```bash
# From local machine:
cd /home/kali/LOCALED
tar --exclude='node_modules' --exclude='.git' -czf app.tar.gz .
scp app.tar.gz root@142.93.220.168:/root/

# On droplet:
ssh root@142.93.220.168
cd /root/LOCALED
tar -xzf ../app.tar.gz

# Reinstall dependencies if needed
cd back && npm install
cd ../terminal && npm install
cd ../front && npm install

# Restart services
pm2 restart all
```
