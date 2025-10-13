import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const alerts = [
  { type: 'warning', title: 'High CPU Usage', message: 'CPU usage has been above 80% for the last 10 minutes', time: '2 min ago' },
  { type: 'info', title: 'Backup Completed', message: 'Daily backup completed successfully at 3:00 AM', time: '5 hours ago' },
  { type: 'success', title: 'SSL Renewed', message: 'SSL certificate for example.com renewed automatically', time: '1 day ago' },
  { type: 'error', title: 'Service Restart', message: 'Apache service was restarted due to memory limit', time: '2 days ago' },
];

export default function SystemAlerts() {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Alerts</h3>
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getAlertBg(alert.type)}`}>
            <div className="flex items-start">
              <div className="mr-3 mt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
