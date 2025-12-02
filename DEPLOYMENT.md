# 🚀 LOCALED - Production Deployment Guide

## Prerequisites
- Oracle Cloud Instance (or any VPS)
- Domain name pointing to server IP (e.g., myhost.nuckz.live → 140.238.243.XXX)
- SSH access to server

---

## 1️⃣ Server Setup

### Connect to Server
```bash
ssh ubuntu@140.238.243.XXX
```

### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Apache2
sudo apt install -y apache2

# Install PHP (optional, for PHP sites)
sudo apt install -y php8.2 php8.2-fpm

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-apache

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

## 2️⃣ Clone Repository

```bash
cd ~
git clone https://github.com/adhilNuckz/finalproject.git
cd finalproject
```

---

## 3️⃣ Backend Setup

```bash
cd back

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name "localed-backend" --watch

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

### Check Backend Status
```bash
pm2 status
pm2 logs localed-backend
curl http://localhost:5000/sites
```

---

## 4️⃣ Frontend Setup

```bash
cd ~/finalproject/front

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

---

## 5️⃣ Apache Configuration

### Create Virtual Host Config
```bash
sudo nano /etc/apache2/sites-available/myhost.nuckz.live.conf
```

### Add This Configuration:
```apache
<VirtualHost *:80>
    ServerName myhost.nuckz.live
    ServerAdmin admin@nuckz.live

    # Serve React frontend
    DocumentRoot /home/ubuntu/finalproject/front/dist
    
    <Directory /home/ubuntu/finalproject/front/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy all /api and backend requests to Node.js
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
    
    ProxyPass /sites http://localhost:5000/sites
    ProxyPassReverse /sites http://localhost:5000/sites
    
    ProxyPass /site http://localhost:5000/site
    ProxyPassReverse /site http://localhost:5000/site
    
    ProxyPass /domains http://localhost:5000/domains
    ProxyPassReverse /domains http://localhost:5000/domains
    
    ProxyPass /ssl http://localhost:5000/ssl
    ProxyPassReverse /ssl http://localhost:5000/ssl
    
    ProxyPass /pm2 http://localhost:5000/pm2
    ProxyPassReverse /pm2 http://localhost:5000/pm2
    
    ProxyPass /files http://localhost:5000/files
    ProxyPassReverse /files http://localhost:5000/files
    
    ProxyPass /list http://localhost:5000/list
    ProxyPassReverse /list http://localhost:5000/list
    
    ProxyPass /server http://localhost:5000/server
    ProxyPassReverse /server http://localhost:5000/server
    
    ProxyPass /apache http://localhost:5000/apache
    ProxyPassReverse /apache http://localhost:5000/apache
    
    ProxyPass /run http://localhost:5000/run
    ProxyPassReverse /run http://localhost:5000/run

    # WebSocket support for Socket.IO
    ProxyPass /socket.io http://localhost:5000/socket.io
    ProxyPassReverse /socket.io http://localhost:5000/socket.io
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)  ws://localhost:5000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)  http://localhost:5000/$1 [P,L]

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/localed-error.log
    CustomLog ${APACHE_LOG_DIR}/localed-access.log combined
</VirtualHost>
```

### Enable Required Modules
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
```

### Enable Site
```bash
sudo a2ensite myhost.nuckz.live.conf
```

### Disable Default Site (optional)
```bash
sudo a2dissite 000-default.conf
```

### Test Configuration
```bash
sudo apache2ctl configtest
```

### Restart Apache
```bash
sudo systemctl restart apache2
```

---

## 6️⃣ Firewall Configuration

### Oracle Cloud Console
1. Go to your instance page
2. Click on the subnet
3. Click on the default security list
4. Add Ingress Rules:
   - Source: `0.0.0.0/0`
   - Destination Port: `80`
   - Description: HTTP
   
   - Source: `0.0.0.0/0`
   - Destination Port: `443`
   - Description: HTTPS

### Server Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status
```

