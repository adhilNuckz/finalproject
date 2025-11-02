const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// Get server IP address
router.get('/ip', (req, res) => {
  exec('hostname -I', (err, stdout) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const ip = stdout.trim().split(' ')[0];
    res.json({ success: true, ip });
  });
});

// Get allowed server paths
router.get('/paths', (req, res) => {
  const os = require('os');
  const ALLOWED_ROOTS = ['/var/www/html', os.homedir(), '/home'];
  res.json({ success: true, paths: ALLOWED_ROOTS });
});

// Run allowed commands
router.post('/run', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ success: false, error: 'command required' });
  
  // Whitelist of allowed commands for security
  const allowedCommands = [
    'hostname -I',
    'uptime',
    'df -h',
    'free -m',
    'systemctl status apache2',
    'systemctl status php*-fpm',
    'certbot certificates'
  ];
  
  const isAllowed = allowedCommands.some(cmd => command.startsWith(cmd));
  if (!isAllowed) {
    return res.status(403).json({ success: false, error: 'command not allowed' });
  }
  
  exec(command, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: err.message, stderr });
    res.json({ success: true, stdout, stderr });
  });
});

module.exports = router;
