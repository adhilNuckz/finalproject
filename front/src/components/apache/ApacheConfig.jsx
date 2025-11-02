import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Power, 
  RotateCw, 
  Square, 
  PlayCircle, 
  CheckCircle, 
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function ApacheConfig() {
  const [apacheStatus, setApacheStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [configFiles, setConfigFiles] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchApacheStatus();
    fetchApacheLogs();
    fetchConfigFiles();
  }, []);

  const fetchApacheStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/apache/status');
      const data = await response.json();
      setApacheStatus(data.status);
    } catch (error) {
      console.error('Error fetching Apache status:', error);
      setApacheStatus('error');
    }
  };

  const fetchApacheLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/apache/logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching Apache logs:', error);
    }
  };

  const fetchConfigFiles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/apache/configs');
      const data = await response.json();
      setConfigFiles(data.configs || []);
    } catch (error) {
      console.error('Error fetching config files:', error);
    }
  };

  const handleApacheControl = async (action) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/apache/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchApacheStatus();
        await fetchApacheLogs();
      }
    } catch (error) {
      console.error(`Error ${action}ing Apache:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/apache/test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Error testing Apache config:', error);
      setTestResult({ success: false, message: 'Error running config test' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (apacheStatus) {
      case 'active':
      case 'running':
        return 'text-green-600 dark:text-green-400';
      case 'inactive':
      case 'stopped':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (apacheStatus) {
      case 'active':
      case 'running':
        return <CheckCircle className="w-5 h-5" />;
      case 'inactive':
      case 'stopped':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Server className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Apache Configuration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage Apache web server
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchApacheStatus();
            fetchApacheLogs();
            fetchConfigFiles();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Apache Status</p>
              <p className={`text-lg font-semibold ${getStatusColor()} capitalize`}>
                {apacheStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleApacheControl('start')}
            disabled={loading || apacheStatus === 'running'}
            className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Start</span>
          </button>

          <button
            onClick={() => handleApacheControl('stop')}
            disabled={loading || apacheStatus === 'stopped'}
            className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Square className="w-6 h-6 text-red-600 dark:text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Stop</span>
          </button>

          <button
            onClick={() => handleApacheControl('restart')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RotateCw className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Restart</span>
          </button>

          <button
            onClick={() => handleApacheControl('reload')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Power className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Reload</span>
          </button>
        </div>
      </div>

      {/* Config Test */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Configuration Test
          </h3>
          <button
            onClick={handleConfigTest}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Run Test</span>
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start space-x-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  testResult.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {testResult.success ? 'Configuration Test Passed' : 'Configuration Test Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Configs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Available Configurations
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {configFiles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No configuration files found
              </p>
            ) : (
              configFiles.map((config, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedConfig(config)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedConfig === config
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </span>
                    {config.enabled && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {config.path}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Apache Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
            Recent Logs
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No logs available</p>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.includes('error') || log.includes('Error') 
                      ? 'text-red-400' 
                      : log.includes('warn') || log.includes('Warning')
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
