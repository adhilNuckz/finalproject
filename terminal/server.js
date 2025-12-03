import 'dotenv/config';
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
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];



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

io.on("connection", (socket) => {
  console.log("✅ Client connected");

  // Start a bash shell
  const shell = spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Send shell output to frontend
shell.onData((data) => {
  socket.emit("output", data); // send raw data
});




  // When user sends command from frontend
  socket.on("input", (data) => {
    try {
      // write raw data to the pty; data may be single keys or full commands with newline
      shell.write(data);
    } catch (e) {
      console.warn('Failed to write to shell', e);
    }
  });

  // handle resize from client
  socket.on('resize', ({ cols, rows }) => {
    try {
      shell.resize(Math.max(1, cols), Math.max(1, rows));
    } catch (e) {
      console.warn('Failed to resize pty', e);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
    try { shell.kill(); } catch (e) {}
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () =>
  console.log(`🚀 Terminal server running at http://${HOST}:${PORT}`)
);
