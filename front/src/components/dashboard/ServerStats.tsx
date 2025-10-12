import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Clock } from 'lucide-react';

interface ServerStat {
  label: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

export default function ServerStats() {
  const [stats, setStats] = useState<ServerStat[]>([
    {
      label: 'CPU Usage',
      value: '42%',
      percentage: 42,
      icon: <Cpu className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Memory',
      value: '6.2/16 GB',
      percentage: 39,
      icon: <HardDrive className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      label: 'Disk Usage',
      value: '180/500 GB',
      percentage: 36,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
    {
      label: 'Uptime',
      value: '24d 18h 32m',
      percentage: 99,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => 
        prevStats.map(stat => ({
          ...stat,
          percentage: Math.max(10, Math.min(95, stat.percentage + (Math.random() - 0.5) * 10)),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Server Performance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color} text-white mr-3`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${stat.color}`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}