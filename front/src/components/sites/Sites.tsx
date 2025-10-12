import React, { useState } from 'react';
import SitesList from './SitesList';
import SiteDetails from './SiteDetails';
import { Plus } from 'lucide-react';

export interface Site {
  id: string;
  domain: string;
  status: 'online' | 'offline' | 'maintenance';
  ssl: boolean;
  visitors: string;
  created: string;
  path: string;
  phpVersion: string;
}

const mockSites: Site[] = [
  {
    id: '1',
    domain: 'example.com',
    status: 'online',
    ssl: true,
    visitors: '1.2k',
    created: '2024-01-15',
    path: '/var/www/example.com',
    phpVersion: '8.2',
  },
  {
    id: '2',
    domain: 'blog.example.com',
    status: 'online',
    ssl: true,
    visitors: '340',
    created: '2024-02-10',
    path: '/var/www/blog.example.com',
    phpVersion: '8.1',
  },
  {
    id: '3',
    domain: 'api.example.com',
    status: 'maintenance',
    ssl: true,
    visitors: '89',
    created: '2024-03-05',
    path: '/var/www/api.example.com',
    phpVersion: '8.2',
  },
  {
    id: '4',
    domain: 'dev.example.com',
    status: 'offline',
    ssl: false,
    visitors: '12',
    created: '2024-03-20',
    path: '/var/www/dev.example.com',
    phpVersion: '7.4',
  },
];

export default function Sites() {
  const [sites, setSites] = useState<Site[]>(mockSites);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSiteUpdate = (updatedSite: Site) => {
    setSites(prevSites =>
      prevSites.map(site => (site.id === updatedSite.id ? updatedSite : site))
    );
    setSelectedSite(updatedSite);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sites & Domains
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Site
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SitesList
            sites={sites}
            selectedSite={selectedSite}
            onSiteSelect={setSelectedSite}
            onSiteUpdate={handleSiteUpdate}
          />
        </div>
        <div>
          {selectedSite ? (
            <SiteDetails
              site={selectedSite}
              onSiteUpdate={handleSiteUpdate}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a site to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}