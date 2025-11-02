import React, { useState, useEffect } from 'react';
import { Server, Play, Square, RefreshCw, RotateCcw, CheckCircle, XCircle, AlertCircle, FileText, Terminal } from 'lucide-react';

export default function ApacheConfig() {
  const [status, setStatus] = useState('checking');
  const [logs, setLogs] = useState('');
  const [configs, setConfigs] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchConfigs();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/apache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const data = await response.json();
      if (data.success) {
        // Parse status from output
        const isActive = data.output.includes('active (running)');
        setStatus(isActive ? 'running' : 'stopped');
      } else {
        setStatus('stopped');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setStatus('error');
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/apache/logs`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogs('Failed to fetch logs');
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await fetch(`${API_URL}/sites`);
      const data = await response.json();
      if (data.success) {
        setConfigs(data.sites);
      }
    } catch (err) {
      console.error('Error fetching configs:', err);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/apache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          fetchStatus();
          fetchLogs();
        }, 1000);
      } else {
        alert('Action failed: ' + (data.error || 'unknown'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigTest = async () => {
    setActionLoading(true);
    setTestResult(null);
    try {
      const response = await fetch(`${API_URL}/apache/configtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            Running
          </span>
        );
      case 'stopped':
        return (
          <span className="flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            <XCircle className="w-4 h-4 mr-1" />
            Stopped
          </span>
        );
      case 'checking':
        return (
          <span className="flex items-center px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            Checking...
          </span>
        );
      default:
        return (
          <span className="flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
            <AlertCircle className="w-4 h-4 mr-1" />
            Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apache Configuration</h1>
        <button
          onClick={() => {
            fetchStatus();
            fetchLogs();
            fetchConfigs();
          }}
          className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </button>
      </div>

      {/* Apache Status & Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apache Server</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control and monitor Apache HTTP Server</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading || status === 'running'}
            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={actionLoading || status === 'stopped'}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </button>
          <button
            onClick={() => handleAction('restart')}
            disabled={actionLoading}
            className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Restart
          </button>
          <button
            onClick={() => handleAction('reload')}
            disabled={actionLoading || status !== 'running'}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reload
          </button>
        </div>

        {/* Config Test Button */}
        <div className="mt-4">
          <button
            onClick={handleConfigTest}
            disabled={actionLoading}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Run Configuration Test
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-start space-x-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${testResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {testResult.success ? 'Configuration Test Passed' : 'Configuration Test Failed'}
                </p>
                {testResult.output && (
                  <pre className="mt-2 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-mono">
                    {testResult.output}
                  </pre>
                )}
                {testResult.error && (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">{testResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Site Configs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Site Configurations</h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{configs.length} sites</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {configs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No site configurations found</p>
          ) : (
            configs.map((config, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{config.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.domain}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  config.status === 'enabled' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                }`}>
                  {config.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apache Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Apache Logs (Last 20 lines)</h2>
          </div>
          <button
            onClick={fetchLogs}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Refresh
          </button>
        </div>
        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {logs || 'No logs available'}
          </pre>
        </div>
      </div>
    </div>
  );
}
