import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Copy, Download } from 'lucide-react';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export default function Terminal() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 1,
      type: 'output',
      content: 'Linux Hosting Manager Terminal v1.0',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'output',
      content: 'Type "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [currentDir, setCurrentDir] = useState('/var/www');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock file system for demonstration
  const mockFiles = {
    '/': ['var', 'etc', 'home', 'usr'],
    '/var': ['www', 'log', 'cache'],
    '/var/www': ['example.com', 'blog.example.com', 'api.example.com'],
    '/var/www/example.com': ['index.html', 'style.css', 'script.js', 'images'],
    '/var/log': ['access.log', 'error.log', 'system.log']
  };

  const mockCommands = {
    help: () => [
      'Available commands:',
      '  ls [path]          - List directory contents',
      '  cd <path>          - Change directory',
      '  pwd                - Print working directory',
      '  cat <file>         - Display file contents',
      '  ps                 - Show running processes',
      '  df -h              - Show disk usage',
      '  top                - Show system processes',
      '  systemctl status   - Show service status',
      '  tail <file>        - Show last lines of file',
      '  clear              - Clear terminal',
      '  help               - Show this help'
    ],
    ls: (args: string[]) => {
      const path = args[0] || currentDir;
      const files = mockFiles[path as keyof typeof mockFiles];
      return files ? files : [`ls: cannot access '${path}': No such file or directory`];
    },
    pwd: () => [currentDir],
    cd: (args: string[]) => {
      const path = args[0];
      if (!path) return [currentDir];
      if (path === '..') {
        const parts = currentDir.split('/');
        parts.pop();
        const newDir = parts.join('/') || '/';
        setCurrentDir(newDir);
        return [];
      }
      const fullPath = currentDir === '/' ? `/${path}` : `${currentDir}/${path}`;
      if (mockFiles[fullPath as keyof typeof mockFiles]) {
        setCurrentDir(fullPath);
        return [];
      }
      return [`cd: no such file or directory: ${path}`];
    },
    cat: (args: string[]) => {
      const file = args[0];
      if (!file) return ['cat: missing file argument'];
      
      // Mock file contents
      const contents = {
        'index.html': ['<!DOCTYPE html>', '<html>', '<head><title>Example</title></head>', '<body><h1>Welcome</h1></body>', '</html>'],
        'style.css': ['body {', '  font-family: Arial, sans-serif;', '  margin: 0;', '  padding: 20px;', '}'],
        'access.log': ['192.168.1.1 - - [25/Jan/2024:10:00:00 +0000] "GET / HTTP/1.1" 200 1234', '192.168.1.2 - - [25/Jan/2024:10:01:00 +0000] "GET /about HTTP/1.1" 200 567'],
        'error.log': ['[Thu Jan 25 10:00:01 2024] [error] [client 192.168.1.1] File does not exist: /var/www/favicon.ico']
      };
      
      return contents[file as keyof typeof contents] || [`cat: ${file}: No such file or directory`];
    },
    ps: () => [
      'PID   TTY      TIME CMD',
      '1     ?        00:00:01 systemd',
      '123   ?        00:00:00 apache2',
      '456   ?        00:00:00 mysql',
      '789   ?        00:00:00 nginx'
    ],
    'df': (args: string[]) => [
      'Filesystem      Size  Used Avail Use% Mounted on',
      '/dev/sda1        20G  12G  7.2G  63% /',
      'tmpfs           2.0G     0  2.0G   0% /dev/shm',
      '/dev/sda2       100G  45G   50G  48% /var'
    ],
    top: () => [
      'PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND',
      '123 www-data  20   0  123456   1234    123 S   2.3  1.4   0:12.34 apache2',
      '456 mysql     20   0  234567   2345    234 S   1.8  2.1   0:23.45 mysqld',
      '789 root      20   0   12345    123     12 S   0.2  0.1   0:01.23 systemd'
    ],
    systemctl: (args: string[]) => {
      if (args[0] === 'status') {
        return [
          '● apache2.service - The Apache HTTP Server',
          '   Loaded: loaded (/lib/systemd/system/apache2.service; enabled)',
          '   Active: active (running) since Thu 2024-01-25 10:00:00 UTC; 2h 30min ago',
          '   Main PID: 123 (apache2)',
          '   Status: "Running"'
        ];
      }
      return ['Usage: systemctl status [service]'];
    },
    tail: (args: string[]) => {
      const file = args[0];
      if (!file) return ['tail: missing file argument'];
      return [
        'Last 10 lines of ' + file + ':',
        '[2024-01-25 12:28:45] INFO: Server started successfully',
        '[2024-01-25 12:29:12] INFO: New connection from 192.168.1.100',
        '[2024-01-25 12:29:45] INFO: Request processed in 0.23s'
      ];
    },
    clear: () => {
      setLines([]);
      return [];
    }
  };

  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add input to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    // Add command to terminal
    const commandLine: TerminalLine = {
      id: Date.now(),
      type: 'input',
      content: `root@server:${currentDir}$ ${trimmedCommand}`,
      timestamp: new Date()
    };

    const [cmd, ...args] = trimmedCommand.split(' ');
    let output: string[] = [];

    if (mockCommands[cmd as keyof typeof mockCommands]) {
      output = mockCommands[cmd as keyof typeof mockCommands](args);
    } else {
      output = [`bash: ${cmd}: command not found`];
    }

    const outputLines: TerminalLine[] = output.map((line, index) => ({
      id: Date.now() + index + 1,
      type: line.startsWith('bash:') || line.includes('error') || line.includes('Error') ? 'error' : 'output',
      content: line,
      timestamp: new Date()
    }));

    if (cmd !== 'clear') {
      setLines(prev => [...prev, commandLine, ...outputLines]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const copyToClipboard = () => {
    const terminalText = lines.map(line => line.content).join('\n');
    navigator.clipboard.writeText(terminalText);
  };

  const downloadLog = () => {
    const terminalText = lines.map(line => 
      `[${line.timestamp.toISOString()}] ${line.content}`
    ).join('\n');
    
    const blob = new Blob([terminalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-session-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when clicking terminal
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Terminal
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Copy Terminal Output"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </button>
          <button
            onClick={downloadLog}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Download Session Log"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button> 
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={`bg-gray-900 rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center">
            <TerminalIcon className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-sm font-medium text-gray-300">
              root@server:{currentDir}
            </span>
          </div>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div 
          className={`bg-black text-green-400 font-mono text-sm overflow-y-auto ${isFullscreen ? 'h-screen' : 'h-96'}`}
          ref={terminalRef}
          onClick={focusInput}
        >
          <div className="p-4 space-y-1">
            {lines.map(line => (
              <div 
                key={line.id} 
                className={`${
                  line.type === 'input' 
                    ? 'text-cyan-400' 
                    : line.type === 'error' 
                    ? 'text-red-400' 
                    : 'text-green-400'
                }`}
              >
                {line.content}
              </div>
            ))}
            
            <div className="flex items-center">
              <span className="text-cyan-400">root@server:{currentDir}$ </span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-green-400 ml-1"
                autoFocus
              />
              <span className="animate-pulse">█</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Commands
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { cmd: 'ls -la', desc: 'List all files with details' },
            { cmd: 'df -h', desc: 'Show disk usage' },
            { cmd: 'ps aux', desc: 'Show all processes' },
            { cmd: 'systemctl status apache2', desc: 'Check Apache status' },
            { cmd: 'tail -f /var/log/access.log', desc: 'Monitor access logs' },
            { cmd: 'top', desc: 'Show system processes' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                executeCommand(item.cmd);
                setCurrentInput('');
              }}
              className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="text-sm font-mono text-blue-600 dark:text-blue-400">
                {item.cmd}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}