const express = require('express');
const fs = require('fs');
const net = require('net');
const path = require('path');
const router = express.Router();
const { exec } = require('child_process');

const APACHE_SERVICE = process.env.APACHE_SERVICE_NAME || 'apache2';
const APACHE_LOG_DIR = process.env.APACHE_ACCESS_LOG_DIR || '/var/log/apache2';
const APACHE_BANLIST_FILE = path.join(__dirname, '..', process.env.APACHE_BANLIST_FILE || 'apache-banlist.json');
const APACHE_BAN_CONF_PATH = process.env.APACHE_BAN_CONF_PATH || '/etc/apache2/conf-available/finalproject-ip-blocklist.conf';
const APACHE_BAN_CONF_NAME = path.basename(APACHE_BAN_CONF_PATH, '.conf');

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function loadBanList() {
  try {
    if (!fs.existsSync(APACHE_BANLIST_FILE)) {
      return [];
    }

    const data = JSON.parse(fs.readFileSync(APACHE_BANLIST_FILE, 'utf8'));
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.ips)) {
      return data.ips;
    }

    return [];
  } catch (error) {
    return [];
  }
}

function saveBanList(entries) {
  fs.writeFileSync(APACHE_BANLIST_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function validateIp(ip) {
  return typeof ip === 'string' && net.isIP(ip.trim()) !== 0;
}

function parseCombinedLogLine(line, sourceFile) {
  const combinedMatch = line.match(/^([\d.:a-fA-F]+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3})\s+(\S+)(?:\s+"([^"]*)"\s+"([^"]*)")?/);

  if (!combinedMatch) {
    return {
      raw: line,
      sourceFile,
      timestamp: null,
      ip: null,
      method: null,
      path: null,
      protocol: null,
      status: null,
      bytes: null,
      referrer: null,
      userAgent: null
    };
  }

  const [, ip, timestamp, request, status, bytes, referrer = '-', userAgent = '-'] = combinedMatch;
  const requestMatch = request.match(/^([A-Z]+)\s+(.*?)(?:\s+(HTTP\/\d\.\d))?$/i);

  return {
    raw: line,
    sourceFile,
    timestamp,
    ip,
    method: requestMatch ? requestMatch[1] : null,
    path: requestMatch ? requestMatch[2] : request,
    protocol: requestMatch ? requestMatch[3] || null : null,
    status: Number(status),
    bytes: bytes === '-' ? null : Number(bytes),
    referrer,
    userAgent
  };
}

function buildBanConfig(entries) {
  const ipRules = entries
    .map((entry) => entry.ip)
    .filter(Boolean)
    .map((ip) => `      Require not ip ${ip}`)
    .join('\n');

  return `# Managed by Hosting Manager\n<IfModule mod_authz_core.c>\n  <Location "/">\n    <RequireAll>\n      Require all granted${ipRules ? `\n${ipRules}` : ''}\n    </RequireAll>\n  </Location>\n</IfModule>\n`;
}

async function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

async function applyBanConfig(entries) {
  const tempFile = `/tmp/${APACHE_BAN_CONF_NAME}.conf`;
  fs.writeFileSync(tempFile, buildBanConfig(entries), 'utf8');

  const sudoCheck = await execPromise('sudo -n true');
  if (sudoCheck.stderr && sudoCheck.stderr.includes('password')) {
    throw new Error('Passwordless sudo is required to apply Apache IP bans');
  }

  await execPromise(`sudo -n mv ${shellQuote(tempFile)} ${shellQuote(APACHE_BAN_CONF_PATH)} && sudo -n chown root:root ${shellQuote(APACHE_BAN_CONF_PATH)} && sudo -n chmod 644 ${shellQuote(APACHE_BAN_CONF_PATH)}`);
  await execPromise(`sudo -n a2enconf ${shellQuote(APACHE_BAN_CONF_NAME)} >/dev/null 2>&1 || true`);

  const testResult = await execPromise('sudo -n apache2ctl configtest');
  const testOutput = `${testResult.stdout}${testResult.stderr}`;
  if (!testOutput.includes('Syntax OK')) {
    throw new Error(testOutput || 'Apache configuration test failed');
  }

  await execPromise(`sudo -n systemctl reload ${shellQuote(APACHE_SERVICE)}`);
}

// GET Apache status
router.get('/status', (req, res) => {
  exec(`systemctl is-active ${APACHE_SERVICE}`, (err, stdout, stderr) => {
    const status = stdout.trim();
    res.json({ success: true, status: status || 'unknown' });
  });
});

// POST Apache control (start, stop, restart, reload)
router.post('/control', (req, res) => {
  const { action } = req.body;
  const { runExecStream } = require('../utils/exec');
  const io = req.app.get('io');
  
  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action' });
  }
  
  const allowedActions = ['start', 'stop', 'restart', 'reload'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
  
  const cmd = `sudo systemctl ${action} ${APACHE_SERVICE}`;
  
  runExecStream(cmd, { action }, (err, result) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    
    res.json({ success: true, message: `Apache ${action}ed successfully` });
  }, io);
});

