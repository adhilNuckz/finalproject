import React, { useState } from 'react';
import FileTree from './FileTree';
import FileEditor from './FileEditor';
import FileToolbar from './FileToolbar';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified: string;
  content?: string;
  children?: FileItem[];
}

const mockFileStructure: FileItem[] = [
  {
    id: '1',
    name: 'var',
    type: 'folder',
    path: '/var',
    modified: '2024-01-15',
    children: [
      {
        id: '2',
        name: 'www',
        type: 'folder',
        path: '/var/www',
        modified: '2024-01-15',
        children: [
          {
            id: '3',
            name: 'example.com',
            type: 'folder',
            path: '/var/www/example.com',
            modified: '2024-01-15',
            children: [
              {
                id: '4',
                name: 'index.html',
                type: 'file',
                path: '/var/www/example.com/index.html',
                size: 2048,
                modified: '2024-01-15',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Example.com</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Example.com</h1>
        <p>This is your website's home page.</p>
    </div>
</body>
</html>`
              },
              {
                id: '5',
                name: 'style.css',
                type: 'file',
                path: '/var/www/example.com/style.css',
                size: 1024,
                modified: '2024-01-15',
                content: `/* Main stylesheet for example.com */

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1, h2, h3 {
    color: #2c3e50;
}

.btn {
    background: #3498db;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
}

.btn:hover {
    background: #2980b9;
}`
              },
              {
                id: '6',
                name: 'config.php',
                type: 'file',
                path: '/var/www/example.com/config.php',
                size: 512,
                modified: '2024-01-15',
                content: `<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'example_user');
define('DB_PASS', 'secure_password');
define('DB_NAME', 'example_db');

// Site configuration
define('SITE_URL', 'https://example.com');
define('SITE_NAME', 'Example Website');
define('DEBUG_MODE', false);

// Email configuration
define('MAIL_HOST', 'mail.example.com');
define('MAIL_USER', 'noreply@example.com');
define('MAIL_PASS', 'email_password');

// Security settings
define('SECRET_KEY', 'your-secret-key-here');
define('SALT', 'your-salt-here');
?>`
              }
            ]
          }
        ]
      }
    ]
  }
];

export default function FileManager() {
  const [fileStructure, setFileStructure] = useState<FileItem[]>(mockFileStructure);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['1', '2', '3'])
  );

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  const handleFileUpdate = (updatedFile: FileItem) => {
    const updateFileInStructure = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === updatedFile.id) {
          return updatedFile;
        }
        if (item.children) {
          return { ...item, children: updateFileInStructure(item.children) };
        }
        return item;
      });
    };

    setFileStructure(updateFileInStructure(fileStructure));
    setSelectedFile(updatedFile);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          File Manager
        </h1>
        <FileToolbar selectedFile={selectedFile} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700">
            <FileTree
              files={fileStructure}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onFileSelect={handleFileSelect}
              onToggleFolder={toggleFolder}
            />
          </div>
          <div className="lg:col-span-2">
            <FileEditor
              file={selectedFile}
              onFileUpdate={handleFileUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}