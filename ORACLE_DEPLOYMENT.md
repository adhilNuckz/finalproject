# 🚀 Oracle Cloud Free Tier Deployment Guide

Quick guide to deploy LOCALED on Oracle Cloud with IP-based access.

## 📋 Server Information
- **Frontend URL:** `http://140.238.243.150:5173`
- **Backend URL:** `http://140.238.243.150:5000`
- **Deployment Type:** Direct IP access (no domain/proxy needed)

---

## ⚡ Quick Deployment Steps

### 1. SSH into Your Oracle Server

```bash
ssh ubuntu@140.238.243.150
# Or as root:
# ssh root@140.238.243.150
```

### 2. Install Dependencies (One-Line)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs git
```

### 3. Clone and Setup Project

```bash
cd ~
git clone https://github.com/adhilNuckz/finalproject.git
cd finalproject

# Install backend dependencies
cd back && npm install

# Install frontend dependencies
cd ../front && npm install
```

### 4. Configure Firewall

#### Oracle Cloud Security List (Web Console)

1. Go to: **Compute → Instances → Your Instance**
2. Click: **Subnet → Default Security List**
3. Click: **Add Ingress Rules**

Add these two rules:

| Source CIDR | Protocol | Port | Description |
|-------------|----------|------|-------------|
| `0.0.0.0/0` | TCP | `5173` | Frontend |
| `0.0.0.0/0` | TCP | `5000` | Backend |

#### Server Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend
sudo ufw enable
sudo ufw status
```

### 5. Start Backend

```bash
cd ~/finalproject/back
node server.js
```

Expected output:
```
Backend server running on http://0.0.0.0:5000
Access from: http://140.238.243.150:5000
Socket.IO enabled for real-time updates
Route modules loaded successfully
```

### 6. Start Frontend (New Terminal)

```bash
cd ~/finalproject/front
npm run dev
```

Expected output:
```
VITE v5.4.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://140.238.243.150:5173/
➜  Network: http://10.0.0.X:5173/
```

### 7. Access Your App! 🎉

Open browser: **`http://140.238.243.150:5173`**

---

## 🔄 Using Screen (Keep Running After Disconnect)

### Start with Screen

```bash
# Start backend in screen
screen -S backend
cd ~/finalproject/back
node server.js
# Press Ctrl+A then D to detach

# Start frontend in screen
screen -S frontend
cd ~/finalproject/front
npm run dev
# Press Ctrl+A then D to detach
```

### Screen Commands

```bash
# List all screen sessions
screen -ls

# Reattach to backend
screen -r backend

# Reattach to frontend
screen -r frontend

# Kill a screen session
screen -X -S backend quit
screen -X -S frontend quit
```

---

## 📊 Verification

### Check Services Running

```bash
# Check if ports are listening
sudo netstat -tulpn | grep -E ':(5173|5000)'

# Test backend locally
curl http://localhost:5000/sites

# Test frontend locally
curl http://localhost:5173
```

### Check Firewall

```bash
# UFW status
sudo ufw status

# Should show:
# 22/tcp    ALLOW       Anywhere
# 5173/tcp  ALLOW       Anywhere
# 5000/tcp  ALLOW       Anywhere
```

### Check from Local Machine

```bash
# Test backend
curl http://140.238.243.150:5000/sites

# Should return JSON like:
# {"success":true,"sites":[...]}
```

---

## 🐛 Troubleshooting

### Can't Access from Browser

**Problem:** Browser can't reach `http://140.238.243.150:5173`

**Solutions:**
1. Check Oracle Security List has ingress rules
2. Check UFW firewall: `sudo ufw status`
3. Verify services running: `sudo netstat -tulpn | grep 5173`
4. Check Vite is binding to 0.0.0.0: Look for "Network: http://140.238.243.150:5173" in output

### Backend Connection Error in Frontend

**Problem:** Frontend shows "Network Error" or can't connect to backend

**Solutions:**
1. Verify backend is running: `curl http://localhost:5000/sites`
2. Check `.env.development` has correct IP: `cat ~/finalproject/front/.env.development`
3. Test backend from local machine: `curl http://140.238.243.150:5000/sites`

### Permission Denied Errors

**Problem:** Apache/system commands fail with permission errors

**Solutions:**
```bash
# Configure passwordless sudo for specific commands
sudo visudo

# Add this line (replace 'ubuntu' with your username):
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/sbin/apache2ctl
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE :::5000` or `:::5173`

**Solutions:**
```bash
# Find process using the port
sudo lsof -i :5000
sudo lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use different ports:
PORT=5001 node server.js
npm run dev -- --port 5174
```

---

## 🔒 Security Considerations

### For Testing (Current Setup)
- ✅ Direct IP access
- ✅ Simple firewall rules
- ⚠️ No SSL (HTTP only)
- ⚠️ Default credentials (change before production!)

### For Production Use
- [ ] Get a domain name
- [ ] Setup Apache reverse proxy
- [ ] Install SSL certificates (Certbot)
- [ ] Change default admin credentials
- [ ] Restrict allowed paths in `back/utils/security.js`
- [ ] Enable fail2ban
- [ ] Setup automated backups

---

## 📝 Default Login

```
Username: admin
Password: admin123
```

⚠️ **Change these immediately in `back/server.js`!**

---

## 🚀 Production Deployment (Optional)

For a production-ready setup with domain and SSL, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full guide with Apache proxy
- [DEPLOYMENT_IP.md](./DEPLOYMENT_IP.md) - IP-based with PM2

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs: `screen -r backend` or `screen -r frontend`
3. Open an issue on GitHub

---

**Happy Testing! 🎉**
