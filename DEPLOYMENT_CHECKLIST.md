# 📋 Oracle Cloud Deployment Checklist

## Before Deployment

- [ ] Push all code to GitHub repository
- [ ] Test application locally (frontend + backend)
- [ ] Note Oracle server IP: `140.238.243.___`
- [ ] Have domain ready: `myhost.nuckz.live`

---

## Oracle Cloud Setup

- [ ] SSH access working: `ssh ubuntu@140.238.243.___`
- [ ] Server updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Node.js installed: `node --version` (should be v18+)
- [ ] Apache2 installed: `apache2 -v`
- [ ] PM2 installed globally: `pm2 --version`
- [ ] Certbot installed: `certbot --version`
- [ ] Git installed: `git --version`

---

## Application Deployment

- [ ] Repository cloned to `~/finalproject`
- [ ] Backend dependencies installed: `cd back && npm install`
- [ ] Backend started with PM2: `pm2 start server.js --name localed-backend`
- [ ] PM2 saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup` (run the command it outputs)
- [ ] Frontend dependencies installed: `cd ../front && npm install`
- [ ] Frontend built: `npm run build`
- [ ] `dist/` folder created successfully

---

## Apache Configuration

- [ ] Virtual host config created: `/etc/apache2/sites-available/myhost.nuckz.live.conf`
- [ ] Config includes proxy rules for `/api`, `/sites`, `/domains`, etc.
- [ ] Config includes WebSocket support
- [ ] Config includes React Router support
- [ ] Required modules enabled: `sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers`
- [ ] Site enabled: `sudo a2ensite myhost.nuckz.live.conf`
- [ ] Default site disabled (optional): `sudo a2dissite 000-default.conf`
- [ ] Config tested: `sudo apache2ctl configtest` (should say "Syntax OK")
- [ ] Apache restarted: `sudo systemctl restart apache2`

---

## Firewall & Security

### Oracle Cloud Console
- [ ] Navigate to instance → Subnet → Security List
- [ ] Ingress rule added for port 80 (HTTP)
- [ ] Ingress rule added for port 443 (HTTPS)
- [ ] Source set to `0.0.0.0/0` for public access

### Server Firewall (UFW)
- [ ] Port 80 allowed: `sudo ufw allow 80/tcp`
- [ ] Port 443 allowed: `sudo ufw allow 443/tcp`
- [ ] Port 22 allowed: `sudo ufw allow 22/tcp` (SSH)
- [ ] UFW enabled: `sudo ufw enable`
- [ ] Status checked: `sudo ufw status`

---

## DNS Configuration

- [ ] DNS A record added in domain registrar
  - Type: A
  - Name: `myhost` (or `@`)
  - Value: `140.238.243.___` (Oracle IP)
  - TTL: 3600
- [ ] DNS propagation verified: `nslookup myhost.nuckz.live`
- [ ] Wait 5-15 minutes if just configured

---

## SSL Certificate

- [ ] Domain accessible via HTTP first: `http://myhost.nuckz.live`
- [ ] Certbot SSL installed: `sudo certbot --apache -d myhost.nuckz.live --non-interactive --agree-tos --email admin@nuckz.live`
- [ ] Certificate files created in `/etc/letsencrypt/live/myhost.nuckz.live/`
- [ ] Apache auto-configured for HTTPS
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] HTTPS works: `https://myhost.nuckz.live`

---

## Testing & Verification

### Backend Tests
- [ ] PM2 status shows running: `pm2 status`
- [ ] No errors in logs: `pm2 logs localed-backend --lines 50`
- [ ] Backend responds locally: `curl http://localhost:5000/sites`

### Apache Tests
- [ ] Apache running: `sudo systemctl status apache2`
- [ ] No errors in Apache config: `sudo apache2ctl configtest`
- [ ] Check Apache logs: `sudo tail -50 /var/log/apache2/localed-error.log`

### Application Tests
- [ ] Frontend loads: `https://myhost.nuckz.live`
- [ ] Login page appears
- [ ] Can login successfully
- [ ] Dashboard loads with all widgets
- [ ] Sites page works
- [ ] Apache Config page works
- [ ] File Manager works
- [ ] PM2 Manager works
- [ ] Can create a new site
- [ ] WebSocket connection works (real-time updates)

---

## Post-Deployment

- [ ] Bookmark admin URL: `https://myhost.nuckz.live`
- [ ] Save credentials securely
- [ ] Document server details
- [ ] Setup monitoring (optional)
- [ ] Configure backups (optional)
- [ ] Setup fail2ban (optional security)

---

## Common Issues & Solutions

### "502 Bad Gateway"
- Backend not running → Check `pm2 status`
- Wrong port in Apache config → Verify proxy rules

### "Connection Refused"
- Firewall blocking → Check UFW and Oracle security list
- Backend crashed → Check `pm2 logs`

### "Certificate Error"
- DNS not propagated → Wait and retry
- Certbot failed → Check domain is accessible via HTTP first

### "WebSocket Failed"
- Module not enabled → `sudo a2enmod proxy_wstunnel`
- Config missing WebSocket rules → Review Apache config

### "Site Not Found / 404"
- Frontend not built → Run `npm run build` in front/
- Wrong DocumentRoot → Check Apache config points to `dist/`

---

## Update Procedure (After Changes)

1. [ ] Push changes to GitHub
2. [ ] SSH into server
3. [ ] Pull changes: `git pull origin main`
4. [ ] Update backend: `cd back && npm install && pm2 restart localed-backend`
5. [ ] Update frontend: `cd ../front && npm install && npm run build`
6. [ ] Clear browser cache and test

---

## Monitoring Commands

```bash
# Check everything
pm2 status
sudo systemctl status apache2
sudo ufw status

# View logs
pm2 logs localed-backend
sudo tail -f /var/log/apache2/localed-error.log
sudo tail -f /var/log/apache2/localed-access.log

# Resource usage
htop
df -h
free -m

# Network connections
sudo netstat -tulpn | grep -E ':(80|443|5000)'
```

---

## 🎉 Deployment Complete!

Your LOCALED hosting management panel is now live at:
**https://myhost.nuckz.live**

All features should be working:
✅ Dashboard with server stats
✅ Site management (create, SSL, enable/disable)
✅ Apache configuration editor
✅ File manager
✅ PM2 process manager
✅ Real-time updates via WebSocket

**Happy hosting! 🚀**
