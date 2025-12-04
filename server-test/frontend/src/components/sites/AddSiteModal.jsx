import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FolderOpen, 
  Globe, 
  Server, 
  FileCode, 
  Settings,
  AlertCircle,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API_BASE = API_BASE_URL;

export default function AddSiteModal({ onClose, onCreated, isServerInterface = false }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    domain: '',
    subdomain: '',
    uploadMethod: 'local', // 'local' or 'server'
    localFiles: [],
    serverPath: '',
    folderName: '',
    folderLocation: '/var/www/html',
    mainFile: 'index.html',
    apiRoutes: [],
    backendPort: '',
    phpVersion: '8.1',
    enableSSL: false,
    autoRenewSSL: true,
  });

  // Available domains
  const [domains, setDomains] = useState([]);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  // Server file browser
  const [serverFiles, setServerFiles] = useState([]);
  const [currentServerPath, setCurrentServerPath] = useState('/home');

  useEffect(() => {
    fetchDomains();
    if (isServerInterface) {
      setFormData(prev => ({ ...prev, uploadMethod: 'server' }));
    }
  }, [isServerInterface]);

  const fetchDomains = async () => {
    try {
      const res = await fetch(`${API_BASE}/domains`);
      const data = await res.json();
      if (data.success) {
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const addDomain = async () => {
    if (!newDomain) return;
    try {
      const res = await fetch(`${API_BASE}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain, status: 'active' })
      });
      const data = await res.json();
      if (data.success) {
        await fetchDomains();
        setFormData(prev => ({ ...prev, domain: newDomain }));
        setNewDomain('');
        setShowAddDomain(false);
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
    }
  };

  const fetchServerFiles = async (path) => {
    try {
      const res = await fetch(`${API_BASE}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: [path] })
      });
      const data = await res.json();
      if (data.success && data.result[path]) {
        setServerFiles(data.result[path].entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch server files:', error);
    }
  };

  const handleLocalFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      localFiles: files,
      mainFile: files.length > 0 ? files[0].name : 'index.html'
    }));
  };

  const addApiRoute = () => {
    setFormData(prev => ({
      ...prev,
      apiRoutes: [...prev.apiRoutes, { path: '', port: '', description: '' }]
    }));
  };

  const updateApiRoute = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      apiRoutes: prev.apiRoutes.map((route, i) => 
        i === index ? { ...route, [field]: value } : route
      )
    }));
  };

  const removeApiRoute = (index) => {
    setFormData(prev => ({
      ...prev,
      apiRoutes: prev.apiRoutes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      
      // Basic info
      fd.append('domain', formData.domain);
      fd.append('subdomain', formData.subdomain);
      fd.append('folderName', formData.folderName);
      fd.append('folderLocation', formData.folderLocation);
      fd.append('mainFile', formData.mainFile);
      fd.append('phpVersion', formData.phpVersion);
      
      // Upload method and files
      fd.append('uploadMethod', formData.uploadMethod);
      if (formData.uploadMethod === 'local') {
        formData.localFiles.forEach(file => {
          fd.append('files', file);
        });
      } else {
        fd.append('serverPath', formData.serverPath);
      }
      
      // API routes
      fd.append('apiRoutes', JSON.stringify(formData.apiRoutes));
      fd.append('backendPort', formData.backendPort);
      
      // SSL
      fd.append('enableSSL', formData.enableSSL);
      fd.append('autoRenewSSL', formData.autoRenewSSL);

      const res = await fetch(`${API_BASE}/site/create-advanced`, {
        method: 'POST',
        body: fd
      });

      const data = await res.json();
      
      if (data.success) {
        onCreated();
        onClose();
      } else {
        alert('Failed to create site: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create site:', error);
      alert('Failed to create site: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.domain && formData.subdomain;
      case 2:
        if (formData.uploadMethod === 'local') {
          return formData.localFiles.length > 0;
        } else {
          return formData.serverPath;
        }
      case 3:
        return formData.folderName && formData.mainFile;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Site</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {step} of 4: {
                step === 1 ? 'Domain Configuration' :
                step === 2 ? 'File Upload' :
                step === 3 ? 'Site Configuration' :
                'Review & Deploy'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center px-6 py-4 bg-gray-50 dark:bg-gray-900">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                s <= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Domain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Select Domain
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a domain...</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.domain}>{d.domain}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddDomain(!showAddDomain)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Domain
                  </button>
                </div>

                {showAddDomain && (
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700"
                      />
                      <button
                        onClick={addDomain}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span>Make sure your domain's DNS A record points to your server IP before deploying.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="blog, app, api, www"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400">.{formData.domain || 'domain.com'}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Final URL: {formData.subdomain ? `${formData.subdomain}.${formData.domain || 'domain.com'}` : 'subdomain.domain.com'}
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Upload Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Upload Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, uploadMethod: 'local' }))}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.uploadMethod === 'local'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${
                      formData.uploadMethod === 'local' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-white">Upload Local Files</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload from your computer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, uploadMethod: 'server' }));
                      fetchServerFiles(currentServerPath);
                    }}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.uploadMethod === 'server'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <Server className={`w-8 h-8 mx-auto mb-3 ${
                      formData.uploadMethod === 'server' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 dark:text-white">Use Server Files</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select from server directory</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Local File Upload */}
              {formData.uploadMethod === 'local' && (
                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <input
                    type="file"
                    multiple
                    onChange={handleLocalFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Click to upload files
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      HTML, CSS, JS, PHP, images, etc.
                    </p>
                  </label>

                  {formData.localFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Selected Files ({formData.localFiles.length})
                      </p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {formData.localFiles.map((file, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                            <FileCode className="w-3 h-3 mr-2" />
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Server File Browser */}
              {formData.uploadMethod === 'server' && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-300 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={currentServerPath}
                        onChange={(e) => setCurrentServerPath(e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                      <button
                        onClick={() => fetchServerFiles(currentServerPath)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    {serverFiles.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No files found. Enter a path and click Browse.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {serverFiles.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (file.isDirectory) {
                                setCurrentServerPath(file.path);
                                fetchServerFiles(file.path);
                              } else {
                                setFormData(prev => ({ ...prev, serverPath: file.path }));
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                              formData.serverPath === file.path ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {file.isDirectory ? (
                              <FolderOpen className="w-4 h-4 mr-2 text-yellow-500" />
                            ) : (
                              <FileCode className="w-4 h-4 mr-2 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-200">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.serverPath && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Selected: {formData.serverPath}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Folder Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={formData.folderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, folderName: e.target.value }))}
                    placeholder="my-website"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Folder Location
                  </label>
                  <input
                    type="text"
                    value={formData.folderLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, folderLocation: e.target.value }))}
                    placeholder="/var/www/html"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Full path: {formData.folderLocation}/{formData.folderName}
              </p>

              {/* Main File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Main File (Entry Point)
                </label>
                {formData.uploadMethod === 'local' && formData.localFiles.length > 0 ? (
                  <select
                    value={formData.mainFile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainFile: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {formData.localFiles.map((file) => (
                      <option key={file.name} value={file.name}>{file.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.mainFile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainFile: e.target.value }))}
                    placeholder="index.html"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                )}
              </div>

              {/* PHP Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  PHP Version
                </label>
                <select
                  value={formData.phpVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, phpVersion: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="none">No PHP</option>
                  <option value="7.4">PHP 7.4</option>
                  <option value="8.0">PHP 8.0</option>
                  <option value="8.1">PHP 8.1</option>
                  <option value="8.2">PHP 8.2</option>
                </select>
              </div>

              {/* API Routes Configuration */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    API Routes & Backend Configuration
                  </label>
                  <button
                    type="button"
                    onClick={addApiRoute}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Route
                  </button>
                </div>

                {formData.apiRoutes.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                    No API routes configured. Add routes if your frontend makes API calls.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.apiRoutes.map((route, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={route.path}
                              onChange={(e) => updateApiRoute(idx, 'path', e.target.value)}
                              placeholder="/api"
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={route.port}
                              onChange={(e) => updateApiRoute(idx, 'port', e.target.value)}
                              placeholder="Port (3000)"
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={route.description}
                              onChange={(e) => updateApiRoute(idx, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div className="col-span-1 flex items-center">
                            <button
                              type="button"
                              onClick={() => removeApiRoute(idx)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  API routes will be proxied to the specified backend port (e.g., /api → localhost:3000)
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {/* SSL Configuration */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SSL Certificate</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableSSL}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableSSL: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Enable SSL/HTTPS
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Install free SSL certificate using Let's Encrypt (Certbot)
                      </p>
                    </div>
                  </label>

                  {formData.enableSSL && (
                    <label className="flex items-center space-x-3 cursor-pointer ml-8">
                      <input
                        type="checkbox"
                        checked={formData.autoRenewSSL}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoRenewSSL: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Auto-renew SSL certificate
                      </p>
                    </label>
                  )}
                </div>

                {formData.enableSSL && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        Make sure your domain's DNS is properly configured and pointing to this server before enabling SSL.
                        SSL installation will fail if the domain is not accessible.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Review Configuration */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Configuration</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Domain:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.subdomain}.{formData.domain}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Document Root:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.folderLocation}/{formData.folderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Main File:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.mainFile}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Upload Method:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {formData.uploadMethod}
                    </span>
                  </div>
                  {formData.uploadMethod === 'local' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Files:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.localFiles.length} file(s)
                      </span>
                    </div>
                  )}
                  {formData.apiRoutes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">API Routes:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.apiRoutes.length} route(s) configured
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">SSL:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.enableSSL ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          <div className="flex space-x-2">
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Deploy Site
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
