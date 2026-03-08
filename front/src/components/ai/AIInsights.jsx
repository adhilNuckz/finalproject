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
        return <CheckCircle className="w-4 h-4 text-lava-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-900/30';
      default:
        return 'text-green-600 bg-green-900/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
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
        <h1 className="text-2xl font-bold text-gray-100">
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

      <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] overflow-hidden">
        <div className="flex border-b border-[#1f1f1f]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-lava-900/20 bg-lava-900/30 text-lava-500 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-300'}`}>
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
