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
        ServerName ${site}
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
          const sites = availableSites.map((s) => ({ name: s, domain: s, status: enabledSites.includes(s) ? 'enabled' : 'disabled' }));
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
      domain: site, // Use the actual domain from the config file name
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

// Add new site (legacy endpoint)
app.post("/site/add", upload.array("files"), (req, res) => {
  const { subdomain, folder, mainFile } = req.body;
  const files = req.files;

  if (!subdomain || !folder || !files || files.length === 0 || !mainFile) {
    return res.status(400).json({ success: false, error: "Missing required fields or files" });
  }

  const documentRoot = `/var/www/html/${folder}`;
  const confFile = `/etc/apache2/sites-available/${subdomain}.conf`;

  // Build command array
  const cmds = [
    `sudo mkdir -p ${documentRoot}`,
    `sudo chown -R www-data:www-data ${documentRoot}`,
    `sudo chmod -R 755 ${documentRoot}`
  ];

  // Add file move commands
  files.forEach(f => {
    cmds.push(`sudo mv ${f.path} ${documentRoot}/${f.originalname}`);
    cmds.push(`sudo chown www-data:www-data ${documentRoot}/${f.originalname}`);
  });

  // Apache config
  const apacheConf = `<VirtualHost *:80>
  ServerName ${subdomain}.local
  DocumentRoot ${documentRoot}
  DirectoryIndex ${mainFile}
  <Directory ${documentRoot}>
    Options +Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>`;

  // Write config to temp file and move it
  const tempFile = `/tmp/${subdomain}.conf`;
  fs.writeFileSync(tempFile, apacheConf);
  
  cmds.push(`sudo mv ${tempFile} ${confFile}`);
  cmds.push(`sudo chown root:root ${confFile}`);
  cmds.push(`echo '127.0.0.1 ${subdomain}.local' | sudo tee -a /etc/hosts`);
  cmds.push(`sudo a2ensite ${subdomain}.conf`);
  cmds.push(`sudo systemctl reload apache2`);

  // Execute all commands
  const cmd = cmds.join(' && ');
  runExec(cmd, res);
});

