# Digital Ocean Droplet Deployment with Apache

## Server Details
- **IP Address**: 142.93.220.168
- **Web Server**: Apache2
- **Environment**: Testing/Production

## Architecture Overview
Your application has 3 components:
1. **Backend API** (Port 5000) - Express.js server with Socket.IO
2. **Terminal Service** (Port 3000) - PTY terminal via Socket.IO
3. **Frontend** (Static files served by Apache) - React/Vite build

---

## Step-by-Step Deployment with Apache

### Step 1: Initial Server Setup

SSH into your droplet:
```bash
ssh root@142.93.220.168
```

Install required packages:
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

# Install Apache2
apt install -y apache2

# Install UFW firewall
apt install -y ufw
```

### Step 2: Configure Firewall

```bash
# Allow SSH (CRITICAL!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 3: Enable Apache Modules

```bash
# Enable required Apache modules
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
a2enmod headers

# Restart Apache to load modules
systemctl restart apache2
systemctl enable apache2
```

### Step 4: Upload Your Application

From your local machine:
```bash
# Navigate to your project directory
cd /home/kali/LOCALED

# Create archive excluding node_modules
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='front/dist' \
    --exclude='back/uploads/*' \
    --exclude='*.tar.gz' \
    -czf localed-app.tar.gz .

# Copy to droplet
scp localed-app.tar.gz root@142.93.220.168:/root/

# Also copy Apache config
scp apache.conf root@142.93.220.168:/root/
```

### Step 5: Extract and Install Dependencies

On the droplet:
```bash
# Extract application
cd /root
tar -xzf localed-app.tar.gz -C /root/LOCALED
cd LOCALED

# Install backend dependencies
cd back
npm install --production

# Install terminal dependencies
cd ../terminal
npm install --production

# Install frontend dependencies and build
cd ../front
npm install
npm run build
```

### Step 6: Configure Apache Virtual Host

```bash
# Copy Apache configuration
cp /root/apache.conf /etc/apache2/sites-available/localed.conf

# Disable default site
a2dissite 000-default.conf

# Enable your site
a2ensite localed.conf

# Test Apache configuration
apache2ctl configtest

# If configuration is OK, restart Apache
systemctl restart apache2
```

### Step 7: Start Backend Services with PM2

```bash
cd /root/LOCALED

# Start backend API
pm2 start back/server.js --name "backend-api"

# Start terminal service
pm2 start terminal/server.js --name "terminal-service"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command output and run the suggested command
```

### Step 8: Set Correct Permissions

```bash
# Set ownership for Apache
chown -R www-data:www-data /root/LOCALED/front/dist

# Set proper permissions
chmod -R 755 /root/LOCALED/front/dist

# For uploads directory
mkdir -p /root/LOCALED/back/uploads
chown -R www-data:www-data /root/LOCALED/back/uploads
chmod -R 755 /root/LOCALED/back/uploads
```

---

## Access Your Application

- **Frontend**: http://142.93.220.168
- **API (proxied)**: http://142.93.220.168/api
- **Backend Direct**: http://142.93.220.168:5000
- **Terminal Service**: http://142.93.220.168:3000

---

## Apache Management Commands

```bash
# Check Apache status
systemctl status apache2

# Restart Apache
systemctl restart apache2

# Reload Apache (graceful restart)
systemctl reload apache2

# Stop Apache
systemctl stop apache2

# Start Apache
systemctl start apache2

# View Apache error logs
tail -f /var/log/apache2/localed-error.log

# View Apache access logs
tail -f /var/log/apache2/localed-access.log

# Test configuration
apache2ctl configtest

# View enabled sites
ls -la /etc/apache2/sites-enabled/

# View enabled modules
apache2ctl -M
```

## PM2 Management Commands

```bash
# View all services
pm2 list

# View logs
pm2 logs

# View specific service logs
pm2 logs backend-api
pm2 logs terminal-service

# Restart services
pm2 restart backend-api
pm2 restart terminal-service
pm2 restart all

# Stop services
pm2 stop backend-api
pm2 stop all

# Monitor services
pm2 monit

# Delete service
pm2 delete backend-api

# View service details
pm2 show backend-api
```

---

## Troubleshooting

### Apache Won't Start
```bash
# Check for syntax errors
apache2ctl configtest

# Check if port 80 is already in use
netstat -tlnp | grep :80

# View detailed error
systemctl status apache2 -l

# Check error logs
tail -100 /var/log/apache2/error.log
```

### 403 Forbidden Error
```bash
# Check file permissions
ls -la /root/LOCALED/front/dist

# Set correct ownership
chown -R www-data:www-data /root/LOCALED/front/dist

# Check SELinux (if enabled)
getenforce
# If enforcing, you may need to set context or disable
```

