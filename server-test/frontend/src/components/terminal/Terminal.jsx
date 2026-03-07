import React, { useState, useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { Plus, X, Download } from "lucide-react";
import io from "socket.io-client";
import "xterm/css/xterm.css";

const SOCKET_SERVER_URL = "http://localhost:3000";

export default function Terminal() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const socketRef = useRef(null);
  const terminalsRef = useRef(new Map()); // sessionId -> { term, fitAddon, containerRef }

  useEffect(() => {
    // Initialize Socket.IO
    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    let initialSessionCreated = false;

    socket.on("connect", () => {
      console.log("Connected to terminal server");
      // Create first session on connect
      if (!initialSessionCreated) {
        initialSessionCreated = true;
        const sessionId = `session-${Date.now()}`;
        const newSession = {
          id: sessionId,
          name: `Terminal 1`,
          created: new Date(),
        };
        setSessions([newSession]);
        setActiveSessionId(sessionId);
        socket.emit("create-session", { sessionId });
      }
    });

    socket.on("session-created", ({ sessionId }) => {
      console.log(`Session ${sessionId} created`);
    });

    socket.on("output", ({ sessionId, data }) => {
      const termData = terminalsRef.current.get(sessionId);
      if (termData && termData.term) {
        termData.term.write(data);
      }
    });

    socket.on("session-closed", ({ sessionId }) => {
      // Close terminal
      const termData = terminalsRef.current.get(sessionId);
      if (termData && termData.term) {
        termData.term.dispose();
      }
      terminalsRef.current.delete(sessionId);

      // Update sessions list
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        
        // If closing active session, switch to another
        setActiveSessionId((currentActive) => {
          if (sessionId === currentActive && filtered.length > 0) {
            return filtered[0].id;
          } else if (filtered.length === 0) {
            return null;
          }
          return currentActive;
        });
        
        return filtered;
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from terminal server");
    });

    return () => {
      // Cleanup all terminals
      terminalsRef.current.forEach((termData) => {
        if (termData.term) {
          termData.term.dispose();
        }
      });
      socket.disconnect();
    };
  }, []);

  const createNewSession = () => {
    const sessionId = `session-${Date.now()}`;
    const newSession = {
      id: sessionId,
      name: `Terminal ${sessions.length + 1}`,
      created: new Date(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(sessionId);

    // Tell server to create session
    if (socketRef.current) {
      socketRef.current.emit("create-session", { sessionId });
    }
  };

  const closeSession = (sessionId) => {
    // Close terminal
    const termData = terminalsRef.current.get(sessionId);
    if (termData && termData.term) {
      termData.term.dispose();
    }
    terminalsRef.current.delete(sessionId);

    // Update sessions list
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      
      // If closing active session, switch to another
      if (sessionId === activeSessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveSessionId(null);
      }
      
      return filtered;
    });

    // Tell server to close session
    if (socketRef.current) {
      socketRef.current.emit("close-session", { sessionId });
    }
  };

  const downloadSessionLog = (sessionId) => {
    const termData = terminalsRef.current.get(sessionId);
    if (!termData || !termData.term) return;

    const term = termData.term;
    const buffer = term.buffer.active;
    let content = "";

    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        content += line.translateToString(true) + "\n";
      }
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-${sessionId}-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const initializeTerminal = (containerRef, sessionId) => {
    if (!containerRef || terminalsRef.current.has(sessionId)) return;

    const term = new XTerm({
      fontFamily: "monospace",
      fontSize: 14,
      cursorBlink: true,
      theme: {
        background: "#0a0a0a",
        foreground: "#00ff66",
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef);
    
    setTimeout(() => {
      fitAddon.fit();
      // Send initial resize
      if (socketRef.current) {
        socketRef.current.emit("resize", {
          sessionId,
          cols: term.cols,
          rows: term.rows,
        });
      }
    }, 100);

    term.writeln("🌐 Connecting to remote shell...\r\n");

    // Handle user input
    term.onData((data) => {
      if (socketRef.current) {
        socketRef.current.emit("input", { sessionId, data });
      }
    });

    // Store terminal data
    terminalsRef.current.set(sessionId, {
      term,
      fitAddon,
      containerRef,
    });

    // Handle resize
    const handleResize = () => {
      if (terminalsRef.current.has(sessionId)) {
        const termData = terminalsRef.current.get(sessionId);
        termData.fitAddon.fit();
        if (socketRef.current) {
          socketRef.current.emit("resize", {
            sessionId,
            cols: termData.term.cols,
            rows: termData.term.rows,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Bar */}
      <div className="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer transition-colors ${
              activeSessionId === session.id
                ? "bg-gray-800 text-green-400"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800"
            }`}
            onClick={() => setActiveSessionId(session.id)}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {session.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadSessionLog(session.id);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Download session log"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              className="p-1 hover:bg-red-600 rounded transition-colors"
              title="Close session"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Add New Session Button */}
        <button
          onClick={createNewSession}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-green-400 transition-colors whitespace-nowrap"
          title="New terminal session"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Session</span>
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative bg-black">
        {sessions.map((session) => (
          <div
            key={session.id}
            ref={(ref) => {
              if (ref && session.id === activeSessionId) {
                initializeTerminal(ref, session.id);
              }
            }}
            style={{
              display: activeSessionId === session.id ? "block" : "none",
              height: "100%",
              width: "100%",
              padding: "10px",
            }}
          />
        ))}
        
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No terminal sessions</p>
              <button
                onClick={createNewSession}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
