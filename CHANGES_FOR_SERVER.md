# Server Deployment Guide for 142.93.220.168:4242

## 📋 Analysis Summary

### Current Configuration:
- **Backend Server**: Port 5000, already listens on `0.0.0.0` ✅
- **Terminal Server**: Port 3000, already listens on `0.0.0.0` ✅
- **Frontend Dev**: Port 5173, already listens on `0.0.0.0` ✅
- **Backend CORS**: Set to allow all origins (`*`) ✅
- **Terminal CORS**: Defaults to `http://localhost:5173` ⚠️ (needs update)

---

## 🔧 Required Changes

### 1. Environment Files to Create

#### `/home/kali/LOCALED/back/.env`
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
```

#### `/home/kali/LOCALED/terminal/.env`
```env
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://142.93.220.168:4242,http://localhost:5173
```

#### `/home/kali/LOCALED/front/.env` (Update existing)
```env
VITE_API_URL=http://142.93.220.168:4242/api
VITE_TERMINAL_URL=http://142.93.220.168:4242/terminal
```

---

## 🚀 Deployment Steps

### Step 1: Install Dependencies (if not already done)
```bash
# Backend
cd /home/kali/LOCALED/back
npm install

# Terminal
cd /home/kali/LOCALED/terminal
npm install

# Frontend
cd /home/kali/LOCALED/front
npm install
```

### Step 2: Create Environment Files
```bash
# Backend .env
cat > /home/kali/LOCALED/back/.env << 'EOF'
PORT=5002
HOST=0.0.0.0
NODE_ENV=production
EOF

# Terminal .env
cat > /home/kali/LOCALED/terminal/.env << 'EOF'
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://142.93.220.168:4242,http://localhost:5173
EOF

# Frontend .env (update)
cat > /home/kali/LOCALED/front/.env << 'EOF'
VITE_API_URL=http://142.93.220.168:4242/api
VITE_TERMINAL_URL=http://142.93.220.168:4242/terminal
EOF
```

### Step 3: Build Frontend
```bash
cd /home/kali/LOCALED/front
npm run build
```
This creates `/home/kali/LOCALED/front/dist` folder.

### Step 4: Install Apache (if not installed)
```bash
sudo apt update
sudo apt install apache2 -y

# Enable required Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
```

### Step 5: Create Apache Virtual Host Configuration
```bash
sudo nano /etc/apache2/sites-available/localed.conf
```

Paste this configuration:
```apache
<VirtualHost *:4242>
    ServerName 142.93.220.168
    
    # Frontend static files
    DocumentRoot /home/kali/LOCALED/front/dist
    
    <Directory /home/kali/LOCALED/front/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing - redirect all requests to index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    
    # Backend API proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:5000/
    ProxyPassReverse /api/ http://localhost:5000/
    
    # Terminal WebSocket proxy
    ProxyPass /terminal/ ws://localhost:3000/
    ProxyPassReverse /terminal/ ws://localhost:3000/
    
    # Also handle regular HTTP for terminal
    ProxyPass /terminal http://localhost:3000/
    ProxyPassReverse /terminal http://localhost:3000/
    
    # Proxy settings for WebSocket
    <Location /terminal>
        ProxyPass ws://localhost:3000
        ProxyPassReverse ws://localhost:3000
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
        RewriteCond %{HTTP:Upgrade} !=websocket [NC]
        RewriteRule /(.*)           http://localhost:3000/$1 [P,L]
    </Location>
    
    # Timeouts for long operations
    ProxyTimeout 300
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Max upload size
    LimitRequestBody 104857600
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/localed_error.log
    CustomLog ${APACHE_LOG_DIR}/localed_access.log combined
</VirtualHost>
```

### Step 6: Configure Apache to Listen on Port 4242
```bash
sudo nano /etc/apache2/ports.conf
```

Add this line (if not already present):
```apache
Listen 4242
```

### Step 7: Enable Site and Restart Apache
```bash
# Enable the site
sudo a2ensite localed.conf

# Test configuration
sudo apache2ctl configtest

# If test passes, restart Apache
sudo systemctl restart apache2
sudo systemctl status apache2
```

### Step 7: Configure Firewall
```bash
# Check current firewall status
sudo ufw status

# Allow port 4242
sudo ufw allow 4242/tcp

# Optional: Allow SSH if not already allowed
sudo ufw allow 22/tcp

# Enable firewall if not enabled
sudo ufw enable

# Verify
sudo ufw status numbered
```

### Step 8: Start Backend Services

#### Option A: Manual Start (for testing)
```bash
# Terminal 1 - Backend
cd /home/kali/LOCALED/back
node server.js

# Terminal 2 - Terminal Server
cd /home/kali/LOCALED/terminal
node server.js
```

#### Option B: Using PM2 (recommended for production)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend
cd /home/kali/LOCALED/back
pm2 start server.js --name "backend"

# Start terminal server
cd /home/kali/LOCALED/terminal
pm2 start server.js --name "terminal"

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs
```

---

## 🧪 Testing

### Test 1: Check Services
```bash
# Check if backend is running
sudo lsof -i :5000

# Check if terminal server is running
sudo lsof -i :3000

# Check if Nginx is running on 4242
sudo lsof -i :4242
```

### Test 2: Local Test
```bash
# Test Nginx is serving frontend
curl http://localhost:4242

# Test API endpoint
curl http://localhost:4242/api/server/info

# Test terminal endpoint
curl http://localhost:4242/terminal/
```

### Test 3: Remote Test
From your local computer:
```bash
# Test if accessible
curl http://142.93.220.168:4242

# Or open in browser
# http://142.93.220.168:4242
```

