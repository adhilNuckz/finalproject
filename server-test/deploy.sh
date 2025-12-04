#!/bin/bash

# Server Test Deployment Script
# This script helps deploy and start the application on the server

set -e

echo "=================================="
echo "Server Test Deployment Helper"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on the server
SERVER_IP="142.93.220.168"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. This is okay but not always necessary."
fi

# Main menu
echo "What would you like to do?"
echo ""
echo "1) Install dependencies"
echo "2) Build frontend"
echo "3) Start services with PM2"
echo "4) Start services manually (for testing)"
echo "5) Stop services"
echo "6) View logs"
echo "7) Setup Apache configuration"
echo "8) Check service status"
echo "9) Full deployment (all steps)"
echo "0) Exit"
echo ""
read -p "Enter your choice [0-9]: " choice

case $choice in
    1)
        print_info "Installing dependencies..."
        
        print_info "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        
        print_info "Installing terminal dependencies..."
        cd terminal
        npm install
        cd ..
        
        print_info "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        
        print_info "Dependencies installed successfully!"
        ;;
        
    2)
        print_info "Building frontend for production..."
        cd frontend
        npm run build
        cd ..
        print_info "Frontend built successfully! Output in frontend/dist/"
        ;;
        
    3)
        print_info "Starting services with PM2..."
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            print_error "PM2 is not installed. Installing PM2..."
            npm install -g pm2
        fi
        
        # Start backend
        cd backend
        pm2 start server.js --name "app-backend"
        cd ..
        
        # Start terminal
        cd terminal
        pm2 start server.js --name "app-terminal"
        cd ..
        
        pm2 save
        print_info "Services started with PM2!"
        print_info "Use 'pm2 status' to check status"
        print_info "Use 'pm2 logs' to view logs"
        ;;
        
    4)
        print_info "Starting services manually..."
        print_warning "This will block the terminal. Press Ctrl+C to stop."
        print_info "Open separate terminals to run each service:"
        echo ""
        echo "Terminal 1 (Backend):"
        echo "  cd backend && npm start"
        echo ""
        echo "Terminal 2 (Terminal Server):"
        echo "  cd terminal && npm start"
        echo ""
        echo "Terminal 3 (Frontend - for testing only):"
        echo "  cd frontend && npm run dev"
        ;;
        
    5)
        print_info "Stopping services..."
        if command -v pm2 &> /dev/null; then
            pm2 stop all
            print_info "All PM2 services stopped"
        else
            print_warning "PM2 not found. If you're running manually, press Ctrl+C in each terminal"
        fi
        ;;
        
    6)
        print_info "Viewing logs..."
        if command -v pm2 &> /dev/null; then
            pm2 logs
        else
            print_error "PM2 not found. Cannot view logs."
        fi
        ;;
        
    7)
        print_info "Setting up Apache configuration..."
        print_warning "This requires root privileges"
        
        APACHE_CONF="/etc/apache2/sites-available/app.conf"
        
        # Check if Apache is installed
        if ! command -v apache2 &> /dev/null; then
            print_error "Apache2 is not installed!"
            exit 1
        fi
        
        # Enable required modules
        print_info "Enabling required Apache modules..."
        sudo a2enmod proxy
        sudo a2enmod proxy_http
        sudo a2enmod proxy_wstunnel
        sudo a2enmod rewrite
        
        # Create Apache configuration
        print_info "Creating Apache virtual host configuration..."
        sudo tee $APACHE_CONF > /dev/null <<'EOF'
<VirtualHost *:5252>
    ServerName 142.93.220.168
    
    DocumentRoot /var/www/server-test/frontend/dist
    
    <Directory /var/www/server-test/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:5002/api
    ProxyPassReverse /api http://127.0.0.1:5002/api
    
    ProxyPass /socket.io http://127.0.0.1:5002/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:5002/socket.io
    
    ErrorLog ${APACHE_LOG_DIR}/app-error.log
    CustomLog ${APACHE_LOG_DIR}/app-access.log combined
</VirtualHost>

Listen 5252
EOF
        
        # Enable site
        print_info "Enabling site..."
        sudo a2ensite app.conf
        
        # Test configuration
        print_info "Testing Apache configuration..."
        sudo apache2ctl configtest
        
        # Restart Apache
        print_info "Restarting Apache..."
        sudo systemctl restart apache2
        
        # Configure firewall
        print_info "Opening firewall ports..."
        if command -v ufw &> /dev/null; then
            sudo ufw allow 5252/tcp
            sudo ufw allow 5002/tcp
            sudo ufw allow 3002/tcp
            sudo ufw reload
        else
            print_warning "UFW not found. Please open ports 5252, 5002, and 3002 manually"
        fi
        
        print_info "Apache configuration completed!"
        ;;
        
    8)
        print_info "Checking service status..."
        echo ""
        
        if command -v pm2 &> /dev/null; then
            print_info "PM2 Services:"
            pm2 status
        fi
        
        echo ""
        print_info "Apache Status:"
        sudo systemctl status apache2 --no-pager
        
        echo ""
        print_info "Listening Ports:"
        netstat -tulpn 2>/dev/null | grep -E '5252|5002|3002' || print_warning "No services found on configured ports"
        ;;
        
    9)
        print_info "Starting full deployment..."
        
        # Install dependencies
        print_info "Step 1/5: Installing dependencies..."
        cd backend && npm install && cd ..
        cd terminal && npm install && cd ..
        cd frontend && npm install && cd ..
        
        # Build frontend
        print_info "Step 2/5: Building frontend..."
        cd frontend && npm run build && cd ..
        
        # Install PM2
        print_info "Step 3/5: Setting up PM2..."
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi
        
        # Start services
        print_info "Step 4/5: Starting services..."
        cd backend && pm2 start server.js --name "app-backend" && cd ..
        cd terminal && pm2 start server.js --name "app-terminal" && cd ..
        pm2 save
        
        print_info "Step 5/5: Deployment completed!"
        echo ""
        print_info "Next steps:"
        echo "  1. Setup Apache: run this script again and choose option 7"
        echo "  2. Access your app at: http://${SERVER_IP}:5252"
        echo ""
        ;;
        
    0)
        print_info "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac

echo ""
print_info "Done!"
