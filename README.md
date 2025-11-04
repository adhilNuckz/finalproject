# 🚀 LOCALED - Local & Cloud Hosting Management Panel

A comprehensive web-based hosting control panel built with React and Node.js for managing Apache web servers, sites, SSL certificates, files, and PM2 processes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running Locally](#-running-locally)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🌐 Site Management
- Create and manage Apache virtual hosts
- Enable/disable sites
- Maintenance mode toggle
- Automatic PHP-FPM configuration
- DNS configuration modal

### 🔒 SSL Certificate Management
- Install SSL certificates with Certbot
- Automatic certificate renewal
- Certificate status checking
- Multi-domain support

### 🖥️ Apache Management
- Start/stop/restart Apache service
- View Apache configuration files
- Live config editor with syntax validation
- View Apache access and error logs
- Test Apache configuration

### 📁 File Manager
- Browse server directories
- Edit files with syntax highlighting
- Upload/download files
- Create folders and files
- Delete files with confirmation
- Show/hide hidden files toggle
- Quick navigation to common directories

### ⚙️ PM2 Process Manager
- View running Node.js processes
- Start/stop/restart processes
- View real-time logs
- Monitor CPU and memory usage
- Directory browser for starting new apps

### 📊 Dashboard
- Real-time server statistics
- Sites overview with status indicators
- Quick actions panel
- System alerts
- Apache status monitoring

### 🎨 UI/UX
- Dark/Light theme toggle
- Responsive design
- Real-time updates via WebSocket
- Modern TailwindCSS styling
- Intuitive navigation

---

## 🏗️ Architecture

```
LOCALED/
├── back/                    # Backend (Node.js + Express)
│   ├── server.js           # Main server file
│   ├── routes/             # Modular route handlers
│   │   ├── apache.js       # Apache management
│   │   ├── sites.js        # Site creation and management
│   │   ├── ssl.js          # SSL certificate operations
│   │   ├── domains.js      # Domain CRUD operations
│   │   ├── pm2.js          # PM2 process management
│   │   ├── files.js        # File operations
│   │   └── server.js       # Server info endpoints
│   ├── utils/              # Utility modules
│   │   ├── exec.js         # Command execution helpers
│   │   ├── security.js     # Path validation & security
│   │   └── domains.js      # Domain storage utilities
│   ├── uploads/            # Temporary file uploads
│   └── domains.json        # Domain data storage
│
├── front/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Login page
│   │   │   ├── dashboard/  # Dashboard widgets
│   │   │   ├── sites/      # Site management UI
│   │   │   ├── apache/     # Apache config editor
│   │   │   ├── files/      # File manager
│   │   │   ├── pm2/        # PM2 manager
│   │   │   ├── terminal/   # Terminal component
│   │   │   └── layout/     # Header, sidebar, layout
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── config/         # Configuration
│   │   │   └── api.js      # API endpoints config
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── .env.development    # Development environment
│   ├── .env.production     # Production environment
│   └── vite.config.ts      # Vite configuration
│
└── terminal/                # Separate terminal server
    └── server.js           # WebSocket terminal server
```

### Technology Stack

**Backend:**
- Node.js 18+
- Express.js - Web framework
- Socket.io - Real-time communication
- Multer - File upload handling
- Child Process - Command execution

**Frontend:**
- React 18
- Vite - Build tool & dev server
- TailwindCSS - Styling
- Lucide React - Icons
- Axios - HTTP client

**Server Components:**
- Apache2 - Web server
- Certbot - SSL certificates
- PM2 - Process manager
- PHP-FPM - PHP processor

---

## 📦 Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Apache2** >= 2.4
- **Git**

### Optional (for full functionality)

- **Certbot** - For SSL certificate management
- **PM2** - For process management
- **PHP-FPM** - For PHP site support

### System Requirements

- **OS:** Linux (Ubuntu 20.04+, Debian 11+, or similar)
- **RAM:** Minimum 1GB, recommended 2GB+
- **Disk:** 1GB free space
- **Permissions:** sudo access for Apache/system operations

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/adhilNuckz/finalproject.git
cd finalproject
```

### 2. Install Backend Dependencies

```bash
cd back
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../front
npm install
```

### 4. Install System Dependencies (Ubuntu/Debian)

```bash
# Apache2
sudo apt update
sudo apt install -y apache2

# Certbot (for SSL)
sudo apt install -y certbot python3-certbot-apache

# PM2 (globally)
sudo npm install -g pm2

# PHP (optional, for PHP sites)
sudo apt install -y php php-fpm
```

---

## ⚙️ Configuration

### Backend Configuration

The backend uses allowed path roots for security. Edit `back/utils/security.js`:

```javascript
const ALLOWED_ROOTS = [
  '/var/www/html',      // Web root
  os.homedir(),         // User home directory
  '/home'               // Home directories
];
```

### Frontend Configuration

#### Development Environment

Create/edit `front/.env.development`:

```bash
VITE_API_URL=http://localhost:5000
```

#### Production Environment

Create/edit `front/.env.production`:

```bash
# For IP-based deployment
VITE_API_URL=http://YOUR_SERVER_IP:5000

# OR for domain-based with Apache proxy
VITE_API_URL=
```

---

## 🚀 Running Locally

### Option 1: Development Mode (Recommended for Testing)

**Terminal 1 - Backend:**
```bash
cd back
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
```

Then open: **http://localhost:5173**

### Option 2: Production Mode (Local)

**Terminal 1 - Backend:**
```bash
cd back
pm2 start server.js --name localed-backend
pm2 logs localed-backend
```

**Terminal 2 - Build & Serve Frontend:**
```bash
cd front
npm run build
cd dist
pm2 start http-server --name localed-frontend -- -p 6666 -a 0.0.0.0
```

Then open: **http://localhost:6666**

### Default Login Credentials

```
Username: admin
Password: admin123
```

> ⚠️ **Security Note:** Change these credentials in `back/server.js` before deployment!

---

## 🌐 Deployment

### Deployment Options

We provide multiple deployment guides based on your needs:

#### Option 1: IP-Based Deployment (Simplest)
Perfect for quick setup without domain configuration.

📄 See: **[DEPLOYMENT_IP.md](./DEPLOYMENT_IP.md)** - Complete guide for deploying with direct IP access

**Quick summary:**
- Frontend: `http://YOUR_IP:6666`
- Backend: `http://YOUR_IP:5000`
- No reverse proxy needed
- No domain required

#### Option 2: Domain-Based with Apache Proxy (Production)
Recommended for production with custom domain and SSL.

📄 See: **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full production deployment guide

**Quick summary:**
- Frontend: `https://yourdomain.com`
- Backend: Behind Apache reverse proxy
- SSL with Certbot
- Professional setup

#### Quick Deploy Checklist
📄 See: **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist format

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Users (Browser)                     │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Frontend :6666    │  (React App)
        │   (http-server)     │
        └──────────┬──────────┘
                   │
                   │ API Calls
                   │
        ┌──────────▼──────────┐
        │   Backend :5000     │  (Express + Socket.io)
        │   (Node.js + PM2)   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   System Services   │
        │  • Apache2          │
        │  • Certbot          │
        │  • PM2              │
        │  • File System      │
        └─────────────────────┘
```

---

## 📂 Project Structure

### Backend Routes

| Route | File | Description |
|-------|------|-------------|
| `/api/apache/*` | `routes/apache.js` | Apache control, config, logs |
| `/api/sites/*` | `routes/sites.js` | Site creation and management |
| `/api/ssl/*` | `routes/ssl.js` | SSL certificate operations |
| `/domains/*` | `routes/domains.js` | Domain CRUD operations |
| `/pm2/*` | `routes/pm2.js` | PM2 process management |
| `/files/*` | `routes/files.js` | File operations |
| `/server/*` | `routes/server.js` | Server info endpoints |
| `/list` | `server.js` | Directory listing (legacy) |
| `/apache` | `server.js` | Apache control (legacy) |
| `/socket.io` | `server.js` | WebSocket connections |

### Frontend Components

```
components/
├── auth/
│   └── LoginPage.jsx          # Authentication
├── dashboard/
│   ├── Dashboard.jsx          # Main dashboard
│   ├── ServerStats.jsx        # CPU, RAM, disk stats
│   ├── SitesOverview.jsx      # Sites summary
│   ├── DomainsOverview.jsx    # Domains list
│   ├── QuickActions.jsx       # Quick action buttons
│   └── SystemAlerts.jsx       # Alerts display
├── sites/
│   ├── Sites.jsx              # Sites management page
│   ├── SitesList.jsx          # Sites list view
│   ├── SiteDetails.jsx        # Individual site details
│   ├── AddSiteModal.jsx       # New site form
│   └── DNSConfigModal.jsx     # DNS configuration
├── apache/
│   └── ApacheConfig.jsx       # Apache management
├── files/
│   ├── FileManager.jsx        # File browser
│   ├── FileTree.jsx           # Directory tree
│   ├── FileEditor.jsx         # Code editor
│   └── FileToolbar.jsx        # Action buttons
├── pm2/
│   └── PM2Manager.jsx         # Process manager
├── terminal/
│   └── Terminal.jsx           # Terminal emulator
└── layout/
    ├── Layout.jsx             # Main layout wrapper
    ├── Header.jsx             # Top navigation
    └── Sidebar.jsx            # Side navigation
```

---

## 📡 API Documentation

### Apache Management

```bash
# Get Apache status
GET /api/apache/status

# Control Apache service
POST /api/apache/control
Body: { action: "start|stop|restart|reload" }

# List Apache configs
GET /api/apache/configs

# Read Apache config file
GET /api/apache/config/:filename

# Update Apache config file
POST /api/apache/config/:filename
Body: { content: "config content" }

# Get Apache logs
POST /api/apache/logs
Body: { logType: "access|error", lines: 100 }

# Test Apache configuration
POST /api/apache/test
```

### Site Management

```bash
# Create new site
POST /api/sites/create-advanced
Body: FormData with:
  - domain: "example.com"
  - phpVersion: "8.1|none"
  - enableSSL: true|false
  - file: index.html (optional)

# List all sites
GET /api/sites/list

# Enable site
POST /api/sites/enable
Body: { siteName: "example.com" }

# Disable site
POST /api/sites/disable
Body: { siteName: "example.com" }

# Toggle maintenance mode
POST /api/sites/maintenance
Body: { siteName: "example.com", enable: true|false }
```

### SSL Management

```bash
# Install SSL certificate
POST /api/ssl/install
Body: { domain: "example.com", email: "admin@example.com" }

# Get SSL status
POST /api/ssl/status
Body: { domain: "example.com" }

# Renew certificates
POST /api/ssl/renew

# Remove certificate
POST /api/ssl/remove
Body: { domain: "example.com" }
```

### File Operations

```bash
# List directory
POST /list
Body: { dirs: ["/path/to/dir"] }

# Read file
POST /files/read
Body: { path: "/path/to/file" }

# Write file
POST /files/write
Body: { path: "/path/to/file", content: "file content" }

# Create file or directory
POST /files/create
Body: { path: "/path/to/item", isDirectory: true|false }

# Delete file or directory
POST /files/delete
Body: { path: "/path/to/item" }

# Upload files
POST /files/upload
Body: FormData with:
  - targetPath: "/destination/path"
  - files: [file1, file2, ...]
```

### PM2 Management

```bash
# List PM2 processes
GET /pm2/list

# Start process
POST /pm2/start
Body: { script: "/path/to/script.js", name: "app-name" }

# Stop process
POST /pm2/stop
Body: { name: "app-name" }

# Restart process
POST /pm2/restart
Body: { name: "app-name" }

# Delete process
POST /pm2/delete
Body: { name: "app-name" }

# Get process logs
POST /pm2/logs
Body: { name: "app-name", lines: 100 }
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend won't start

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 node server.js
```

#### 2. Permission denied errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Grant sudo permissions for Apache commands
sudo visudo

# Add line:
yourusername ALL=(ALL) NOPASSWD: /usr/sbin/apache2ctl, /usr/bin/systemctl
```

#### 3. File Manager shows no files

**Issue:** Only hidden files (starting with `.`) are visible

**Solution:**
- Click the **"👁️‍🗨️ Show Hidden"** toggle button
- Or check if you're in the correct directory (use "Home" button)
- Verify allowed paths in `back/utils/security.js`

#### 4. Frontend can't connect to backend

**Error:** Network errors in browser console

**Solution:**
```bash
# Check backend is running
curl http://localhost:5000/sites

# Check .env.development
cat front/.env.development

# Should contain:
VITE_API_URL=http://localhost:5000
```

#### 5. Apache commands fail

**Error:** `sudo: a terminal is required to read the password`

**Solution:**
Configure passwordless sudo for Apache commands (see deployment guides)

---

## 📚 Additional Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full production deployment guide with Apache reverse proxy
- **[DEPLOYMENT_IP.md](./DEPLOYMENT_IP.md)** - Simple IP-based deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment checklist
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick reference commands
- **[TROUBLESHOOT_FILES.md](./TROUBLESHOOT_FILES.md)** - File manager troubleshooting
- **[SITE_WORKFLOW_GUIDE.md](./SITE_WORKFLOW_GUIDE.md)** - Site creation workflow

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default admin credentials
- [ ] Configure firewall (UFW or iptables)
- [ ] Use HTTPS with valid SSL certificates
- [ ] Restrict allowed paths in `security.js`
- [ ] Set up fail2ban for brute force protection
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Use strong passwords for all services
- [ ] Limit sudo permissions to specific commands
- [ ] Enable Apache security modules
- [ ] Review file permissions regularly

### Allowed Paths Configuration

The backend uses a whitelist approach for file operations:

```javascript
// back/utils/security.js
const ALLOWED_ROOTS = [
  '/var/www/html',   // Web root only
  os.homedir(),      // User home directory
  '/home'            // All home directories
];
```

Add or remove paths based on your security requirements.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Adhil Nuckz** - [@adhilNuckz](https://github.com/adhilNuckz)

---

## 🙏 Acknowledgments

- React team for amazing framework
- Vite team for blazing fast build tool
- TailwindCSS for utility-first CSS
- Lucide for beautiful icons
- Express.js community
- Open source community

---

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues:** [https://github.com/adhilNuckz/finalproject/issues](https://github.com/adhilNuckz/finalproject/issues)
- **Pull Requests:** [https://github.com/adhilNuckz/finalproject/pulls](https://github.com/adhilNuckz/finalproject/pulls)

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] Multi-user support with roles
- [ ] Database backup/restore
- [ ] Nginx support alongside Apache
- [ ] Docker container management
- [ ] Server monitoring graphs
- [ ] Automated backups
- [ ] Email notifications
- [ ] MySQL/PostgreSQL management
- [ ] FTP server management
- [ ] Cron job manager

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/adhilNuckz/finalproject?style=social)
![GitHub forks](https://img.shields.io/github/forks/adhilNuckz/finalproject?style=social)
![GitHub issues](https://img.shields.io/github/issues/adhilNuckz/finalproject)
![GitHub pull requests](https://img.shields.io/github/issues-pr/adhilNuckz/finalproject)

---

<div align="center">

**Made with ❤️ by Adhil Nuckz**

⭐ Star this repo if you find it helpful!

</div>
