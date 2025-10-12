import React from 'react';
import { 
  Upload, 
  FolderPlus, 
  FilePlus, 
  Download, 
  Trash2, 
  Copy,
  RefreshCw
} from 'lucide-react';
import { FileItem } from './FileManager';

interface FileToolbarProps {
  selectedFile: FileItem | null;
}

export default function FileToolbar({ selectedFile }: FileToolbarProps) {
  const handleAction = (action: string) => {
    // Mock actions for prototype
    console.log(`File action: ${action}`, selectedFile);
    
    switch (action) {
      case 'upload':
        // Mock file upload
        alert('File upload functionality would be implemented here');
        break;
      case 'newFolder':
        const folderName = prompt('Enter folder name:');
        if (folderName) {
          alert(`Create folder: ${folderName}`);
        }
        break;
      case 'newFile':
        const fileName = prompt('Enter file name:');
        if (fileName) {
          alert(`Create file: ${fileName}`);
        }
        break;
      case 'download':
        if (selectedFile) {
          alert(`Download: ${selectedFile.name}`);
        }
        break;
      case 'copy':
        if (selectedFile) {
          alert(`Copy: ${selectedFile.name}`);
        }
        break;
      case 'delete':
        if (selectedFile && confirm(`Delete ${selectedFile.name}?`)) {
          alert(`Delete: ${selectedFile.name}`);
        }
        break;
      case 'refresh':
        alert('Refresh file tree');
        break;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleAction('upload')}
        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        title="Upload Files"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </button>
      
      <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleAction('newFolder')}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
          title="New Folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleAction('newFile')}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="New File"
        >
          <FilePlus className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleAction('refresh')}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
        
        <button
          onClick={() => handleAction('download')}
          disabled={!selectedFile || selectedFile.type === 'folder'}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleAction('copy')}
          disabled={!selectedFile}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleAction('delete')}
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