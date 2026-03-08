import React, { useState, useEffect } from 'react';
import { Play, Square, RefreshCw, Trash2, AlertCircle, CheckCircle, XCircle, Loader, Plus, X, FolderOpen, Folder, ChevronRight, Home } from 'lucide-react';
import { API_BASE_URL } from '../../config.js';

export default function PM2Manager() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProcess, setNewProcess] = useState({
    name: '',
    script: '',
    cwd: ''
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false);
  const [currentPath, setCurrentPath] = useState('/home/kali');
  const [directoryContents, setDirectoryContents] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetchProcesses();
    fetchServerPaths();
    const interval = setInterval(fetchProcesses, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchServerPaths = async () => {
    console.log('=== Fetching server paths...');
    try {
      const response = await fetch(`${API_URL}/server/paths`);
      const data = await response.json();
      console.log('=== Server paths response:', data);
      if (data.success) {
        // Check if we're in root, use /home instead
        const homePath = data.homeDir === '/root' ? '/home/kali' : data.homeDir;
        console.log('=== Setting currentPath to:', homePath);
        setCurrentPath(homePath);
      }
    } catch (err) {
      console.error('Error fetching server paths:', err);
      // Fallback to /home/kali if fetch fails
      console.log('=== Fallback: setting currentPath to /home/kali');
      setCurrentPath('/home/kali');
    }
  };

  const fetchDirectoryContents = async (path) => {
    setDirectoryLoading(true);
    console.log('=== Fetching directory contents for:', path);
    try {
      const response = await fetch(`${API_URL}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: [path] })
      });
      const data = await response.json();
      console.log('=== API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.result[path]) {
        console.log('=== Result for path:', data.result[path]);
        
        if (data.result[path].success) {
          const allEntries = data.result[path].entries;
          console.log('=== Total entries:', allEntries.length);
          
          // Filter directories and exclude hidden files (starting with .)
          const entries = allEntries
            .filter(e => {
              const isDir = e.isDirectory;
              const isHidden = e.name.startsWith('.');
              console.log(`  - ${e.name}: isDir=${isDir}, hidden=${isHidden}`);
              return isDir && !isHidden;
            })
            .map(e => ({
              ...e,
              path: e.path || `${path}/${e.name}` // Ensure path is set
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('=== Filtered directories:', entries.length, entries.map(e => e.name));
          setDirectoryContents(entries);
        } else {
          console.error('Directory read failed:', data.result[path].error);
          alert('Failed to read directory: ' + data.result[path].error);
        }
      } else {
        console.error('Invalid response structure:', data);
        alert('Failed to load directory contents');
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
      alert('Error loading directory: ' + err.message);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openDirectoryBrowser = () => {
    console.log('=== Opening directory browser, currentPath:', currentPath);
    setShowDirectoryBrowser(true);
    if (currentPath) {
      console.log('=== Calling fetchDirectoryContents with:', currentPath);
      fetchDirectoryContents(currentPath);
    } else {
      console.log('=== currentPath is null/undefined, not fetching');
    }
  };

  const navigateToDirectory = (path) => {
    if (!path) return;
    console.log('Navigating to:', path);
    setCurrentPath(path);
    fetchDirectoryContents(path);
  };

  const selectDirectory = (path) => {
    setNewProcess({ ...newProcess, cwd: path });
    setShowDirectoryBrowser(false);
  };

  const fetchProcesses = async () => {
    try {
      const response = await fetch(`${API_URL}/pm2/list`);
      const data = await response.json();
      if (data.success) {
        setProcesses(data.processes);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch PM2 processes');
      console.error('Error fetching PM2 processes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, processId, name) => {
    const actionKey = `${processId}-${action}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    console.log('PM2 Action:', { action, processId, name });

    try {
      const response = await fetch(`${API_URL}/pm2/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, processId })
      });

      const data = await response.json();
      console.log('PM2 Control response:', data);
      
      if (data.success) {
        // Wait a bit then refresh
        setTimeout(fetchProcesses, 1000);
      } else {
        alert(data.error || `Failed to ${action} process`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error(`Error ${action}ing process:`, err);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleAddProcess = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    if (!newProcess.name.trim() || !newProcess.script.trim()) {
      setAddError('Name and script are required');
      setAddLoading(false);
      return;
    }

    // Check if user accidentally included "pm2 start" in the script
    if (newProcess.script.trim().toLowerCase().startsWith('pm2 ')) {
      setAddError('Do not include "pm2 start" in the script field. Just enter the script name (e.g., "server.js")');
      setAddLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/pm2/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProcess)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowAddModal(false);
        setNewProcess({ name: '', script: '', cwd: '' });
        setTimeout(fetchProcesses, 1000);
      } else {
        setAddError(data.error || 'Failed to start process');
      }
    } catch (err) {
      setAddError('Network error. Please try again.');
      console.error('Error adding process:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'stopping':
      case 'launching':
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'errored':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'online':
        return `${base} bg-green-900/30 text-green-400`;
      case 'stopped':
        return `${base} bg-red-900/30 text-red-400`;
      case 'stopping':
      case 'launching':
        return `${base} bg-yellow-900/30 text-yellow-400`;
      case 'errored':
        return `${base} bg-red-900/30 text-red-400`;
      default:
        return `${base} bg-[#1a1a1a] bg-[#0e0e0e]/30 text-gray-200 text-gray-500`;
    }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
        <div className="text-center py-8 text-gray-500">
          Loading PM2 processes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchProcesses}
            className="mt-4 px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">PM2 Process Manager</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Process
            </button>
            <button
              onClick={fetchProcesses}
              className="flex items-center px-3 py-2 bg-lava-600 hover:bg-lava-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {processes.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No PM2 processes running</p>
            <p className="text-sm text-gray-400">Start managing your Node.js applications with PM2</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">CPU</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Memory</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Uptime</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Restarts</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((proc) => (
                  <tr
                    key={proc.pm_id}
                    className="border-b border-gray-100 border-[#1f1f1f] hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-100 font-mono">
                      {proc.pm_id}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-100">
                          {proc.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {proc.pm2_env?.pm_cwd || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={getStatusBadge(proc.pm2_env?.status)}>
                          {proc.pm2_env?.status}
                        </span>
                        {getStatusIcon(proc.pm2_env?.status)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-100">
                      {proc.monit?.cpu || 0}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-100">
                      {formatMemory(proc.monit?.memory)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-100">
                      {formatUptime(proc.pm2_env?.pm_uptime)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-100">
                      {proc.pm2_env?.restart_time || 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        {proc.pm2_env?.status === 'online' ? (
                          <>
                            <button
                              onClick={() => handleAction('reload', proc.pm_id, proc.name)}
                              disabled={actionLoading[`${proc.pm_id}-reload`]}
                              className="p-1.5 text-lava-500 hover:bg-lava-900/20 rounded transition-colors disabled:opacity-50"
                              title="Reload"
                            >
                              {actionLoading[`${proc.pm_id}-reload`] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleAction('stop', proc.pm_id, proc.name)}
                              disabled={actionLoading[`${proc.pm_id}-stop`]}
                              className="p-1.5 text-orange-600 hover:bg-orange-900/20 rounded transition-colors disabled:opacity-50"
                              title="Stop"
                            >
                              {actionLoading[`${proc.pm_id}-stop`] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAction('restart', proc.pm_id, proc.name)}
                            disabled={actionLoading[`${proc.pm_id}-restart`]}
                            className="p-1.5 text-green-600 hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                            title="Start"
                          >
                            {actionLoading[`${proc.pm_id}-restart`] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${proc.name}?`)) {
                              handleAction('delete', proc.pm_id, proc.name);
                            }
                          }}
                          disabled={actionLoading[`${proc.pm_id}-delete`]}
                          className="p-1.5 text-red-400 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {actionLoading[`${proc.pm_id}-delete`] ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Process Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-100">Add PM2 Process</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProcess({ name: '', script: '', cwd: '' });
                  setAddError('');
                }}
                className="text-gray-400 hover:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProcess}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Process Name *
                  </label>
                  <input
                    type="text"
                    value={newProcess.name}
                    onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                    placeholder="my-app"
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg focus:ring-2 focus:ring-lava-500 focus:border-transparent bg-[#1a1a1a] text-gray-100"
                    disabled={addLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Unique name for your PM2 process
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Script/Command *
                  </label>
                  <input
                    type="text"
                    value={newProcess.script}
                    onChange={(e) => setNewProcess({ ...newProcess, script: e.target.value })}
                    placeholder="server.js or npm start"
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg focus:ring-2 focus:ring-lava-500 focus:border-transparent bg-[#1a1a1a] text-gray-100"
                    disabled={addLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Just the script file or command (e.g., server.js, app.js, npm start)
                  </p>
                  <p className="mt-1 text-xs text-yellow-600">
                    ⚠️ Do NOT include "pm2 start" - just enter the script name!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Working Directory (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={newProcess.cwd}
                        onChange={(e) => setNewProcess({ ...newProcess, cwd: e.target.value })}
                        placeholder="/path/to/project"
                        className="w-full pl-10 pr-4 py-2 border border-[#252525] rounded-lg focus:ring-2 focus:ring-lava-500 focus:border-transparent bg-[#1a1a1a] text-gray-100"
                        disabled={addLoading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openDirectoryBrowser}
                      className="px-4 py-2 bg-gray-600 hover:bg-[#1a1a1a] text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      disabled={addLoading}
                      title="Browse server directories"
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Browse
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Directory where the script is located (leave empty for current directory)
                  </p>
                </div>

                <div className="bg-lava-900/20 bg-lava-900/20 border border-lava-600/30 rounded-lg p-3">
                  <p className="text-xs text-lava-300">
                    <strong>Example:</strong> Name: "backend", Script: "server.js", Directory: "/home/kali/LOCALED/back"
                  </p>
                </div>
              </div>

              {addError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-600">{addError}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewProcess({ name: '', script: '', cwd: '' });
                    setAddError('');
                  }}
                  className="flex-1 px-4 py-2 border border-[#252525] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={addLoading}
                >
                  {addLoading ? 'Starting...' : 'Start Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Browser Modal */}
      {showDirectoryBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-100">Browse Server Directories</h3>
              <button
                onClick={() => setShowDirectoryBrowser(false)}
                className="text-gray-400 hover:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Path Display */}
            <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
              <div className="flex items-center text-sm text-gray-300">
                <Home className="w-4 h-4 mr-2" />
                <span className="font-mono">{currentPath}</span>
              </div>
            </div>

            {/* Parent Directory Navigation */}
            {currentPath && currentPath !== '/' && (
              <button
                onClick={() => {
                  const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
                  navigateToDirectory(parentPath);
                }}
                className="w-full mb-2 px-4 py-2 text-left flex items-center space-x-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">..</span>
              </button>
            )}

            {/* Directory List */}
            <div className="border border-[#1f1f1f] rounded-lg max-h-96 overflow-y-auto">
              {directoryLoading ? (
                <div className="p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-lava-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading directories...</p>
                </div>
              ) : directoryContents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No subdirectories found</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1f1f1f]">
                  {directoryContents.map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a]/50 transition-colors"
                    >
                      <button
                        onClick={() => navigateToDirectory(item.path)}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <Folder className="w-5 h-5 text-lava-400" />
                        <span className="text-sm text-gray-100">{item.name}</span>
                      </button>
                      <button
                        onClick={() => selectDirectory(item.path)}
                        className="ml-4 px-3 py-1 bg-lava-600 hover:bg-lava-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#1f1f1f]">
              <button
                onClick={() => selectDirectory(currentPath)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Use Current Directory
              </button>
              <button
                onClick={() => setShowDirectoryBrowser(false)}
                className="px-4 py-2 border border-[#252525] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
