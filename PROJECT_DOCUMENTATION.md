# Final Project - Complete Documentation

## Project Overview
This is a full-stack **Server Control Panel** application built with React (Vite) frontend and Express.js backend. The project manages server resources, domains, sites, projects, databases, and provides terminal access with real-time monitoring. Two identical stacks exist: **main** (`front/` + `back/`) and **server-test** (`server-test/frontend/` + `server-test/backend/`).

**Key Features:**
- 🔐 Authentication & Authorization
- 🎨 Dark/Light Theme Support
- 📊 Real-time Server Monitoring (CPU, Memory, Disk, Uptime)
- 🖥️ Terminal Access via WebSocket
- 🌐 Domain & Site Management
- 📁 File Manager with Code Editor
- 🐍 PM2 Process Management
- 🔒 Apache Configuration & SSL Management
- 📦 Project Git Repository Management
- 🗄️ Database Connection Management

---

## FRONTEND PROJECT STRUCTURE

### Root Directory: `/front/`

#### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js dependencies, scripts (dev, build, lint, preview) |
| `vite.config.ts` | Vite build configuration with React plugin |
| `tailwind.config.js` | Tailwind CSS configuration for dark/light themes |
| `postcss.config.js` | PostCSS configuration for Tailwind processing |
| `tsconfig.json` | TypeScript configuration |
| `eslint.config.js` | ESLint linting rules |
| `index.html` | HTML entry point for Vite |
| `vite-env.d.ts` | Vite environment variable type definitions |

---

### Source Directory: `/front/src/`

#### **Entry Points**

##### `App.jsx`
- **Purpose:** Main application component with routing logic
- **Key Features:**
  - Wraps app with `ThemeProvider` and `AuthProvider`
  - Routes between pages: Dashboard, Projects, Sites, Files, PM2, Apache Config, Terminal, AI Insights, Databases
  - Handles authentication check before rendering main content
  - Uses state management for current page navigation
- **Content:** Router component that switches between different pages based on `currentPage` state
- **Dependencies:** React, AuthContext, ThemeContext, all page components

##### `main.jsx`
- **Purpose:** React application entry point
- **Content:** Renders App component into DOM root element
- **Dependencies:** React, ReactDOM, App component

#### **Configuration**

##### `config.js`
- **Purpose:** Centralized configuration for API endpoints and environment variables
- **Content:**
  ```javascript
  API_BASE_URL: Backend API server URL (default: http://localhost:5000)
  SOCKET_URL: WebSocket server URL (same as API_BASE_URL)
  TERMINAL_URL: Terminal server URL (default: http://localhost:3000)
  ```
- **Usage:** Imported across frontend to access backend services
- **Environment Variables:** Uses Vite's `import.meta.env.VITE_*` variables

##### `index.css`
- **Purpose:** Global CSS styles for Tailwind
- **Content:** Tailwind directives (@tailwind base, components, utilities) + custom CSS utilities

---

### Context Providers: `/front/src/contexts/`

#### `ThemeContext.jsx`
- **Purpose:** Manages dark/light theme state across the application
- **Key Features:**
  - State: `theme` (light/dark)
  - Saves theme preference to localStorage
  - `toggleTheme()` function switches themes
  - Applies/removes `dark` class to `document.documentElement`
  - Provides theme context to all components via useTheme() hook
- **Usage Pattern:**
  ```javascript
  const { theme, toggleTheme } = useTheme();
  ```
- **Integration:** Tailwind dark mode uses `dark:` prefix for dark theme styles

#### `AuthContext.jsx`
- **Purpose:** Manages user authentication state
- **Key Features:**
  - Stores user information and authentication token
  - Provides `login()` and `logout()` functions
  - Persists auth state to localStorage
  - Tracks loading and error states
- **Usage Pattern:**
  ```javascript
  const { user, isAuthenticated, login, logout } = useAuth();
  ```

---

### Components: `/front/src/components/`

#### **Layout Components** (`/layout/`)

##### `Layout.jsx`
- **Purpose:** Main layout wrapper for authenticated pages
- **Features:**
  - Combines Header, Sidebar, and main content area
  - Handles page navigation
  - Responsive design (sidebar collapses on mobile)
