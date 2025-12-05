const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { runExecStream } = require('../utils/exec');

// GET all PM2 processes
router.get('/list', (req, res) => {
  exec('/usr/bin/pm2 jlist', (err, stdout, stderr) => {
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
router.post('/control', (req, res) => {
  const { action, processId } = req.body;
  const io = req.app.get('io');
  
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
      exec('/usr/bin/pm2 jlist', (err, stdout) => {
        if (!err) {
          try {
            const processes = JSON.parse(stdout);
            if (io) io.emit('pm2:updated', processes);
          } catch (e) {
            console.warn('Failed to emit PM2 update', e);
          }
        }
      });
    }, 500);
    
    res.json({ success: true, message: `Process ${action}ed successfully` });
  }, io);
});

// POST start new PM2 process
router.post('/start', (req, res) => {
  const { name, script, cwd } = req.body;
  const { runExec } = require('../utils/exec');
  
  if (!name || !script) {
    return res.status(400).json({ success: false, error: 'Missing name or script' });
  }
  
  const cwdParam = cwd ? `--cwd ${cwd}` : '';
  const cmd = `pm2 start ${script} --name ${name} ${cwdParam}`;
  
  runExec(cmd, res);
});

module.exports = router;
