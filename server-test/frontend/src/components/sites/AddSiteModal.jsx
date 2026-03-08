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
import { API_BASE_URL } from '../../config.js';

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
    const IGNORED = ['.gitignore', '.git', 'node_modules', '.DS_Store', '.env', 'Thumbs.db'];
    const isIgnored = (f) => IGNORED.some(p =>
      (f.webkitRelativePath || f.name) === p ||
      (f.webkitRelativePath || f.name).startsWith(p + '/') ||
      (f.webkitRelativePath || f.name).includes('/' + p)
    );
    const files = Array.from(e.target.files || []).filter(f => !isIgnored(f));
    const indexFile = files.find(f => f.name === 'index.html' || f.name === 'index.php');
    setFormData(prev => ({
      ...prev,
      localFiles: files,
      mainFile: indexFile
        ? (indexFile.webkitRelativePath || indexFile.name)
        : files.length > 0 ? (files[0].webkitRelativePath || files[0].name) : 'index.html'
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
          // Send relative path so backend can reconstruct folder structure
          fd.append('relativePaths', file.webkitRelativePath || file.name);
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
      <div className="bg-[#141414] rounded-xl shadow-2xl shadow-black/40 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Add New Site</h2>
            <p className="text-sm text-gray-500 mt-1">
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
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center px-6 py-4 bg-[#111111]">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                s <= step 
                  ? 'bg-lava-600 text-white' 
                  : 'bg-[#252525] bg-[#1f1f1f] text-gray-400'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-lava-600' : 'bg-[#252525] bg-[#1f1f1f]'
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
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Select Domain
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.domain}
                    onChange={(e) => {
                    const dom = e.target.value;
                    setFormData(prev => {
                      const prevAuto = `${prev.subdomain}.${prev.domain}`;
                      const shouldAutoFill = !prev.folderName || prev.folderName === prevAuto;
                      return {
                        ...prev,
                        domain: dom,
                        folderName: shouldAutoFill && prev.subdomain && dom ? `${prev.subdomain}.${dom}` : prev.folderName
                      };
                    });
                  }}
                    className="flex-1 px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a] text-gray-100 focus:ring-2 focus:ring-lava-500"
                  >
                    <option value="">Choose a domain...</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.domain}>{d.domain}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddDomain(!showAddDomain)}
                    className="px-4 py-2 bg-[#1f1f1f] bg-[#1f1f1f] hover:bg-[#252525] hover:bg-[#252525] rounded-lg transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Domain
                  </button>
                </div>

                {showAddDomain && (
                  <div className="mt-3 p-4 bg-lava-900/20 bg-lava-900/20 border border-lava-600/30 rounded-lg">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-4 py-2 border border-lava-500/50 rounded-lg bg-[#1a1a1a]"
                      />
                      <button
                        onClick={addDomain}
                        className="px-4 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-lava-400 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span>Make sure your domain's DNS A record points to your server IP before deploying.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const sub = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData(prev => {
                        const prevAuto = `${prev.subdomain}.${prev.domain}`;
                        const shouldAutoFill = !prev.folderName || prev.folderName === prevAuto;
                        return {
                          ...prev,
                          subdomain: sub,
                          folderName: shouldAutoFill && sub && prev.domain ? `${sub}.${prev.domain}` : prev.folderName
                        };
                      });
                    }}
                    placeholder="blog, app, api, www"
                    className="flex-1 px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a] text-gray-100"
                  />
                  <span className="text-gray-500">.{formData.domain || 'domain.com'}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Final URL: {formData.subdomain ? `${formData.subdomain}.${formData.domain || 'domain.com'}` : 'subdomain.domain.com'}
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Upload Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Upload Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, uploadMethod: 'local' }))}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      formData.uploadMethod === 'local'
                        ? 'border-lava-500 bg-lava-900/20 bg-lava-900/20'
                        : 'border-[#252525] hover:border-lava-500/50'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${
                      formData.uploadMethod === 'local' ? 'text-lava-500' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <p className="font-semibold text-gray-100">Upload Local Files</p>
                      <p className="text-xs text-gray-500 mt-1">Upload from your computer</p>
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
                        ? 'border-lava-500 bg-lava-900/20 bg-lava-900/20'
                        : 'border-[#252525] hover:border-lava-500/50'
                    }`}
                  >
                    <Server className={`w-8 h-8 mx-auto mb-3 ${
                      formData.uploadMethod === 'server' ? 'text-lava-500' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <p className="font-semibold text-gray-100">Use Server Files</p>
                      <p className="text-xs text-gray-500 mt-1">Select from server directory</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Local File Upload */}
              {formData.uploadMethod === 'local' && (
                <div className="p-6 border-2 border-dashed border-[#252525] rounded-lg">
                  {/* Hidden inputs: one for files, one for folders */}
                  <input
                    type="file"
                    multiple
                    onChange={handleLocalFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <input
                    type="file"
                    multiple
                    webkitdirectory=""
                    mozdirectory=""
                    onChange={handleLocalFileChange}
                    className="hidden"
                    id="folder-upload"
                  />

                  <div className="flex flex-col items-center justify-center gap-4">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-300">Select files or an entire folder</p>
                    <div className="flex gap-3">
                      <label
                        htmlFor="file-upload"
                        className="px-4 py-2 bg-[#1f1f1f] hover:bg-[#252525] border border-[#333] rounded-lg cursor-pointer text-sm text-gray-300 flex items-center gap-2 transition-colors"
                      >
                        <FileCode className="w-4 h-4" />
                        Select Files
                      </label>
                      <label
                        htmlFor="folder-upload"
                        className="px-4 py-2 bg-lava-900/30 hover:bg-lava-900/50 border border-lava-700/50 rounded-lg cursor-pointer text-sm text-lava-400 flex items-center gap-2 transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Select Folder
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">HTML, CSS, JS, PHP, images — folders preserve structure</p>
                  </div>

                  {formData.localFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm font-medium text-gray-300 mb-2">
                        {formData.localFiles.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'))
                          ? `Selected Folder — ${formData.localFiles.length} files`
                          : `Selected ${formData.localFiles.length} file(s)`
                        }
                      </p>
                      <ul className="space-y-1 max-h-48 overflow-y-auto">
                        {formData.localFiles.map((file, idx) => {
                          const displayPath = file.webkitRelativePath || file.name;
                          const depth = displayPath.split('/').length - 1;
                          return (
                            <li key={idx} className="text-xs text-gray-400 flex items-center" style={{ paddingLeft: `${depth * 12}px` }}>
                              {depth > 0 && <span className="text-gray-600 mr-1">└</span>}
                              <FileCode className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="ml-auto text-gray-600 pl-2">{(file.size / 1024).toFixed(1)}KB</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Server File Browser */}
              {formData.uploadMethod === 'server' && (
                <div className="border border-[#252525] rounded-lg overflow-hidden">
                  <div className="bg-[#1a1a1a] p-3 border-b border-[#252525]">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={currentServerPath}
                        onChange={(e) => setCurrentServerPath(e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border border-[#252525] rounded bg-[#141414]"
                      />
                      <button
                        onClick={() => fetchServerFiles(currentServerPath)}
                        className="px-3 py-1 bg-lava-600 hover:bg-lava-700 text-white text-sm rounded"
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    {serverFiles.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
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
                            className={`w-full text-left px-3 py-2 rounded hover:bg-[#1a1a1a] flex items-center ${
                              formData.serverPath === file.path ? 'bg-lava-900/20 bg-lava-900/20' : ''
                            }`}
                          >
                            {file.isDirectory ? (
                              <FolderOpen className="w-4 h-4 mr-2 text-yellow-500" />
                            ) : (
                              <FileCode className="w-4 h-4 mr-2 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-300">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.serverPath && (
                    <div className="bg-lava-900/20 bg-lava-900/20 p-3 border-t border-lava-600/30">
                      <p className="text-xs text-lava-400">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={formData.folderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, folderName: e.target.value }))}
                    placeholder="my-website"
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Folder Location
                  </label>
                  <input
                    type="text"
                    value={formData.folderLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, folderLocation: e.target.value }))}
                    placeholder="/var/www/html"
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a]"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Full path: {formData.folderLocation}/{formData.folderName}
              </p>

              {/* Main File */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main File (Entry Point)
                </label>
                {formData.uploadMethod === 'local' && formData.localFiles.length > 0 ? (
                  <select
                    value={formData.mainFile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainFile: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a]"
                  >
                    {formData.localFiles.map((file, idx) => {
                      const relPath = file.webkitRelativePath || file.name;
                      return <option key={relPath || idx} value={relPath}>{relPath}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.mainFile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainFile: e.target.value }))}
                    placeholder="index.html"
                    className="w-full px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a]"
                  />
                )}
              </div>

              {/* PHP Version */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PHP Version
                </label>
                <select
                  value={formData.phpVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, phpVersion: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#252525] rounded-lg bg-[#1a1a1a]"
                >
                  <option value="none">No PHP</option>
                  <option value="7.4">PHP 7.4</option>
                  <option value="8.0">PHP 8.0</option>
                  <option value="8.1">PHP 8.1</option>
                  <option value="8.2">PHP 8.2</option>
                </select>
              </div>

              {/* API Routes Configuration */}
              <div className="border border-[#252525] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    API Routes & Backend Configuration
                  </label>
                  <button
                    type="button"
                    onClick={addApiRoute}
                    className="px-3 py-1 bg-lava-600 hover:bg-lava-700 text-white text-xs rounded flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Route
                  </button>
                </div>

                {formData.apiRoutes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No API routes configured. Add routes if your frontend makes API calls.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.apiRoutes.map((route, idx) => (
                      <div key={idx} className="p-3 bg-[#1a1a1a] rounded border border-[#1f1f1f]">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={route.path}
                              onChange={(e) => updateApiRoute(idx, 'path', e.target.value)}
                              placeholder="/api"
                              className="w-full px-2 py-1 text-sm border border-[#252525] rounded bg-[#141414]"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={route.port}
                              onChange={(e) => updateApiRoute(idx, 'port', e.target.value)}
                              placeholder="Port (3000)"
                              className="w-full px-2 py-1 text-sm border border-[#252525] rounded bg-[#141414]"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={route.description}
                              onChange={(e) => updateApiRoute(idx, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1 text-sm border border-[#252525] rounded bg-[#141414]"
                            />
                          </div>
                          <div className="col-span-1 flex items-center">
                            <button
                              type="button"
                              onClick={() => removeApiRoute(idx)}
                              className="p-1 hover:bg-red-900/40 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500 bg-lava-900/20 bg-lava-900/20 p-2 rounded">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  API routes will be proxied to the specified backend port (e.g., /api → localhost:3000)
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {/* SSL Configuration */}
              <div className="border border-[#252525] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">SSL Certificate</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableSSL}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableSSL: e.target.checked }))}
                      className="w-5 h-5 rounded border-[#252525] text-lava-500 focus:ring-lava-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        Enable SSL/HTTPS
                      </p>
                      <p className="text-xs text-gray-500">
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
                        className="w-4 h-4 rounded border-[#252525] text-lava-500 focus:ring-lava-500"
                      />
                      <p className="text-sm text-gray-300">
                        Auto-renew SSL certificate
                      </p>
                    </label>
                  )}
                </div>

                {formData.enableSSL && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded">
                    <p className="text-xs text-yellow-400 flex items-start">
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
              <div className="border border-[#252525] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Review Configuration</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Domain:</span>
                    <span className="font-medium text-gray-100">
                      {formData.subdomain}.{formData.domain}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Document Root:</span>
                    <span className="font-medium text-gray-100">
                      {formData.folderLocation}/{formData.folderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Main File:</span>
                    <span className="font-medium text-gray-100">
                      {formData.mainFile}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Upload Method:</span>
                    <span className="font-medium text-gray-100 capitalize">
                      {formData.uploadMethod}
                    </span>
                  </div>
                  {formData.uploadMethod === 'local' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Files:</span>
                      <span className="font-medium text-gray-100">
                        {formData.localFiles.length} file(s)
                      </span>
                    </div>
                  )}
                  {formData.apiRoutes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">API Routes:</span>
                      <span className="font-medium text-gray-100">
                        {formData.apiRoutes.length} route(s) configured
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">SSL:</span>
                    <span className="font-medium text-gray-100">
                      {formData.enableSSL ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#1f1f1f]">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-300 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          
          <div className="flex space-x-2">
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
                className="px-6 py-2 bg-lava-600 hover:bg-lava-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
