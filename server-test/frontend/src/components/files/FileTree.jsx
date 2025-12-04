import React from 'react';
import { FolderOpen, Folder, FileText, Code, Image, Settings, ChevronRight, ChevronDown } from 'lucide-react';

export default function FileTree({ files, selectedFile, onFileSelect, onFolderNavigate }) {
  const getFileIcon = (file) => {
    if (file.type === 'folder') return <Folder className="w-4 h-4 text-blue-500" />;
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html': case 'htm': case 'xml': return <Code className="w-4 h-4 text-orange-500" />;
      case 'css': case 'scss': case 'sass': return <Code className="w-4 h-4 text-blue-500" />;
      case 'js': case 'jsx': case 'ts': case 'tsx': return <Code className="w-4 h-4 text-yellow-500" />;
      case 'php': return <Code className="w-4 h-4 text-purple-500" />;
      case 'json': case 'xml': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return <Image className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => { if (!bytes) return ''; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(1024)); return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`; };

  const renderFileItem = (file, depth = 0) => {
    const isSelected = selectedFile?.id === file.id;
    return (
      <div key={file.id}>
        <div className={`flex items-center px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`} style={{ paddingLeft: `${12 + depth * 20}px` }} onClick={() => { if (file.type === 'folder') { onFolderNavigate(file.path); } else { onFileSelect(file); } }}>
          {file.type === 'folder' && <div className="mr-1"><ChevronRight className="w-3 h-3 text-gray-400" /></div>}
          <div className="mr-2">{getFileIcon(file)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="truncate font-medium">{file.name}</span>
              {file.type === 'file' && file.size && <span className="text-xs text-gray-400 ml-2">{formatFileSize(file.size)}</span>}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(file.modified).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-white">File Explorer</h3></div>
      <div className="py-2">{files.map(file => renderFileItem(file))}</div>
    </div>
  );
}
