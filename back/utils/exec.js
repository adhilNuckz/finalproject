const { exec, spawn } = require("child_process");

// Utility to run shell commands
function runExec(cmd, res) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });
    res.json({ success: true, output: stdout || "Done" });
  });
}

// Stream execution and broadcast output via socket.io, then call callback on finish
function runExecStream(cmd, meta = {}, callback, io) {
  const child = spawn('bash', ['-lc', cmd], { env: process.env });
  
  child.stdout.on('data', (chunk) => {
    if (io) io.emit('site:action-output', { ...meta, type: 'stdout', chunk: chunk.toString() });
  });
  
  child.stderr.on('data', (chunk) => {
    if (io) io.emit('site:action-output', { ...meta, type: 'stderr', chunk: chunk.toString() });
  });
  
  child.on('close', (code) => {
    if (io) io.emit('site:action-output', { ...meta, type: 'close', code });
    if (callback) callback(null, { code });
  });
  
  child.on('error', (err) => {
    if (callback) callback(err);
  });
}

module.exports = {
  runExec,
  runExecStream
};
