# Server Test Deployment Guide

This folder contains the production-ready version of the application configured for deployment on your remote server.

## Server Configuration

- **Server IP**: 142.93.220.168
- **Frontend Port**: 5252
- **Backend Port**: 5002
- **Terminal Port**: 3002

## Quick Start on Server

### 1. Upload Files to Server

Transfer this entire `server-test` folder to your server:

```bash
# From your local machine
scp -r server-test root@142.93.220.168:/var/www/
```

Or use SFTP/FTP to upload the folder.

### 2. Install Dependencies on Server

SSH into your server and install dependencies for each component:

```bash
ssh root@142.93.220.168

cd /var/www/server-test/backend
npm install

cd /var/www/server-test/terminal
npm install

cd /var/www/server-test/frontend
npm install
```

### 3. Build Frontend

```bash
cd /var/www/server-test/frontend
npm run build
```

This creates a `dist` folder with the production build.

### 4. Start Services

You have two options:

#### Option A: Using PM2 (Recommended for Production)

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start backend
cd /var/www/server-test/backend
pm2 start server.js --name "app-backend"

# Start terminal server
cd /var/www/server-test/terminal
pm2 start server.js --name "app-terminal"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option B: Using Node directly (for testing)

Open three terminal windows:

```bash
# Terminal 1 - Backend
cd /var/www/server-test/backend
npm start

# Terminal 2 - Terminal Server
cd /var/www/server-test/terminal
npm start

# Terminal 3 - Frontend (for testing, not needed if using Apache)
cd /var/www/server-test/frontend
npm run dev
```

## Apache2 Configuration

### Method 1: Serve Frontend via Apache (Recommended)

1. **Create Apache Virtual Host**

Create a new configuration file:

```bash
sudo nano /etc/apache2/sites-available/app.conf
```

Add this configuration:

```apache
<VirtualHost *:5252>
    ServerName 142.93.220.168
    
    DocumentRoot /var/www/server-test/frontend/dist
    
    <Directory /var/www/server-test/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Enable SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:5002/api
    ProxyPassReverse /api http://127.0.0.1:5002/api
    
    # Proxy Socket.IO connections
    ProxyPass /socket.io http://127.0.0.1:5002/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:5002/socket.io
    
    ErrorLog ${APACHE_LOG_DIR}/app-error.log
    CustomLog ${APACHE_LOG_DIR}/app-access.log combined
</VirtualHost>

# Listen on port 5252
Listen 5252
```

2. **Enable Required Apache Modules**

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
```

3. **Configure Apache to Listen on Port 5252**

Edit ports configuration:

```bash
sudo nano /etc/apache2/ports.conf
```

Add this line if not already present:

```apache
Listen 5252
```

4. **Enable the Site and Restart Apache**

```bash
sudo a2ensite app.conf
sudo systemctl restart apache2
```

5. **Open Firewall Ports**

```bash
sudo ufw allow 5252/tcp
sudo ufw allow 5002/tcp
sudo ufw allow 3002/tcp
sudo ufw reload
```

### Method 2: Direct Access via Vite Dev Server

If you want to use Vite's dev server (not recommended for production):

1. Configure Apache to proxy port 5252:

```bash
sudo nano /etc/apache2/sites-available/app-dev.conf
```

```apache
<VirtualHost *:5252>
    ServerName 142.93.220.168
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5173/
    ProxyPassReverse / http://127.0.0.1:5173/
    
    ProxyPass /ws ws://127.0.0.1:5173/ws
    ProxyPassReverse /ws ws://127.0.0.1:5173/ws
    
    ErrorLog ${APACHE_LOG_DIR}/app-dev-error.log
    CustomLog ${APACHE_LOG_DIR}/app-dev-access.log combined
</VirtualHost>

Listen 5252
```

2. Enable and restart:

```bash
sudo a2ensite app-dev.conf
sudo systemctl restart apache2
```

3. Start Vite dev server:

```bash
cd /var/www/server-test/frontend
npm run dev
```

## Accessing the Application

Once everything is set up:

- **Frontend**: http://142.93.220.168:5252
- **Backend API**: http://142.93.220.168:5002
- **Terminal Server**: http://142.93.220.168:3002

You can access the application from any computer on your local network or the internet (if ports are open).

## Environment Variables

Each component has its own `.env` file pre-configured:

### Backend (.env)
```
PORT=5002
HOST=0.0.0.0
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=http://142.93.220.168:5002
VITE_SOCKET_URL=http://142.93.220.168:5002
VITE_TERMINAL_URL=http://142.93.220.168:3002
VITE_PORT=5252
VITE_HOST=0.0.0.0
```

### Terminal (.env)
```
PORT=3002
HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=http://142.93.220.168:5252,http://localhost:5252
```

## Troubleshooting

### Check if services are running

```bash
# Check PM2 status
pm2 status

# Check Apache status
sudo systemctl status apache2

# Check ports
netstat -tulpn | grep -E '5252|5002|3002'
```

### View logs

```bash
# PM2 logs
pm2 logs

# Apache logs
sudo tail -f /var/log/apache2/app-error.log
sudo tail -f /var/log/apache2/app-access.log
```

### Restart services

```bash
# Restart PM2 services
pm2 restart all

# Restart Apache
sudo systemctl restart apache2
```

## Security Considerations

1. **Firewall**: Ensure only necessary ports are open
2. **HTTPS**: Consider setting up SSL certificates using Let's Encrypt
3. **Authentication**: Implement proper authentication mechanisms
4. **Updates**: Keep all dependencies and system packages updated

## Notes

- The original development files remain unchanged in the parent directory
- This deployment uses production-optimized configurations
- All API endpoints and WebSocket connections are configured for the server IP
- The frontend is built for production with optimizations enabled