- **Structure:** Header + Sidebar + Content Container

##### `Header.jsx`
- **Purpose:** Top navigation bar
- **Features:**
  - Dark/Light theme toggle button (Moon/Sun icon)
  - Refresh page button
  - User info display with username
  - Logout button
  - Responsive styling with dark mode support

##### `Sidebar.jsx`
- **Purpose:** Left navigation menu
- **Features:**
  - Menu items for all pages (Dashboard, Projects, Sites, Files, PM2, Apache, Terminal, AI, Databases)
  - Icon indicators for each section
  - Active page highlighting
  - Collapsible on mobile
  - Dark mode styling

---

#### **Authentication** (`/auth/`)

##### `LoginPage.jsx`
- **Purpose:** User login interface
- **Features:**
  - Username and password input fields
  - Login form submission
  - Error message display
  - Loading state during authentication
  - Redirects to dashboard on successful login

---

#### **Dashboard** (`/dashboard/`)

Dashboard displays server overview and key metrics. Modular design with sub-components.

##### `Dashboard.jsx`
- **Purpose:** Main dashboard container
- **Features:**
  - Server IP address display with dark mode text color
  - IP refresh button and copy-to-clipboard functionality
  - Grid layout for sub-components
- **Sub-components integrated:** ServerStats, SystemAlerts, QuickActions, SitesOverview, DomainsOverview

##### `ServerStats.jsx`
- **Purpose:** Real-time server metrics display
- **Metrics:** CPU usage, Memory usage, Disk usage, System uptime
- **Features:**
  - WebSocket connection for live updates
  - Circular progress indicators
  - Color-coded status (green for healthy, red for critical)
  - Updates every 2 seconds

##### `SystemAlerts.jsx`
- **Purpose:** Alerts and warnings for system issues
- **Features:**
  - Displays active alerts
  - Color-coded severity (warning, critical)
  - Alert dismissal functionality

##### `QuickActions.jsx`
- **Purpose:** Common actions accessible from dashboard
- **Actions:** Refresh stats, View logs, Restart services, etc.

##### `SitesOverview.jsx`
- **Purpose:** Preview of active sites
- **Features:**
  - Shows recently added sites
  - Links to full sites management page
  - Status indicators

##### `DomainsOverview.jsx`
- **Purpose:** Domain management preview
- **Features:**
  - Active domains list
  - SSL status indicators
  - Domain management links

---

#### **Projects** (`/projects/`)

##### `Projects.jsx`
- **Purpose:** Git project management interface
- **Features:**
  - Create new projects from git repositories
  - Clone existing repositories
  - Project listing with status
  - Git operations: Pull, Push, Commit
  - Branch management
  - Terminal integration for each project
  - Real-time git status updates
  - File browser integration
  - Terminal sub-component for each project
- **Key Sections:**
  - Project list with actions (refresh, delete, open terminal, view files)
  - Git panel showing status, branches, commits
  - Code panel for file viewing/editing
  - Terminal panel with full xterm support
  - GitHub authentication modal
- **Terminal Features:** Creates socket.io session for each project, sends/receives terminal output

---

#### **Sites** (`/sites/`)

##### `Sites.jsx`
- **Purpose:** Main sites management page
- **Features:**
  - List all domains and hosted sites
  - Add new sites via modal
  - Delete sites
  - Real-time site status
- **Integrates:** SitesList, AddSiteModal, DNSConfigModal

##### `SitesList.jsx`
- **Purpose:** Displays all sites in a table
- **Columns:** Domain, Status, SSL, Last Updated, Actions

##### `SiteDetails.jsx`
- **Purpose:** Detailed view of individual site
- **Shows:** Configuration, SSL certificate, DNS records, traffic stats

##### `AddSiteModal.jsx`
- **Purpose:** Form to add new website/site
- **Fields:** Domain, Document root, PHP version, SSL options

##### `DNSConfigModal.jsx`
- **Purpose:** Display DNS configuration for domain
- **Shows:** A records, CNAME, MX records with copy functionality

