const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const os = require('os');

// Get real-time server stats
router.get('/stats', (req, res) => {
  try {
    // CPU Usage
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);

    // Uptime
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    // Disk usage via shell command
    exec("df -h / | tail -1 | awk '{print $3, $2, $5}'", (err, stdout) => {
      let diskUsed = '0 GB', diskTotal = '0 GB', diskPercent = 0;
      
      if (!err && stdout) {
        const parts = stdout.trim().split(' ');
        diskUsed = parts[0] || '0G';
        diskTotal = parts[1] || '0G';
        diskPercent = parseInt(parts[2]) || 0;
      }

      res.json({
        success: true,
        stats: {
          cpu: {
            usage: cpuUsage,
            cores: cpus.length
          },
          memory: {
            used: (usedMem / (1024 ** 3)).toFixed(2),
            total: (totalMem / (1024 ** 3)).toFixed(2),
            percentage: memUsage
          },
          disk: {
            used: diskUsed,
            total: diskTotal,
            percentage: diskPercent
          },
          uptime: {
            seconds: uptime,
            formatted: uptimeStr
          },
          timestamp: Date.now()
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
  res.json({ 
    success: true, 
    paths: ALLOWED_ROOTS,
    allowedRoots: ALLOWED_ROOTS,
    homeDir: os.homedir(),
    username: os.userInfo().username
  });
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
