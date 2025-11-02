# Complete Site Hosting Workflow Documentation

## Overview
This application provides a complete web hosting management system with domain management, file uploads, SSL certificates, and API proxy configuration.

## 🚀 Complete Workflow

### 1. User Authentication
- User logs into the app from:
  - Local computer/laptop
  - Server interface directly

### 2. Add New Site Process

#### Step 1: Domain Configuration
1. **Select or Add Domain**
   - Choose from existing domains pointed to your server
   - Add new domain with "Add Domain" button
   - System provides DNS configuration instructions

2. **Configure Subdomain**
   - Enter subdomain name (e.g., blog, app, api, www)
   - System automatically validates and formats subdomain
   - Final URL preview shown: `subdomain.domain.com`

#### Step 2: File Upload
**Two Methods Available:**

**Method A: Local File Upload (from computer)**
- Drag & drop or browse files
- Upload HTML, CSS, JS, PHP, images, etc.
- Multiple files supported
- Shows file count and sizes

**Method B: Server Files (from server directory)**
- Browse server filesystem
- Navigate through directories
- Select existing files/folders
- Useful when files already on server

#### Step 3: Site Configuration
1. **Folder Setup**
   - Folder Name: Name for your site folder
   - Folder Location: Base path (default: `/var/www/html`)
   - Full path preview shown

2. **Main File Selection**
   - Choose entry point file (e.g., index.html, index.php)
   - Auto-populated from uploaded files

3. **PHP Version**
   - Select PHP version if needed
   - Options: None, 7.4, 8.0, 8.1, 8.2
   - Configures PHP-FPM automatically

4. **API Routes Configuration**
   - Add multiple API endpoints
   - Configure reverse proxy for backend services
   - Example: `/api` → `localhost:3000`
   - Each route has:
     - Path: URL path (e.g., /api, /graphql)
     - Port: Backend port number
     - Description: Optional notes

#### Step 4: Review & Deploy
1. **SSL Certificate**
   - Enable HTTPS with Let's Encrypt
   - Auto-renewal option available
   - Requires proper DNS configuration

2. **Review Configuration**
   - Domain: Full domain name
   - Document Root: File location
   - Main File: Entry point
   - Upload Method: Local or Server
   - API Routes: Configured endpoints
   - SSL Status: Enabled/Disabled

3. **Deploy**
   - Click "Deploy Site"
   - System automatically:
     - Creates folder structure
     - Sets proper permissions
     - Generates Apache virtual host
     - Configures proxy for APIs
     - Enables PHP if selected
     - Installs SSL if requested
     - Reloads Apache
     - Adds site to monitoring

### 3. Post-Deployment Features

#### View Site
- **View Site** button opens site in new tab
- Automatically uses HTTP or HTTPS based on SSL status
- External link icon for easy access

#### SSL Management
- **Add SSL** button for sites without SSL
- Shows SSL status badge (green lock icon)
- Uses Certbot for free certificates
- Auto-renewal configuration
- Requirements:
  - Domain DNS must point to server
  - Ports 80 and 443 must be accessible
  - Domain must be accessible from internet

#### Site Controls
- **Start/Stop**: Enable or disable site
- **Restart**: Reload site configuration
- **Status Badge**: Visual status indicator
  - 🟢 Online: Site is active
  - 🔴 Offline: Site is disabled
  - 🟡 Maintenance: Site in maintenance mode

### 4. DNS Configuration Helper

Access via:
- Dashboard → Quick Actions → "DNS Configuration"
- Automatic helper during domain setup

**Provides:**
- Current server IP address
- DNS record templates
- Copy-to-clipboard functionality
- Step-by-step instructions
- DNS propagation checker link

**Required DNS Records:**
```
Type: A    Name: @      Value: [Your Server IP]
Type: A    Name: www    Value: [Your Server IP]
Type: A    Name: *      Value: [Your Server IP] (wildcard)
```

### 5. Domain Management

**Features:**
- Add new domains
- Store domain configurations
- Track domain status
- Associate domains with sites

**Backend Storage:**
- Domains stored in `domains.json`
- Persistent across restarts
- Real-time updates via WebSocket

### 6. Apache Configuration

**Generated Virtual Host Includes:**
- ServerName (domain)
- DocumentRoot (file location)
- DirectoryIndex (main file)
- Directory permissions
- PHP-FPM configuration (if enabled)
- Proxy configuration for APIs
- Error and access logs
- SSL configuration (if enabled)

**Example Apache Config:**
```apache
<VirtualHost *:80>
    ServerName blog.example.com
    DocumentRoot /var/www/html/blog
    DirectoryIndex index.html
    
    <Directory /var/www/html/blog>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # API Proxy
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    ErrorLog ${APACHE_LOG_DIR}/blog.example.com-error.log
    CustomLog ${APACHE_LOG_DIR}/blog.example.com-access.log combined
</VirtualHost>
```