---

#### **File Manager** (`/files/`)

##### `FileManager.jsx`
- **Purpose:** Main file manager interface
- **Features:**
  - File browser with tree view
  - File upload capability
  - File deletion
  - Create new files/folders
  - Real-time directory listing
- **Integrates:** FileTree, FileEditor, FileToolbar

##### `FileTree.jsx`
- **Purpose:** Hierarchical file/folder tree view
- **Features:**
  - Collapsible folders
  - File type icons
  - Click to open file for editing
  - Double-click folders to expand/collapse
- **Supports:** Images, code files, JSON, text files

##### `FileEditor.jsx`
- **Purpose:** Code editor for file viewing/editing
- **Features:**
  - Syntax highlighting for different file types
  - Line numbers
  - Dark/Light theme support
  - Save functionality
  - File content updates in real-time

##### `FileToolbar.jsx`
- **Purpose:** Toolbar with file operations
- **Actions:** Upload, Create file, Create folder, Delete, Refresh, Download

---

#### **PM2 Manager** (`/pm2/`)

##### `PM2Manager.jsx`
- **Purpose:** Node.js process management via PM2
- **Features:**
  - List all PM2 processes
  - Start/Stop/Restart processes
  - Monitor process status and resource usage
  - Real-time logs display
  - Process configuration
- **Integrates:** Process list, log viewer, start/stop controls

---

#### **Apache Configuration** (`/apache/`)

##### `ApacheConfig.jsx`
- **Purpose:** Apache web server configuration management
- **Features:**
  - View Apache configuration files
  - Edit Apache settings
  - Virtual host management
  - Module enable/disable
  - Restart Apache with validation
  - Error handling and syntax checking

---

#### **Terminal** (`/terminal/`)

##### `Terminal.jsx`
- **Purpose:** Browser-based terminal interface using xterm
- **Features:**
  - Full terminal emulation (xterm.js)
  - WebSocket connection to backend terminal server
  - Multiple terminal sessions (tabs)
  - Session creation and closure
  - Terminal theme switching (dark/light mode)
  - Command history
  - Download session logs
  - Real-time theme updates when dark mode toggles
- **Addons Used:**
  - FitAddon: Auto-fit terminal to container
  - WebLinksAddon: Clickable URLs in terminal
- **Socket Events:**
  - `create-session`: Start new terminal session
  - `input`: Send user input
  - `output`: Receive command output
  - `resize`: Terminal size changes
  - `close-session`: End session

---

#### **AI Insights** (`/ai/`)

##### `AIInsights.jsx`
- **Purpose:** AI-powered server insights and recommendations
- **Features:**
  - Analyzes server metrics
  - Provides optimization recommendations
  - Alerts on anomalies
  - Performance trending

---

#### **Databases** (`/databases/`)

##### `Databases.jsx`
- **Purpose:** Database connection management
- **Features:**
  - Add database connections (MySQL, MongoDB, PostgreSQL)
  - Save connection configurations
  - Test database connections
  - Delete connections
  - View connection details (clickable cards)
  - Start inactive database services
  - Display service status (active/inactive)
  - Install database packages if not present
  - Keyboard accessibility for database cards (Enter/Space to open details)
  - "Click to view details" affordance on cards
  - Loading states for test, start service, and delete operations
- **Service Start Feature:**
  - Detects inactive services
  - "Start service" button appears for inactive databases
  - Attempts to start service via backend endpoint
  - Refreshes status after starting
  - Error handling if service start fails
- **Supported Databases:**
  - MySQL (service: mysql/mariadb)
  - MongoDB (service: mongod/mongodb)
  - PostgreSQL (service: postgresql)
- **Database Card Interactions:**
  - Click card to select and view connection details
  - Shows connection string and configuration
  - Displays service status (active/inactive)
  - Test connection button
  - Delete connection button

---

## BACKEND PROJECT STRUCTURE

### Root Directory: `/server-test/backend/` (or `/back/` for main)

#### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node dependencies (express, socket.io, multer, etc.) |
| `server.js` | Main Express server entry point |
| `server-old.js` | Previous server version (backup) |

