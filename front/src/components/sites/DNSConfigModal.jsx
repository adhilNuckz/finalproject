import React, { useState, useEffect } from 'react';
import { X, Globe, Server, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { API_URL } from '../../config.js';

const API_BASE = API_URL;

export default function DNSConfigModal({ domain, onClose }) {
  const [serverIP, setServerIP] = useState('Loading...');
  const [copied, setCopied] = useState({});

  useEffect(() => {
    fetchServerIP();
  }, []);

  const fetchServerIP = async () => {
    try {
      const res = await fetch(`${API_BASE}/server/ip`);
      const data = await res.json();
      if (data.success) {
        setServerIP(data.ip);
      }
    } catch (error) {
      console.error('Failed to fetch server IP:', error);
      setServerIP('Error loading IP');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const dnsRecords = [
    {
      type: 'A',
      name: '@',
      value: serverIP,
      description: 'Points your root domain to the server'
    },
    {
      type: 'A',
      name: 'www',
      value: serverIP,
      description: 'Points www subdomain to the server'
    },
    {
      type: 'A',
      name: '*',
      value: serverIP,
      description: 'Points all subdomains to the server (wildcard)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">DNS Configuration</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure DNS for {domain}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Server IP */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Server IP Address
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 font-mono text-sm flex-1">
                    {serverIP}
                  </code>
                  <button
                    onClick={() => copyToClipboard(serverIP, 'ip')}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Copy IP"
                  >
                    {copied.ip ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Setup Instructions
            </h3>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  1
                </span>
                <span>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  2
                </span>
                <span>Navigate to DNS management for <strong>{domain}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  3
                </span>
                <span>Add the DNS records shown below</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  4
                </span>
                <span>Wait 5-60 minutes for DNS propagation (varies by provider)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  5
                </span>
                <span>Verify DNS is working before installing SSL certificates</span>
              </li>
            </ol>
          </div>

          {/* DNS Records Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              DNS Records to Add
            </h3>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dnsRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-mono rounded">
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-900 dark:text-white font-mono">
                          {record.name}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {record.value}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyToClipboard(record.value, `record-${index}`)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Copy value"
                        >
                          {copied[`record-${index}`] ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Record descriptions */}
            <div className="mt-3 space-y-2">
              {dnsRecords.map((record, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="font-mono font-semibold mr-2">{record.name}:</span>
                  <span>{record.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Important Notes
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside">
                  <li>DNS changes can take 5-60 minutes to propagate globally</li>
                  <li>Some providers may take up to 48 hours for full propagation</li>
                  <li>Do not install SSL until DNS is fully propagated</li>
                  <li>Use <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900 dark:hover:text-yellow-100">dnschecker.org</a> to verify DNS propagation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Verification Tool */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Verify DNS Configuration
            </h3>
            <a
              href={`https://dnschecker.org/#A/${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Check DNS Propagation
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