---

## 7️⃣ DNS Configuration

In your domain registrar (where you manage nuckz.live):

**Add A Record:**
- **Type**: A
- **Name**: myhost (or @ for root)
- **Value**: 140.238.243.XXX (your Oracle IP)
- **TTL**: 3600

**Wait 5-15 minutes for DNS propagation.**

Test DNS:
```bash
nslookup myhost.nuckz.live
```

---

## 8️⃣ SSL Certificate Installation

```bash
sudo certbot --apache -d myhost.nuckz.live --non-interactive --agree-tos --email admin@nuckz.live
```

Certbot will:
- Verify domain ownership
- Install SSL certificate
- Auto-configure Apache for HTTPS
- Setup auto-renewal

### Test SSL
```bash
sudo certbot renew --dry-run
```

---

## 9️⃣ Testing

### Check Services
```bash
# Backend
pm2 status
pm2 logs localed-backend --lines 50

# Apache
sudo systemctl status apache2

# Test backend locally
curl http://localhost:5000/sites
```

### Access Application
Open browser:
- **HTTP**: http://myhost.nuckz.live
- **HTTPS**: https://myhost.nuckz.live

---

## 🔄 Updating Application

When you push updates to GitHub:

```bash
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

# No Apache restart needed (serves static files)
```

---

## 📊 Monitoring

### View Logs
```bash
# Backend logs
pm2 logs localed-backend

# Apache error logs
sudo tail -f /var/log/apache2/localed-error.log

# Apache access logs
sudo tail -f /var/log/apache2/localed-access.log
```

### Check Status
```bash
pm2 status
sudo systemctl status apache2
```

---

## 🐛 Troubleshooting

### Backend Not Starting
```bash
pm2 logs localed-backend
cd ~/finalproject/back
node server.js  # Run directly to see errors
```

### Apache Issues
```bash
sudo apache2ctl configtest
sudo systemctl status apache2
sudo tail -100 /var/log/apache2/localed-error.log
```

### Port Already in Use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
pm2 restart localed-backend
```

### Can't Access Site
1. Check DNS: `nslookup myhost.nuckz.live`
2. Check firewall: `sudo ufw status`
3. Check Oracle security list (ports 80, 443)
4. Check Apache: `sudo systemctl status apache2`
5. Check backend: `pm2 status`

### WebSocket Connection Failed
- Ensure `proxy_wstunnel` module is enabled
- Check Apache config has WebSocket rewrite rules
- Check backend is running: `curl http://localhost:5000/socket.io/`

---

## 🔒 Security Checklist

- [x] Firewall enabled (UFW)
- [x] Only necessary ports open (22, 80, 443)
- [x] SSL certificate installed
- [x] Backend runs as non-root user
- [x] Apache security headers configured
- [ ] Change default SSH port (optional)
- [ ] Setup fail2ban (optional)
- [ ] Regular backups configured

---

## 📝 Important Notes

1. **API URLs**: The frontend uses environment variables. In production with empty `VITE_API_URL`, it uses relative paths which Apache proxies to the backend.

2. **File Permissions**: Ensure Apache can read frontend files:
   ```bash
   chmod -R 755 ~/finalproject/front/dist
   ```

3. **PM2 Logs**: Logs are stored in `~/.pm2/logs/`

4. **Apache Modules**: Make sure all required modules are enabled

5. **Domain DNS**: Must point to server IP before SSL installation

---

## 🎉 Success!

Your LOCALED application should now be accessible at:
- https://myhost.nuckz.live

Features available:
- Dashboard with server stats
- Site management (create, enable, disable, SSL)
- Apache configuration editor
- File manager
- PM2 process manager
- DNS configuration helper

---

## Support

For issues, check:
- Backend logs: `pm2 logs localed-backend`
- Apache logs: `/var/log/apache2/`
- Application repo: https://github.com/adhilNuckz/finalproject

**Happy Hosting! 🚀**
