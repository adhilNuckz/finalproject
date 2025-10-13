import React, { useState } from 'react';
import FileTree from './FileTree.jsx';
import FileEditor from './FileEditor.jsx';
import FileToolbar from './FileToolbar.jsx';

export default function FileManager() {
  const mockFileStructure = [ /* mock structure omitted for brevity */ ];
  const [fileStructure, setFileStructure] = useState(mockFileStructure);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1', '2', '3']));

  const handleFileSelect = (file) => { if (file.type === 'file') setSelectedFile(file); };
  const handleFileUpdate = (updatedFile) => {
    const updateFileInStructure = (items) => items.map(item => {
      if (item.id === updatedFile.id) return updatedFile;
      if (item.children) return { ...item, children: updateFileInStructure(item.children) };
      return item;
    });
    setFileStructure(updateFileInStructure(fileStructure));
    setSelectedFile(updatedFile);
  };
  const toggleFolder = (folderId) => { const newExpanded = new Set(expandedFolders); newExpanded.has(folderId) ? newExpanded.delete(folderId) : newExpanded.add(folderId); setExpandedFolders(newExpanded); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Manager</h1>
        <FileToolbar selectedFile={selectedFile} />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700">
            <FileTree files={fileStructure} selectedFile={selectedFile} expandedFolders={expandedFolders} onFileSelect={handleFileSelect} onToggleFolder={toggleFolder} />
          </div>
          <div className="lg:col-span-2">
            <FileEditor file={selectedFile} onFileUpdate={handleFileUpdate} />
          </div>
        </div>
      </div>
    </div>
  );
}