### Backend Services Not Accessible
```bash
# Check if services are running
pm2 status

# Check if ports are listening
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000

# View backend logs
pm2 logs backend-api --lines 50

# Restart services
pm2 restart all
```

### WebSocket Connection Issues
```bash
# Ensure proxy_wstunnel module is enabled
apache2ctl -M | grep proxy_wstunnel

# If not enabled:
a2enmod proxy_wstunnel
systemctl restart apache2

# Check Apache error logs for WebSocket issues
grep -i websocket /var/log/apache2/localed-error.log
```

### Frontend Shows "Cannot connect to API"
```bash
# Verify backend is running
pm2 status

# Check backend can be accessed locally
curl http://localhost:5000/api/health

# Check Apache proxy configuration
apache2ctl -S

# Verify firewall allows connections
ufw status
```

---

## SSL Setup with Let's Encrypt (Optional but Recommended)

### Prerequisites
You need a domain name pointing to your droplet IP.

```bash
# Install Certbot
apt install -y certbot python3-certbot-apache

# Get SSL certificate
certbot --apache -d yourdomain.com

# Or if you only have IP (not recommended for production)
# Use self-signed certificate:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt
```

Then update your Apache config to use SSL:
```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # ... rest of your configuration
</VirtualHost>
```

---

## Updating Your Application

When you make changes locally:

```bash
# On local machine
cd /home/kali/LOCALED
tar --exclude='node_modules' --exclude='.git' -czf localed-app.tar.gz .
scp localed-app.tar.gz root@142.93.220.168:/root/

# On droplet
ssh root@142.93.220.168
cd /root/LOCALED

# Backup current version
cp -r /root/LOCALED /root/LOCALED.backup

# Extract new version
tar -xzf ../localed-app.tar.gz

# Rebuild frontend
cd front
npm install
npm run build

# Set permissions
chown -R www-data:www-data /root/LOCALED/front/dist

# Restart backend services
pm2 restart all

# No need to restart Apache unless config changed
```

---

## Quick Deployment Script

Create `/root/deploy-localed.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying LOCALED application..."

# Navigate to app directory
cd /root/LOCALED

# Backup
echo "📦 Creating backup..."
rm -rf /root/LOCALED.backup
cp -r /root/LOCALED /root/LOCALED.backup

# Install backend dependencies
echo "📚 Installing backend dependencies..."
cd back
npm install --production

# Install terminal dependencies
echo "📚 Installing terminal dependencies..."
cd ../terminal
npm install --production

# Build frontend
echo "🏗️  Building frontend..."
cd ../front
npm install
npm run build

# Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /root/LOCALED/front/dist
chmod -R 755 /root/LOCALED/front/dist

# Restart services
echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Deployment complete!"
echo "🌐 Access at: http://142.93.220.168"
pm2 status
```

Make it executable:
```bash
chmod +x /root/deploy-localed.sh
```

---

## Performance Optimization

### Enable Apache Compression
```bash
# Enable mod_deflate
a2enmod deflate

# Add to your virtual host config:
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### Enable Apache Caching
```bash
# Enable caching modules
a2enmod expires
a2enmod headers

# Add to your virtual host:
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### PM2 Cluster Mode
```bash
# Start backend in cluster mode (use all CPU cores)
pm2 start back/server.js --name "backend-api" -i max
```

---

## Security Recommendations

1. **Keep System Updated**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Use Fail2Ban** to prevent brute force attacks
   ```bash
   apt install fail2ban
   systemctl enable fail2ban
   ```

3. **Disable Directory Listing** (already done in config)

4. **Setup Proper Authentication** in your application

5. **Use Environment Variables** for sensitive data
   ```bash
   # Create .env files
   nano /root/LOCALED/back/.env
   ```

6. **Regular Backups**
   ```bash
   # Setup cron job for backups
   crontab -e
   # Add: 0 2 * * * tar -czf /root/backups/localed-$(date +\%Y\%m\%d).tar.gz /root/LOCALED
   ```

---

## Monitoring

### Setup Basic Monitoring
```bash
# Install htop for process monitoring
apt install htop

# Install Apache monitoring tools
apt install apache2-utils
```

### View Resource Usage
```bash
# CPU and Memory
htop

# Disk usage
df -h

# Apache status
apache2ctl status

# PM2 monitoring
pm2 monit
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Apache can't access /root directory | Move app to /var/www or adjust permissions |
| Socket.IO not connecting | Ensure proxy_wstunnel is enabled |
| 502 Bad Gateway | Check if backend services are running with `pm2 status` |
| Frontend not loading | Check build exists: `ls /root/LOCALED/front/dist` |
| CORS errors | Verify CORS settings in backend server.js |

---

## Support

For issues:
1. Check Apache logs: `/var/log/apache2/localed-error.log`
2. Check PM2 logs: `pm2 logs`
3. Check system logs: `journalctl -xe`
4. Verify all services: `pm2 status && systemctl status apache2`