### Test 4: Check Logs
```bash
# Apache logs
sudo tail -f /var/log/apache2/localed_access.log
sudo tail -f /var/log/apache2/localed_error.log

# PM2 logs (if using PM2)
pm2 logs backend
pm2 logs terminal
```

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 4242
sudo lsof -i :4242
sudo kill -9 <PID>

# Or for backend/terminal ports
sudo lsof -i :5000
sudo lsof -i :3000
```

### Apache Module Issues
```bash
# Check if required modules are enabled
apache2ctl -M | grep proxy

# If not enabled, enable them
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### CORS Issues
```bash
# Check terminal server logs for CORS errors
pm2 logs terminal

# Verify ALLOWED_ORIGINS in terminal/.env includes your frontend URL
cat /home/kali/LOCALED/terminal/.env
```

### WebSocket Connection Issues
```bash
# Check if WebSocket upgrade is working
sudo tail -f /var/log/apache2/localed_error.log

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/

# Check Apache modules
apache2ctl -M | grep proxy
```

### Cannot Access from External IP
```bash
# Verify server IP
ip addr show

# Check firewall
sudo ufw status

# Check if Apache is listening on all interfaces
sudo netstat -tulpn | grep :4242

# Check if cloud provider firewall allows port 4242
# (Digital Ocean, AWS, etc. may have additional firewall rules)
```

### Apache Permission Issues
```bash
# Give Apache access to dist folder
sudo chmod -R 755 /home/kali/LOCALED/front/dist
sudo chown -R www-data:www-data /home/kali/LOCALED/front/dist

# Or allow Apache to read user directories
sudo chmod +x /home
sudo chmod +x /home/kali
sudo chmod +x /home/kali/LOCALED
```

---

## 📦 PM2 Management Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs

# Restart services
pm2 restart backend
pm2 restart terminal
pm2 restart all

# Stop services
pm2 stop backend
pm2 stop terminal
pm2 stop all

# Delete from PM2
pm2 delete backend
pm2 delete terminal

# Monitor
pm2 monit
```

---

## 🔐 Security Recommendations

1. **Setup HTTPS with SSL Certificate** (using Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

2. **Restrict Backend CORS** (optional, in `back/server.js`):
   Currently set to `origin: '*'` - consider restricting to your frontend domain.

3. **Rate Limiting** - Consider adding rate limiting to Apache:
```bash
# Install mod_evasive
sudo apt install libapache2-mod-evasive
sudo a2enmod evasive

# Configure in /etc/apache2/mods-enabled/evasive.conf
<IfModule mod_evasive20.c>
    DOSHashTableSize 3097
    DOSPageCount 5
    DOSSiteCount 100
    DOSPageInterval 1
    DOSSiteInterval 1
    DOSBlockingPeriod 60
</IfModule>
```

4. **Update UFW Rules** to only allow necessary ports:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 4242/tcp # Your app
sudo ufw enable
```

---

## ✅ Final Checklist

- [ ] All environment files created
- [ ] Frontend built (`npm run build`)
- [ ] Nginx installed and configured
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx restarted
- [ ] Firewall configured (port 4242 open)
- [ ] Backend server running (port 5000)
- [ ] Terminal server running (port 3000)
- [ ] Can access http://142.93.220.168:4242 from browser
- [ ] API calls working
- [ ] Terminal WebSocket connecting
- [ ] PM2 configured for auto-restart (optional but recommended)

---

## 📝 Important Notes

1. **Backend already allows all CORS origins** (`cors()` with no restrictions), so external access should work.

2. **Terminal CORS is restricted** - make sure `ALLOWED_ORIGINS` includes `http://142.93.220.168:4242`.

3. **All servers already listen on `0.0.0.0`** - no code changes needed, only environment configuration.

4. **Nginx acts as reverse proxy** - frontend requests to `/api` are proxied to `localhost:5000`, and `/terminal` to `localhost:3000`.

5. **File uploads** - Backend has multer configured with `uploads/` directory. Ensure this directory exists and has proper permissions.

6. **Cloud Provider Firewall** - If using Digital Ocean, AWS, etc., make sure to open port 4242 in their control panel/security groups as well.

---

## 🎯 Quick Start Commands

```bash
# 1. Create all .env files
cd /home/kali/LOCALED
cat > back/.env << 'EOF'
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
EOF

cat > terminal/.env << 'EOF'
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://142.93.220.168:4242,http://localhost:5173
EOF

cat > front/.env << 'EOF'
VITE_API_URL=http://142.93.220.168:4242/api
VITE_TERMINAL_URL=http://142.93.220.168:4242/terminal
EOF

# 2. Build frontend
cd front && npm run build && cd ..

# 3. Setup Apache (create config file manually as shown above)
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
echo "Listen 4242" | sudo tee -a /etc/apache2/ports.conf
sudo a2ensite localed.conf
sudo apache2ctl configtest
sudo systemctl restart apache2

# 4. Allow firewall
sudo ufw allow 4242/tcp

# 5. Start with PM2
sudo npm install -g pm2
cd back && pm2 start server.js --name backend && cd ..
cd terminal && pm2 start server.js --name terminal && cd ..
pm2 save
pm2 startup

# 6. Test
curl http://localhost:4242
```

---

## Support

If issues persist, check:
- Nginx error logs: `/var/log/nginx/error.log`
- PM2 logs: `pm2 logs`
- Firewall: `sudo ufw status`
- Port usage: `sudo lsof -i :4242`, `sudo lsof -i :5000`, `sudo lsof -i :3000`
