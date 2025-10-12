import React from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

const sites = [
  {
    domain: 'example.com',
    status: 'online',
    ssl: true,
    visitors: '1.2k',
  },
  {
    domain: 'blog.example.com',
    status: 'online',
    ssl: true,
    visitors: '340',
  },
  {
    domain: 'api.example.com',
    status: 'maintenance',
    ssl: true,
    visitors: '89',
  },
  {
    domain: 'dev.example.com',
    status: 'offline',
    ssl: false,
    visitors: '12',
  },
];

export default function SitesOverview() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case 'offline':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      case 'maintenance':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sites Overview
        </h3>
        <button className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4 mr-1" />
          Add Site
        </button>
      </div>

      <div className="space-y-3">
        {sites.map((site, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="flex items-center">
                  <p className="font-medium text-gray-900 dark:text-white mr-2">
                    {site.domain}
                  </p>
                  {site.ssl && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="SSL Enabled" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {site.visitors} visitors today
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={getStatusBadge(site.status)}>
                {site.status}
              </span>
              {getStatusIcon(site.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}