#### Data Files

| File | Purpose |
|------|---------|
| `domains.json` | Stored domain configurations |
| `projects.json` | Stored project information |
| `apache-banlist.json` | Banned IP addresses for Apache |

---

### Routes: `/routes/` (API Endpoints)

#### `server.js`
- **Purpose:** Server system information routes
- **Endpoints:**
  - `GET /server/ip` - Returns server's public IP address
  - `GET /server/stats` - Returns system stats (CPU, memory, disk, uptime)
  - `GET /server/info` - Returns server information
  - Socket.IO real-time stats broadcast

#### `databases.js`
- **Purpose:** Database management API
- **Endpoints:**
  - `GET /databases/status` - Get all database service statuses
  - `POST /databases/service/start` - Start a database service
  - `GET /databases` - List all saved database connections
  - `POST /databases` - Create new database connection
  - `PUT /databases/:id` - Update database connection
  - `DELETE /databases/:id` - Delete database connection
  - `POST /databases/:id/test` - Test database connection
- **Service Mapping:**
  ```javascript
  {
    mysql: ['mysql', 'mariadb'],
    mongo: ['mongod', 'mongodb'],
    mongodb: ['mongod', 'mongodb'],
    postgres: ['postgresql'],
    postgresql: ['postgresql']
  }
  ```
- **Service Start Logic:**
  - Uses `systemctl start` command
  - Attempts multiple service names for each database type
  - Handles root vs non-root execution
  - Returns success/error status

#### `projects.js`
- **Purpose:** Git project management routes
- **Endpoints:**
  - `GET /projects` - List all projects
  - `POST /projects` - Create/clone new project
  - `DELETE /projects/:id` - Delete project
  - `GET /projects/:id/git/status` - Get git status
  - `POST /projects/:id/git/pull` - Pull from remote
  - `POST /projects/:id/git/push` - Push to remote
  - `POST /projects/:id/git/commit` - Commit changes
  - `GET /projects/:id/files` - List project files
  - `POST /projects/github/auth` - GitHub authentication

#### `sites.js`
- **Purpose:** Website/domain management routes
- **Endpoints:**
  - `GET /sites` - List all sites
  - `POST /sites` - Create new site
  - `DELETE /sites/:id` - Delete site
  - `GET /sites/:id` - Get site details
  - `PUT /sites/:id` - Update site configuration

#### `domains.js`
- **Purpose:** Domain management routes
- **Endpoints:**
  - `GET /domains` - List all domains
  - `POST /domains` - Add new domain
  - `DELETE /domains/:id` - Remove domain
  - `GET /domains/:id/dns` - Get DNS records
  - `GET /domains/:id/status` - Check domain status

#### `files.js`
- **Purpose:** File system operations routes
- **Endpoints:**
  - `GET /files` - List directory contents
  - `POST /files/upload` - Upload file
  - `DELETE /files/:id` - Delete file
  - `GET /files/:id` - Get file contents
  - `PUT /files/:id` - Update file contents
  - `POST /files/create` - Create new file/folder
- **File Upload:** Uses Multer for multipart form data handling

#### `pm2.js`
- **Purpose:** PM2 process management routes
- **Endpoints:**
  - `GET /pm2` - List all PM2 processes
  - `POST /pm2/start` - Start process
  - `POST /pm2/stop` - Stop process
  - `POST /pm2/restart` - Restart process
  - `DELETE /pm2/:id` - Delete process
  - `GET /pm2/:id/logs` - Get process logs

#### `apache.js`
- **Purpose:** Apache configuration management routes
- **Endpoints:**
  - `GET /apache/config` - Get Apache config
  - `PUT /apache/config` - Update Apache config
  - `POST /apache/restart` - Restart Apache
  - `GET /apache/modules` - List modules
  - `POST /apache/modules` - Enable/disable module
  - `GET /apache/ban-list` - Get IP ban list
  - `POST /apache/ban` - Ban IP address

