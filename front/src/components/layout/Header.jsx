import React from 'react';
import { RefreshCw, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Server Control Panel
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-lava-600 transition-all duration-200 hover:rotate-180"
            aria-label="Refresh page"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-8 h-8 lava-gradient rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
               <span className="ml-2 text-sm font-medium text-slate-700">
                {user?.username}
              </span>
            </div>

            <button
              onClick={logout}
               className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
