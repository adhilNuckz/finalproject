import React, { useState } from 'react';
import { Plus, RefreshCw, Shield, Database, Settings, Monitor, Globe } from 'lucide-react';
import DNSConfigModal from '../sites/DNSConfigModal.jsx';

const actions = [
  { id: 'add-site', title: 'Add New Site', description: 'Create a new website or subdomain', icon: Plus, color: 'bg-lava-600 hover:bg-lava-500' },
  { id: 'dns-config', title: 'DNS Configuration', description: 'Configure domain DNS settings', icon: Globe, color: 'bg-lava-700 hover:bg-lava-600' },
  { id: 'restart-services', title: 'Restart Services', description: 'Restart Apache/Nginx services', icon: RefreshCw, color: 'bg-ember-700 hover:bg-ember-600' },
  { id: 'security-scan', title: 'Security Scan', description: 'Run security vulnerability check', icon: Shield, color: 'bg-amber-700 hover:bg-amber-600' },
];

export default function QuickActions({ onAddSite }) {
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('example.com');

  const handleAction = (actionId) => {
    switch (actionId) {
      case 'add-site':
        if (onAddSite) onAddSite();
        break;
      case 'dns-config':
        setShowDNSModal(true);
        break;
      case 'restart-services':
        if (confirm('Restart Apache service?')) {
          fetch('http://localhost:5000/api/apache/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restart' })
          }).then(() => alert('Apache restarted successfully'));
        }
        break;
      case 'security-scan':
        alert('Security scan feature coming soon!');
        break;
    }
  };
  return (
    <>
      <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button 
                key={action.id} 
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center p-3 rounded-lg border border-[#1f1f1f] hover:bg-[#1a1a1a] hover:border-lava-800/50 transition-all group"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white mr-3 transition-all`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showDNSModal && (
        <DNSConfigModal 
          domain={selectedDomain}
          onClose={() => setShowDNSModal(false)}
        />
      )}
    </>
  );
}
