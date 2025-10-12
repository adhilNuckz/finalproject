import React, { useState } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  analysis: string;
  recommendation?: string;
}

interface SecurityAlert {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  status: 'new' | 'investigating' | 'resolved';
}

interface PerformanceMetric {
  metric: string;
  current: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  recommendation: string;
}

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<'logs' | 'security' | 'performance'>('logs');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data
  const logAnalysis: LogEntry[] = [
    {
      timestamp: '2024-01-25 10:30:45',
      level: 'error',
      message: 'MySQL connection failed: Access denied for user \'app\'@\'localhost\'',
      analysis: 'Database authentication failure detected. This could indicate incorrect credentials or a potential security breach.',
      recommendation: 'Verify database credentials and check for suspicious login attempts.'
    },
    {
      timestamp: '2024-01-25 10:25:12',
      level: 'warning',
      message: 'Apache memory usage at 85%',
      analysis: 'Web server memory consumption is approaching critical levels. This may impact site performance.',
      recommendation: 'Consider increasing server memory or optimizing Apache configuration.'
    },
    {
      timestamp: '2024-01-25 10:20:33',
      level: 'error',
      message: 'Failed to open file /var/www/uploads/temp.php: Permission denied',
      analysis: 'File permission issue preventing proper file operations. This may affect file upload functionality.',
      recommendation: 'Check and correct file permissions for the uploads directory.'
    }
  ];

  const securityAlerts: SecurityAlert[] = [
    {
      severity: 'high',
      title: 'Multiple Failed SSH Login Attempts',
      description: '47 failed SSH login attempts from IP 198.51.100.42 in the last hour',
      recommendation: 'Enable Fail2Ban and consider implementing IP whitelisting for SSH access',
      status: 'new'
    },
    {
      severity: 'medium',
      title: 'Outdated SSL Certificate',
      description: 'SSL certificate for blog.example.com expires in 14 days',
      recommendation: 'Renew SSL certificate or enable auto-renewal through Let\'s Encrypt',
      status: 'investigating'
    },
    {
      severity: 'low',
      title: 'Unused Open Ports',
      description: 'Ports 3306 and 5432 are open but not actively used',
      recommendation: 'Close unnecessary ports to reduce attack surface',
      status: 'resolved'
    }
  ];

  const performanceMetrics: PerformanceMetric[] = [
    {
      metric: 'CPU Usage',
      current: 78,
      threshold: 80,
      status: 'warning',
      recommendation: 'Monitor processes and consider upgrading CPU or optimizing resource-heavy applications'
    },
    {
      metric: 'Memory Usage',
      current: 65,
      threshold: 85,
      status: 'good',
      recommendation: 'Memory usage is within acceptable limits'
    },
    {
      metric: 'Disk I/O Wait',
      current: 15,
      threshold: 10,
      status: 'critical',
      recommendation: 'High disk I/O wait times detected. Consider upgrading to SSD storage or optimizing database queries'
    },
    {
      metric: 'Response Time',
      current: 245,
      threshold: 300,
      status: 'good',
      recommendation: 'Website response times are optimal'
    }
  ];

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const tabs = [
    { id: 'logs', name: 'Log Analyzer', icon: FileText },
    { id: 'security', name: 'Security Advisor', icon: Shield },
    { id: 'performance', name: 'Performance Tuner', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Insights
        </h1>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Brain className="w-5 h-5 mr-2" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Log Analysis
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last analyzed: 5 minutes ago
                </span>
              </div>

              <div className="space-y-4">
                {logAnalysis.map((log, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        {getLevelIcon(log.level)}
                        <span className="ml-2 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {log.timestamp}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.level === 'error' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          : log.level === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200">
                        {log.message}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <Brain className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Analysis:</strong> {log.analysis}
                        </p>
                      </div>
                      
                      {log.recommendation && (
                        <div className="flex items-start">
                          <Zap className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Recommendation:</strong> {log.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Security Assessment
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    1 High Risk
                  </span>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    1 Medium Risk
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {securityAlerts.map((alert, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-blue-500 mr-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.status === 'resolved' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : alert.status === 'investigating'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                        }`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-start">
                      <Zap className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Recommendation:</strong> {alert.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    1 Critical
                  </span>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    1 Warning
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {metric.metric}
                      </h4>
                      <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Current</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {metric.metric === 'Response Time' ? `${metric.current}ms` : `${metric.current}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === 'critical' 
                              ? 'bg-red-500' 
                              : metric.status === 'warning' 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(metric.current, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <TrendingUp className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {metric.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}