// const express = require("express");
// const bodyParser = require("body-parser");
// const { exec } = require("child_process");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const multer = require("multer");

// const app = express() ;
// app.use(cors());
// app.use(bodyParser.json());

// // Multer setup for file uploads
// const upload = multer({ dest: "uploads/" });

// function runExec(cmd, res) {
//   exec(cmd, (err, stdout, stderr) => {
//     if (err) return res.status(500).json({ success: false, error: stderr });
//     res.json({ success: true, output: stdout });
//   });
// }


// // Route to run user commands
// app.post("/run", (req, res) => {
//   const { command } = req.body;
//   const allowed = ["ls", "pwd", "whoami", "uptime"];
//   if (!allowed.includes(command)) {
//     return res.status(400).json({ success: false, error: "Invalid command" });
//   }
//   runExec(command, res);
// });

// // Route to control Apache
// app.post("/apache", (req, res) => {
//   const { action } = req.body;
//   let cmd = "";
//   if (action === "start") cmd = "sudo service apache2 start";
//   if (action === "stop") cmd = "sudo service apache2 stop";
//   if (action === "restart") cmd = "sudo service apache2 restart";
//   if (action === "status") cmd = "service apache2 status";
//   if (!cmd) return res.status(400).json({ success: false, error: "Invalid action" });
//   runExec(cmd, res);
// });


// app.post("/sites", (req, res) => {
//   const { site, action } = req.body;

//   if (!site || !action) {
//     return res.status(400).json({ success: false, error: "Missing site or action" });
//   }

//   const confFile = `/etc/apache2/sites-available/${site}.conf`;
//   const enabledFile = `/etc/apache2/sites-enabled/${site}.conf`;

//   // check if enabled by symlink
//   exec(`[ -L ${enabledFile} ] && echo "enabled" || echo "disabled"`, (err, stdout) => {
//     if (err) {
//       return res.status(400).json({ success: false, error: `Site ${site} not found` });
//     }

//     const isEnabled = stdout.trim() === "enabled";
//     let cmd = "";

//     if (action === "enable") {
//       if (isEnabled) {
//         return res.status(400).json({ success: false, error: `Site ${site} is already enabled` });
//       }
//       cmd = `
//         if [ -f ${confFile}.bak ]; then
//           sudo mv ${confFile}.bak ${confFile};
//         fi;
//         sudo a2ensite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2
//       `;
//     } else if (action === "disable") {
//       if (!isEnabled) {
//         return res.status(400).json({ success: false, error: `Site ${site} is already disabled` });
//       }
//       cmd = `sudo a2dissite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2`;
//     } else if (action === "maintenance") {
//       if (!isEnabled) {
//         return res.status(400).json({ success: false, error: `Cannot enable maintenance because site ${site} is not active` });
//       }
//       cmd = `
//         if [ ! -f ${confFile}.bak ]; then
//           sudo cp ${confFile} ${confFile}.bak;
//         fi;
//         echo '<VirtualHost *:80>
//         ServerName ${site}.local
//         DocumentRoot /var/www/html/maintenance
//         </VirtualHost>' | sudo tee ${confFile};
//         sudo apache2ctl configtest && sudo systemctl reload apache2
//       `;
//     } else {
//       return res.status(400).json({ success: false, error: "Invalid action" });
//     }

//     exec(cmd, (err, stdout, stderr) => {
//       if (err) {
//         return res.json({ success: false, error: stderr });
//       }
//       res.json({ success: true, output: stdout || "Done" });
//     });
//   });
// });


// // List all sites with enabled/disabled status
// app.get("/sites", (req, res) => {
//   const availableDir = "/etc/apache2/sites-available";
//   const enabledDir = "/etc/apache2/sites-enabled";

//   try {
//     const availableSites = fs
//       .readdirSync(availableDir)
//       .filter((file) => file.endsWith(".conf"))
//       .map((file) => file.replace(".conf", ""));

