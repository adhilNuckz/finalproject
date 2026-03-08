import React, { useState } from 'react';
import { Server, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(username, password);
    
    if (!success) {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Lava ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lava-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-ember-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl shadow-2xl shadow-black/40 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 lava-gradient rounded-xl mb-4 lava-glow">
              <Server className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Linux Hosting Manager
            </h1>
            <p className="text-gray-500">
              Sign in to your hosting dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-lava-500/50 focus:border-lava-500 bg-[#0e0e0e] text-white placeholder-gray-600 transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-lava-500/50 focus:border-lava-500 bg-[#0e0e0e] text-white placeholder-gray-600 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-ember-900/30 border border-ember-800 rounded-lg p-3">
                <p className="text-sm text-ember-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full lava-gradient hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all focus:ring-2 focus:ring-lava-500/50 focus:ring-offset-2 focus:ring-offset-[#141414]"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-lava-900/20 border border-lava-800/30 rounded-lg">
            <p className="text-sm text-lava-400 text-center">
              <strong>Demo Credentials:</strong><br />
              Username: admin | Password: admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
