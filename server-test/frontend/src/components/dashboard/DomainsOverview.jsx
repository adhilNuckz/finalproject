import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, XCircle, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function DomainsOverview() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch(`${API_URL}/domains`);
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!newDomain.trim()) {
      setError('Please enter a domain name');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim(), status: 'active' })
      });

      const data = await response.json();
      
      if (data.success) {
        setDomains([...domains, data.domain]);
        setNewDomain('');
        setShowModal(false);
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error adding domain:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDomain = async (domain) => {
    if (!confirm(`Are you sure you want to delete ${domain}?`)) return;

    try {
      const response = await fetch(`${API_URL}/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setDomains(domains.filter(d => d.domain !== domain));
      } else {
        alert(data.error || 'Failed to delete domain');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Error deleting domain:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'active': return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`;
      case 'inactive': return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`;
      case 'pending': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`;
      default: return `${base} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400`;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Domains</h3>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Domain
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading domains...</div>
        ) : domains.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No domains connected yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Click "Add Domain" to connect your first domain</p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center flex-1">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{domain.domain}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(domain.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getStatusBadge(domain.status)}>{domain.status}</span>
                  {getStatusIcon(domain.status)}
                  <button
                    onClick={() => handleDeleteDomain(domain.domain)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    title="Delete domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Domain</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewDomain('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDomain}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com or nuckz.live"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={submitting}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Enter the domain name you've pointed to this server
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewDomain('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
