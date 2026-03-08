import React, { useState } from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, Shield, Eye, Lock, ExternalLink } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '../../config.js';

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
      case 'online': return `${base} bg-green-900/30 text-green-400`; 
      case 'offline': return `${base} bg-red-900/30 text-red-400`; 
      case 'maintenance': return `${base} bg-yellow-900/30 text-yellow-400`; 
      default: return `${base} bg-[#1a1a1a] bg-[#0e0e0e]/30 text-gray-200 text-gray-500`; 
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

  const openSite = (site, protocol, e) => {
    e.stopPropagation();
    window.open(`${protocol}://${site.domain}`, '_blank');
  };

  return (
    <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f]">
      <div className="p-6 border-b border-[#1f1f1f]"><h3 className="text-lg font-semibold text-gray-100">All Sites {loading ? '(loading...)' : `(${sites.length})`}</h3></div>
      <div className="divide-y divide-[#1f1f1f]">
        {sites.map(site => (
          <div key={site.id} className={`p-6 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${selectedSite?.id === site.id ? 'bg-lava-900/20 bg-lava-900/20 border-l-4 border-lava-500' : ''}`} onClick={() => onSiteSelect(site)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-100">{site.domain}</h4>
                    {site.ssl && (
                      <div className="flex items-center px-2 py-0.5 bg-green-900/30 rounded-full">
                        <Lock className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-xs text-green-300 font-medium">SSL</span>
                      </div>
                    )}
                    <span className={getStatusBadge(site.status)}>{site.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{site.path || '/var/www/html'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Protocol Selector Button Group */}
                <div className="inline-flex rounded-md shadow-sm shadow-black/20" role="group">
                  <button 
                    onClick={(e) => openSite(site, 'http', e)} 
                    className="px-3 py-1.5 bg-lava-600 hover:bg-lava-700 text-white text-sm font-medium rounded-l-md transition-colors inline-flex items-center"
                    title="Open with HTTP"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    HTTP
                  </button>
                  {site.ssl ? (
                    <button 
                      onClick={(e) => openSite(site, 'https', e)} 
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-r-md transition-colors inline-flex items-center -ml-px"
                      title="Open with HTTPS"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      HTTPS
                    </button>
                  ) : (
                    <button 
                      className="px-3 py-1.5 bg-gray-400 bg-[#1f1f1f] text-white text-sm font-medium rounded-r-md cursor-not-allowed inline-flex items-center opacity-60 -ml-px"
                      title="HTTPS not available - Install SSL first"
                      disabled
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      HTTPS
                    </button>
                  )}
                </div>
                
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
                        <Shield className="w-3 h-3 mr-1" />
                        Add SSL
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(site, site.status === 'offline' ? 'start' : 'stop'); }} 
                  className={`p-1.5 rounded-md transition-colors ${site.status === 'online' ? 'text-red-400 hover:bg-red-900/40' : 'text-green-600 hover:bg-green-900/40'}`} 
                  title={site.status === 'online' ? 'Pause (Maintenance Mode)' : 'Play (Resume Site)'}
                >
                  {site.status === 'online' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(site, 'restart'); }} 
                  className="p-1.5 rounded-md text-lava-500 hover:bg-lava-900/30 transition-colors" 
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