// Advanced site creation with full features
app.post("/site/create-advanced", upload.array("files"), async (req, res) => {
  const { 
    domain, 
    subdomain, 
    uploadMethod, 
    serverPath, 
    folderName, 
    folderLocation,
    mainFile, 
    phpVersion,
    apiRoutes: apiRoutesStr,
    backendPort,
    enableSSL,
    autoRenewSSL
  } = req.body;

  const files = req.files;

  // Validate required fields
  if (!domain || !subdomain || !folderName || !folderLocation || !mainFile) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: domain, subdomain, folderName, folderLocation, mainFile" 
    });
  }

  // Parse API routes
  let apiRoutes = [];
  try {
    apiRoutes = apiRoutesStr ? JSON.parse(apiRoutesStr) : [];
  } catch (e) {
    console.warn('Failed to parse API routes', e);
  }

  const fullDomain = `${subdomain}.${domain}`;
  const documentRoot = `${folderLocation}/${folderName}`;
  const confFile = `/etc/apache2/sites-available/${fullDomain}.conf`;
  const sslConfFile = `/etc/apache2/sites-available/${fullDomain}-le-ssl.conf`;

  try {
    // Step 1: Create document root and set permissions
    let setupCmds = [
      `sudo mkdir -p ${documentRoot}`,
      `sudo chown -R www-data:www-data ${documentRoot}`,
      `sudo chmod -R 755 ${documentRoot}`
    ];

    // Step 2: Handle file upload based on method
    if (uploadMethod === 'local' && files && files.length > 0) {
      files.forEach(f => {
        setupCmds.push(`sudo mv ${f.path} ${documentRoot}/${f.originalname}`);
        setupCmds.push(`sudo chown www-data:www-data ${documentRoot}/${f.originalname}`);
      });
    } else if (uploadMethod === 'server' && serverPath) {
      // Copy files from server path to document root
      setupCmds.push(`sudo cp -r ${serverPath}/* ${documentRoot}/`);
      setupCmds.push(`sudo chown -R www-data:www-data ${documentRoot}`);
    }

    // Combine all commands into one line
    const setupCmd = setupCmds.join(' && ');

    // Execute setup commands
    await new Promise((resolve, reject) => {
      exec(setupCmd, (err, stdout, stderr) => {
        if (err) {
          console.error('Setup error:', stderr);
          reject(new Error(stderr || 'Setup failed'));
        } else {
          resolve(stdout);
        }
      });
    });

    // Step 3: Generate Apache virtual host configuration
    let apacheConfig = `<VirtualHost *:80>
    ServerName ${fullDomain}
    DocumentRoot ${documentRoot}
    DirectoryIndex ${mainFile}

    <Directory ${documentRoot}>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
`;

    // Add PHP configuration if needed
    if (phpVersion && phpVersion !== 'none') {
      apacheConfig += `
    <FilesMatch \\.php$>
        SetHandler "proxy:unix:/run/php/php${phpVersion}-fpm.sock|fcgi://localhost"
    </FilesMatch>
`;
    }

    // Add API proxy configurations
    if (apiRoutes && apiRoutes.length > 0) {
      apacheConfig += `
    # API Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off
`;
      
      apiRoutes.forEach(route => {
        if (route.path && route.port) {
          apacheConfig += `
    ProxyPass ${route.path} http://localhost:${route.port}${route.path}
    ProxyPassReverse ${route.path} http://localhost:${route.port}${route.path}
`;
        }
      });
    }

    // Enable logging
    apacheConfig += `
    ErrorLog \${APACHE_LOG_DIR}/${fullDomain}-error.log
    CustomLog \${APACHE_LOG_DIR}/${fullDomain}-access.log combined
`;

    apacheConfig += `</VirtualHost>`;

    // Write Apache configuration to a temp file first, then move it
    const tempConfFile = `/tmp/${fullDomain}.conf`;
    const fs = require('fs');
    
    // Write to temp file
    fs.writeFileSync(tempConfFile, apacheConfig);
    
    // Move to Apache directory with sudo
    const writeConfCmd = `sudo mv ${tempConfFile} ${confFile} && sudo chown root:root ${confFile} && sudo chmod 644 ${confFile}`;
    await new Promise((resolve, reject) => {
      exec(writeConfCmd, (err, stdout, stderr) => {
        if (err) {
          console.error('Config write error:', stderr);
          reject(new Error(stderr || 'Failed to write config'));
        } else {
          resolve(stdout);
        }
      });
    });

    // Step 4: Enable required Apache modules
    const modulesCmd = `sudo a2enmod proxy proxy_http proxy_fcgi rewrite ssl`;
    await new Promise((resolve, reject) => {
      exec(modulesCmd, (err) => {
        // Ignore errors if modules already enabled
        resolve();
      });
    });

    // Step 5: Enable site and test configuration
    const enableCmd = `sudo a2ensite ${fullDomain}.conf && sudo apache2ctl configtest`;
    
    await new Promise((resolve, reject) => {
      exec(enableCmd, (err, stdout, stderr) => {
        const output = stdout + stderr;
        if (err && !output.includes('Syntax OK')) {
          reject(new Error(output));
        } else {
          resolve(stdout);
        }
      });
    });

    // Step 6: Reload Apache
    await new Promise((resolve, reject) => {
      exec('sudo systemctl reload apache2', (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || 'Failed to reload Apache'));
        } else {
          resolve(stdout);
        }
      });
    });

    // Step 7: Install SSL if requested
    let sslStatus = 'disabled';
    if (enableSSL === 'true' || enableSSL === true) {
      try {
        const certbotCmd = `sudo certbot --apache -d ${fullDomain} --non-interactive --agree-tos --email admin@${domain} --redirect`;
        
        await new Promise((resolve, reject) => {
          exec(certbotCmd, { timeout: 120000 }, (err, stdout, stderr) => {
            if (err) {
              console.warn('SSL installation warning:', stderr);
              // Don't fail the entire operation if SSL fails
              resolve();
            } else {
              sslStatus = 'enabled';
              resolve(stdout);
            }
          });
        });

        // Setup auto-renewal if requested
        if ((autoRenewSSL === 'true' || autoRenewSSL === true) && sslStatus === 'enabled') {
          exec('sudo certbot renew --dry-run', (err) => {
            if (!err) {
              console.log('SSL auto-renewal configured successfully');
            }
          });
        }
      } catch (sslError) {
        console.error('SSL installation failed:', sslError);
        // Continue without SSL
      }
    }

    // Update sites list via socket
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
        const sites = availableSites.map((s) => ({ 
          name: s, 
          domain: s, 
          status: enabledSites.includes(s) ? 'enabled' : 'disabled',
          ssl: sslStatus === 'enabled'
        }));
        io.emit('sites:updated', sites);
      } catch (e) {
        console.warn('Failed to emit sites update', e);
      }
    }, 1000);

    res.json({ 
      success: true, 
      message: 'Site created successfully',
      site: {
        domain: fullDomain,
        documentRoot,
        ssl: sslStatus,
        url: sslStatus === 'enabled' ? `https://${fullDomain}` : `http://${fullDomain}`
      }
    });

  } catch (error) {
    console.error('Site creation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create site'
    });
  }
});


