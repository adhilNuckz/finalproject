import React, { useState, useEffect } from 'react';
import { Play, Square, RefreshCw, Trash2, AlertCircle, CheckCircle, XCircle, Loader, Plus, X, FolderOpen, Folder, ChevronRight, Home } from 'lucide-react';

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
  const [currentPath, setCurrentPath] = useState(null);
  const [directoryContents, setDirectoryContents] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchProcesses();
    fetchServerPaths();
    const interval = setInterval(fetchProcesses, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchServerPaths = async () => {
    try {
      const response = await fetch(`${API_URL}/server/paths`);
      const data = await response.json();
      console.log('Server paths:', data);
      if (data.success) {
        // Check if we're in root, use /home instead
        const homePath = data.homeDir === '/root' ? '/home/kali' : data.homeDir;
        setCurrentPath(homePath);
      }
    } catch (err) {
      console.error('Error fetching server paths:', err);
      // Fallback to /home/kali if fetch fails
      setCurrentPath('/home/kali');
    }
  };

  const fetchDirectoryContents = async (path) => {
    setDirectoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: [path] })
      });
      const data = await response.json();
      console.log('Directory data:', data);
      console.log('Path:', path);
      if (data.success && data.result[path]?.success) {
        const allEntries = data.result[path].entries;
        console.log('All entries:', allEntries);
        // Filter directories and exclude hidden files (starting with .)
        const entries = allEntries
          .filter(e => {
            console.log('Entry:', e.name, 'isDirectory:', e.isDirectory, 'starts with dot:', e.name.startsWith('.'));
            return e.isDirectory && !e.name.startsWith('.');
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        console.log('Filtered entries:', entries);
        setDirectoryContents(entries);
      } else {
        console.error('Failed to load directory:', data);
        alert('Failed to load directory contents');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error loading directory: ' + err.message);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openDirectoryBrowser = () => {
    setShowDirectoryBrowser(true);
    if (currentPath) {
      fetchDirectoryContents(currentPath);
    }
  };

  const navigateToDirectory = (path) => {
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
        return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case 'stopped':
        return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      case 'stopping':
      case 'launching':
        return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`;
      case 'errored':
        return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      default:
        return `${base} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400`;
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading PM2 processes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchProcesses}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PM2 Process Manager</h2>
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
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {processes.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No PM2 processes running</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Start managing your Node.js applications with PM2</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">CPU</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Memory</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Uptime</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Restarts</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((proc) => (
                  <tr
                    key={proc.pm_id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-mono">
                      {proc.pm_id}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {proc.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
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
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {proc.monit?.cpu || 0}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {formatMemory(proc.monit?.memory)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {formatUptime(proc.pm2_env?.pm_uptime)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {proc.pm2_env?.restart_time || 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        {proc.pm2_env?.status === 'online' ? (
                          <>
                            <button
                              onClick={() => handleAction('reload', proc.pm_id, proc.name)}
                              disabled={actionLoading[`${proc.pm_id}-reload`]}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
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
                              className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors disabled:opacity-50"
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
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
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
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add PM2 Process</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProcess({ name: '', script: '', cwd: '' });
                  setAddError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProcess}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Process Name *
                  </label>
                  <input
                    type="text"
                    value={newProcess.name}
                    onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                    placeholder="my-app"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={addLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Unique name for your PM2 process
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Script/Command *
                  </label>
                  <input
                    type="text"
                    value={newProcess.script}
                    onChange={(e) => setNewProcess({ ...newProcess, script: e.target.value })}
                    placeholder="server.js or npm start"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={addLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Just the script file or command (e.g., server.js, app.js, npm start)
                  </p>
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Do NOT include "pm2 start" - just enter the script name!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={addLoading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openDirectoryBrowser}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      disabled={addLoading}
                      title="Browse server directories"
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Browse
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Directory where the script is located (leave empty for current directory)
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>Example:</strong> Name: "backend", Script: "server.js", Directory: "/home/kali/LOCALED/back"
                  </p>
                </div>
              </div>

              {addError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Browse Server Directories</h3>
              <button
                onClick={() => setShowDirectoryBrowser(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Path Display */}
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
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
                className="w-full mb-2 px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">..</span>
              </button>
            )}

            {/* Directory List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
              {directoryLoading ? (
                <div className="p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading directories...</p>
                </div>
              ) : directoryContents.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No subdirectories found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {directoryContents.map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <button
                        onClick={() => navigateToDirectory(item.path)}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <Folder className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                      </button>
                      <button
                        onClick={() => selectDirectory(item.path)}
                        className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => selectDirectory(currentPath)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Use Current Directory
              </button>
              <button
                onClick={() => setShowDirectoryBrowser(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
