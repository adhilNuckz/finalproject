import React, { useRef } from 'react';
import { Upload, FolderPlus, FilePlus, Download, Trash2, RefreshCw } from 'lucide-react';

export default function FileToolbar({ selectedFile, onUpload, onNewFolder, onNewFile, onDelete, onDownload, onRefresh }) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
      // Reset input so the same file can be uploaded again
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
      <button 
        onClick={handleUploadClick} 
        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors" 
        title="Upload Files"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload
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
