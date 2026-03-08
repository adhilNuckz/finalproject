import React, { useState, useEffect } from 'react';
import { X, Globe, Server, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

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
      <div className="bg-[#141414] rounded-xl shadow-2xl shadow-black/40 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-lava-900/30 bg-lava-900/30 rounded-lg">
              <Globe className="w-6 h-6 text-lava-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-100">DNS Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure DNS for {domain}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Server IP */}
          <div className="bg-lava-900/20 bg-lava-900/20 border border-lava-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Server className="w-5 h-5 text-lava-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-lava-200 text-lava-200">
                  Server IP Address
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="px-3 py-2 bg-[#141414] border border-lava-500/50 rounded text-lava-400 font-mono text-sm flex-1">
                    {serverIP}
                  </code>
                  <button
                    onClick={() => copyToClipboard(serverIP, 'ip')}
                    className="p-2 hover:bg-lava-900/30 rounded transition-colors"
                    title="Copy IP"
                  >
                    {copied.ip ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-lava-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              Setup Instructions
            </h3>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-lava-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  1
                </span>
                <span>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-lava-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  2
                </span>
                <span>Navigate to DNS management for <strong>{domain}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-lava-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  3
                </span>
                <span>Add the DNS records shown below</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-lava-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  4
                </span>
                <span>Wait 5-60 minutes for DNS propagation (varies by provider)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-lava-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  5
                </span>
                <span>Verify DNS is working before installing SSL certificates</span>
              </li>
            </ol>
          </div>

          {/* DNS Records Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              DNS Records to Add
            </h3>
            <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {dnsRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-[#1a1a1a]">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs font-mono rounded">
                          {record.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-100 font-mono">
                          {record.name}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-300 font-mono">
                          {record.value}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyToClipboard(record.value, `record-${index}`)}
                          className="p-1.5 hover:bg-[#1f1f1f] rounded transition-colors"
                          title="Copy value"
                        >
                          {copied[`record-${index}`] ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
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
                <div key={index} className="text-xs text-gray-400 flex items-start">
                  <span className="font-mono font-semibold mr-2">{record.name}:</span>
                  <span>{record.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-200">
                  Important Notes
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-300 list-disc list-inside">
                  <li>DNS changes can take 5-60 minutes to propagate globally</li>
                  <li>Some providers may take up to 48 hours for full propagation</li>
                  <li>Do not install SSL until DNS is fully propagated</li>
                  <li>Use <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">dnschecker.org</a> to verify DNS propagation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Verification Tool */}
          <div className="border border-[#1f1f1f] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              Verify DNS Configuration
            </h3>
            <a
              href={`https://dnschecker.org/#A/${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Check DNS Propagation
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[#1f1f1f]">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
