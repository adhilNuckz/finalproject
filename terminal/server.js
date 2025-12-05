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
// Allow local dev origins (Vite dev server + localhost)
const allowedOrigins = [
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
  socket.on("create-session", ({ sessionId }) => {
    console.log(`Creating session: ${sessionId}`);
    
    const shell = spawn("bash", [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });

    // Store session
    sessions.set(sessionId, shell);

    // Send shell output to frontend
    shell.onData((data) => {
      socket.emit("output", { sessionId, data });
    });

    shell.on("exit", () => {
      console.log(`Session ${sessionId} exited`);
      sessions.delete(sessionId);
      socket.emit("session-closed", { sessionId });
    });

    socket.emit("session-created", { sessionId });
  });

  // When user sends command from frontend
  socket.on("input", ({ sessionId, data }) => {
    const shell = sessions.get(sessionId);
    if (!shell) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }
    
    try {
      shell.write(data);
    } catch (e) {
      console.warn('Failed to write to shell', e);
    }
  });

  // Handle resize from client
  socket.on('resize', ({ sessionId, cols, rows }) => {
    const shell = sessions.get(sessionId);
    if (!shell) return;
    
    try {
      shell.resize(Math.max(1, cols), Math.max(1, rows));
    } catch (e) {
      console.warn('Failed to resize pty', e);
    }
  });

  // Close a specific session
  socket.on("close-session", ({ sessionId }) => {
    const shell = sessions.get(sessionId);
    if (shell) {
      try {
        shell.kill();
      } catch (e) {
        console.warn('Failed to kill shell', e);
      }
      sessions.delete(sessionId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
    // Kill all sessions for this socket
    sessions.forEach((shell, sessionId) => {
      try {
        shell.kill();
      } catch (e) {
        console.warn(`Failed to kill session ${sessionId}`, e);
      }
    });
    sessions.clear();
    terminalSessions.delete(socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
