import React from 'react';
import { Globe, FolderOpen, Code, Calendar } from 'lucide-react';

export default function SiteDetails({ site, onSiteUpdate }) {
  return (
    <div className="bg-[#141414] rounded-xl shadow-sm shadow-black/20 border border-[#1f1f1f] p-6">
      <div className="flex items-center mb-6"><Globe className="w-6 h-6 text-lava-400 mr-3" /><h3 className="text-lg font-semibold text-gray-100">{site.domain}</h3></div>
      <div className="space-y-4">
        <div className="p-4 bg-[#1a1a1a] rounded-lg"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-400">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${site.status === 'online' ? 'bg-green-900/30 text-green-400' : site.status === 'offline' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{site.status}</span></div><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-400">SSL Certificate</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${site.ssl ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{site.ssl ? 'Enabled' : 'Disabled'}</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-400">Daily Visitors</span><span className="text-sm font-bold text-gray-100">{site.visitors}</span></div></div>
        <div className="space-y-3"><div className="flex items-center"><FolderOpen className="w-4 h-4 text-gray-400 mr-3" /><div><p className="text-sm font-medium text-gray-100">Document Root</p><p className="text-sm text-gray-500">{site.path}</p></div></div><div className="flex items-center"><Calendar className="w-4 h-4 text-gray-400 mr-3" /><div><p className="text-sm font-medium text-gray-100">Created</p><p className="text-sm text-gray-500">{new Date(site.created).toLocaleDateString()}</p></div></div></div>
        <div className="pt-4 border-t border-[#1f1f1f]"><h4 className="text-sm font-medium text-gray-100 mb-3">Quick Actions</h4><div className="space-y-2"><button className="w-full text-left px-3 py-2 text-sm bg-lava-900/20 bg-lava-900/30 text-lava-400 rounded-lg hover:bg-lava-900/30 hover:bg-lava-900/40 transition-colors">Configure DNS</button><button className="w-full text-left px-3 py-2 text-sm bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/40 hover:bg-green-900/40 transition-colors">Create Backup</button><button className="w-full text-left px-3 py-2 text-sm bg-purple-900/30 text-purple-300 rounded-lg hover:bg-purple-900/40 hover:bg-purple-900/40 transition-colors">View Analytics</button><button className="w-full text-left px-3 py-2 text-sm bg-red-900/30 text-red-300 rounded-lg hover:bg-red-900/40 hover:bg-red-900/40 transition-colors">Delete Site</button></div></div>
      </div>
    </div>
  );       
}
