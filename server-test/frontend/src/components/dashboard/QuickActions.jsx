import React, { useState } from 'react';
import { Plus, RefreshCw, Shield, Database, Settings, Monitor, Globe } from 'lucide-react';
import DNSConfigModal from '../sites/DNSConfigModal.jsx';
import { API_BASE_URL } from '../../config';

const actions = [
  { id: 'add-site', title: 'Add New Site', description: 'Create a new website or subdomain', icon: Plus, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'dns-config', title: 'DNS Configuration', description: 'Configure domain DNS settings', icon: Globe, color: 'bg-indigo-500 hover:bg-indigo-600' },
  { id: 'restart-services', title: 'Restart Services', description: 'Restart Apache/Nginx services', icon: RefreshCw, color: 'bg-green-500 hover:bg-green-600' },
  { id: 'security-scan', title: 'Security Scan', description: 'Run security vulnerability check', icon: Shield, color: 'bg-purple-500 hover:bg-purple-600' },
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
          fetch(`${API_BASE_URL}/api/apache/control`, {
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button 
                key={action.id} 
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white mr-3 transition-colors`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
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
