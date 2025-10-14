import React, { useEffect, useState, useCallback, useRef } from 'react';
import SitesList from './SitesList.jsx';
import SiteDetails from './SiteDetails.jsx';
import { Plus } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Site</h3>
            <AddSiteForm onCancel={() => setShowAddModal(false)} onCreated={async () => { setShowAddModal(false); await fetchSites(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddSiteForm({ onCancel, onCreated }) {
  const [subdomain, setSubdomain] = React.useState('');
  const [folder, setFolder] = React.useState('');
  const [mainFile, setMainFile] = React.useState('index.html');
  const [saving, setSaving] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [domainExt, setDomainExt] = React.useState('.local');

  const onFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    if (selected.length > 0) setMainFile(selected[0].name);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!subdomain || !folder || !mainFile) return;
    setSaving(true);
    try {
      // If files were provided, send multipart to /site/add
      if (files && files.length > 0) {
        const fd = new FormData();
        fd.append('subdomain', subdomain + domainExt.replace(/^\./, ''));
        fd.append('folder', folder);
        fd.append('mainFile', mainFile);
        files.forEach((f) => fd.append('files', f));

        const res = await fetch(`${API_BASE}/site/add`, { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.success) {
          alert('Failed to create site: ' + (data.error || 'unknown'));
        } else {
          await onCreated();
        }
      } else {
        // fallback: use json create endpoint
        const res = await fetch(`${API_BASE}/site/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subdomain: subdomain + domainExt.replace(/^\./, ''), folder, mainFile }) });
        const data = await res.json();
        if (!data.success) {
          alert('Failed to create site: ' + (data.error || 'unknown'));
        } else {
          await onCreated();
        }
      }
    } catch (err) {
      console.error('Create site failed', err);
      alert('Create site failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Domain extension</label>
        <select value={domainExt} onChange={(e) => setDomainExt(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 p-2">
          <option value=".local">.local</option>
          <option value=".test">.test</option>
          <option value=".localhost">.localhost</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Subdomain</label>
        <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="example" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Folder</label>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="example-folder" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Upload files</label>
        <input type="file" multiple onChange={onFileChange} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 p-2" />
        {files.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Files selected:</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
              {files.map((f, idx) => (<li key={idx}>{f.name}</li>))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Main file (select from uploaded files)</label>
        <select value={mainFile} onChange={(e) => setMainFile(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 p-2">
          {files.length === 0 ? (<option value="index.html">index.html</option>) : files.map((f) => (<option key={f.name} value={f.name}>{f.name}</option>))}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white">{saving ? 'Creating…' : 'Create Site'}</button>
      </div>
    </form>
  );
}
