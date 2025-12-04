# Deployment Checklist

Use this checklist to ensure all steps are completed for server deployment.

## Pre-Deployment (On Local Machine)

- [ ] Verify server IP is correct: 142.93.220.168
- [ ] Check that all `.env` files have correct values
- [ ] Test local version works properly
- [ ] Upload `server-test` folder to server
  ```bash
  scp -r server-test root@142.93.220.168:/var/www/
  ```

## Server Setup

- [ ] SSH into server: `ssh root@142.93.220.168`
- [ ] Navigate to folder: `cd /var/www/server-test`
- [ ] Verify Node.js is installed: `node --version`
- [ ] Verify npm is installed: `npm --version`

## Installation

- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install terminal dependencies: `cd ../terminal && npm install`
- [ ] Install frontend dependencies: `cd ../frontend && npm install`
- [ ] Build frontend: `npm run build`

## PM2 Setup

- [ ] Install PM2: `npm install -g pm2`
- [ ] Start backend: `cd backend && pm2 start server.js --name "app-backend"`
- [ ] Start terminal: `cd ../terminal && pm2 start server.js --name "app-terminal"`
- [ ] Save PM2 config: `pm2 save`
- [ ] Enable PM2 startup: `pm2 startup`
- [ ] Verify services: `pm2 status`

## Apache Configuration

- [ ] Enable Apache modules:
  - [ ] `sudo a2enmod proxy`
  - [ ] `sudo a2enmod proxy_http`
  - [ ] `sudo a2enmod proxy_wstunnel`
  - [ ] `sudo a2enmod rewrite`
- [ ] Create virtual host configuration (or use deploy.sh option 7)
- [ ] Enable site: `sudo a2ensite app.conf`
- [ ] Test configuration: `sudo apache2ctl configtest`
- [ ] Restart Apache: `sudo systemctl restart apache2`

## Firewall Configuration

- [ ] Open port 5252: `sudo ufw allow 5252/tcp`
- [ ] Open port 5002: `sudo ufw allow 5002/tcp`
- [ ] Open port 3002: `sudo ufw allow 3002/tcp`
- [ ] Reload firewall: `sudo ufw reload`
- [ ] Verify ports: `sudo ufw status`

## Testing

- [ ] Check PM2 services running: `pm2 status`
- [ ] Check Apache is running: `sudo systemctl status apache2`
- [ ] Check ports are listening: `netstat -tulpn | grep -E '5252|5002|3002'`
- [ ] Test backend API: `curl http://localhost:5002/sites`
- [ ] Test terminal server: `curl http://localhost:3002`
- [ ] Access frontend from server: `curl http://localhost:5252`

## External Access Testing

- [ ] Access from local laptop: `http://142.93.220.168:5252`
- [ ] Test login functionality
- [ ] Test adding a new site
- [ ] Test pausing a site
- [ ] Test terminal access
- [ ] Test file manager

## Logs & Monitoring

- [ ] Check PM2 logs: `pm2 logs`
- [ ] Check Apache access log: `sudo tail -f /var/log/apache2/app-access.log`
- [ ] Check Apache error log: `sudo tail -f /var/log/apache2/app-error.log`
- [ ] No errors in logs

## Security (Optional but Recommended)

- [ ] Setup HTTPS/SSL certificates
- [ ] Configure authentication
- [ ] Set up rate limiting
- [ ] Disable directory listing
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Review firewall rules
- [ ] Configure fail2ban for SSH

## Documentation

- [ ] Document any changes made
- [ ] Note any issues encountered
- [ ] Save login credentials securely
- [ ] Share access instructions with team

## Post-Deployment

- [ ] Monitor logs for first 24 hours
- [ ] Test from multiple devices
- [ ] Setup automated backups
- [ ] Configure monitoring/alerts
- [ ] Plan maintenance schedule

---

## Quick Commands Reference

**View all services:**
```bash
pm2 status
sudo systemctl status apache2
```

**Restart services:**
```bash
pm2 restart all
sudo systemctl restart apache2
```

**View logs:**
```bash
pm2 logs
sudo tail -f /var/log/apache2/app-error.log
```

**Stop services:**
```bash
pm2 stop all
sudo systemctl stop apache2
```

---

## Troubleshooting

**Problem: Can't access from external laptop**
- Check firewall: `sudo ufw status`
- Check if services are running: `pm2 status`
- Check if ports are open: `netstat -tulpn | grep -E '5252|5002|3002'`

**Problem: Backend not responding**
- Check PM2: `pm2 logs app-backend`
- Check .env file in backend folder
- Restart: `pm2 restart app-backend`

**Problem: Frontend shows errors**
- Check browser console for errors
- Verify frontend build: `ls -la frontend/dist/`
- Check Apache config: `sudo apache2ctl -t`

**Problem: Terminal not connecting**
- Check PM2: `pm2 logs app-terminal`
- Verify port 3002 is open
- Check CORS settings in terminal/.env
