const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import route modules
const apacheRoutes = require('./routes/apache');
const sslRoutes = require('./routes/ssl');
const domainsRoutes = require('./routes/domains');
const pm2Routes = require('./routes/pm2');
const filesRoutes = require('./routes/files');
const serverRoutes = require('./routes/server');
const sitesRoutes = require('./routes/sites');

// Import utilities
const { isAllowedPath } = require('./utils/security');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*' 
  } 
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

// Make io accessible to routes
app.set('io', io);

// ==================== Mount Route Modules ====================

// Apache management routes
app.use('/api/apache', apacheRoutes);

// SSL certificate management routes
app.use('/ssl', sslRoutes);

// Domain management routes
app.use('/domains', domainsRoutes);

// PM2 process management routes
app.use('/pm2', pm2Routes);

// File management routes
app.use('/files', filesRoutes);

// Server information routes
app.use('/server', serverRoutes);

// Site management routes
app.use('/sites', sitesRoutes);
app.use('/site', sitesRoutes);

// ==================== Legacy Endpoints ====================

// These endpoints are kept for backwards compatibility
// They will eventually be migrated to route modules

// File upload endpoint with multer middleware
app.post('/files/upload', upload.array('files'), (req, res) => {
  const { targetPath } = req.body;
  const files = req.files;

  if (!targetPath) {
    return res.status(400).json({ success: false, error: 'targetPath required' });
  }
  
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }
  
  if (!isAllowedPath(targetPath)) {
    return res.status(403).json({ success: false, error: 'path not allowed' });
  }

  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const uploadedFiles = [];
    for (const file of files) {
      const destPath = path.join(targetPath, file.originalname);
      fs.renameSync(file.path, destPath);
      uploadedFiles.push({
        name: file.originalname,
        path: destPath,
        size: file.size
      });
    }

    res.json({ success: true, files: uploadedFiles });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Directory listing endpoint
app.post('/list', (req, res) => {
  const { dirs } = req.body;
  if (!Array.isArray(dirs) || dirs.length === 0) {
    return res.status(400).json({ success: false, error: 'dirs must be a non-empty array' });
  }

  try {
    const result = {};
    dirs.forEach((d) => {
      try {
        if (!isAllowedPath(d)) throw new Error('Path not allowed');
        const entries = fs.readdirSync(d).map((name) => {
          const full = path.join(d, name);
          const stat = fs.statSync(full);
          return { 
            name, 
            path: full, 
            isDirectory: stat.isDirectory(), 
            size: stat.size, 
            modified: stat.mtimeMs 
          };
        });
        result[d] = { success: true, entries };
      } catch (e) {
        result[d] = { success: false, error: e.message };
      }
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Legacy Apache control endpoint
const { exec } = require('child_process');

app.post('/apache', (req, res) => {
  const { action } = req.body;
  let cmd = '';
  
  if (action === 'start') cmd = 'sudo service apache2 start';
  if (action === 'stop') cmd = 'sudo service apache2 stop';
  if (action === 'restart') cmd = 'sudo service apache2 restart';
  
  if (!cmd) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
  
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, output: stdout || 'Done' });
  });
});

// Legacy run command endpoint
app.post('/run', (req, res) => {
  const { command } = req.body;
  const allowed = ['ls', 'pwd', 'whoami', 'uptime'];
  
  if (!allowed.includes(command)) {
    return res.status(400).json({ success: false, error: 'Invalid command' });
  }
  
  exec(command, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr });
    }
    res.json({ success: true, output: stdout });
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// ==================== Start Server ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Socket.IO enabled for real-time updates');
  console.log('Route modules loaded successfully');
});

module.exports = app;
