import React, { useEffect, useState, useCallback, useRef } from 'react';
import SitesList from './SitesList.jsx';
import SiteDetails from './SiteDetails.jsx';
import AddSiteModal from './AddSiteModal.jsx';
import { Plus } from 'lucide-react';
import { API_URL } from '../../config.js';

const API_BASE = API_URL;
const SOCKET_URL = API_URL;

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sites`);
      const data = await res.json();
      if (!data.success) return;
      const mapped = data.sites.map((s, idx) => ({
        id: s.name || `${s.domain || 'site'}-${idx}`,
        name: s.name || `${s.domain || 'site'}-${idx}`,
        domain: s.domain || `${s.name || s.domain || 'site'}.local`,
        status: (s.status === 'enabled' || s.status === 'online') ? 'online' : 'offline',
  ssl: false,
  visitors: 42,
        path: `/var/www/${s.name}`,
        phpVersion: '8.1',
        created: Date.now() - idx * 86400000,
      }));
      setSites(mapped);
      // keep selectedSiteId as-is; selectedSite object will be derived from the refreshed list below
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch sites', err);
      setLoading(false);
    }
  }, []);

  // socket for realtime updates
  const socketRef = useRef(null);
  useEffect(() => {
    // lazy-load socket.io-client to avoid bundling issues
    let io;
    (async () => {
      io = (await import('socket.io-client')).default;
      const socket = io(SOCKET_URL, { transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('sites:updated', (sites) => {
        // map server sites into our mapped shape
        const mapped = sites.map((s, idx) => ({ id: s.name || `${s.domain || 'site'}-${idx}`, name: s.name || `${s.domain || 'site'}-${idx}`, domain: s.domain || `${s.name || s.domain || 'site'}.local`, status: (s.status === 'enabled' || s.status === 'online') ? 'online' : 'offline', ssl: false, visitors: 42, path: `/var/www/${s.name}`, phpVersion: '8.1', created: Date.now() - idx * 86400000 }));
        setSites(mapped);
      });

      socket.on('site:action-output', (payload) => {
        // append to live log
        setLiveLog((prev) => [...prev, { ...payload, ts: Date.now() }]);
      });
    })();

    return () => { try { socketRef.current?.disconnect(); } catch (e) {} };
  }, []);

  const [liveLog, setLiveLog] = useState([]);

  useEffect(() => {
    fetchSites();
    const iv = setInterval(fetchSites, 5000); // poll every 5s for realtime-ish updates
    return () => clearInterval(iv);
  }, [fetchSites]);

  // actions: start/stop/restart -> map to backend enable/disable/maintenance
  const handleSiteAction = async (site, action) => {
    if (!site) return;
    if (action === 'ssl') {
      // toggle only on client (backend doesn't provide SSL toggle in server.js)
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, ssl: !s.ssl } : s));
      return;
    }

    const actionMap = { start: 'enable', stop: 'disable', restart: 'maintenance' };
    const backendAction = actionMap[action] || action;

    try {
      // clear live log for new action
      setLiveLog([]);
      const res = await fetch(`${API_BASE}/sites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: site.name || site.id, action: backendAction }) });
      const data = await res.json();
      if (!data.success) {
        console.error('Action failed', data.error);
        return;
      }
      // server will emit sites:updated and site:action-output; still fetch as fallback
      setTimeout(fetchSites, 700);
    } catch (err) {
      console.error('Failed to perform site action', err);
    }
  };

  const handleSiteUpdate = (updatedSite) => { setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s)); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sites & Domains</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"><Plus className="w-5 h-5 mr-2" />Add New Site</button>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            { /* derive selectedSite from id so updates to sites don't break selection */ }
            <SitesList sites={sites} selectedSite={sites.find(s => s.id === selectedSiteId) || null} onSiteSelect={(site) => setSelectedSiteId(site?.id ?? null)} onSiteUpdate={handleSiteUpdate} onSiteAction={handleSiteAction} loading={loading} />
          </div>
          <div>
            { (sites.find(s => s.id === selectedSiteId)) ? <SiteDetails site={sites.find(s => s.id === selectedSiteId)} onSiteUpdate={handleSiteUpdate} /> : <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"><p className="text-gray-500 dark:text-gray-400">Select a site to view details</p></div>}
          </div>
        </div>

        {/* Live action output log */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Live Action Output</h4>
            <div className="flex items-center space-x-2"><button onClick={() => setLiveLog([])} className="px-2 py-1 text-xs bg-gray-100 rounded">Clear</button></div>
          </div>
          <div className="bg-black text-green-400 font-mono text-sm p-3 rounded h-40 overflow-auto">
            {liveLog.length === 0 ? <div className="text-gray-400">No live output</div> : liveLog.map((line, i) => (<div key={i}><span className="text-yellow-300">[{new Date(line.ts).toLocaleTimeString()}]</span> {line.type === 'stderr' ? <span className="text-red-400">{line.chunk}</span> : <span>{line.chunk}</span>}</div>))}
          </div>
        </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <AddSiteModal 
          onClose={() => setShowAddModal(false)} 
          onCreated={async () => { 
            setShowAddModal(false); 
            await fetchSites(); 
          }} 
          isServerInterface={false}
        />
      )}
    </div>
  );
}
