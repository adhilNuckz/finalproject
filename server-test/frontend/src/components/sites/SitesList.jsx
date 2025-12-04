import React, { useState } from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, Shield, Eye, Lock, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API_BASE = API_BASE_URL;

export default function SitesList({ sites, selectedSite, onSiteSelect, onSiteUpdate, onSiteAction, loading }) {
  const [installingSSL, setInstallingSSL] = useState({});
  
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
      case 'online': return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`; 
      case 'offline': return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`; 
      case 'maintenance': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`; 
      default: return `${base} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400`; 
    } 
  };

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

  const handleSSLInstall = async (site, e) => {
    e.stopPropagation();
    
    if (site.ssl) {
      // SSL already installed, show message
      alert('SSL is already installed for this site');
      return;
    }
    
    const confirmed = window.confirm(
      `Install SSL certificate for ${site.domain}?\n\nMake sure:\n1. Your domain DNS points to this server\n2. Port 80 and 443 are accessible\n\nThis may take a few moments.`
    );
    
    if (!confirmed) return;
    
    setInstallingSSL(prev => ({ ...prev, [site.id]: true }));
    
    try {
      const res = await fetch(`${API_BASE}/ssl/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: site.domain,
          email: `admin@${site.domain}`
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('SSL certificate installed successfully!');
        onSiteUpdate({ ...site, ssl: true });
      } else {
        alert('SSL installation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('SSL installation error:', error);
      alert('SSL installation failed: ' + error.message);
    } finally {
      setInstallingSSL(prev => ({ ...prev, [site.id]: false }));
    }
  };

  const openSite = (site, e) => {
    e.stopPropagation();
    const protocol = site.ssl ? 'https' : 'http';
    window.open(`${protocol}://${site.domain}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Sites {loading ? '(loading...)' : `(${sites.length})`}</h3></div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sites.map(site => (
          <div key={site.id} className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selectedSite?.id === site.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`} onClick={() => onSiteSelect(site)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{site.domain}</h4>
                    {site.ssl && (
                      <div className="flex items-center px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Lock className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
                        <span className="text-xs text-green-700 dark:text-green-300 font-medium">SSL</span>
                      </div>
                    )}
                    <span className={getStatusBadge(site.status)}>{site.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{site.path || '/var/www/html'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => openSite(site, e)} 
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center"
                  title="View Site"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Site
                </button>
                
                {!site.ssl && (
                  <button 
                    onClick={(e) => handleSSLInstall(site, e)}
                    disabled={installingSSL[site.id]}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Install SSL Certificate"
                  >
                    {installingSSL[site.id] ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Add SSL
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(site, site.status === 'online' ? 'stop' : 'start'); }} 
                  className={`p-1.5 rounded-md transition-colors ${site.status === 'online' ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'}`} 
                  title={site.status === 'online' ? 'Stop' : 'Start'}
                >
                  {site.status === 'online' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(site, 'restart'); }} 
                  className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" 
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
