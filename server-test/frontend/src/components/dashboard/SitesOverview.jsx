import React from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

const sites = [
  { domain: 'example.com', status: 'online', ssl: true, visitors: '1.2k' },
  { domain: 'blog.example.com', status: 'online', ssl: true, visitors: '340' },
  { domain: 'api.example.com', status: 'maintenance', ssl: true, visitors: '89' },
  { domain: 'dev.example.com', status: 'offline', ssl: false, visitors: '12' },
];

export default function SitesOverview() {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'online': return `${base} bg-green-900/30 text-green-400`;
      case 'offline': return `${base} bg-red-900/30 text-red-400`;
      case 'maintenance': return `${base} bg-yellow-900/30 text-yellow-400`;
      default: return `${base} bg-[#1a1a1a] bg-[#0e0e0e]/30 text-gray-200 text-gray-500`;
    }
  };

  return (
    <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">Sites Overview</h3>
        <button className="flex items-center px-3 py-2 bg-lava-600 hover:bg-lava-700 text-white text-sm font-medium rounded-lg transition-colors"><Plus className="w-4 h-4 mr-1" />Add Site</button>
      </div>
      <div className="space-y-3">
        {sites.map((site, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-[#1f1f1f] rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="flex items-center">
                  <p className="font-medium text-gray-100 mr-2">{site.domain}</p>
                  {site.ssl && <div className="w-2 h-2 bg-green-500 rounded-full" title="SSL Enabled" />}
                </div>
                <p className="text-sm text-gray-500">{site.visitors} visitors today</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={getStatusBadge(site.status)}>{site.status}</span>
              {getStatusIcon(site.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
