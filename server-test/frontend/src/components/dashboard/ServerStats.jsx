import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Clock, Signal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../config';

const MAX_DATA_POINTS = 20;

export default function ServerStats() {
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [diskData, setDiskData] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { used: 0, total: 0, percentage: 0 },
    disk: { used: '0G', total: '0G', percentage: 0 },
    uptime: { seconds: 0 }
  });
  const [isConnected, setIsConnected] = useState(false);
  const [hasLiveData, setHasLiveData] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to server stats socket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('server-stats', (stats) => {
      const timestamp = new Date(stats.timestamp).toLocaleTimeString();
      setHasLiveData(true);
      
      setCurrentStats(stats);
      
      // Update CPU data
      setCpuData(prev => {
        const newData = [...prev, { time: timestamp, value: stats.cpu.usage }];
        return newData.slice(-MAX_DATA_POINTS);
      });
      
      // Update Memory data
      setMemoryData(prev => {
        const newData = [...prev, { time: timestamp, value: parseFloat(stats.memory.percentage) }];
        return newData.slice(-MAX_DATA_POINTS);
      });
      
      // Update Disk data
      setDiskData(prev => {
        const newData = [...prev, { time: timestamp, value: stats.disk.percentage }];
        return newData.slice(-MAX_DATA_POINTS);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const chartTooltipStyle = {
    backgroundColor: '#101010',
    border: '1px solid #242424',
    borderRadius: '14px',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)'
  };

  const renderSkeletonCard = (title, icon) => (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10" />
          <div>
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-2 h-5 w-40 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-8 w-20 rounded-full bg-white/10" />
      </div>
      <div className="h-44 rounded-xl bg-white/10" />
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#0b0b0b] p-5 shadow-2xl shadow-black/30 lg:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.08),transparent_26%)]" />
      <div className="relative mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            <Signal className="w-3.5 h-3.5" />
            {isConnected ? 'Live socket connected' : 'Connecting to live stats...'}
          </div>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Real-Time Server Performance</h3>
          <p className="mt-1 text-sm text-gray-400">Smooth live charts for CPU, memory, disk, and uptime.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400 sm:w-[320px]">
          {[
            ['CPU', `${currentStats.cpu.usage.toFixed(1)}%`],
            ['Memory', `${currentStats.memory.percentage.toFixed(1)}%`],
            ['Disk', `${currentStats.disk.percentage}%`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</div>
              <div className="mt-1 text-base font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-lava-500/15 text-lava-300 mr-3">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">CPU Usage</p>
                <p className="text-2xl font-bold text-white">
                  {currentStats.cpu.usage.toFixed(1)}%
                  <span className="text-xs font-normal text-gray-500 ml-2">({currentStats.cpu.cores} cores)</span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-48">
            {hasLiveData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#525252" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#525252" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#fb923c" strokeWidth={2} fill="url(#cpuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              renderSkeletonCard('CPU', Cpu)
            )}
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-300 mr-3">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Memory Usage</p>
                <p className="text-2xl font-bold text-white">
                  {currentStats.memory.percentage.toFixed(1)}%
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({currentStats.memory.used}/{currentStats.memory.total} GB)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-48">
            {hasLiveData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryData}>
                  <defs>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#525252" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#525252" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#fb7185" strokeWidth={2} fill="url(#memoryGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              renderSkeletonCard('Memory', HardDrive)
            )}
          </div>
        </div>

        {/* Disk Usage Chart */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 mr-3">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Disk Usage</p>
                <p className="text-2xl font-bold text-white">
                  {currentStats.disk.percentage}%
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({currentStats.disk.used}/{currentStats.disk.total})
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-48">
            {hasLiveData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diskData}>
                  <defs>
                    <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#525252" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#525252" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#diskGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              renderSkeletonCard('Disk', Activity)
            )}
          </div>
        </div>

        {/* Uptime Display */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-xl bg-lava-500/15 text-lava-300 mr-3">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Server Uptime</p>
                <p className="text-2xl font-bold text-white">
                  {formatUptime(currentStats.uptime.seconds)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex h-48 items-center justify-center rounded-2xl border border-lava-500/10 bg-gradient-to-br from-lava-500/10 via-white/5 to-white/0">
            <div className="text-center">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/10 text-lava-300 shadow-lg shadow-black/20">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-3xl font-black tracking-tight text-white">
                {formatUptime(currentStats.uptime.seconds)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-gray-500">System running time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