//     const enabledSites = fs
//       .readdirSync(enabledDir)
//       .filter((file) => file.endsWith(".conf"))
//       .map((file) => file.replace(".conf", ""));

//     const sites = availableSites.map((site) => ({
//       name: site,
//       status: enabledSites.includes(site) ? "enabled" : "disabled",
//     }));

//     res.json({ success: true, sites });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });


// // Add new site
// app.post("/site/add", upload.array("files"), (req, res) => {
//   const { subdomain, folder } = req.body;
//   const files = req.files;

//   if (!subdomain || !folder || !files || files.length === 0) {
//     return res.status(400).json({ success: false, error: "Missing required fields or files" });
//   }

//   const documentRoot = `/var/www/html/${folder}`;
//   const confFile = `/etc/apache2/sites-available/${subdomain}.conf`;

//   // Create directory
//   const cmd = `
//     sudo mkdir -p ${documentRoot} &&
//     sudo chown -R www-data:www-data ${documentRoot} &&
//     sudo chmod -R 755 ${documentRoot} &&
//     ${files
//       .map(
//         (file) =>
//           `sudo mv ${file.path} ${documentRoot}/${file.originalname} && sudo chown www-data:www-data ${documentRoot}/${file.originalname}`
//       )
//       .join(" && ")} &&
//     echo '<VirtualHost *:80>
//       ServerName ${subdomain}.local
//       DocumentRoot ${documentRoot}
//       <Directory ${documentRoot}>
//         Options Indexes +FollowSymLinks
//         AllowOverride All
//         Require all granted
//       </Directory>
//     </VirtualHost>' | sudo tee ${confFile} &&
//     echo '127.0.0.1 ${subdomain}.local' | sudo tee -a /etc/hosts &&
//     sudo a2ensite ${subdomain}.conf &&
//     sudo systemctl reload apache2
//   `;

//   runExec(cmd, res);
// });

// app.listen(5000, () => console.log("Backend running on http://localhost:5000"));


const express = require("express");
const bodyParser = require("body-parser");
const { exec, spawn } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
});

// Utility to run shell commands
function runExec(cmd, res) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });
    res.json({ success: true, output: stdout || "Done" });
  });
}

// Stream execution and broadcast output via socket.io, then call callback on finish
function runExecStream(cmd, meta = {}, callback) {
  const child = spawn('bash', ['-lc', cmd], { env: process.env });
  child.stdout.on('data', (chunk) => {
    io.emit('site:action-output', { ...meta, type: 'stdout', chunk: chunk.toString() });
  });
  child.stderr.on('data', (chunk) => {
    io.emit('site:action-output', { ...meta, type: 'stderr', chunk: chunk.toString() });
  });
  child.on('close', (code) => {
    io.emit('site:action-output', { ...meta, type: 'close', code });
    if (callback) callback(null, { code });
  });
  child.on('error', (err) => {
    if (callback) callback(err);
  });
}

// ------------------------- Routes -------------------------

// Run allowed commands
app.post("/run", (req, res) => {
  const { command } = req.body;
  const allowed = ["ls", "pwd", "whoami", "uptime"];
  if (!allowed.includes(command)) {
    return res.status(400).json({ success: false, error: "Invalid command" });
  }
  runExec(command, res);
});

// Control Apache
app.post("/apache", (req, res) => {
  const { action } = req.body;
  let cmd = "";
  if (action === "start") cmd = "sudo service apache2 start";
  if (action === "stop") cmd = "sudo service apache2 stop";
  if (action === "restart") cmd = "sudo service apache2 restart";
  if (!cmd) return res.status(400).json({ success: false, error: "Invalid action" });
  runExec(cmd, res);
});

