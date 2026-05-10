import React, { useState, useEffect } from 'react';
import ServerStats from './ServerStats.jsx';
import DomainsOverview from './DomainsOverview.jsx';
import QuickActions from './QuickActions.jsx';
import SystemAlerts from './SystemAlerts.jsx';
import AddSiteModal from '../sites/AddSiteModal.jsx';
import { Server, Sparkles, ShieldCheck, Activity, Globe2, Bell, GitBranch, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function Dashboard() {
  const [serverIp, setServerIp] = useState('Loading...');
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    fetchServerIp();
    fetchProjects();
    const interval = setInterval(fetchProjects, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerIp = async () => {
    setIsLoadingIp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/server/ip`);
      const data = await response.json();
      if (data.success) {
        setServerIp(data.ip);
      }
    } catch (err) {
      console.error('Error fetching server IP:', err);
      setServerIp('Unable to fetch IP');
    } finally {
      setIsLoadingIp(false);
    }
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const notifications = [
    ...(projects || [])
      .filter((project) => project.git && !project.git.error)
      .map((project) => {
        const behind = Number(project.git.behind || 0);
        const ahead = Number(project.git.ahead || 0);
        return {
          id: `repo-${project.id}`,
          type: behind > 0 ? 'warning' : ahead > 0 ? 'info' : 'success',
          title: project.name,
          message: behind > 0
            ? `${behind} recent push${behind === 1 ? '' : 'es'} available on ${project.git.branch}`
            : ahead > 0
              ? `${ahead} local commit${ahead === 1 ? '' : 's'} not pushed yet`
              : `Repo synced on ${project.git.branch}`,
          meta: project.git.lastCommit?.committedAt ? new Date(project.git.lastCommit.committedAt).toLocaleString() : 'Just checked'
        };
      })
      .slice(0, 4),
    {
      id: 'system-alerts',
      type: 'info',
      title: 'System alerts enabled',
      message: 'Monitor CPU, backups, SSL, and service state from the dashboard.',
      meta: 'Live'
    }
  ];

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'warning': return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
      case 'success': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
      case 'info': return 'border-blue-500/20 bg-blue-500/10 text-blue-200';
      default: return 'border-white/10 bg-white/5 text-gray-200';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-x-0 top-0 h-56 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-8 top-6 h-36 w-36 rounded-full bg-lava-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-12 top-10 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-lava-400" />
            Live infrastructure overview
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-gray-400">
            Monitor server health, manage domains, and launch common actions from one polished control center.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 backdrop-blur">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.65)] animate-pulse" />
          <span>Last updated</span>
          <span className="font-medium text-white">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Server IP Address */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a120f] via-[#151515] to-[#090909] shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_30%)]" />
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg shadow-black/20 backdrop-blur">
                <Server className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-orange-100/90">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  Server IP Address
                </div>
                <div className="min-h-8 text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                  {isLoadingIp ? (
                    <div className="h-8 w-56 rounded-lg bg-white/10 animate-pulse" />
                  ) : (
                    serverIp
                  )}
                </div>
                <p className="text-xs text-orange-100/80">
                  Point your domain&apos;s A record to this IP address to bring the site online.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(serverIp);
                  alert('IP address copied to clipboard!');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Globe2 className="w-4 h-4" />
                Copy IP
              </button>
              <button
                onClick={fetchServerIp}
                className="inline-flex items-center gap-2 rounded-xl bg-lava-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lava-600"
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      

      {/* System Metrics (Graphs in Hero Section) */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a120f]/40 via-[#151515]/40 to-[#090909]/40 p-6 backdrop-blur-sm shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-lava-400" />
          <h2 className="text-lg font-semibold text-white">System Metrics</h2>
        </div>
        <ServerStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                <Bell className="w-3.5 h-3.5 text-lava-400" />
                Notifications
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">Recent project and system activity</h2>
            </div>
            <button onClick={fetchProjects} className="text-xs text-gray-400 hover:text-white transition">
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {projectsLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 rounded-2xl bg-white/5" />
                <div className="h-16 rounded-2xl bg-white/5" />
                <div className="h-16 rounded-2xl bg-white/5" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((note) => (
                <div key={note.id} className={`rounded-2xl border p-4 ${getNotificationStyles(note.type)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-white/10 bg-black/20 p-2">
                      {note.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-300" /> : <GitBranch className="w-4 h-4 text-lava-300" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">{note.title}</h3>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{note.meta}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-300">{note.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
                No notifications yet. Recent pushes and alerts will appear here.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111111]/80 p-5 backdrop-blur-sm shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Notification Shortcuts</h2>
          </div>
          <SystemAlerts />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions onAddSite={() => setShowAddSiteModal(true)} />
        <DomainsOverview />
      </div>

      {/* Add Site Modal */}
      {showAddSiteModal && (
        <AddSiteModal
          onClose={() => setShowAddSiteModal(false)}
          onCreated={() => {
            // Optionally refresh dashboard data here
          }}
          isServerInterface={false}
        />
      )}
    </div>
  );
}
