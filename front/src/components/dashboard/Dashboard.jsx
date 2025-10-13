import React from 'react';
import ServerStats from './ServerStats.jsx';
import SitesOverview from './SitesOverview.jsx';
import QuickActions from './QuickActions.jsx';
import SystemAlerts from './SystemAlerts.jsx';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ServerStats /></div>
        <div><QuickActions /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SitesOverview />
        <SystemAlerts />
      </div>
    </div>
  );
}