// -------------------- SSL Management Routes --------------------

// POST Install SSL for a site
app.post('/ssl/install', async (req, res) => {
  const { domain, email } = req.body;
  
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Domain is required' });
  }
  
  const adminEmail = email || `admin@${domain.split('.').slice(-2).join('.')}`;
  const certbotCmd = `sudo certbot --apache -d ${domain} --non-interactive --agree-tos --email ${adminEmail} --redirect`;
  
  try {
    exec(certbotCmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        return res.json({ 
          success: false, 
          error: stderr || 'SSL installation failed',
          output: stdout + stderr
        });
      }
      
      res.json({ 
        success: true, 
        message: 'SSL certificate installed successfully',
        output: stdout
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET SSL status for a domain
app.get('/ssl/status/:domain', (req, res) => {
  const { domain } = req.params;
  
  exec(`sudo certbot certificates | grep -A 5 "${domain}"`, (err, stdout, stderr) => {
    if (err || !stdout) {
      return res.json({ 
        success: true, 
        installed: false,
        message: 'No SSL certificate found for this domain'
      });
    }
    
    // Parse certbot output for expiry date
    const expiryMatch = stdout.match(/Expiry Date: (.+)/);
    const expiry = expiryMatch ? expiryMatch[1] : 'Unknown';
    
    res.json({ 
      success: true, 
      installed: true,
      expiry,
      details: stdout
    });
  });
});

// POST Renew SSL certificate
app.post('/ssl/renew', (req, res) => {
  const { domain } = req.body;
  
  const renewCmd = domain 
    ? `sudo certbot renew --cert-name ${domain}`
    : `sudo certbot renew`;
  
  exec(renewCmd, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ 
        success: false, 
        error: stderr || 'SSL renewal failed',
        output: stdout + stderr
      });
    }
    
    res.json({ 
      success: true, 
      message: 'SSL certificate renewed successfully',
      output: stdout
    });
  });
});

// DELETE Remove SSL certificate
app.delete('/ssl/remove/:domain', (req, res) => {
  const { domain } = req.params;
  
  const removeCmd = `sudo certbot delete --cert-name ${domain} --non-interactive`;
  
  exec(removeCmd, (err, stdout, stderr) => {
    if (err) {
      return res.json({ 
        success: false, 
        error: stderr || 'SSL removal failed'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'SSL certificate removed successfully'
    });
  });
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

// -------------------- Apache Config Routes --------------------

// GET Apache status
app.get('/api/apache/status', (req, res) => {
  exec('systemctl is-active apache2', (err, stdout, stderr) => {
    const status = stdout.trim();
    res.json({ success: true, status: status || 'unknown' });
  });
});

// POST Apache control (start, stop, restart, reload)
app.post('/api/apache/control', (req, res) => {
  const { action } = req.body;
  
  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action' });
  }
  
  const allowedActions = ['start', 'stop', 'restart', 'reload'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
  
  const cmd = `sudo systemctl ${action} apache2`;
  
  runExecStream(cmd, { action }, (err, result) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    
    res.json({ success: true, message: `Apache ${action}ed successfully` });
  });
});

// GET Apache config files
app.get('/api/apache/configs', (req, res) => {
  const availableDir = '/etc/apache2/sites-available';
  const enabledDir = '/etc/apache2/sites-enabled';
  
  try {
    const availableSites = fs
      .readdirSync(availableDir)
      .filter((f) => f.endsWith('.conf'))
      .map((file) => {
        const name = file.replace('.conf', '');
        const filePath = path.join(availableDir, file);
        const enabled = fs.existsSync(path.join(enabledDir, file));
        
        return {
          name,
          path: filePath,
          enabled
        };
      });
    
    res.json({ success: true, configs: availableSites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Apache logs
app.get('/api/apache/logs', (req, res) => {
  const logFile = '/var/log/apache2/error.log';
  
  exec(`sudo tail -n 50 ${logFile}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to read logs',
        logs: ['Error reading Apache logs'] 
      });
    }
    
    const logs = stdout.split('\n').filter(line => line.trim());
    res.json({ success: true, logs });
  });
});

// GET Apache config test
app.get('/api/apache/test', (req, res) => {
  exec('sudo apache2ctl configtest', (err, stdout, stderr) => {
    const output = stdout + stderr;
    const success = output.includes('Syntax OK');
    
    res.json({ 
      success, 
      message: output.trim(),
      details: output
    });
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
