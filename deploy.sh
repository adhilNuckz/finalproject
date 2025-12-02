#!/bin/bash
# Deployment script for Digital Ocean Droplet

set -e  # Exit on error

DROPLET_IP="142.93.220.168"
DROPLET_USER="root"
APP_DIR="/root/LOCALED"

echo "🚀 Starting deployment to $DROPLET_IP..."

# Create archive excluding node_modules and .git
echo "📦 Creating deployment archive..."
cd "$(dirname "$0")"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='front/dist' \
    --exclude='back/uploads/*' \
    --exclude='*.tar.gz' \
    -czf localed-deploy.tar.gz .

# Upload to droplet
echo "⬆️  Uploading to droplet..."
scp localed-deploy.tar.gz $DROPLET_USER@$DROPLET_IP:/tmp/

# Execute deployment commands on droplet
echo "🔧 Installing on droplet..."
ssh $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
set -e

# Create app directory if it doesn't exist
mkdir -p /root/LOCALED
cd /root/LOCALED

# Backup old version (if exists)
if [ -d "back" ]; then
    echo "📦 Backing up old version..."
    rm -rf ../LOCALED.backup
    cp -r ../LOCALED ../LOCALED.backup
fi

# Extract new version
echo "📤 Extracting files..."
tar -xzf /tmp/localed-deploy.tar.gz -C /root/LOCALED
rm /tmp/localed-deploy.tar.gz

# Install backend dependencies
echo "📚 Installing backend dependencies..."
cd back
npm install --production

# Install terminal dependencies
echo "📚 Installing terminal dependencies..."
cd ../terminal
npm install --production

# Install frontend dependencies and build
echo "📚 Installing frontend dependencies..."
cd ../front
npm install
echo "🏗️  Building frontend..."
npm run build

# Restart services with PM2
echo "🔄 Restarting services..."
cd /root/LOCALED

# Stop existing services (ignore errors if not running)
pm2 stop backend-api 2>/dev/null || true
pm2 stop terminal-service 2>/dev/null || true

# Start services
pm2 start back/server.js --name "backend-api" --update-env
pm2 start terminal/server.js --name "terminal-service" --update-env

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "📊 Service status:"
pm2 status

ENDSSH

echo "✅ Deployment successful!"
echo "🌐 Access your app at: http://$DROPLET_IP:5173"
echo "🔌 Backend API at: http://$DROPLET_IP:5000"
echo "💻 Terminal service at: http://$DROPLET_IP:3000"
echo ""
echo "To view logs, SSH into the droplet and run: pm2 logs"
