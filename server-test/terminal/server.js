import express from "express";
import http from "http";
import { Server } from "socket.io";
import { spawn } from "node-pty";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Allow configured origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];



function stripAnsiCodes(str) {
  return str.replace(
    /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
    ''
  );
}



const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (curl, server-side)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, "public")));

// Store terminal sessions per socket
const terminalSessions = new Map();

io.on("connection", (socket) => {
  console.log("✅ Client connected");
  
  // Store sessions for this socket
  const sessions = new Map();
  terminalSessions.set(socket.id, sessions);

  // Create a new terminal session
  socket.on("create-session", ({ sessionId, cwd }) => {
    console.log(`Creating session: ${sessionId}${cwd ? ` (cwd: ${cwd})` : ''}`);
    
    const sessionCwd = cwd || process.env.DEFAULT_CWD || process.env.HOME;
    const shell = process.env.DEFAULT_SHELL || "bash";
    
    const ptyProcess = spawn(shell, [], {
    
    const ptyProcess = spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: sessionCwd,
      env: { ...process.env, HOME: process.env.HOME },
    });

    // Force cd into the target directory in case .bashrc overrides cwd
    if (cwd) {
      ptyProcess.write(`cd ${cwd}\r`);
    }

    // Store session
    sessions.set(sessionId, ptyProcess);

    // Send shell output to frontend
    ptyProcess.onData((data) => {
      socket.emit("output", { sessionId, data });
    });

    ptyProcess.on("exit", () => {
      console.log(`Session ${sessionId} exited`);
      sessions.delete(sessionId);
      socket.emit("session-closed", { sessionId });
    });

    socket.emit("session-created", { sessionId });
  });

  // When user sends command from frontend
  socket.on("input", ({ sessionId, data }) => {
    const ptyProcess = sessions.get(sessionId);
    if (!ptyProcess) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }
    
    try {
      ptyProcess.write(data);
    } catch (e) {
      console.warn('Failed to write to shell', e);
    }
  });

  // Handle resize from client
  socket.on('resize', ({ sessionId, cols, rows }) => {
    const ptyProcess = sessions.get(sessionId);
    if (!ptyProcess) return;
    const ptyProcess = sessions.get(sessionId);
    if (!ptyProcess) return;
    
    try {
      ptyProcess.resize(Math.max(1, cols), Math.max(1, rows));
    } catch (e) {
      console.warn('Failed to resize pty', e);
    }
  });

  // Close a specific session
  socket.on("close-session", ({ sessionId }) => {
    const ptyProcess = sessions.get(sessionId);
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch (e) {
        console.warn('Failed to kill shell', e);
      }
      sessions.delete(sessionId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
    // Kill all sessions for this socket
    sessions.forEach((ptyProcess, sessionId) => {
      try {
        ptyProcess.kill();
      } catch (e) {
        console.warn(`Failed to kill session ${sessionId}`, e);
      }
    });
    sessions.clear();
    terminalSessions.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () =>
  console.log(`🚀 Terminal server running at http://${HOST}:${PORT}`)
);