### 7. API Endpoints

#### Site Management
- `POST /site/create-advanced` - Create new site with full features
- `GET /sites` - List all sites
- `POST /sites` - Enable/disable/maintenance site

#### SSL Management
- `POST /ssl/install` - Install SSL certificate
- `GET /ssl/status/:domain` - Check SSL status
- `POST /ssl/renew` - Renew certificate
- `DELETE /ssl/remove/:domain` - Remove certificate

#### Domain Management
- `GET /domains` - List all domains
- `POST /domains` - Add new domain
- `DELETE /domains/:domain` - Remove domain

#### Apache Control
- `GET /api/apache/status` - Get Apache status
- `POST /api/apache/control` - Control Apache (start/stop/restart/reload)
- `GET /api/apache/configs` - List configurations
- `GET /api/apache/logs` - View logs
- `GET /api/apache/test` - Test configuration

#### Server Info
- `GET /server/ip` - Get server IP address
- `GET /server/paths` - Get allowed paths

### 8. File Upload System

**Local Upload:**
- Multipart form data
- Supports multiple files
- Files uploaded to temp directory
- Moved to document root with proper permissions

**Server Upload:**
- Browse server filesystem
- Copy files from existing location
- Secure path validation
- Only allowed directories accessible

### 9. Security Features

**Path Security:**
- Whitelist of allowed directories
- Path traversal protection
- Automatic permission setting (www-data:www-data)

**SSL/HTTPS:**
- Free certificates via Let's Encrypt
- Automatic renewal
- HTTP to HTTPS redirect
- Certificate management

**Apache Security:**
- Disabled directory indexes
- AllowOverride for .htaccess
- Proper file permissions
- Error log monitoring

### 10. Real-time Features

**WebSocket Updates:**
- Live site status changes
- Real-time log streaming
- Instant site list updates
- Action output monitoring

**Live Console:**
- Command execution output
- Color-coded messages
- Timestamp tracking
- Error highlighting

## 📋 Requirements Checklist

### Before Creating a Site:
- [ ] Domain registered and owned
- [ ] DNS access to domain registrar
- [ ] Server IP address known
- [ ] Ports 80 (HTTP) and 443 (HTTPS) open
- [ ] Apache installed and running
- [ ] Certbot installed (for SSL)
- [ ] Required PHP version installed (if needed)

### For SSL Installation:
- [ ] DNS A record points to server
- [ ] Domain accessible from internet
- [ ] No firewall blocking ports 80/443
- [ ] Valid email for Let's Encrypt
- [ ] DNS fully propagated (5-60 minutes)

### For API Proxy:
- [ ] Backend service running
- [ ] Backend port accessible
- [ ] Apache proxy modules enabled (`proxy`, `proxy_http`)
- [ ] Correct API path configuration

## 🎯 Best Practices

1. **DNS First**: Always configure DNS before creating site
2. **Test Without SSL**: Verify site works on HTTP first
3. **Then Add SSL**: Install SSL after confirming site works
4. **API Testing**: Test backend independently before proxying
5. **Logs Monitoring**: Check Apache logs for errors
6. **Backup**: Keep backups of site files and configs
7. **Permissions**: Ensure proper file ownership (www-data)

## 🐛 Troubleshooting

### Site Not Accessible
1. Check DNS propagation: https://dnschecker.org
2. Verify Apache is running: `systemctl status apache2`
3. Check site is enabled: `a2ensite sitename`
4. Review Apache logs: `/var/log/apache2/`

### SSL Installation Fails
1. Verify DNS points to server
2. Check ports 80/443 are open
3. Ensure domain is accessible via HTTP first
4. Review Certbot logs: `/var/log/letsencrypt/`

### API Proxy Not Working
1. Verify backend service is running
2. Check proxy modules: `a2enmod proxy proxy_http`
3. Review Apache error logs
4. Test backend directly: `curl localhost:PORT/api`

### File Upload Issues
1. Check folder permissions
2. Verify upload size limits (PHP/Apache)
3. Check available disk space
4. Review upload directory write permissions

## 📚 Additional Resources

- Apache Documentation: https://httpd.apache.org/docs/
- Let's Encrypt: https://letsencrypt.org/
- Certbot: https://certbot.eff.org/
- DNS Checker: https://dnschecker.org/
- Apache Proxy Guide: https://httpd.apache.org/docs/current/mod/mod_proxy.html

## 🎉 Summary

This system provides enterprise-grade web hosting management with:
- ✅ Multiple domain support
- ✅ Flexible file upload (local/server)
- ✅ Automatic SSL certificates
- ✅ API reverse proxy
- ✅ Real-time monitoring
- ✅ DNS configuration helper
- ✅ User-friendly interface
- ✅ Complete automation

Your sites will be accessible from the internet via your domain name with proper DNS configuration and optional HTTPS encryption!
