import React, { useState, useEffect } from 'react';
import { Save, Edit3, Eye, X } from 'lucide-react';
import { FileItem } from './FileManager';

interface FileEditorProps {
  file: FileItem | null;
  onFileUpdate: (file: FileItem) => void;
}

export default function FileEditor({ file, onFileUpdate }: FileEditorProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (file?.content) {
      setContent(file.content);
      setIsEditing(false);
      setHasChanges(false);
      setPreviewMode(false);
    }
  }, [file]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== (file?.content || ''));
  };

  const handleSave = () => {
    if (file && hasChanges) {
      const updatedFile = { ...file, content, modified: new Date().toISOString() };
      onFileUpdate(updatedFile);
      setHasChanges(false);
      setIsEditing(false);
    }
  };

  const handleDiscard = () => {
    if (file?.content) {
      setContent(file.content);
      setHasChanges(false);
      setIsEditing(false);
    }
  };

  const getLanguage = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'php':
        return 'php';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      default:
        return 'text';
    }
  };

  const renderPreview = () => {
    if (!file) return null;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'html' || extension === 'htm') {
      return (
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          title="HTML Preview"
        />
      );
    }
    
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
        Preview not available for this file type
      </div>
    );
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Edit3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Select a file to edit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {file.name}
          </h3>
          {hasChanges && (
            <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {file.name.endsWith('.html') && (
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`p-2 rounded-lg transition-colors ${
                previewMode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Toggle Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit File"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDiscard}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Discard Changes"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors"
                title="Save Changes"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {previewMode ? (
          renderPreview()
        ) : (
          <div className="h-full">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full p-4 border-0 resize-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm leading-relaxed"
                style={{ outline: 'none' }}
              />
            ) : (
              <pre className="w-full h-full p-4 overflow-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Language: {getLanguage(file.name)}</span>
          <span>Size: {file.size ? `${file.size} bytes` : 'Unknown'}</span>
        </div>
        <div>
          Modified: {new Date(file.modified).toLocaleString()}
        </div>
      </div>
    </div>
  );
}