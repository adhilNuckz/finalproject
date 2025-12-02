# 🚀 Simple IP-Based Deployment Guide

Deploy your LOCALED app to Oracle Cloud with direct IP access:
- **Frontend**: `http://140.238.243.150:6666`
- **Backend API**: `http://140.238.243.150:5000`

---

## 📋 Prerequisites

- Oracle Cloud VPS (Ubuntu)
- IP Address: `140.238.243.150`
- SSH access to the server
- Git repository: `https://github.com/adhilNuckz/finalproject`

---

## 🔧 Step 1: Server Setup

### SSH into your server
```bash
ssh ubuntu@140.238.243.150
```

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x
npm --version
```

### Install PM2 globally
```bash
sudo npm install -g pm2
pm2 --version
```

### Install Git
```bash
sudo apt install -y git
```

---

## 📦 Step 2: Clone and Setup Application

### Clone the repository
```bash
cd ~
git clone https://github.com/adhilNuckz/finalproject.git
cd finalproject
```

### Setup Backend
```bash
cd back
npm install
```

### Setup Frontend
```bash
cd ../front
npm install
```

---

## 🎯 Step 3: Configure Environment

### Update Backend Configuration
```bash
cd ~/finalproject/back
nano server.js
```

Make sure the server listens on `0.0.0.0` (not just localhost):
```javascript
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

### Frontend is already configured
The `.env.production` already has:
```
VITE_API_URL=http://140.238.243.150:5000
```

---

## 🚀 Step 4: Build and Start Backend

### Start backend with PM2 on port 5000
```bash
cd ~/finalproject/back
pm2 start server.js --name localed-backend
pm2 save
pm2 startup  # Run the command it outputs
```

### Verify backend is running
```bash
pm2 status
pm2 logs localed-backend --lines 20
```

### Test backend locally
```bash
curl http://localhost:5000/sites
# Should return JSON response
```

---

## 🎨 Step 5: Build and Start Frontend

### Build the frontend for production
```bash
cd ~/finalproject/front
npm run build
```

This creates a `dist/` folder with optimized static files.

### Install http-server to serve frontend
```bash
sudo npm install -g http-server
```

### Start frontend with PM2 on port 6666
```bash
cd ~/finalproject/front/dist
pm2 start http-server --name localed-frontend -- -p 6666 -a 0.0.0.0
pm2 save
```

### Verify frontend is running
```bash
pm2 status
# Should show both localed-backend and localed-frontend running
```

---

## 🔥 Step 6: Configure Firewall

### Oracle Cloud Security List (Web Console)
1. Go to Oracle Cloud Console
2. Navigate to: **Compute → Instances → Your Instance**
3. Click on the **Subnet** link
4. Click on the **Default Security List**
5. Click **Add Ingress Rules**

**Add Rule 1 (Backend):**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `5000`
- Click **Add Ingress Rules**

**Add Rule 2 (Frontend):**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `6666`
- Click **Add Ingress Rules**

### Server Firewall (UFW)
```bash
# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow backend port
sudo ufw allow 5000/tcp

# Allow frontend port
sudo ufw allow 6666/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

Should show:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
5000/tcp                   ALLOW       Anywhere
6666/tcp                   ALLOW       Anywhere
```

---

## ✅ Step 7: Test Your Application

### Test from your local computer

**Backend API:**
```bash
curl http://140.238.243.150:5000/sites
```

**Frontend:**
Open your browser and visit:
```
http://140.238.243.150:6666
```

You should see the LOCALED login page!

---

## 🔍 Verification Checklist

- [ ] Backend running: `pm2 status` shows `localed-backend` online
- [ ] Frontend running: `pm2 status` shows `localed-frontend` online
- [ ] Port 5000 open: `sudo netstat -tulpn | grep 5000`
- [ ] Port 6666 open: `sudo netstat -tulpn | grep 6666`
- [ ] UFW rules active: `sudo ufw status`
- [ ] Oracle security list has ingress rules for ports 5000 and 6666
- [ ] Backend responds: `curl http://140.238.243.150:5000/sites`
- [ ] Frontend loads: Visit `http://140.238.243.150:6666` in browser
- [ ] Can login to the application
- [ ] Dashboard shows server stats
- [ ] All features work (Sites, Apache, Files, PM2)

---

## 📊 Management Commands

### View application status
```bash
pm2 status
```

### View logs
```bash
# Backend logs
pm2 logs localed-backend

# Frontend logs
pm2 logs localed-frontend

# Both
pm2 logs
```

### Restart applications
```bash
# Restart backend
pm2 restart localed-backend

# Restart frontend
pm2 restart localed-frontend

# Restart all
pm2 restart all
```

### Stop applications
```bash
pm2 stop localed-backend
pm2 stop localed-frontend
```

### Delete applications
```bash
pm2 delete localed-backend
pm2 delete localed-frontend
```

---

## 🔄 Update Application (After Changes)

When you make changes and push to GitHub:

```bash
# SSH into server
ssh ubuntu@140.238.243.150

# Go to project directory
cd ~/finalproject

# Pull latest changes
git pull origin main

# Update backend
cd back
npm install
pm2 restart localed-backend

# Update frontend
cd ../front
npm install
npm run build
pm2 restart localed-frontend
```

---

## 🐛 Troubleshooting

### Backend not accessible from outside
```bash
# Check if backend is listening on 0.0.0.0 (not 127.0.0.1)
sudo netstat -tulpn | grep 5000

# Check backend logs
pm2 logs localed-backend

# Restart backend
pm2 restart localed-backend
```

### Frontend not accessible
```bash
# Check if frontend is running
pm2 status

# Check if port 6666 is listening
sudo netstat -tulpn | grep 6666

# Restart frontend
pm2 restart localed-frontend
```

### Firewall blocking connections
```bash
# Check UFW status
sudo ufw status

# Re-add rules if needed
sudo ufw allow 5000/tcp
sudo ufw allow 6666/tcp

# Check Oracle Cloud Security List in web console
```

### "Connection Refused" error
1. Check PM2 status: `pm2 status`
2. Check firewall: `sudo ufw status`
3. Check Oracle Security List rules
4. Verify server is listening on `0.0.0.0` not `127.0.0.1`

### Backend crashes
```bash
# View error logs
pm2 logs localed-backend --err --lines 50

# Check if port 5000 is already in use
sudo lsof -i :5000

# Restart with error logging
pm2 restart localed-backend
pm2 logs localed-backend
```

---

## 🎉 Success!

Your LOCALED application is now running on:

**🌐 Access URL**: `http://140.238.243.150:6666`

**🔌 Backend API**: `http://140.238.243.150:5000`

**Features Available:**
- ✅ Dashboard with real-time server stats
- ✅ Site management (create, enable, disable, maintenance)
- ✅ Apache configuration editor
- ✅ File manager with upload/download
- ✅ PM2 process manager
- ✅ SSL certificate management
- ✅ Domain management

**Happy hosting! 🚀**

---

## 📝 Notes

- This setup uses direct IP access (no domain required)
- Backend runs on port 5000
- Frontend runs on port 6666
- Both managed by PM2 for auto-restart
- Firewall rules allow external access
- No Apache/Nginx reverse proxy needed
- Simple and straightforward deployment

For a production environment with a domain name and SSL, consider using the full Apache setup in `DEPLOYMENT.md`.
