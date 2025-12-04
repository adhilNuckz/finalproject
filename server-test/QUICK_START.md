# Server Test Folder - Quick Reference

## What's Inside

This `server-test` folder contains a complete copy of your application configured for remote server deployment.

```
server-test/
├── backend/          # Backend API server (Port 5002)
├── frontend/         # React frontend (Port 5252)
├── terminal/         # Terminal server (Port 3002)
├── deploy.sh         # Automated deployment script
└── README.md         # Detailed deployment guide
```

## Server Information

- **Server IP**: 142.93.220.168
- **Frontend**: Port 5252 - http://142.93.220.168:5252
- **Backend**: Port 5002 - http://142.93.220.168:5002
- **Terminal**: Port 3002 - http://142.93.220.168:3002

## Quick Deployment Steps

### On Your Local Machine

1. **Upload to Server**:
   ```bash
   scp -r server-test root@142.93.220.168:/var/www/
   ```

### On Your Server

2. **SSH into server**:
   ```bash
   ssh root@142.93.220.168
   cd /var/www/server-test
   ```

3. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```
   Choose option **9** for full automated deployment.

4. **Setup Apache** (after step 3):
   ```bash
   ./deploy.sh
   ```
   Choose option **7** to configure Apache.

5. **Access your application**:
   Open browser: http://142.93.220.168:5252

## Key Features

✅ **Separate Environment Files**: Each component has its own `.env` file pre-configured with server settings

✅ **Production Ready**: All URLs and configurations point to your server IP

✅ **Original Code Unchanged**: Your local development files in the parent directory remain untouched

✅ **Apache Integration**: Includes configuration to serve the frontend through Apache

✅ **PM2 Support**: Automated process management for backend and terminal services

✅ **Easy Management**: Interactive deployment script for common tasks

## Environment Configuration

All environment variables are pre-configured:

- **Backend** (`.env`): PORT=5002, HOST=0.0.0.0
- **Frontend** (`.env`): All API URLs point to http://142.93.220.168
- **Terminal** (`.env`): PORT=3002, Allowed origins configured

## Access From Another Laptop

Once deployed, you can access the application from any device:

1. Make sure you're on the same network (or ports are publicly accessible)
2. Open browser on any laptop
3. Navigate to: http://142.93.220.168:5252
4. Use the app to manage websites, add sites, pause sites, etc.

## Common Commands

### Check Status
```bash
cd /var/www/server-test
./deploy.sh
# Choose option 8
```

### View Logs
```bash
cd /var/www/server-test
./deploy.sh
# Choose option 6
```

### Restart Services
```bash
pm2 restart all
```

### Stop Services
```bash
cd /var/www/server-test
./deploy.sh
# Choose option 5
```

## Apache Configuration

The frontend is served through Apache on port 5252. Apache also:
- Proxies API requests to the backend (port 5002)
- Handles Socket.IO connections
- Supports React Router (SPA routing)

## Troubleshooting

**Can't access from another laptop?**
- Check firewall: `sudo ufw status`
- Ensure ports are open: `sudo ufw allow 5252/tcp`

**Services not starting?**
- Check PM2: `pm2 status`
- View logs: `pm2 logs`

**Apache not serving?**
- Check Apache status: `sudo systemctl status apache2`
- View errors: `sudo tail -f /var/log/apache2/app-error.log`

## Important Notes

⚠️ **Security**: This configuration is for testing. For production, add:
- HTTPS/SSL certificates
- Authentication/authorization
- Rate limiting
- Input validation

⚠️ **Firewall**: Make sure to configure your server's firewall to allow traffic on ports 5252, 5002, and 3002

⚠️ **Node.js**: Ensure Node.js and npm are installed on your server

For detailed instructions, see **README.md** in this folder.