#### `ssl.js`
- **Purpose:** SSL certificate management routes
- **Endpoints:**
  - `GET /ssl/certificates` - List certificates
  - `POST /ssl/generate` - Generate new certificate
  - `DELETE /ssl/:id` - Delete certificate
  - `POST /ssl/renew` - Renew certificate

---

### Utilities: `/utils/`

#### `security.js`
- **Purpose:** Security utilities and access control
- **Functions:**
  - `isAllowedPath()` - Validate file path access (prevent directory traversal)
  - `sanitizeInput()` - Sanitize user input
  - Authentication middleware
  - CORS configuration helpers

#### `exec.js`
- **Purpose:** Safe command execution wrapper
- **Functions:**
  - `exec()` - Execute shell commands with error handling
  - `execAsync()` - Promise-based command execution
  - Timeout management
  - Output buffering

#### `domains.js`
- **Purpose:** Domain utility functions
- **Functions:**
  - `validateDomain()` - Validate domain format
  - `getDNSRecords()` - Fetch DNS records
  - `checkDomainStatus()` - Verify domain is reachable
  - DNS lookup utilities

---

### Main Server File: `server.js`

#### **Purpose:** Express.js HTTP server initialization and configuration

#### **Key Sections:**

1. **Imports & Initialization**
   - Express app setup
   - HTTP server creation
   - Socket.IO initialization
   - Multer file upload configuration

2. **Middleware**
   - CORS for cross-origin requests
   - Body parser for JSON/URL-encoded data
   - Static file serving

3. **Routes Registration**
   - `/` - Static files
   - `/apache` - Apache routes
   - `/ssl` - SSL routes
   - `/domains` - Domain routes
   - `/pm2` - PM2 routes
   - `/files` - File routes
   - `/server` - Server info routes
   - `/sites` - Sites routes
   - `/projects` - Project routes
   - `/databases` - Database routes

4. **Socket.IO Setup**
   - Real-time server stats broadcasting
   - CPU, memory, disk, uptime updates
   - Connected socket tracking
   - Graceful cleanup on disconnect

5. **Terminal Server**
   - Separate Node PTY server on port 3000
   - WebSocket connections for terminal sessions
   - Command execution in shell context
   - Session management

6. **Server Start**
   - Listens on port 5000 (API)
   - Terminal server on port 3000
   - Environment variable configuration
   - Startup logging

---

## UPLOAD DIRECTORY

### `/backend/uploads/`
- **Purpose:** Temporary file upload storage
- **Files:** User-uploaded files stored with hash IDs
- **Organization:** One hash directory per upload session
- **Cleanup:** Files should be archived or deleted after processing

---

## TECHNOLOGY STACK

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1
- **Icons:** Lucide React 0.344.0
- **Charts:** Recharts 3.6.0
- **Terminal:** xterm 5.3.0
- **Real-time:** Socket.IO Client 4.8.1
- **Language:** JavaScript (JSX) with TypeScript support

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-time:** Socket.IO
- **Terminal:** node-pty (via separate terminal server)
- **File Upload:** Multer
- **Command Execution:** child_process (exec)
- **Environment:** dotenv for config

---

## KEY FEATURES IMPLEMENTATION

### 1. **Dark/Light Theme**
- **Location:** ThemeContext manages state
- **Storage:** localStorage persistence
- **Application:** Tailwind `dark:` modifier classes
- **Toggle:** Header component with Moon/Sun icons
- **Terminal Integration:** `getTerminalTheme()` function adapts terminal colors
- **Components Affected:** All components use dark: prefix for responsive styling

### 2. **Real-time Updates**
- **WebSocket:** Socket.IO connects frontend to backend
- **Server Stats:** Emitted every 2 seconds
- **Terminal:** Live command output and input
- **Project Git:** Real-time status updates

### 3. **Database Service Management**
- **Service Start:** POST `/databases/service/start` endpoint
- **Status Check:** GET `/databases/status` returns all services
- **UI Display:** Button shows only for inactive services
- **Service Mapping:** Multiple service names per database type
- **Error Handling:** Fallback to next service name if first fails

