import React, { useState, useEffect } from 'react';
import FileTree from './FileTree.jsx';
import FileEditor from './FileEditor.jsx';
import FileToolbar from './FileToolbar.jsx';

const API_BASE = 'http://localhost:5000';

function mapEntriesToTree(entries, parentPath) {
  return entries.map((e, idx) => ({
    id: `${parentPath}:${e.name}:${idx}`,
    name: e.name,
    type: e.isDirectory ? 'folder' : 'file',
    size: e.size,
    modified: e.modified || Date.now(),
    path: parentPath ? `${parentPath}/${e.name}` : e.name
  }));
}

export default function FileManager() {
  const [fileStructure, setFileStructure] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPath, setCurrentPath] = useState('/var/www/html');
  const [pathInput, setPathInput] = useState('/var/www/html');
  const [history, setHistory] = useState([]);
  const [allowedRoots, setAllowedRoots] = useState(['/var/www/html']);
  const [homeDir, setHomeDir] = useState(null);

  useEffect(() => {
    fetchServerPaths();
    fetchList(currentPath);
  }, [currentPath]);

  const fetchServerPaths = async () => {
    try {
      const res = await fetch(`${API_BASE}/server/paths`);
      const data = await res.json();
      if (data.success) {
        setAllowedRoots(data.allowedRoots);
        setHomeDir(data.homeDir);
      }
    } catch (e) {
      console.error('Failed to fetch server paths', e);
    }
  };

  const fetchList = async (dirPath) => {
    try {
      const res = await fetch(`${API_BASE}/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dirs: [dirPath] }) });
      const data = await res.json();
      if (data.success) {
        const root = data.result[dirPath];
        if (root && root.success) {
          const tree = mapEntriesToTree(root.entries, dirPath);
          setFileStructure(tree);
          setPathInput(dirPath);
        } else {
          setFileStructure([]);
        }
      }
    } catch (e) { console.error('Failed to load file list', e); setFileStructure([]); }
  };

  const handleFileSelect = async (file) => {
    if (file.type === 'file') {
      // read file content from server
      try {
        const res = await fetch(`${API_BASE}/files/read`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: file.path }) });
        const data = await res.json();
        if (data.success) {
          setSelectedFile({ ...file, content: data.content, size: data.size, modified: data.modified });
        } else {
          alert('Failed to read file: ' + (data.error || 'unknown'));
        }
      } catch (e) { console.error('Read failed', e); }
    } else if (file.type === 'folder') {
      // navigate into folder (update currentPath & history)
      setHistory(prev => [...prev, currentPath]);
      setCurrentPath(file.path);
    }
  };

  const handleFileUpdate = async (updatedFile) => {
    // write back to server
    try {
      const res = await fetch(`${API_BASE}/files/write`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: updatedFile.path, content: updatedFile.content }) });
      const data = await res.json();
      if (data.success) {
        // update selected file
        setSelectedFile({ ...updatedFile, size: data.size, modified: data.modified });
      } else {
        alert('Save failed: ' + (data.error || 'unknown'));
      }
    } catch (e) { console.error('Save failed', e); }
  };

  const isPathAllowed = (p) => {
    return allowedRoots.some(root => p === root || p.startsWith(root + '/'));
  };

  const goToPath = (p) => {
    if (!p) return;
    // Check if path is under any allowed root
    if (!isPathAllowed(p)) {
      alert(`Path must be under one of: ${allowedRoots.join(', ')}`);
      return;
    }
    setHistory(prev => [...prev, currentPath]);
    setCurrentPath(p);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return; // Already at root
    parts.pop();
    const up = parts.length > 0 ? '/' + parts.join('/') : '/';
    if (!isPathAllowed(up)) return; // Don't go above allowed roots
    setHistory(prev => [...prev, currentPath]);
    setCurrentPath(up);
  };

  const goToHome = () => {
    if (homeDir && isPathAllowed(homeDir)) {
      setHistory(prev => [...prev, currentPath]);
      setCurrentPath(homeDir);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = ['/', ...pathParts.map((p, i) => ({ name: p, path: '/' + pathParts.slice(0, i + 1).join('/') }))];

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('targetPath', currentPath);
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const res = await fetch(`${API_BASE}/files/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        alert(`${data.files.length} file(s) uploaded successfully!`);
        fetchList(currentPath);
      } else {
        alert('Upload failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed: ' + e.message);
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    const newPath = `${currentPath}/${folderName}`;
    try {
      const res = await fetch(`${API_BASE}/files/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: newPath, isDirectory: true }) });
      const data = await res.json();
      if (data.success) {
        fetchList(currentPath);
      } else {
        alert('Failed to create folder: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Create folder failed', e);
      alert('Failed to create folder: ' + e.message);
    }
  };

  const handleNewFile = async () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    const newPath = `${currentPath}/${fileName}`;
    try {
      const res = await fetch(`${API_BASE}/files/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: newPath, isDirectory: false }) });
      const data = await res.json();
      if (data.success) {
        fetchList(currentPath);
      } else {
        alert('Failed to create file: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Create file failed', e);
      alert('Failed to create file: ' + e.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    if (!confirm(`Delete ${selectedFile.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/files/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selectedFile.path }) });
      const data = await res.json();
      if (data.success) {
        setSelectedFile(null);
        fetchList(currentPath);
      } else {
        alert('Failed to delete: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete: ' + e.message);
    }
  };

  const handleDownload = () => {
    if (!selectedFile || selectedFile.type === 'folder') return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchList(currentPath);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Manager</h1>
        <FileToolbar 
          selectedFile={selectedFile} 
          currentPath={currentPath}
          onUpload={handleUpload}
          onNewFolder={handleNewFolder}
          onNewFile={handleNewFile}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onRefresh={handleRefresh}
        />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button onClick={() => goToPath('/var/www/html')} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50">Web Root</button>
              {homeDir && (
                <button onClick={goToHome} className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50">Home</button>
              )}
            </div>
            <div className="flex-1" />
            <div className="flex items-center space-x-2">
              <button onClick={navigateUp} className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded hover:bg-gray-200 dark:hover:bg-gray-800">↑ Up</button>
              <input value={pathInput} onChange={(e) => setPathInput(e.target.value)} className="text-sm px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              <button onClick={() => goToPath(pathInput)} className="text-sm px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Go</button>
            </div>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-400">/</span>}
                <button onClick={() => goToPath(b.path)} className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">{b.name || 'root'}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
            <FileTree files={fileStructure} selectedFile={selectedFile} onFileSelect={handleFileSelect} onFolderNavigate={(p) => goToPath(p)} />
          </div>
          <div className="lg:col-span-2 overflow-hidden">
            <FileEditor file={selectedFile} onFileUpdate={handleFileUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}
