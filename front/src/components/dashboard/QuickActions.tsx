import React from 'react';
import { 
  Plus, 
  RefreshCw, 
  Shield, 
  Database, 
  Settings,
  Monitor
} from 'lucide-react';

const actions = [
  {
    title: 'Add New Site',
    description: 'Create a new website or subdomain',
    icon: Plus,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Restart Services',
    description: 'Restart Apache/Nginx services',
    icon: RefreshCw,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Security Scan',
    description: 'Run security vulnerability check',
    icon: Shield,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'Database Backup',
    description: 'Create database backup now',
    icon: Database,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    title: 'System Settings',
    description: 'Configure server settings',
    icon: Settings,
    color: 'bg-gray-500 hover:bg-gray-600',
  },
  {
    title: 'Monitor Logs',
    description: 'View real-time system logs',
    icon: Monitor,
    color: 'bg-red-500 hover:bg-red-600',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h3>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className={`p-2 rounded-lg ${action.color} text-white mr-3 transition-colors`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}