import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Copy, Download } from 'lucide-react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

export default function Terminal() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [lines, setLines] = useState([{ id: 1, type: 'output', content: 'Connecting to Linux Hosting Manager Terminal...', timestamp: new Date() }]);

  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { reconnectionAttempts: 5, timeout: 20000 });
    newSocket.on('connect', () => { setIsConnected(true); setLines(prev => [...prev, { id: Date.now(), type: 'output', content: '✅ Connected to webserver shell.', timestamp: new Date() }]); });
    newSocket.on('disconnect', () => { setIsConnected(false); setLines(prev => [...prev, { id: Date.now(), type: 'error', content: '❌ Disconnected from webserver shell.', timestamp: new Date() }]); });
    newSocket.on('connect_error', (error) => { setLines(prev => [...prev, { id: Date.now(), type: 'error', content: `Connection Error: ${error.message}. Please ensure the backend is running on ${SOCKET_SERVER_URL}.`, timestamp: new Date() }]); });
    newSocket.on('output', (data) => { const rawOutput = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); const newLines = rawOutput.split('\n').map((lineContent, index) => ({ id: Date.now() + index + Math.random(), type: lineContent.startsWith('bash:') || lineContent.includes('error') ? 'error' : 'output', content: lineContent, timestamp: new Date() })); setLines(prev => [...prev, ...newLines]); });
    setSocket(newSocket);
    return () => { newSocket.off('connect'); newSocket.off('disconnect'); newSocket.off('connect_error'); newSocket.off('output'); newSocket.close(); };
  }, []);

  const sendCommandToBackend = (command) => {
    const trimmedCommand = command.trim(); if (!trimmedCommand) return; if (!isConnected) { setLines(prev => [...prev, { id: Date.now(), type: 'error', content: `❌ Not connected. Cannot send command: ${trimmedCommand}`, timestamp: new Date() }]); return; }
    setLines(prev => [...prev, { id: Date.now(), type: 'input', content: trimmedCommand, timestamp: new Date() }]);
    socket.emit('input', trimmedCommand + '\r');
    if (trimmedCommand === 'clear') setLines([]);
  };

  const executeCommand = (command) => { sendCommandToBackend(command); };

  const handleKeyDown = (e) => { if (e.key === 'Enter') { executeCommand(currentInput); setCurrentInput(''); } };

  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [lines]);
  const focusInput = () => { inputRef.current?.focus(); };

  const copyToClipboard = () => { const terminalText = lines.map(line => line.content).join('\n'); navigator.clipboard.writeText(terminalText); };
  const downloadLog = () => { const terminalText = lines.map(line => `[${line.timestamp.toISOString()}] ${line.content}`).join('\n'); const blob = new Blob([terminalText], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `terminal-session-${new Date().toISOString().split('T')[0]}.log`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terminal <span className={`ml-3 text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>{isConnected ? 'LIVE' : 'DISCONNECTED'}</span></h1>
        <div className="flex items-center space-x-2">
          <button onClick={copyToClipboard} className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors" title="Copy Terminal Output"><Copy className="w-4 h-4 mr-2" />Copy</button>
          <button onClick={downloadLog} className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors" title="Download Session Log"><Download className="w-4 h-4 mr-2" />Download</button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}</button>
        </div>
      </div>

      <div className={`bg-gray-900 rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700"><div className="flex items-center"><TerminalIcon className="w-5 h-5 text-green-400 mr-2" /><span className="text-sm font-medium text-gray-300">Webserver Shell</span></div><div className="flex space-x-2"><div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div><div className="w-3 h-3 bg-yellow-500 rounded-full"></div><div className="w-3 h-3 bg-red-500 rounded-full"></div></div></div>

        <div className={`bg-black text-green-400 font-mono text-sm overflow-y-auto ${isFullscreen ? 'h-screen' : 'h-96'}`} ref={terminalRef} onClick={focusInput}>
          <div className="p-4 space-y-1">
            {lines.map(line => (<div key={line.id} className={`${line.type === 'input' ? 'text-cyan-400' : line.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{line.content}</div>))}
            <div className="flex items-center"><input ref={inputRef} type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-transparent border-none outline-none text-green-400 ml-0" autoFocus /><span className="animate-pulse">█</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[
          { cmd: 'ls -la', desc: 'List all files with details' }, { cmd: 'df -h', desc: 'Show disk usage' }, { cmd: 'ps aux', desc: 'Show all processes' }, { cmd: 'systemctl status apache2', desc: 'Check Apache status' }, { cmd: 'tail -f /var/log/access.log', desc: 'Monitor access logs' }, { cmd: 'top', desc: 'Show system processes' }
        ].map((item, index) => (<button key={index} onClick={() => { executeCommand(item.cmd); setCurrentInput(''); }} className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><div className="text-sm font-mono text-blue-600 dark:text-blue-400">{item.cmd}</div><div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</div></button>))}</div>
      </div>
    </div>
  );
}
