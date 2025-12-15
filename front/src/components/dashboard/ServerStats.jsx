import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to server stats socket');
    });

    socket.on('server-stats', (stats) => {
      const timestamp = new Date(stats.timestamp).toLocaleTimeString();
      
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Real-Time Server Performance</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-500 text-white mr-3">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentStats.cpu.usage.toFixed(1)}%
                  <span className="text-xs font-normal text-gray-500 ml-2">({currentStats.cpu.cores} cores)</span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#6B7280" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-500 text-white mr-3">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentStats.memory.percentage.toFixed(1)}%
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({currentStats.memory.used}/{currentStats.memory.total} GB)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#6B7280" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk Usage Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-500 text-white mr-3">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disk Usage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentStats.disk.percentage}%
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({currentStats.disk.used}/{currentStats.disk.total})
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#6B7280" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-500 text-white mr-3">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Uptime</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatUptime(currentStats.uptime.seconds)}
                </p>
              </div>
            </div>
          </div>
          <div className="h-32 flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-center">
              <Clock className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatUptime(currentStats.uptime.seconds)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">System Running Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
