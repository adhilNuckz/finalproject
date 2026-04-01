import React from 'react';
import { LayoutDashboard, Globe, FolderOpen, Terminal, Brain, Server, Activity, Settings, FolderGit2, Database } from 'lucide-react';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', name: 'Projects', icon: FolderGit2 },
  { id: 'apache-config', name: 'Apache Config', icon: Settings },
  { id: 'sites', name: 'Sites', icon: Globe },
  { id: 'files', name: 'Files', icon: FolderOpen },
  { id: 'pm2', name: 'PM2 Manager', icon: Activity },  
  { id: 'databases', name: 'Databases', icon: Database },
  { id: 'terminal', name: 'Terminal', icon: Terminal },
  { id: 'ai-insights', name: 'AI Insights', icon: Brain },
];

export default function Sidebar({ currentPage, onPageChange }) {
  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center">
          <div className="w-10 h-10 lava-gradient rounded-lg flex items-center justify-center lava-glow">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-white">
              Hosting Manager
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-lava-600/20 to-lava-500/10 text-lava-400 border-l-2 border-lava-500'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-lava-300 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-lava-400' : ''}`} />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