// Enable / Disable / Maintenance
app.post("/sites", (req, res) => {
  const { site, action } = req.body;
  if (!site || !action) return res.status(400).json({ success: false, error: "Missing site or action" });

  const confFile = `/etc/apache2/sites-available/${site}.conf`;
  const enabledFile = `/etc/apache2/sites-enabled/${site}.conf`;

  // Check if site is enabled
  exec(`[ -L ${enabledFile} ] && echo "enabled" || echo "disabled"`, (err, stdout) => {
    if (err) return res.status(400).json({ success: false, error: `Site ${site} not found` });
    const isEnabled = stdout.trim() === "enabled";
    let cmd = "";

    if (action === "enable") {
      if (isEnabled) return res.status(400).json({ success: false, error: `Site ${site} is already enabled` });
      // Restore from backup if exists (from maintenance mode)
      cmd = `
        if [ -f ${confFile}.bak ]; then 
          sudo mv ${confFile}.bak ${confFile}; 
        fi;
        sudo a2ensite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2
      `;
    } else if (action === "disable") {
      if (!isEnabled) return res.status(400).json({ success: false, error: `Site ${site} is already disabled` });
      // Force reload to ensure Apache stops serving this site
      cmd = `sudo a2dissite ${site}.conf && sudo apache2ctl configtest && sudo systemctl restart apache2`;
    } else if (action === "maintenance") {
      if (!isEnabled) return res.status(400).json({ success: false, error: `Cannot enable maintenance; site ${site} is disabled` });
      // Create maintenance page if doesn't exist
      cmd = `
        sudo mkdir -p /var/www/html/maintenance;
        if [ ! -f /var/www/html/maintenance/index.html ]; then
          echo '<!DOCTYPE html><html><head><title>Under Maintenance</title><style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}div{text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#ff6b6b;margin:0 0 20px}p{color:#666}</style></head><body><div><h1>⚠️ Under Maintenance</h1><p>This site is temporarily unavailable. Please check back soon.</p></div></body></html>' | sudo tee /var/www/html/maintenance/index.html;
        fi;
        if [ ! -f ${confFile}.bak ]; then sudo cp ${confFile} ${confFile}.bak; fi;
        echo '<VirtualHost *:80>
        ServerName ${site}.local
        DocumentRoot /var/www/html/maintenance
        <Directory /var/www/html/maintenance>
          Options -Indexes +FollowSymLinks
          AllowOverride None
          Require all granted
        </Directory>
        </VirtualHost>' | sudo tee ${confFile};
        sudo apache2ctl configtest && sudo systemctl reload apache2
      `;
    } else return res.status(400).json({ success: false, error: "Invalid action" });

    // Stream the command and emit live outputs via socket.io
    runExecStream(cmd, { site, action }, (err, result) => {
      if (err) return res.json({ success: false, error: err.message });
      // After action completes, emit updated sites list
      // small delay to allow filesystem changes to settle
      setTimeout(() => {
        try {
          const availableSites = fs
            .readdirSync('/etc/apache2/sites-available')
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          const enabledSites = fs
            .readdirSync('/etc/apache2/sites-enabled')
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          const sites = availableSites.map((s) => ({ name: s, domain: `${s}.local`, status: enabledSites.includes(s) ? 'enabled' : 'disabled' }));
          io.emit('sites:updated', sites);
        } catch (e) {
          console.warn('failed to emit sites update', e);
        }
      }, 500);

      res.json({ success: true, output: `Command executed (exit ${result.code})` });
    });
  });
});

