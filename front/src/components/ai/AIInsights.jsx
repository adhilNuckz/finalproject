import React, { useState } from 'react';
import { Brain, AlertTriangle, Shield, TrendingUp, FileText, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState('logs');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const logAnalysis = [ /* mock data omitted for brevity (same as TSX) */ ];
  const securityAlerts = [ /* mock data omitted for brevity (same as TSX) */ ];
  const performanceMetrics = [ /* mock data omitted for brevity (same as TSX) */ ];

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    }
  };

  const getStatusColor = (status) => {
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
        <button onClick={runAnalysis} disabled={isAnalyzing} className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors">
          {isAnalyzing ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Brain className="w-5 h-5 mr-2" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500">Mock AI Insights content (converted to JSX).</p>
        </div>
      </div>
    </div>
  );
}
