import React, { useState, useEffect } from 'react';
import ServerStats from './ServerStats.jsx';
import DomainsOverview from './DomainsOverview.jsx';
import QuickActions from './QuickActions.jsx';
import SystemAlerts from './SystemAlerts.jsx';
import AddSiteModal from '../sites/AddSiteModal.jsx';
import { Server } from 'lucide-react';
import { API_BASE_URL } from '../../config.js';

export default function Dashboard() {
  const [serverIp, setServerIp] = useState('Loading...');
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);

  useEffect(() => {
    fetchServerIp();
  }, []);

  const fetchServerIp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/server/ip`);
      const data = await response.json();
      if (data.success) {
        setServerIp(data.ip);
      }
    } catch (err) {
      console.error('Error fetching server IP:', err);
      setServerIp('Unable to fetch IP');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* Server IP Address */}
      <div className="lava-gradient rounded-xl shadow-sm shadow-black/20 p-4 lava-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-100">Server IP Address</p>
              <p className="text-xl font-bold text-white">{serverIp}</p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(serverIp);
              alert('IP address copied to clipboard!');
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all"
          >
            Copy IP
          </button>
        </div>
        <p className="text-xs text-orange-100 mt-2">Point your domain's A record to this IP address</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ServerStats /></div>
        <div><DomainsOverview /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions onAddSite={() => setShowAddSiteModal(true)} />
        <SystemAlerts />
      </div>

      {/* Add Site Modal */}
      {showAddSiteModal && (
        <AddSiteModal
          onClose={() => setShowAddSiteModal(false)}
          onCreated={() => {
            setShowAddSiteModal(false);
            // Optionally refresh dashboard data here
          }}
          isServerInterface={false}
        />
      )}
    </div>
  );
}
