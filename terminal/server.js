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
const io = new Server(server);

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
    socket.emit("output", data);
  });

  // When user sends command from frontend
  socket.on("input", (data) => {
    shell.write(data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
    shell.kill();
  });
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
