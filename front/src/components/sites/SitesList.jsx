import React from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, Shield, Eye } from 'lucide-react';

export default function SitesList({ sites, selectedSite, onSiteSelect, onSiteUpdate, onSiteAction, loading }) {
  const getStatusIcon = (status) => { switch (status) { case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />; case 'offline': return <XCircle className="w-4 h-4 text-red-500" />; case 'maintenance': return <AlertCircle className="w-4 h-4 text-yellow-500" />; default: return <XCircle className="w-4 h-4 text-gray-400" />; } };
  const getStatusBadge = (status) => { const base = "px-2 py-1 text-xs font-medium rounded-full"; switch (status) { case 'online': return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`; case 'offline': return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`; case 'maintenance': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`; default: return `${base} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400`; } };

  const handleAction = (site, action) => {
    if (onSiteAction) return onSiteAction(site, action);
    // fallback: optimistic update
    let newStatus = site.status;
    switch (action) {
      case 'start': newStatus = 'online'; break;
      case 'stop': newStatus = 'offline'; break;
      case 'restart': newStatus = 'maintenance'; setTimeout(() => { onSiteUpdate({ ...site, status: 'online' }); }, 2000); break;
      case 'ssl': onSiteUpdate({ ...site, ssl: !site.ssl }); return;
    }
    onSiteUpdate({ ...site, status: newStatus });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Sites {loading ? '(loading...)' : `(${sites.length})`}</h3></div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sites.map(site => (
          <div key={site.id} className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selectedSite?.id === site.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`} onClick={() => onSiteSelect(site)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mr-2">{site.domain}</h4>
                    {site.ssl && <div className="w-2 h-2 bg-green-500 rounded-full" title="SSL Enabled" />}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{site.visitors} visitors today</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">Created: {new Date(site.created).toLocaleDateString()}</div>
                <div className="flex items-center space-x-1">
                  <button onClick={(e) => { e.stopPropagation(); handleAction(site, site.status === 'online' ? 'stop' : 'start'); }} className={`p-1.5 rounded-md transition-colors ${site.status === 'online' ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'}`} title={site.status === 'online' ? 'Stop' : 'Start'}>{site.status === 'online' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                  <button onClick={(e) => { e.stopPropagation(); handleAction(site, 'restart'); }} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Restart"><RotateCcw className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleAction(site, 'ssl'); }} className={`p-1.5 rounded-md transition-colors ${site.ssl ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900/30'}`} title={site.ssl ? 'Disable SSL' : 'Enable SSL'}><Shield className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); window.open(`http://${site.domain}`, '_blank'); }} className="p-1.5 rounded-md text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors" title="Preview Site"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
