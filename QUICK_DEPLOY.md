# 🚀 Quick Deployment Reference

## Access URLs
- **Frontend**: http://140.238.243.150:6666
- **Backend**: http://140.238.243.150:5000

## One-Line Deploy Commands

```bash
# On Oracle Cloud server (140.238.243.150)

# 1. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs git && sudo npm install -g pm2 http-server

# 2. Clone and setup
cd ~ && git clone https://github.com/adhilNuckz/finalproject.git && cd finalproject/back && npm install && cd ../front && npm install

# 3. Start backend (port 5000)
cd ~/finalproject/back && pm2 start server.js --name localed-backend && pm2 save

# 4. Build and start frontend (port 6666)
cd ~/finalproject/front && npm run build && cd dist && pm2 start http-server --name localed-frontend -- -p 6666 -a 0.0.0.0 && pm2 save

# 5. Setup PM2 startup
pm2 startup

# 6. Configure firewall
sudo ufw allow 22/tcp && sudo ufw allow 5000/tcp && sudo ufw allow 6666/tcp && sudo ufw enable
```

## Oracle Cloud Security List
Add these ingress rules in Oracle Cloud Console:
- Port **5000** (Backend API)
- Port **6666** (Frontend)
- Source: **0.0.0.0/0**

## Test
```bash
# Backend
curl http://140.238.243.150:5000/sites

# Frontend (open in browser)
http://140.238.243.150:6666
```

## Management
```bash
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 restart all              # Restart both
pm2 monit                    # Monitor resources
```

## Update After Changes
```bash
cd ~/finalproject && git pull origin main
cd back && npm install && pm2 restart localed-backend
cd ../front && npm install && npm run build && pm2 restart localed-frontend
```

---

**That's it! Simple IP-based deployment with no domain or reverse proxy needed. 🎉**