// GET all sites with status
app.get("/sites", (req, res) => {
  const availableDir = "/etc/apache2/sites-available";
  const enabledDir = "/etc/apache2/sites-enabled";

  try {
    const availableSites = fs
      .readdirSync(availableDir)
      .filter((f) => f.endsWith(".conf"))
      .map((f) => f.replace(".conf", ""));

    const enabledSites = fs
      .readdirSync(enabledDir)
      .filter((f) => f.endsWith(".conf"))
      .map((f) => f.replace(".conf", ""));

    const sites = availableSites.map((site) => ({
      name: site,
      domain: `${site}.local`,
      status: enabledSites.includes(site) ? "enabled" : "disabled",
    }));

    res.json({ success: true, sites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const path = require('path');
const os = require('os');

// Security: only allow operations under these roots
const ALLOWED_ROOTS = [
  '/var/www/html',
  os.homedir(), // User's home directory
  '/home' // Allow access to all home directories
];

function isAllowedPath(p) {
  try {
    const resolved = path.resolve(p);
    return ALLOWED_ROOTS.some(root => resolved === root || resolved.startsWith(root + path.sep));
  } catch (e) {
    return false;
  }
}

// Traverse multiple directories and return basic listing (includes modified time)
app.post('/list', (req, res) => {
  const { dirs } = req.body;
  if (!Array.isArray(dirs) || dirs.length === 0) return res.status(400).json({ success: false, error: 'dirs must be a non-empty array' });

  try {
    const result = {};
    dirs.forEach((d) => {
      try {
        if (!isAllowedPath(d)) throw new Error('Path not allowed');
        const entries = fs.readdirSync(d).map((name) => {
          const full = path.join(d, name);
          const stat = fs.statSync(full);
          return { name, path: full, isDirectory: stat.isDirectory(), size: stat.size, modified: stat.mtimeMs };
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

// Read file content
app.post('/files/read', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(filePath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return res.status(400).json({ success: false, error: 'path is a directory' });
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content, size: stat.size, modified: stat.mtimeMs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Write file content
app.post('/files/write', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(filePath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  try {
    fs.writeFileSync(filePath, content || '', 'utf8');
    const stat = fs.statSync(filePath);
    res.json({ success: true, size: stat.size, modified: stat.mtimeMs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Create file or directory
app.post('/files/create', (req, res) => {
  const { path: targetPath, isDirectory } = req.body;
  if (!targetPath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(targetPath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  try {
    if (isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true });
      return res.json({ success: true });
    } else {
      fs.writeFileSync(targetPath, '', 'utf8');
      return res.json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete file or directory
app.post('/files/delete', (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(targetPath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Upload files to a directory
app.post('/files/upload', upload.array('files'), (req, res) => {
  const { targetPath } = req.body;
  const files = req.files;

  if (!targetPath) return res.status(400).json({ success: false, error: 'targetPath required' });
  if (!files || files.length === 0) return res.status(400).json({ success: false, error: 'No files uploaded' });
  if (!isAllowedPath(targetPath)) return res.status(403).json({ success: false, error: 'path not allowed' });

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

// Add new site
app.post("/site/add", upload.array("files"), (req, res) => {
  const { subdomain, folder, mainFile } = req.body; // get mainFile
  const files = req.files;

  if (!subdomain || !folder || !files || files.length === 0 || !mainFile) {
    return res.status(400).json({ success: false, error: "Missing required fields or files" });
  }

  const documentRoot = `/var/www/html/${folder}`;
  const confFile = `/etc/apache2/sites-available/${subdomain}.conf`;

  // Move all uploaded files to document root
  const moveFilesCmd = files
    .map(f => `sudo mv ${f.path} ${documentRoot}/${f.originalname} && sudo chown www-data:www-data ${documentRoot}/${f.originalname}`)
    .join(" && ");

  // Apache config pointing to the selected main file
  const cmd = `
    sudo mkdir -p ${documentRoot} &&
    sudo chown -R www-data:www-data ${documentRoot} &&
    sudo chmod -R 755 ${documentRoot} &&
    ${moveFilesCmd} &&
    echo '<VirtualHost *:80>
      ServerName ${subdomain}.local
      DocumentRoot ${documentRoot}
      DirectoryIndex ${mainFile}
      <Directory ${documentRoot}>
        Options +Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>' | sudo tee ${confFile} &&
    echo '127.0.0.1 ${subdomain}.local' | sudo tee -a /etc/hosts &&
    sudo a2ensite ${subdomain}.conf &&
    sudo systemctl reload apache2
  `;

  runExec(cmd, res);
});


// -------------------- Domain Management Routes --------------------

const DOMAINS_FILE = path.join(__dirname, 'domains.json');

// Helper to read domains
function readDomains() {
  try {
    if (!fs.existsSync(DOMAINS_FILE)) {
      fs.writeFileSync(DOMAINS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DOMAINS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading domains:', e);
    return [];
  }
}

// Helper to write domains
function writeDomains(domains) {
  try {
    fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing domains:', e);
    return false;
  }
}

// GET all domains
app.get('/domains', (req, res) => {
  const domains = readDomains();
  res.json({ success: true, domains });
});

// POST add new domain
app.post('/domains', (req, res) => {
  const { domain, status = 'active' } = req.body;
  
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Domain name is required' });
  }
  
  const domains = readDomains();
  
  // Check if domain already exists
  const exists = domains.find(d => d.domain === domain);
  if (exists) {
    return res.status(400).json({ success: false, error: 'Domain already exists' });
  }
  
  const newDomain = {
    id: Date.now().toString(),
    domain,
    status,
    addedAt: new Date().toISOString()
  };
  
  domains.push(newDomain);
  
  if (writeDomains(domains)) {
    io.emit('domains:updated', domains);
    res.json({ success: true, domain: newDomain });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save domain' });
  }
});

// DELETE domain
app.delete('/domains/:domain', (req, res) => {
  const { domain } = req.params;
  
  const domains = readDomains();
  const filtered = domains.filter(d => d.domain !== domain);
  
  if (domains.length === filtered.length) {
    return res.status(404).json({ success: false, error: 'Domain not found' });
  }
  
  if (writeDomains(filtered)) {
    io.emit('domains:updated', filtered);
    res.json({ success: true, message: 'Domain deleted' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to delete domain' });
  }
});

// GET server IP address
app.get('/server/ip', (req, res) => {
  exec('hostname -I', (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to get IP address' });
    }
    const ips = stdout.trim().split(' ').filter(ip => ip);
    res.json({ success: true, ip: ips[0] || 'localhost', allIps: ips });
  });
});

// GET server paths (home directory, allowed roots)
app.get('/server/paths', (req, res) => {
  res.json({
    success: true,
    homeDir: os.homedir(),
    allowedRoots: ALLOWED_ROOTS,
    username: os.userInfo().username
  });
});

// -------------------- PM2 Management Routes --------------------

// GET all PM2 processes
app.get('/pm2/list', (req, res) => {
  exec('pm2 jlist', (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to get PM2 list. Make sure PM2 is installed.' });
    }
    try {
      const processes = JSON.parse(stdout);
      res.json({ success: true, processes });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to parse PM2 output' });
    }
  });
});

// POST control PM2 process (restart, stop, reload, delete)
app.post('/pm2/control', (req, res) => {
  const { action, processId } = req.body;
  
  if (!action || processId === undefined || processId === null) {
    return res.status(400).json({ success: false, error: 'Missing action or processId' });
  }
  
  const allowedActions = ['restart', 'stop', 'reload', 'delete'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
  
  const cmd = `pm2 ${action} ${processId}`;
  
  runExecStream(cmd, { action, processId }, (err, result) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    
    // Emit updated PM2 list after action
    setTimeout(() => {
      exec('pm2 jlist', (err, stdout) => {
        if (!err) {
          try {
            const processes = JSON.parse(stdout);
            io.emit('pm2:updated', processes);
          } catch (e) {
            console.warn('Failed to emit PM2 update', e);
          }
        }
      });
    }, 500);
    
    res.json({ success: true, message: `Process ${action}ed successfully` });
  });
});

// POST start new PM2 process
app.post('/pm2/start', (req, res) => {
  const { name, script, cwd } = req.body;
  
  if (!name || !script) {
    return res.status(400).json({ success: false, error: 'Missing name or script' });
  }
  
  const cwdParam = cwd ? `--cwd ${cwd}` : '';
  const cmd = `pm2 start ${script} --name ${name} ${cwdParam}`;
  
  runExec(cmd, res);
});

// Start server with Socket.IO
server.listen(5000, () => console.log("Backend running on http://localhost:5000 with Socket.IO"));
