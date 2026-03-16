import React, { useEffect, useState } from 'react';
import { Database, Plus, RefreshCw, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config.js';

export default function Databases() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [installing, setInstalling] = useState({});
  const [selectedDbId, setSelectedDbId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDb, setNewDb] = useState({
    name: '',
    type: 'mysql',
    host: '127.0.0.1',
    port: '',
    user: '',
    password: '',
    uri: ''
  });
  const [adding, setAdding] = useState(false);
  const [autoCreateMysqlUser, setAutoCreateMysqlUser] = useState(false);

  useEffect(() => {
    fetchDatabases();
    fetchStatus();
  }, []);

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/databases`);
      const data = await res.json();
      if (data.success) {
        setDatabases(data.databases || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load databases');
      }
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/databases/status`);
      const data = await res.json();
      if (data.success) {
        setSystemStatus(data.status || null);
      }
    } catch {
      // ignore, leave systemStatus null
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDb.name.trim()) return;
    if (newDb.type === 'mysql' && autoCreateMysqlUser) {
      if (!newDb.user.trim() || !newDb.password.trim()) {
        alert('User and password are required to create a MySQL user');
        return;
      }
    }
    setAdding(true);
    try {
      // Optional: create MySQL user on the server first (requires MYSQL_ADMIN_* on backend)
      if (newDb.type === 'mysql' && autoCreateMysqlUser) {
        const resUser = await fetch(`${API_BASE_URL}/databases/mysql/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: newDb.user,
            password: newDb.password,
            host: newDb.host || 'localhost'
          })
        });
        const dataUser = await resUser.json();
        if (!dataUser.success) {
          alert(dataUser.error || 'Failed to create MySQL user. Please check server configuration (MYSQL_ADMIN_USER).');
          setAdding(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDb,
          port: newDb.port ? Number(newDb.port) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewDb({ name: '', type: 'mysql', host: '127.0.0.1', port: '', user: '', password: '', uri: '' });
        setAutoCreateMysqlUser(false);
        fetchDatabases();
      } else {
        alert(data.error || 'Failed to create database config');
      }
    } catch (e) {
      alert('Failed to connect to server');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this database config?')) return;
    setActionLoading(prev => ({ ...prev, [`del-${id}`]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/databases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDatabases(dbs => dbs.filter(d => d.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (e) {
      alert('Failed to connect to server');
    } finally {
      setActionLoading(prev => ({ ...prev, [`del-${id}`]: false }));
    }
  };

  const handleInstall = async (type) => {
    const key = `install-${type}`;
    setInstalling(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/databases/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Install command for ${type} started / completed.`);
        fetchStatus();
      } else {
        alert(data.error || `Failed to install ${type}`);
      }
    } catch (e) {
      alert('Failed to connect to server');
    } finally {
      setInstalling(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTest = async (id) => {
    setActionLoading(prev => ({ ...prev, [`test-${id}`]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/databases/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Connection successful');
      } else {
        alert(data.error || 'Connection failed');
      }
    } catch (e) {
      alert('Failed to connect to server');
    } finally {
      setActionLoading(prev => ({ ...prev, [`test-${id}`]: false }));
    }
  };

  const typeLabel = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'mysql') return 'MySQL';
    if (t === 'mongo' || t === 'mongodb') return 'MongoDB';
    if (t === 'postgres' || t === 'postgresql') return 'PostgreSQL';
    if (t === 'sqlite' || t === 'sqlite3') return 'SQLite';
    return type || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-lava-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Database className="w-7 h-7 text-lava-400" />
            Databases
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage database connection configs (MySQL, MongoDB, and others) for your servers.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDatabases}
            className="px-3 py-2 text-sm rounded-lg bg-[#1a1a1a] text-gray-300 hover:bg-[#1f1f1f] transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm rounded-lg bg-lava-600 text-white hover:bg-lava-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Connection
          </button>
        </div>
      </div>

      {/* System DB tools status & install */}
      <div className="bg-[#141414] rounded-xl border border-[#1f1f1f] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-200">Database Servers on this machine</h2>
            <p className="text-xs text-gray-500 mt-0.5">Check if MySQL, MongoDB, PostgreSQL and phpMyAdmin are installed. Install them with one click (apt-based systems).</p>
          </div>
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#1a1a1a] text-gray-300 hover:bg-[#1f1f1f] flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {statusLoading && (
          <div className="flex items-center text-xs text-gray-400">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Checking database tools...
          </div>
        )}

        {!statusLoading && systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {['mysql', 'mongo', 'postgres', 'phpmyadmin'].map((key) => {
              const info = systemStatus[key] || {};
              const installed = info.installed;
              const active = info.active;
              const labelMap = {
                mysql: 'MySQL Server',
                mongo: 'MongoDB',
                postgres: 'PostgreSQL',
                phpmyadmin: 'phpMyAdmin'
              };
              const label = labelMap[key] || key;
              const installKey = `install-${key}`;
              return (
                <div key={key} className="bg-[#111111] border border-[#222222] rounded-lg p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-100">{label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${installed ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}
                      >
                        {installed ? 'Installed' : 'Not installed'}
                      </span>
                    </div>
                    {typeof active === 'boolean' && (
                      <div className="text-[11px] text-gray-400">
                        Service: <span className={active ? 'text-emerald-400' : 'text-red-400'}>{active ? 'active' : 'inactive'}</span>
                      </div>
                    )}
                    {key === 'phpmyadmin' && info.url && installed && (
                      <div className="mt-1 text-[11px] text-gray-400 break-all">
                        URL: {info.url}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleInstall(key)}
                      disabled={installing[installKey]}
                      className="px-2 py-1 text-[11px] rounded-md bg-lava-600 text-white hover:bg-lava-700 disabled:opacity-70"
                    >
                      {installing[installKey] ? (
                        <Loader2 className="w-3 h-3 animate-spin inline-block" />
                      ) : (
                        'Install'
                      )}
                    </button>
                    {key === 'phpmyadmin' && info.url && installed && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-lava-400 hover:text-lava-300"
                      >
                        Open full page
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-400 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {databases.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] rounded-xl border border-[#1f1f1f]">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No database configs</h3>
          <p className="text-sm text-gray-500 mt-1">Add your first database connection to get started.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-lava-600 text-white rounded-lg hover:bg-lava-700 transition text-sm"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add Connection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {databases.map((db) => (
            <div
              key={db.id}
              className={`bg-[#141414] rounded-xl border p-5 flex items-center justify-between cursor-pointer transition-colors ${
                selectedDbId === db.id ? 'border-lava-500/70' : 'border-[#1f1f1f] hover:border-[#2a2a2a]'
              }`}
              onClick={() => setSelectedDbId(db.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-100">{db.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-[#1f1f1f] text-gray-300">
                    {typeLabel(db.type)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {db.uri
                    ? db.uri
                    : `${db.user || 'user'}@${db.host || 'host'}:${db.port || (db.type === 'mysql' ? 3306 : db.type === 'mongo' || db.type === 'mongodb' ? 27017 : '')}/${db.database || ''}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTest(db.id);
                  }}
                  disabled={actionLoading[`test-${db.id}`]}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 disabled:opacity-70"
                >
                  {actionLoading[`test-${db.id}`] ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Test
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(db.id);
                  }}
                  disabled={actionLoading[`del-${db.id}`]}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-700 hover:bg-red-800 text-white flex items-center gap-1 disabled:opacity-70"
                >
                  {actionLoading[`del-${db.id}`] ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected DB details + phpMyAdmin preview (for MySQL) */}
      {selectedDbId && (
        (() => {
          const db = databases.find(d => d.id === selectedDbId);
          if (!db) return null;
          const isMySql = (db.type || '').toLowerCase() === 'mysql';
          const phpMyAdminAvailable =
            !!systemStatus?.phpmyadmin?.installed && !!systemStatus.phpmyadmin.url && isMySql;
          return (
            <div className="space-y-4">
              <div className="bg-[#141414] rounded-xl border border-[#1f1f1f] p-4">
                <h2 className="text-sm font-semibold text-gray-200 mb-2">Connection details</h2>
                <div className="text-xs text-gray-400 space-y-1">
                  <div><span className="text-gray-500">Name:</span> {db.name}</div>
                  <div><span className="text-gray-500">Type:</span> {typeLabel(db.type)}</div>
                  <div><span className="text-gray-500">Host:</span> {db.host || '127.0.0.1'}</div>
                  <div><span className="text-gray-500">Port:</span> {db.port || (isMySql ? 3306 : '')}</div>
                  <div><span className="text-gray-500">User:</span> {db.user || '(not set)'}</div>
                  {db.database && (
                    <div><span className="text-gray-500">Default database:</span> {db.database}</div>
                  )}
                  {db.createdAt && (
                    <div><span className="text-gray-500">Created:</span> {new Date(db.createdAt).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {phpMyAdminAvailable && (
                <div className="bg-[#141414] rounded-xl border border-[#1f1f1f] overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#1f1f1f] flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-200">phpMyAdmin Preview (MySQL)</span>
                    <a
                      href={systemStatus.phpmyadmin.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-lava-400 hover:text-lava-300"
                    >
                      Open in new tab
                    </a>
                  </div>
                  <div className="h-[480px] bg-black">
                    <iframe
                      src={systemStatus.phpmyadmin.url}
                      title="phpMyAdmin"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111111] rounded-xl border border-[#2a2a2a] w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-lava-400" />
              New Database Connection
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                  value={newDb.name}
                  onChange={e => setNewDb({ ...newDb, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                  value={newDb.type}
                  onChange={e => setNewDb({ ...newDb, type: e.target.value })}
                >
                  <option value="mysql">MySQL</option>
                  <option value="mongo">MongoDB</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              {newDb.type === 'mongo' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Mongo URI (optional)</label>
                    <input
                      type="text"
                      placeholder="mongodb://user:pass@host:27017/dbname"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                      value={newDb.uri}
                      onChange={e => setNewDb({ ...newDb, uri: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Host</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.host}
                        onChange={e => setNewDb({ ...newDb, host: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Port</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.port}
                        onChange={e => setNewDb({ ...newDb, port: e.target.value })}
                        placeholder="27017"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">User</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.user}
                        onChange={e => setNewDb({ ...newDb, user: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.password}
                        onChange={e => setNewDb({ ...newDb, password: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Host</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.host}
                        onChange={e => setNewDb({ ...newDb, host: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Port</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.port}
                        onChange={e => setNewDb({ ...newDb, port: e.target.value })}
                        placeholder={newDb.type === 'mysql' ? '3306' : newDb.type === 'postgres' ? '5432' : ''}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">User</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.user}
                        onChange={e => setNewDb({ ...newDb, user: e.target.value })}
                        required={newDb.type !== 'sqlite'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-100 focus:outline-none focus:border-lava-500"
                        value={newDb.password}
                        onChange={e => setNewDb({ ...newDb, password: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {newDb.type === 'mysql' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="autoCreateMysqlUser"
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#2a2a2a] bg-[#181818]"
                    checked={autoCreateMysqlUser}
                    onChange={e => setAutoCreateMysqlUser(e.target.checked)}
                  />
                  <label htmlFor="autoCreateMysqlUser" className="text-xs text-gray-400">
                    Also create MySQL user on server (requires admin user configured on backend)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-[#181818] text-gray-300 hover:bg-[#222222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 text-sm rounded-lg bg-lava-600 text-white hover:bg-lava-700 flex items-center gap-2 disabled:opacity-70"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
