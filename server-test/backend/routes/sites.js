const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { runExecStream } = require('../utils/exec');

// Enable / Disable / Maintenance mode for sites
router.post('/', (req, res) => {
  const { site, action } = req.body;
  const io = req.app.get('io');
  
  if (!site || !action) {
    return res.status(400).json({ success: false, error: 'Missing site or action' });
  }

  const confFile = `/etc/apache2/sites-available/${site}.conf`;
  const enabledFile = `/etc/apache2/sites-enabled/${site}.conf`;

  // Check if site is enabled
  exec(`[ -L ${enabledFile} ] && echo "enabled" || echo "disabled"`, (err, stdout) => {
    if (err) {
      return res.status(400).json({ success: false, error: `Site ${site} not found` });
    }
    
    const isEnabled = stdout.trim() === 'enabled';
    let cmd = '';

    if (action === 'enable') {
      if (isEnabled) {
        return res.status(400).json({ success: false, error: `Site ${site} is already enabled` });
      }
      // Restore from backup if exists (from maintenance mode)
      cmd = [
        `if [ -f ${confFile}.bak ]; then sudo mv ${confFile}.bak ${confFile}; fi`,
        `sudo a2ensite ${site}.conf`,
        `sudo apache2ctl configtest`,
        `sudo systemctl reload apache2`
      ].join(' && ');
    } else if (action === 'disable') {
      if (!isEnabled) {
        return res.status(400).json({ success: false, error: `Site ${site} is already disabled` });
      }
      // Force reload to ensure Apache stops serving this site
      cmd = [
        `sudo a2dissite ${site}.conf`,
        `sudo apache2ctl configtest`,
        `sudo systemctl restart apache2`
      ].join(' && ');
    } else if (action === 'maintenance') {
      if (!isEnabled) {
        return res.status(400).json({ success: false, error: `Cannot enable maintenance; site ${site} is disabled` });
      }
      
      // Check if already in maintenance (has .bak file)
      const hasBackup = fs.existsSync(`${confFile}.bak`);
      
      if (hasBackup) {
        // Restore from maintenance
        const sslConfFile = `/etc/apache2/sites-available/${site}-le-ssl.conf`;
        const hasSSlBackup = fs.existsSync(`${sslConfFile}.bak`);
        const sslEnabledFile = `/etc/apache2/sites-enabled/${site}-le-ssl.conf`;
        
        cmd = [
          // Restore HTTP config
          `sudo mv ${confFile}.bak ${confFile}`,
          // Restore HTTPS config if exists
          hasSSlBackup ? `sudo mv ${sslConfFile}.bak ${sslConfFile}` : 'true',
          // Re-enable SSL site if it was enabled
          hasSSlBackup && fs.existsSync(sslEnabledFile) ? `sudo a2ensite ${site}-le-ssl.conf` : 'true',
          `sudo apache2ctl configtest`,
          `sudo systemctl reload apache2`
        ].join(' && ');
      } else {
        // Enter maintenance mode
        // Create maintenance page if doesn't exist
        const maintenanceHTML = '<!DOCTYPE html><html><head><title>Under Maintenance</title><style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5}div{text-align:center;padding:40px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#ff6b6b;margin:0 0 20px}p{color:#666}</style></head><body><div><h1>⚠️ Under Maintenance</h1><p>This site is temporarily unavailable. Please check back soon.</p></div></body></html>';
        
        // Read original config to get ServerName
        let serverName = site;
        try {
          const configContent = fs.readFileSync(confFile, 'utf8');
          const serverNameMatch = configContent.match(/ServerName\s+([^\s]+)/);
          if (serverNameMatch) {
            serverName = serverNameMatch[1];
          }
        } catch (e) {
          console.warn('Could not read ServerName from config', e);
        }
        
        const maintenanceConfHTTP = `<VirtualHost *:80>
    ServerName ${serverName}
    DocumentRoot /var/www/html/maintenance
    <Directory /var/www/html/maintenance>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
    ErrorLog \${APACHE_LOG_DIR}/${site}-maintenance-error.log
    CustomLog \${APACHE_LOG_DIR}/${site}-maintenance-access.log combined
</VirtualHost>`;

        const maintenanceConfHTTPS = `<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName ${serverName}
    DocumentRoot /var/www/html/maintenance
    <Directory /var/www/html/maintenance>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
    ErrorLog \${APACHE_LOG_DIR}/${site}-maintenance-error.log
    CustomLog \${APACHE_LOG_DIR}/${site}-maintenance-access.log combined
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${serverName}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${serverName}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>`;

        const sslConfFile = `/etc/apache2/sites-available/${site}-le-ssl.conf`;
        const hasSSL = fs.existsSync(sslConfFile);
        
        cmd = [
          // Create maintenance directory and page
          `sudo mkdir -p /var/www/html/maintenance`,
          `echo '${maintenanceHTML}' | sudo tee /var/www/html/maintenance/index.html`,
          // Backup HTTP config
          `sudo cp ${confFile} ${confFile}.bak`,
          // Backup HTTPS config if exists
          hasSSL ? `sudo cp ${sslConfFile} ${sslConfFile}.bak` : 'true',
          // Replace with maintenance configs
          `echo '${maintenanceConfHTTP}' | sudo tee ${confFile}`,
          hasSSL ? `echo '${maintenanceConfHTTPS}' | sudo tee ${sslConfFile}` : 'true',
          `sudo apache2ctl configtest`,
          `sudo systemctl reload apache2`
        ].join(' && ');
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    // Stream the command and emit live outputs via socket.io
    runExecStream(cmd, { site, action }, (err, result) => {
      if (err) {
        return res.json({ success: false, error: err.message });
      }
      
      // After action completes, emit updated sites list
      setTimeout(() => {
        try {
          const availableDir = '/etc/apache2/sites-available';
          const availableSites = fs
            .readdirSync(availableDir)
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          const enabledSites = fs
            .readdirSync('/etc/apache2/sites-enabled')
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          
          const sites = availableSites
            .filter(site => !site.endsWith('-le-ssl'))
            .map((s) => {
              const sslConfPath = path.join(availableDir, `${s}-le-ssl.conf`);
              const hasSSL = fs.existsSync(sslConfPath);
              
              return { 
                name: s, 
                domain: s, 
                status: enabledSites.includes(s) ? 'enabled' : 'disabled',
                ssl: hasSSL
              };
            });
          io.emit('sites:updated', sites);
        } catch (e) {
          console.warn('Failed to emit sites update', e);
        }
      }, 500);

      res.json({ success: true, output: `Command executed (exit ${result.code})` });
    }, io);
  });
});

// GET all sites with status
router.get('/', (req, res) => {
  const availableDir = '/etc/apache2/sites-available';
  const enabledDir = '/etc/apache2/sites-enabled';

  try {
    const availableSites = fs
      .readdirSync(availableDir)
      .filter((f) => f.endsWith('.conf'))
      .map((f) => f.replace('.conf', ''));

    const enabledSites = fs
      .readdirSync(enabledDir)
      .filter((f) => f.endsWith('.conf'))
      .map((f) => f.replace('.conf', ''));

    // Parse config files to extract actual domain and SSL info
    const sites = availableSites
      .filter(site => !site.endsWith('-le-ssl')) // Skip SSL-specific files, we'll detect them
      .map((site) => {
        const confPath = path.join(availableDir, `${site}.conf`);
        const sslConfPath = path.join(availableDir, `${site}-le-ssl.conf`);
        
        let domain = site;
        let hasSSL = false;
        
        // Read config to extract ServerName
        try {
          const configContent = fs.readFileSync(confPath, 'utf8');
          const serverNameMatch = configContent.match(/ServerName\s+([^\s]+)/);
          if (serverNameMatch) {
            domain = serverNameMatch[1].replace('.local', '');
          }
        } catch (e) {
          console.warn(`Could not read config for ${site}`, e);
        }
        
        // Check if SSL config exists
        if (fs.existsSync(sslConfPath)) {
          hasSSL = true;
        }
        
        // Check if in maintenance mode
        const isInMaintenance = fs.existsSync(`${confPath}.bak`);
        let status = 'disabled';
        if (enabledSites.includes(site)) {
          status = isInMaintenance ? 'maintenance' : 'enabled';
        }
        
        return {
          name: site,
          domain: domain,
          status: status,
          ssl: hasSSL
        };
      });

    res.json({ success: true, sites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Legacy site add endpoint (kept for backwards compatibility)
router.post('/add', (req, res) => {
  const multer = require('multer');
  const upload = multer({ dest: 'uploads/' });
  
  upload.array('files')(req, res, (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    const { subdomain, folder, mainFile } = req.body;
    const files = req.files;

    if (!subdomain || !folder || !files || files.length === 0 || !mainFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields or files' 
      });
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
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr });
      }
      res.json({ success: true, output: stdout });
    });
  });
});

// Advanced site creation with full features
router.post('/create-advanced', async (req, res) => {
  const multer = require('multer');
  const upload = multer({ dest: 'uploads/' });
  const io = req.app.get('io');
  
  upload.array('files')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(500).json({ success: false, error: uploadErr.message });
    }
    
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
        error: 'Missing required fields: domain, subdomain, folderName, folderLocation, mainFile' 
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
      
      // Write to temp file
      fs.writeFileSync(tempConfFile, apacheConfig);
      
      // Move to Apache directory with sudo
      const writeConfCmd = [
        `sudo mv ${tempConfFile} ${confFile}`,
        `sudo chown root:root ${confFile}`,
        `sudo chmod 644 ${confFile}`
      ].join(' && ');
      
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

      // Step 7: Create backup files for maintenance mode
      const backupCmd = [
        `sudo cp ${confFile} ${confFile}.bak.initial`,
        `sudo chmod 644 ${confFile}.bak.initial`
      ].join(' && ');
      
      await new Promise((resolve) => {
        exec(backupCmd, (err) => {
          if (err) {
            console.warn('Failed to create initial backup', err);
          }
          resolve();
        });
      });

      // Step 8: Install SSL if requested
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

          // Create backup of SSL config too
          if (sslStatus === 'enabled') {
            const sslConfFile = `/etc/apache2/sites-available/${fullDomain}-le-ssl.conf`;
            if (fs.existsSync(sslConfFile)) {
              exec(`sudo cp ${sslConfFile} ${sslConfFile}.bak.initial`, (err) => {
                if (err) {
                  console.warn('Failed to create SSL backup', err);
                }
              });
            }
          }

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
          const availableDir = '/etc/apache2/sites-available';
          const availableSites = fs
            .readdirSync(availableDir)
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          const enabledSites = fs
            .readdirSync('/etc/apache2/sites-enabled')
            .filter((f) => f.endsWith('.conf'))
            .map((f) => f.replace('.conf', ''));
          
          const sites = availableSites
            .filter(site => !site.endsWith('-le-ssl'))
            .map((s) => {
              const sslConfPath = path.join(availableDir, `${s}-le-ssl.conf`);
              const hasSSL = fs.existsSync(sslConfPath);
              
              return { 
                name: s, 
                domain: s, 
                status: enabledSites.includes(s) ? 'enabled' : 'disabled',
                ssl: hasSSL
              };
            });
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
});

module.exports = router;