### 4. **Terminal Emulation**
- **xterm.js:** Full terminal emulation in browser
- **WebSocket Sessions:** Each terminal gets unique session ID
- **Theme Support:** Terminal respects dark/light mode
- **Addons:** FitAddon for responsive sizing, WebLinksAddon for URL clicking
- **Multi-tab:** Support for multiple terminal sessions

### 5. **File Management**
- **Upload:** Multipart form data via Multer
- **Storage:** Hash-named directories for uploads
- **Security:** Path traversal prevention in utils/security.js
- **Editor:** Syntax highlighting for code files
- **Operations:** Create, read, update, delete files and folders

---

## DATA FLOW PATTERNS

### 1. **Authentication Flow**
```
User Login → AuthContext.login() → Backend verification → 
Store token/user → AuthProvider context → Render app
```

### 2. **Theme Toggle Flow**
```
User clicks theme button → toggleTheme() → 
Update state + localStorage → Apply dark class → 
Update terminal theme → Re-render all components
```

### 3. **Server Stats Flow**
```
ServerStats mount → useEffect connects WebSocket → 
Backend broadcasts stats every 2s → 
Socket receives data → Update state → Re-render charts
```

### 4. **Database Service Start Flow**
```
User clicks "Start service" → POST /databases/service/start → 
Backend: systemctl start {service} → 
Return success/error → Refresh status → Update UI
```

### 5. **Terminal Session Flow**
```
User opens terminal → socket.emit("create-session") → 
Backend creates PTY → TerminalPanelComponent initializes xterm → 
User types → socket.emit("input") → 
Backend executes in PTY → socket.emit("output") → 
Terminal displays output
```

---

## ENVIRONMENT VARIABLES

### Frontend (`.env.local` or Vite VITE_ prefix)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_TERMINAL_URL=http://localhost:3000
```

### Backend (`.env`)
```
PORT=5000
TERMINAL_PORT=3000
CORS_ORIGIN=*
UPLOAD_DIR=./uploads/
```

---

## BUILD & DEPLOYMENT

### Frontend Build
```bash
cd front/
npm install
npm run build
# Output: dist/ folder with optimized production build
```

### Backend Start
```bash
cd back/ or server-test/backend/
npm install
node server.js
# Listens on port 5000 (API) and 3000 (Terminal)
```

### Development
```bash
# Frontend: Hot reload with Vite
npm run dev

# Backend: Use nodemon for auto-restart
nodemon server.js
```

---

## FILE SYNCHRONIZATION

### Main Project vs Server-test
Both stacks are identical:
- **Frontend:** `/front/src/` ↔ `/server-test/frontend/src/`
- **Backend:** `/back/routes/` ↔ `/server-test/backend/routes/`

Changes made to one should be replicated to the other to maintain consistency.

---

## RECENT IMPROVEMENTS

### Dark Mode Support
- ✅ Added `text-slate-900 dark:text-white` to IP address in Dashboard
- ✅ Terminal theme updates when dark mode toggles (separate useEffect)
- ✅ Header styling with `dark:` modifiers
- ✅ All components use responsive dark mode colors

### Database Management
- ✅ Added service start button for inactive databases
- ✅ Database cards are clickable with keyboard support (Enter/Space)
- ✅ "Click to view details" affordance text on cards
- ✅ Backend POST `/service/start` endpoint with service mapping
- ✅ Support for MySQL, MongoDB, PostgreSQL services

### Terminal Improvements
- ✅ Theme switching without terminal re-initialization
- ✅ Separate useEffect for theme updates only
- ✅ `getTerminalTheme()` function for dark/light color schemes

---

## SUMMARY

This is a comprehensive server management dashboard with:
- **React + Vite** for fast, modern frontend development
- **Express.js** backend with real-time WebSocket support
- **Tailwind CSS** for responsive, themeable UI
- **xterm.js** for browser-based terminal
- **Dark/Light theme** support with localStorage persistence
- **Database management** with service controls
- **Git project** management with terminal integration
- **File management** with code editor
- **Real-time monitoring** of server resources
- **Apache & SSL** configuration management
- **PM2** process monitoring

The architecture is modular, scalable, and maintainable with clear separation of concerns between frontend components, backend routes, and utilities.
