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
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-lava-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-ember-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'warning': return 'bg-amber-900/20 border-amber-800/50';
      case 'info': return 'bg-lava-900/20 border-lava-800/50';
      case 'success': return 'bg-green-900/20 border-green-800/50';
      case 'error': return 'bg-ember-900/20 border-ember-800/50';
      default: return 'bg-[#1a1a1a] border-[#2a2a2a]';
    }
  };

  return (
    <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
      <h3 className="text-lg font-semibold text-white mb-6">System Alerts</h3>
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getAlertBg(alert.type)}`}>
            <div className="flex items-start">
              <div className="mr-3 mt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">{alert.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
