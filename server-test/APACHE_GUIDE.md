# Apache2 Configuration Guide

This guide provides detailed instructions for serving your application through Apache2 on port 5252.

## Overview

Apache will:
- Serve the React frontend from the built `dist` folder on port 5252
- Proxy API requests to the backend server (port 5002)
- Handle WebSocket connections for Socket.IO
- Support React Router with proper URL rewriting

## Prerequisites

- Apache2 installed on your server
- Root or sudo access
- Backend and Terminal servers running (via PM2 or manually)
- Frontend built (`npm run build` in frontend directory)

## Step-by-Step Setup

### 1. Enable Required Apache Modules

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel  # For WebSocket support
sudo a2enmod rewrite          # For React Router
```

Verify modules are enabled:
```bash
apache2ctl -M | grep -E 'proxy|rewrite'
```

### 2. Create Virtual Host Configuration

Create a new configuration file:

```bash
sudo nano /etc/apache2/sites-available/app.conf
```

Add the following configuration:

```apache
<VirtualHost *:5252>
    # Server configuration
    ServerName 142.93.220.168
    ServerAdmin admin@yourdomain.com
    
    # Document root - points to the built React app
    DocumentRoot /var/www/server-test/frontend/dist
    
    # Directory configuration for the React app
    <Directory /var/www/server-test/frontend/dist>
        # Don't list directory contents
        Options -Indexes +FollowSymLinks
        
        # Allow .htaccess overrides
        AllowOverride All
        
        # Allow access from all
        Require all granted
        
        # React Router support - redirect all requests to index.html
        RewriteEngine On
        RewriteBase /
        
        # Don't rewrite files or directories that exist
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        
        # Rewrite everything else to index.html
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy settings
    ProxyPreserveHost On
    ProxyTimeout 600
    
    # Proxy API requests to backend server
    ProxyPass /api http://127.0.0.1:5002/api
    ProxyPassReverse /api http://127.0.0.1:5002/api
    
    # Proxy Socket.IO WebSocket connections
    ProxyPass /socket.io http://127.0.0.1:5002/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:5002/socket.io
    
    # WebSocket upgrade support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:5002/$1" [P,L]
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/app-error.log
    CustomLog ${APACHE_LOG_DIR}/app-access.log combined
    
    # Optional: Set log level for debugging
    # LogLevel warn
</VirtualHost>

# Make Apache listen on port 5252
Listen 5252
```

Save and exit (Ctrl+X, then Y, then Enter).

### 3. Configure Apache Ports

Edit the ports configuration:

```bash
sudo nano /etc/apache2/ports.conf
```

Add this line if not already present:

```apache
Listen 5252
```

### 4. Enable the Site

```bash
sudo a2ensite app.conf
```

### 5. Test Configuration

Before restarting Apache, test the configuration:

```bash
sudo apache2ctl configtest
```

You should see "Syntax OK". If you see errors, review your configuration.

### 6. Restart Apache

```bash
sudo systemctl restart apache2
```

Check Apache status:

```bash
sudo systemctl status apache2
```

### 7. Configure Firewall

Open the necessary ports:

```bash
# Open frontend port
sudo ufw allow 5252/tcp

# Open backend port (if you want direct access)
sudo ufw allow 5002/tcp

# Open terminal port (if you want direct access)
sudo ufw allow 3002/tcp

# Reload firewall
sudo ufw reload

# Check firewall status
sudo ufw status
```

## Alternative Configuration - Without Port 5252

If you want to use the default HTTP port (80):

```apache
<VirtualHost *:80>
    ServerName 142.93.220.168
    # ... rest of configuration same as above ...
</VirtualHost>
```

Then remove the `Listen 5252` line.

## Verification

### 1. Check Apache is Listening

```bash
netstat -tulpn | grep apache2
```

You should see Apache listening on port 5252.

### 2. Test Local Access

From the server:

```bash
curl http://localhost:5252
```

You should get HTML output from your React app.

### 3. Test Remote Access

From your local laptop:

```bash
curl http://142.93.220.168:5252
```

Or open in a browser: http://142.93.220.168:5252

## Troubleshooting

### Issue: Apache Won't Start

**Check logs:**
```bash
sudo tail -f /var/log/apache2/error.log
```

**Common causes:**
- Port 5252 already in use
- Syntax errors in configuration
- Modules not enabled

### Issue: 404 Errors for Routes

**Problem:** React Router routes return 404

**Solution:** Ensure the rewrite rules are in place in the Directory block.

### Issue: API Calls Fail

**Check backend is running:**
```bash
curl http://localhost:5002/sites
```

**Check proxy configuration:**
- Ensure ProxyPass directives are correct
- Check backend logs: `pm2 logs app-backend`

### Issue: WebSocket Connection Failed

**Ensure proxy_wstunnel is enabled:**
```bash
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2
```

**Check Socket.IO is working:**
```bash
curl http://localhost:5002/socket.io/
```

### Issue: Permission Denied

**Check directory permissions:**
```bash
ls -la /var/www/server-test/frontend/dist/
```

**Fix permissions if needed:**
```bash
sudo chown -R www-data:www-data /var/www/server-test/frontend/dist/
sudo chmod -R 755 /var/www/server-test/frontend/dist/
```

## Viewing Logs

### Access Logs
```bash
sudo tail -f /var/log/apache2/app-access.log
```

### Error Logs
```bash
sudo tail -f /var/log/apache2/app-error.log
```

### All Apache Logs
```bash
sudo tail -f /var/log/apache2/*.log
```

## Performance Tuning (Optional)

### Enable Compression

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Enable Caching

```apache
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

## SSL/HTTPS Setup (Recommended for Production)

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get certificate (requires a domain name)
sudo certbot --apache -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Manual SSL Configuration

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt
    
    # ... rest of configuration ...
</VirtualHost>
```

## Useful Commands

```bash
# Restart Apache
sudo systemctl restart apache2

# Reload Apache (without dropping connections)
sudo systemctl reload apache2

# Check Apache status
sudo systemctl status apache2

# Test configuration
sudo apache2ctl configtest

# List enabled sites
sudo apache2ctl -S

# Disable a site
sudo a2dissite app.conf

# Enable a site
sudo a2ensite app.conf

# View Apache version
apache2 -v
```

## Security Recommendations

1. **Disable directory listing** - Already done with `Options -Indexes`
2. **Hide Apache version** - Add to apache2.conf: `ServerTokens Prod` and `ServerSignature Off`
3. **Enable HTTPS** - Use SSL certificates
4. **Limit request size** - Add: `LimitRequestBody 10485760` (10MB)
5. **Configure mod_security** - For additional security
6. **Use fail2ban** - To prevent brute force attacks

## Summary

Once configured, Apache will:
- ✅ Serve your React frontend on port 5252
- ✅ Proxy API calls to your backend
- ✅ Handle WebSocket connections
- ✅ Support React Router navigation
- ✅ Log all access and errors

Your application will be accessible at: **http://142.93.220.168:5252**
