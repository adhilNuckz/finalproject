import React, { useState } from 'react';
import SitesList from './SitesList.jsx';
import SiteDetails from './SiteDetails.jsx';
import { Plus } from 'lucide-react';

const mockSites = [ /* mock sites omitted for brevity */ ];

export default function Sites() {
  const [sites, setSites] = useState(mockSites);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSiteUpdate = (updatedSite) => { setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s)); setSelectedSite(updatedSite); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sites & Domains</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"><Plus className="w-5 h-5 mr-2" />Add New Site</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SitesList sites={sites} selectedSite={selectedSite} onSiteSelect={setSelectedSite} onSiteUpdate={handleSiteUpdate} />
        </div>
        <div>
          {selectedSite ? <SiteDetails site={selectedSite} onSiteUpdate={handleSiteUpdate} /> : <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"><p className="text-gray-500 dark:text-gray-400">Select a site to view details</p></div>}
        </div>
      </div>
    </div>
  );
}
