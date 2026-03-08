import React, { useRef } from 'react';
import { Upload, FolderOpen, FolderPlus, FilePlus, Download, Trash2, RefreshCw } from 'lucide-react';

const IGNORED_PATTERNS = ['.gitignore', '.git', 'node_modules', '.DS_Store', '.env', 'Thumbs.db'];
const isIgnored = (relPath) =>
  IGNORED_PATTERNS.some(p => relPath === p || relPath.startsWith(p + '/') || relPath.includes('/' + p));

export default function FileToolbar({ selectedFile, onUpload, onNewFolder, onNewFile, onDelete, onDownload, onRefresh }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const filterAndUpload = (files) => {
    const filtered = Array.from(files).filter(f => !isIgnored(f.webkitRelativePath || f.name));
    if (filtered.length === 0) { alert('No uploadable files found (hidden/ignored files were skipped).'); return; }
    if (filtered.length < files.length) {
      const skipped = files.length - filtered.length;
      console.info(`Skipped ${skipped} ignored file(s) (.gitignore, node_modules, etc.)`);
    }
    onUpload(filtered);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      filterAndUpload(files);
      e.target.value = '';
    }
  };

  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      filterAndUpload(files);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center px-3 py-2 bg-lava-600 hover:bg-lava-700 text-white text-sm font-medium rounded-lg transition-colors"
        title="Upload Files"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Files
      </button>
      <button
        onClick={() => folderInputRef.current?.click()}
        className="flex items-center px-3 py-2 bg-[#1f1f1f] hover:bg-[#252525] border border-[#333] text-lava-400 text-sm font-medium rounded-lg transition-colors"
        title="Upload Folder"
      >
        <FolderOpen className="w-4 h-4 mr-2" />
        Upload Folder
      </button>
      <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <button 
          onClick={onNewFolder} 
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors" 
          title="New Folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
        <button 
          onClick={onNewFile} 
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
          title="New File"
        >
          <FilePlus className="w-4 h-4" />
        </button>
        <button 
          onClick={onRefresh} 
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
        <button 
          onClick={onDownload} 
          disabled={!selectedFile || selectedFile.type === 'folder'} 
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete} 
          disabled={!selectedFile} 
          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors" 
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