// GET Apache config files
router.get('/configs', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const availableDir = process.env.APACHE_SITES_AVAILABLE || '/etc/apache2/sites-available';
  const enabledDir = process.env.APACHE_SITES_ENABLED || '/etc/apache2/sites-enabled';
  
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
router.get('/logs', (req, res) => {
  const logFile = '/var/log/apache2/error.log';
  
  exec(`tail -n 50 ${logFile}`, (err, stdout, stderr) => {
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

// GET Apache access logs
router.get('/access-logs', async (req, res) => {
  try {
    const limit = Math.max(10, Math.min(Number.parseInt(req.query.limit || '60', 10) || 60, 200));
    const discoveredFiles = fs
      .readdirSync(APACHE_LOG_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (entry.name === 'access.log' || entry.name.endsWith('-access.log')))
      .map((entry) => path.join(APACHE_LOG_DIR, entry.name));

    const parsedEntries = [];

    await Promise.all(discoveredFiles.map((filePath) => new Promise((resolve) => {
      exec(`tail -n ${limit} ${shellQuote(filePath)}`, (err, stdout) => {
        if (!err && stdout) {
          stdout
            .split('\n')
            .filter((line) => line.trim())
            .forEach((line) => {
              parsedEntries.push(parseCombinedLogLine(line, path.basename(filePath)));
            });
        }

        resolve();
      });
    })));

    const sorted = parsedEntries.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    res.json({ success: true, logs: sorted.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, logs: [] });
  }
});

// GET banned IP entries
router.get('/ip-bans', (req, res) => {
  try {
    const entries = loadBanList();
    res.json({ success: true, bans: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, bans: [] });
  }
});

// POST ban IP
router.post('/ip-bans', async (req, res) => {
  const { ip, reason = '' } = req.body;

  if (!validateIp(ip)) {
    return res.status(400).json({ success: false, error: 'A valid IP address is required' });
  }

  try {
    const entries = loadBanList();
    const normalizedIp = ip.trim();

    if (!entries.some((entry) => entry.ip === normalizedIp)) {
      entries.push({
        ip: normalizedIp,
        reason: String(reason || '').trim(),
        bannedAt: new Date().toISOString()
      });

      saveBanList(entries);
      await applyBanConfig(entries);
    }

    res.json({ success: true, bans: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE unban IP
router.delete('/ip-bans/:ip', async (req, res) => {
  const { ip } = req.params;

  if (!validateIp(ip)) {
    return res.status(400).json({ success: false, error: 'A valid IP address is required' });
  }

  try {
    const normalizedIp = ip.trim();
    const entries = loadBanList().filter((entry) => entry.ip !== normalizedIp);

    saveBanList(entries);
    await applyBanConfig(entries);

    res.json({ success: true, bans: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Apache config test
router.get('/test', (req, res) => {
  exec(`sudo ${APACHE_SERVICE}ctl configtest`, (err, stdout, stderr) => {
    const output = stdout + stderr;
    const success = output.includes('Syntax OK');
    
    res.json({ 
      success, 
      message: output.trim(),
      details: output
    });
  });
});

// GET read config file content
router.get('/config/:filename', (req, res) => {
  const { filename } = req.params;
  const fs = require('fs');
  const availableDir = process.env.APACHE_SITES_AVAILABLE || '/etc/apache2/sites-available';
  const configPath = `${availableDir}/${filename}`;
  
  exec(`sudo cat ${configPath}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to read config file' });
    }
    res.json({ success: true, content: stdout, path: configPath });
  });
});

// POST save config file content
router.post('/config/:filename', (req, res) => {
  const { filename } = req.params;
  const { content } = req.body;
  const fs = require('fs');
  
  if (!content) {
    return res.status(400).json({ success: false, error: 'Content is required' });
  }
  
  const configPath = `/etc/apache2/sites-available/${filename}`;
  const tempFile = `/tmp/apache-config-${Date.now()}.conf`;
  
  try {
    // Write content to temp file
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // Move temp file to Apache directory with sudo
    const cmd = `sudo mv ${tempFile} ${configPath} && sudo chown root:root ${configPath} && sudo chmod 644 ${configPath}`;
    
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || 'Failed to save config file' });
      }
      
      // Test configuration after saving
      exec('sudo apache2ctl configtest', (testErr, testStdout, testStderr) => {
        const testOutput = testStdout + testStderr;
        const testSuccess = testOutput.includes('Syntax OK');
        
        res.json({ 
          success: true, 
          message: 'Config file saved successfully',
          configTest: {
            success: testSuccess,
            output: testOutput
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
