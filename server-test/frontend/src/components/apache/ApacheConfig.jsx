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
  RefreshCw,
  Edit,
  Save,
  X
} from 'lucide-react';

export default function ApacheConfig() {
  const [apacheStatus, setApacheStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [configFiles, setConfigFiles] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configContent, setConfigContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

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

  const handleConfigClick = async (config) => {
    setSelectedConfig(config);
    setShowConfigModal(true);
    setIsEditing(false);
    setSaveResult(null);
    
    try {
      const filename = config.name + '.conf';
      const response = await fetch(`http://localhost:5000/api/apache/config/${filename}`);
      const data = await response.json();
      
      if (data.success) {
        setConfigContent(data.content);
        setEditedContent(data.content);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setConfigContent('Error loading configuration file');
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setSaveResult(null);
    
    try {
      const filename = selectedConfig.name + '.conf';
      const response = await fetch(`http://localhost:5000/api/apache/config/${filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent })
      });
      const data = await response.json();
      
      if (data.success) {
        setConfigContent(editedContent);
        setIsEditing(false);
        setSaveResult({
          success: true,
          message: 'Configuration saved successfully',
          configTest: data.configTest
        });
        await fetchConfigFiles();
      } else {
        setSaveResult({
          success: false,
          message: data.error || 'Failed to save configuration'
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveResult({
        success: false,
        message: 'Error saving configuration file'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfigModal(false);
    setSelectedConfig(null);
    setConfigContent('');
    setEditedContent('');
    setIsEditing(false);
    setSaveResult(null);
  };

  const getStatusColor = () => {
    switch (apacheStatus) {
      case 'active':
      case 'running':
        return 'text-green-600';
      case 'inactive':
      case 'stopped':
        return 'text-red-600';
      default:
        return 'text-gray-400';
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
          <div className="p-3 bg-orange-100 rounded-lg">
            <Server className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Apache Configuration
            </h2>
            <p className="text-sm text-gray-500">
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
          className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Apache Status</p>
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
            className="flex flex-col items-center justify-center p-4 bg-green-900/20 hover:bg-green-900/40 border border-green-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <PlayCircle className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-300">Start</span>
          </button>

          <button
            onClick={() => handleApacheControl('stop')}
            disabled={loading || apacheStatus === 'stopped'}
            className="flex flex-col items-center justify-center p-4 bg-red-900/20 hover:bg-red-900/40 border border-red-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Square className="w-6 h-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-300">Stop</span>
          </button>

          <button
            onClick={() => handleApacheControl('restart')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-lava-900/20 bg-lava-900/20 hover:bg-lava-900/30 border border-lava-600/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RotateCw className="w-6 h-6 text-lava-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-lava-400">Restart</span>
          </button>

          <button
            onClick={() => handleApacheControl('reload')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Power className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-300">Reload</span>
          </button>
        </div>
      </div>

      {/* Config Test */}
      <div className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-lava-500" />
            Configuration Test
          </h3>
          <button
            onClick={handleConfigTest}
            disabled={loading}
            className="px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Run Test</span>
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-900/20 border-green-800' 
              : 'bg-red-900/20 border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  testResult.success 
                    ? 'text-green-900' 
                    : 'text-red-900'
                }`}>
                  {testResult.success ? 'Configuration Test Passed' : 'Configuration Test Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.success 
                    ? 'text-green-300' 
                    : 'text-red-300'
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
        <div className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-lava-500" />
            Available Configurations
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {configFiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No configuration files found
              </p>
            ) : (
              configFiles.map((config, index) => (
                <button
                  key={index}
                  onClick={() => handleConfigClick(config)}
                  className="w-full text-left px-4 py-3 rounded-lg border transition-all bg-[#1a1a1a]/50 border-[#1f1f1f] hover:border-lava-600/30 hover:bg-lava-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Edit className="w-4 h-4 text-lava-500" />
                      <span className="text-sm font-medium text-gray-100">
                        {config.name}
                      </span>
                    </div>
                    {config.enabled && (
                      <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded-full">
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.path}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Apache Logs */}
        <div className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600" />
            Recent Logs
          </h3>
          <div className="bg-[#0e0e0e] rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
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

      {/* Config Editor Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-lg shadow-xl w-full max-w-6xl h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-lava-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {selectedConfig?.name}.conf
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConfig?.path}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-6 min-h-0">
              <div className="h-full flex flex-col min-h-0">
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    {selectedConfig?.enabled && (
                      <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded-full">
                        Enabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setEditedContent(configContent);
                            setIsEditing(false);
                            setSaveResult(null);
                          }}
                          className="px-4 py-2 bg-[#1f1f1f] bg-[#1a1a1a] hover:bg-[#252525] hover:bg-[#1f1f1f] text-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleSaveConfig}
                          disabled={loading || editedContent === configContent}
                          className="px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Save Result */}
                {saveResult && (
                  <div className={`mb-4 p-4 rounded-lg border flex-shrink-0 ${
                    saveResult.success 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-red-900/20 border-red-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {saveResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          saveResult.success 
                            ? 'text-green-900' 
                            : 'text-red-900'
                        }`}>
                          {saveResult.message}
                        </p>
                        {saveResult.configTest && (
                          <p className={`text-sm mt-1 ${
                            saveResult.configTest.success 
                              ? 'text-green-300' 
                              : 'text-red-300'
                          }`}>
                            Config Test: {saveResult.configTest.success ? '✓ Passed' : '✗ Failed'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Config Content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-full p-4 bg-[#0e0e0e] text-green-400 font-mono text-sm rounded-lg border border-[#1f1f1f] focus:border-lava-500 focus:ring-2 focus:ring-lava-500 focus:outline-none resize-none overflow-auto"
                      style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                    />
                  ) : (
                    <pre className="w-full h-full p-4 bg-[#0e0e0e] text-green-400 font-mono text-sm rounded-lg overflow-auto border border-[#1f1f1f] whitespace-pre-wrap">
                      {configContent || 'Loading...'}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#1f1f1f] bg-[#111111]/50">
              <p className="text-xs text-gray-500">
                Changes will be validated with apache2ctl configtest before being applied
              </p>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-[#1f1f1f] bg-[#1a1a1a] hover:bg-[#252525] hover:bg-[#1f1f1f] text-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
