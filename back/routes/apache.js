const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// GET Apache status
router.get('/status', (req, res) => {
  exec('systemctl is-active apache2', (err, stdout, stderr) => {
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
  
  const cmd = `sudo systemctl ${action} apache2`;
  
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
router.get('/logs', (req, res) => {
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
router.get('/test', (req, res) => {
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

module.exports = router;
