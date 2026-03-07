import React, { useState, useEffect, useRef } from 'react';
import {
  FolderGit2, Plus, RefreshCw, Trash2, GitBranch, GitCommit,
  ArrowDownToLine, ArrowUpFromLine, Globe, Activity, FolderOpen, ChevronRight,
  Home, X, AlertCircle, FileCode, Save,
  ExternalLink, Loader, GitFork, TerminalSquare,
  File, Folder, ChevronDown, FileText, Image, Code2, FileJson, FileType,
  ArrowLeft, Github, LogOut, Check, User, Settings, Key, Link, Eye, EyeOff,
  ChevronLeft, Shield, Server, Play, Square, RotateCw, Cpu, MemoryStick
} from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import io from 'socket.io-client';
import 'xterm/css/xterm.css';
import { API_BASE_URL as API_URL, TERMINAL_URL } from '../../config.js';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [gitPanel, setGitPanel] = useState(null);
  const [codePanel, setCodePanel] = useState(null);
  const [terminalPanel, setTerminalPanel] = useState(null);
  const [gitStatus, setGitStatus] = useState(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [commitMessage, setCommitMessage] = useState('');
  const [actionOutput, setActionOutput] = useState('');
  const [githubAuth, setGithubAuth] = useState(null);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchGithubAuth();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGithubAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/github/auth`);
      const data = await res.json();
      if (data.success && data.authenticated) {
        setGithubAuth(data);
      } else {
        setGithubAuth(null);
      }
    } catch {
      setGithubAuth(null);
    }
  };

  const signInGithub = async () => {
    if (!githubUsername || !githubToken) return;
    setGithubLoading(true);
    setGithubError('');
    try {
      const res = await fetch(`${API_URL}/projects/github/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: githubUsername, token: githubToken })
      });
      const data = await res.json();
      if (data.success) {
        setGithubAuth(data);
        setShowGithubModal(false);
        setGithubToken('');
        setGithubUsername('');
      } else {
        setGithubError(data.error || 'Authentication failed');
      }
    } catch {
      setGithubError('Failed to connect to server');
    } finally {
      setGithubLoading(false);
    }
  };

  const signOutGithub = async () => {
    try {
      await fetch(`${API_URL}/projects/github/auth`, { method: 'DELETE' });
      setGithubAuth(null);
    } catch {
      alert('Failed to sign out');
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id, deleteFiles = false) => {
    if (!confirm(`Delete this project${deleteFiles ? ' AND all its files' : ' (keep files)'}?`)) return;
    setActionLoading(prev => ({ ...prev, [`del-${id}`]: true }));
    try {
      const res = await fetch(`${API_URL}/projects/${id}?deleteFiles=${deleteFiles}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
        if (gitPanel === id) setGitPanel(null);
        if (codePanel === id) setCodePanel(null);
        if (terminalPanel === id) setTerminalPanel(null);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Failed to delete project');
    } finally {
      setActionLoading(prev => ({ ...prev, [`del-${id}`]: false }));
    }
  };

  // ==================== Git Operations ====================

  const fetchGitStatus = async (projectId) => {
    setGitLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/git/status`);
      const data = await res.json();
      if (data.success) {
        setGitStatus(data);
      } else {
        setGitStatus({ error: data.error });
      }
    } catch {
      setGitStatus({ error: 'Failed to fetch git status' });
    } finally {
      setGitLoading(false);
    }
  };

  const openGitPanel = (projectId) => {
    if (gitPanel === projectId) {
      setGitPanel(null);
      setGitStatus(null);
    } else {
      setGitPanel(projectId);
      fetchGitStatus(projectId);
    }
  };

  const gitAction = async (projectId, action, body = {}) => {
    const key = `git-${action}-${projectId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    setActionOutput('');
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/git/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setActionOutput(data.output || 'Success');
        fetchGitStatus(projectId);
        fetchProjects();
      } else {
        setActionOutput(`Error: ${data.error}`);
      }
    } catch (e) {
      setActionOutput(`Error: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const gitCommit = async (projectId) => {
    if (!commitMessage.trim()) return alert('Commit message is required');
    await gitAction(projectId, 'commit', { message: commitMessage });
    setCommitMessage('');
  };

  // ==================== Panel Toggles ====================

  const toggleCodePanel = (projectId) => {
    setCodePanel(codePanel === projectId ? null : projectId);
  };

  const toggleTerminalPanel = (projectId) => {
    setTerminalPanel(terminalPanel === projectId ? null : projectId);
  };

  // ==================== Render Helpers ====================

  const getStatusBadge = (pm2) => {
    if (!pm2) return null;
    const colors = {
      online: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      stopped: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      errored: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'not-found': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
      unknown: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[pm2.status] || colors.unknown}`}>
        {pm2.status}
      </span>
    );
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ==================== Main Render ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-7 h-7 text-blue-500" />
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your projects, files, sites, PM2 processes and Git repos in one place
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* GitHub Account Button */}
          {githubAuth ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-800 text-white border border-gray-600">
              {githubAuth.avatarUrl ? (
                <img src={githubAuth.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              <span className="text-green-400 font-medium">{githubAuth.username}</span>
              <button
                onClick={signOutGithub}
                className="ml-1 text-gray-400 hover:text-red-400 transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGithubModal(true)}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition flex items-center gap-2 border border-gray-600"
            >
              <Github className="w-4 h-4" /> Sign in to GitHub
            </button>
          )}
          <button
            onClick={fetchProjects}
            className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FolderGit2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No projects yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first project to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Project Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
                        onClick={() => setSelectedProject(project)}
                      >
                        {project.name}
                      </h3>
                      {project.pm2 && getStatusBadge(project.pm2)}
                      {project.siteEnabled && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Site Active
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5" /> {project.path}
                      </span>
                      {project.domain && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> {project.domain}
                        </span>
                      )}
                      {project.pm2Name && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> PM2: {project.pm2Name}
                        </span>
                      )}
                      {project.git && !project.git.error && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5" /> {project.git.branch}
                          {project.git.hasChanges && (
                            <span className="text-yellow-500 ml-1">({project.git.changedFiles} changes)</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* PM2 Stats Row */}
                    {project.pm2 && project.pm2.status === 'online' && (
                      <div className="mt-2 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span>CPU: {project.pm2.cpu}%</span>
                        <span>Memory: {formatMemory(project.pm2.memory)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Code Button */}
                    <button
                      onClick={() => toggleCodePanel(project.id)}
                      className={`p-2 rounded-lg text-sm transition ${
                        codePanel === project.id
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Code Editor"
                    >
                      <FileCode className="w-4 h-4" />
                    </button>

                    {/* Terminal Button */}
                    <button
                      onClick={() => toggleTerminalPanel(project.id)}
                      className={`p-2 rounded-lg text-sm transition ${
                        terminalPanel === project.id
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Open Terminal Here"
                    >
                      <TerminalSquare className="w-4 h-4" />
                    </button>

                    {/* Git Button */}
                    {project.git !== null && (
                      <button
                        onClick={() => openGitPanel(project.id)}
                        className={`p-2 rounded-lg text-sm transition ${
                          gitPanel === project.id
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title="Git Operations"
                      >
                        <GitBranch className="w-4 h-4" />
                      </button>
                    )}
                    {project.git === null && (
                      <button
                        onClick={() => gitAction(project.id, 'init', {})}
                        className="p-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        title="Initialize Git"
                      >
                        <GitFork className="w-4 h-4" />
                      </button>
                    )}

                    {/* Open Site */}
                    {project.domain && (
                      <a
                        href={`http://${project.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        title="Open Site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => deleteProject(project.id, false)}
                      disabled={actionLoading[`del-${project.id}`]}
                      className="p-2 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                      title="Delete Project"
                    >
                      {actionLoading[`del-${project.id}`] ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Panel */}
              {codePanel === project.id && (
                <CodePanelComponent project={project} />
              )}

              {/* Terminal Panel */}
              {terminalPanel === project.id && (
                <TerminalPanelComponent project={project} />
              )}

              {/* Git Panel */}
              {gitPanel === project.id && (
                <GitPanelComponent
                  project={project}
                  gitStatus={gitStatus}
                  gitLoading={gitLoading}
                  actionLoading={actionLoading}
                  actionOutput={actionOutput}
                  commitMessage={commitMessage}
                  setCommitMessage={setCommitMessage}
                  onPull={() => gitAction(project.id, 'pull')}
                  onPush={() => gitAction(project.id, 'push')}
                  onCommit={() => gitCommit(project.id)}
                  onRefresh={() => fetchGitStatus(project.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchProjects();
          }}
        />
      )}

      {/* GitHub Sign-In Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Github className="w-5 h-5" /> Sign in to GitHub
              </h2>
              <button onClick={() => { setShowGithubModal(false); setGithubError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use a <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Personal Access Token</a> to authenticate git operations. The token needs <strong>repo</strong> scope.
              </p>
              {githubError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {githubError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal Access Token</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={signInGithub}
                disabled={githubLoading || !githubUsername || !githubToken}
                className="w-full px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {githubLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {githubLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail View */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          sitesList={[]}
          onClose={() => setSelectedProject(null)}
          onUpdated={() => { fetchProjects(); }}
        />
      )}
    </div>
  );
}

// ==================== Code Panel Component ====================

function CodePanelComponent({ project }) {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState(project.path);
  const [pathHistory, setPathHistory] = useState([project.path]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (dirPath) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/files/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: [dirPath] })
      });
      const data = await res.json();
      if (data.success && data.result[dirPath]?.success) {
        const entries = data.result[dirPath].entries
          .filter(e => !e.name.startsWith('.'))
          .sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          });
        setFiles(entries);
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDir = (dirPath) => {
    setSelectedFile(null);
    setFileContent('');
    setEditedContent('');
    setIsEditing(false);
    setPathHistory(prev => [...prev, dirPath]);
    setCurrentPath(dirPath);
  };

  const goBack = () => {
    if (pathHistory.length <= 1) return;
    const newHistory = [...pathHistory];
    newHistory.pop();
    setPathHistory(newHistory);
    setCurrentPath(newHistory[newHistory.length - 1]);
    setSelectedFile(null);
    setFileContent('');
    setEditedContent('');
    setIsEditing(false);
  };

  const openFile = async (file) => {
    setFileLoading(true);
    setSelectedFile(file);
    setIsEditing(false);
    try {
      const res = await fetch(`${API_URL}/files/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path })
      });
      const data = await res.json();
      if (data.success) {
        setFileContent(data.content);
        setEditedContent(data.content);
      } else {
        setFileContent(`Error: ${data.error}`);
        setEditedContent('');
      }
    } catch {
      setFileContent('Error: Failed to read file');
      setEditedContent('');
    } finally {
      setFileLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content: editedContent })
      });
      const data = await res.json();
      if (data.success) {
        setFileContent(editedContent);
        setIsEditing(false);
      } else {
        alert(`Save failed: ${data.error}`);
      }
    } catch {
      alert('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const iconMap = {
      js: <Code2 className="w-3.5 h-3.5 text-yellow-500" />,
      jsx: <Code2 className="w-3.5 h-3.5 text-blue-400" />,
      ts: <Code2 className="w-3.5 h-3.5 text-blue-500" />,
      tsx: <Code2 className="w-3.5 h-3.5 text-blue-500" />,
      json: <FileJson className="w-3.5 h-3.5 text-yellow-600" />,
      html: <FileType className="w-3.5 h-3.5 text-orange-500" />,
      css: <FileType className="w-3.5 h-3.5 text-blue-500" />,
      md: <FileText className="w-3.5 h-3.5 text-gray-500" />,
      png: <Image className="w-3.5 h-3.5 text-green-500" />,
      jpg: <Image className="w-3.5 h-3.5 text-green-500" />,
      svg: <Image className="w-3.5 h-3.5 text-purple-500" />,
    };
    return iconMap[ext] || <File className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getLanguage = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const langMap = { js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX', json: 'JSON', html: 'HTML', css: 'CSS', php: 'PHP', py: 'Python', md: 'Markdown', sh: 'Shell', yml: 'YAML', yaml: 'YAML', xml: 'XML', sql: 'SQL' };
    return langMap[ext] || ext?.toUpperCase() || 'Text';
  };

  const relativePath = currentPath.replace(project.path, '') || '/';

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <FileCode className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Code</span>
          <span className="text-gray-400 mx-1">/</span>
          <button onClick={() => { setCurrentPath(project.path); setPathHistory([project.path]); setSelectedFile(null); }} className="text-blue-500 hover:text-blue-600 text-xs">
            root
          </button>
          {relativePath !== '/' && relativePath.split('/').filter(Boolean).map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{part}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {pathHistory.length > 1 && (
            <button onClick={goBack} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title="Go Back">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => fetchFiles(currentPath)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: '400px' }}>
        {/* File Tree (left) */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-8">Empty directory</div>
          ) : (
            <div className="py-1">
              {files.map((file, i) => (
                <button
                  key={i}
                  onClick={() => file.isDirectory ? navigateToDir(file.path) : openFile(file)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedFile?.path === file.path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {file.isDirectory ? <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" /> : getFileIcon(file.name)}
                  <span className="truncate">{file.name}</span>
                  {file.isDirectory && <ChevronRight className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor (right) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedFile ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <FileCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a file to view or edit</p>
              </div>
            </div>
          ) : fileLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 text-xs">
                  {getFileIcon(selectedFile.name)}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                  <span className="text-gray-400">({getLanguage(selectedFile.name)})</span>
                  {isEditing && editedContent !== fileContent && (
                    <span className="text-yellow-500 font-medium">&#x2022; Modified</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)}
                      className="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                      Edit
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setEditedContent(fileContent); setIsEditing(false); }}
                        className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        Cancel
                      </button>
                      <button onClick={saveFile} disabled={saving || editedContent === fileContent}
                        className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1">
                        {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Code Area */}
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="flex-1 w-full p-3 font-mono text-xs bg-gray-950 text-green-400 resize-none focus:outline-none"
                  spellCheck={false}
                />
              ) : (
                <pre className="flex-1 overflow-auto p-3 font-mono text-xs bg-gray-950 text-gray-300 whitespace-pre-wrap">
                  {fileContent}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ==================== Terminal Panel Component ====================

function TerminalPanelComponent({ project }) {
  const termRef = useRef(null);
  const socketRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const sessionId = useRef(`proj-${project.id}-${Date.now()}`);

  useEffect(() => {
    if (!termRef.current) return;

    const term = new XTerm({
      fontFamily: 'monospace',
      fontSize: 13,
      cursorBlink: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff66',
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(termRef.current);

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => fitAddon.fit(), 50);

    const socket = io(TERMINAL_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      term.writeln(`\x1b[36m~ Terminal opened in: ${project.path}\x1b[0m\r\n`);
      socket.emit('create-session', { sessionId: sessionId.current, cwd: project.path });
    });

    socket.on('session-created', () => {});

    socket.on('output', ({ sessionId: sid, data }) => {
      if (sid === sessionId.current) term.write(data);
    });

    socket.on('session-closed', ({ sessionId: sid }) => {
      if (sid === sessionId.current) term.writeln('\r\n\x1b[31m~ Session ended\x1b[0m');
    });

    term.onData((data) => {
      socket.emit('input', { sessionId: sessionId.current, data });
    });

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        socket.emit('resize', { sessionId: sessionId.current, cols: term.cols, rows: term.rows });
      } catch {}
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.emit('close-session', { sessionId: sessionId.current });
      socket.disconnect();
      term.dispose();
    };
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <TerminalSquare className="w-3.5 h-3.5 text-green-500" />
          <span>Terminal</span>
          <span className="text-gray-600">—</span>
          <span className="text-green-500 font-mono">{project.path}</span>
        </div>
      </div>
      <div ref={termRef} style={{ height: '300px', background: '#0a0a0a' }} />
    </div>
  );
}


// ==================== Git Panel Component ====================

function GitPanelComponent({
  project, gitStatus, gitLoading, actionLoading, actionOutput,
  commitMessage, setCommitMessage, onPull, onPush, onCommit, onRefresh
}) {
  if (gitLoading) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-gray-500">Loading git status...</span>
      </div>
    );
  }

  if (!gitStatus || gitStatus.error) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-red-500">{gitStatus?.error || 'Failed to load git status'}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div className="p-4 space-y-4">
        {/* Branch & Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <GitBranch className="w-4 h-4 text-orange-500" /> {gitStatus.branch}
            </span>
            <span className="text-xs text-gray-400">
              {gitStatus.changedFiles.length} changed file{gitStatus.changedFiles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPull}
              disabled={actionLoading[`git-pull-${project.id}`]}
              className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading[`git-pull-${project.id}`] ? <Loader className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
              Pull
            </button>
            <button
              onClick={onPush}
              disabled={actionLoading[`git-push-${project.id}`]}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading[`git-push-${project.id}`] ? <Loader className="w-3 h-3 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3" />}
              Push
            </button>
          </div>
        </div>

        {/* Changed Files */}
        {gitStatus.changedFiles.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Changed Files</h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
              {gitStatus.changedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className={`font-mono font-bold w-5 text-center ${
                    f.status === 'M' ? 'text-yellow-500' :
                    f.status === 'A' || f.status === '?' || f.status === '??' ? 'text-green-500' :
                    f.status === 'D' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {f.status}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono truncate">{f.file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commit Box */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Commit Changes</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && onCommit()}
            />
            <button
              onClick={onCommit}
              disabled={!commitMessage.trim() || actionLoading[`git-commit-${project.id}`]}
              className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading[`git-commit-${project.id}`] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
              Commit
            </button>
          </div>
        </div>

        {/* Recent Commits */}
        {gitStatus.recentCommits.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Recent Commits</h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
              {gitStatus.recentCommits.map((commit, i) => (
                <div key={i} className="px-3 py-1.5 text-xs font-mono text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-blue-500">{commit.substring(0, 7)}</span>{' '}
                  {commit.substring(8)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Output */}
        {actionOutput && (
          <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
            {actionOutput}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Add Project Modal ====================

function AddProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    path: '',
    domain: '',
    pm2Name: '',
    gitUrl: '',
    branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDirBrowser, setShowDirBrowser] = useState(false);
  const [currentBrowsePath, setCurrentBrowsePath] = useState('/var/www/html');
  const [dirContents, setDirContents] = useState([]);
  const [dirLoading, setDirLoading] = useState(false);

  // Branch fetching
  const [remoteBranches, setRemoteBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState('');
  const branchFetchTimer = useRef(null);

  // Fetch PM2 list and sites for association dropdowns
  const [pm2List, setPm2List] = useState([]);
  const [sitesList, setSitesList] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/pm2/list`)
      .then(r => r.json())
      .then(d => { if (d.success) setPm2List(d.processes || []); })
      .catch(() => {});

    fetch(`${API_URL}/sites`)
      .then(r => r.json())
      .then(d => { if (d.success) setSitesList(d.sites || []); })
      .catch(() => {});
  }, []);

  // Fetch remote branches when git URL changes
  useEffect(() => {
    if (branchFetchTimer.current) clearTimeout(branchFetchTimer.current);
    setRemoteBranches([]);
    setBranchError('');

    const url = form.gitUrl.trim();
    if (!url || !url.includes('github.com')) {
      return;
    }

    branchFetchTimer.current = setTimeout(async () => {
      setBranchLoading(true);
      try {
        const res = await fetch(`${API_URL}/projects/git/remote-branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gitUrl: url })
        });
        const data = await res.json();
        if (data.success && data.branches.length > 0) {
          setRemoteBranches(data.branches);
          if (!form.branch) {
            const def = data.branches.includes('main') ? 'main' : data.branches.includes('master') ? 'master' : data.branches[0];
            setForm(prev => ({ ...prev, branch: def }));
          }
        } else {
          setBranchError(data.error || 'No branches found');
        }
      } catch {
        setBranchError('Failed to fetch branches');
      } finally {
        setBranchLoading(false);
      }
    }, 800);

    return () => { if (branchFetchTimer.current) clearTimeout(branchFetchTimer.current); };
  }, [form.gitUrl]);

  const fetchDir = async (dirPath) => {
    setDirLoading(true);
    try {
      const res = await fetch(`${API_URL}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: [dirPath] })
      });
      const data = await res.json();
      if (data.success && data.result[dirPath]?.success) {
        setDirContents(
          data.result[dirPath].entries
            .filter(e => e.isDirectory && !e.name.startsWith('.'))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setCurrentBrowsePath(dirPath);
      }
    } catch {
      // ignore
    } finally {
      setDirLoading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.path.trim()) {
      setError('Project name and path are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          path: form.path.trim(),
          domain: form.domain.trim() || null,
          pm2Name: form.pm2Name.trim() || null,
          gitUrl: form.gitUrl.trim() || null,
          branch: form.branch.trim() || 'main'
        })
      });
      const data = await res.json();
      if (data.success) {
        onCreated();
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="My App"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Path *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.path}
                onChange={e => setForm({ ...form, path: e.target.value })}
                placeholder="/var/www/html/myapp"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => { setShowDirBrowser(!showDirBrowser); if (!showDirBrowser) fetchDir(currentBrowsePath); }}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>

            {/* Directory Browser */}
            {showDirBrowser && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                  <button onClick={() => fetchDir('/')} className="hover:text-blue-500"><Home className="w-3 h-3" /></button>
                  {currentBrowsePath.split('/').filter(Boolean).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <ChevronRight className="w-3 h-3" />
                      <button
                        className="hover:text-blue-500"
                        onClick={() => fetchDir('/' + arr.slice(0, i + 1).join('/'))}
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  onClick={() => setForm({ ...form, path: currentBrowsePath })}
                  className="text-xs text-blue-500 hover:text-blue-600 mb-2 block"
                >
                  ✓ Select this folder: {currentBrowsePath}
                </button>
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {dirLoading ? (
                    <div className="text-xs text-gray-400 py-2 text-center">Loading...</div>
                  ) : dirContents.length === 0 ? (
                    <div className="text-xs text-gray-400 py-2 text-center">No subdirectories</div>
                  ) : (
                    dirContents.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => fetchDir(currentBrowsePath === '/' ? `/${d.name}` : `${currentBrowsePath}/${d.name}`)}
                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <FolderOpen className="w-3 h-3 text-yellow-500" /> {d.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Git URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Git Repository URL <span className="text-gray-400 font-normal">(optional — will clone)</span>
            </label>
            <input
              type="text"
              value={form.gitUrl}
              onChange={e => setForm({ ...form, gitUrl: e.target.value })}
              placeholder="https://github.com/user/repo.git"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Branch */}
          {form.gitUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch
                {branchLoading && <Loader className="w-3 h-3 animate-spin inline ml-2" />}
              </label>
              {remoteBranches.length > 0 ? (
                <select
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {remoteBranches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    placeholder="main"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {branchError && (
                    <p className="text-xs text-yellow-500 mt-1">{branchError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Domain Association */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Associated Domain <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {sitesList.length > 0 ? (
              <select
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {sitesList.map((site, i) => (
                  <option key={i} value={site.domain || site.name}>
                    {site.domain || site.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
                placeholder="myapp.example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* PM2 Association */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Associated PM2 Process <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {pm2List.length > 0 ? (
              <select
                value={form.pm2Name}
                onChange={e => setForm({ ...form, pm2Name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {pm2List.map((proc, i) => (
                  <option key={i} value={proc.name}>{proc.name} ({proc.pm2_env?.status})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.pm2Name}
                onChange={e => setForm({ ...form, pm2Name: e.target.value })}
                placeholder="my-app-server"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {form.gitUrl ? 'Clone & Create' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ==================== Project Detail View ====================

function ProjectDetailView({ project, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [envContent, setEnvContent] = useState('');
  const [envExists, setEnvExists] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);
  const [envSaving, setEnvSaving] = useState(false);
  const [envDirty, setEnvDirty] = useState(false);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [branchLoading, setBranchLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [sitesList, setSitesList] = useState([]);
  const [pm2List, setPm2List] = useState([]);
  const [editForm, setEditForm] = useState({
    domain: project.domain || '',
    pm2Name: project.pm2Name || '',
    gitUrl: project.gitUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [showEnvValues, setShowEnvValues] = useState(false);
  // Apache config state
  const [apacheConfig, setApacheConfig] = useState(null);
  const [apacheConfigContent, setApacheConfigContent] = useState('');
  const [apacheLoading, setApacheLoading] = useState(false);
  const [apacheSaving, setApacheSaving] = useState(false);
  const [apacheDirty, setApacheDirty] = useState(false);
  // PM2 detail state
  const [pm2Detail, setPm2Detail] = useState(null);
  const [pm2Loading, setPm2Loading] = useState(false);
  const [pm2ActionLoading, setPm2ActionLoading] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchEnv();
    fetchApacheConfig();
    fetchPm2Detail();
    fetch(`${API_URL}/sites`).then(r => r.json()).then(d => { if (d.success) setSitesList(d.sites || []); }).catch(() => {});
    fetch(`${API_URL}/pm2/list`).then(r => r.json()).then(d => { if (d.success) setPm2List(d.processes || []); }).catch(() => {});
  }, []);

  const fetchBranches = async () => {
    setBranchLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/git/branches`);
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches);
        setCurrentBranch(data.current);
      }
    } catch {} finally { setBranchLoading(false); }
  };

  const checkoutBranch = async (branch) => {
    const cleanBranch = branch.replace(/^remotes\/origin\//, '');
    if (cleanBranch === currentBranch) return;
    setCheckoutLoading(cleanBranch);
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/git/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: cleanBranch })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentBranch(cleanBranch);
        fetchBranches();
        onUpdated();
      } else {
        alert(data.error);
      }
    } catch { alert('Failed to checkout branch'); }
    finally { setCheckoutLoading(''); }
  };

  const fetchEnv = async () => {
    setEnvLoading(true);
    try {
      const res = await fetch(`${API_URL}/projects/env/${project.id}`);
      const data = await res.json();
      if (data.success) {
        setEnvContent(data.content);
        setEnvExists(data.exists);
        setEnvDirty(false);
      }
    } catch {} finally { setEnvLoading(false); }
  };

  const saveEnv = async () => {
    setEnvSaving(true);
    try {
      const res = await fetch(`${API_URL}/projects/env/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: envContent })
      });
      const data = await res.json();
      if (data.success) {
        setEnvDirty(false);
        setEnvExists(true);
      } else { alert(data.error); }
    } catch { alert('Failed to save .env'); }
    finally { setEnvSaving(false); }
  };

  const saveProjectSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        onUpdated();
      } else { alert(data.error); }
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const fetchApacheConfig = async () => {
    setApacheLoading(true);
    try {
      const res = await fetch(`${API_URL}/apache/configs`);
      const data = await res.json();
      if (data.success) {
        // Find config matching project domain
        const match = data.configs.find(c => {
          if (project.domain && c.name.includes(project.domain.replace(/\./g, ''))) return true;
          if (project.domain && c.name.includes(project.domain)) return true;
          return false;
        });
        // Also try to find by reading all configs and checking DocumentRoot
        if (!match) {
          for (const cfg of data.configs) {
            try {
              const r = await fetch(`${API_URL}/apache/config/${cfg.name}.conf`);
              const d = await r.json();
              if (d.success && d.content && d.content.includes(project.path)) {
                setApacheConfig(cfg);
                setApacheConfigContent(d.content);
                setApacheDirty(false);
                setApacheLoading(false);
                return;
              }
            } catch {}
          }
        }
        if (match) {
          setApacheConfig(match);
          const r2 = await fetch(`${API_URL}/apache/config/${match.name}.conf`);
          const d2 = await r2.json();
          if (d2.success) {
            setApacheConfigContent(d2.content);
            setApacheDirty(false);
          }
        }
      }
    } catch {} finally { setApacheLoading(false); }
  };

  const saveApacheConfig = async () => {
    if (!apacheConfig) return;
    setApacheSaving(true);
    try {
      const res = await fetch(`${API_URL}/apache/config/${apacheConfig.name}.conf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: apacheConfigContent })
      });
      const data = await res.json();
      if (data.success) {
        setApacheDirty(false);
      } else { alert(data.error || 'Failed to save'); }
    } catch { alert('Failed to save Apache config'); }
    finally { setApacheSaving(false); }
  };

  const fetchPm2Detail = async () => {
    setPm2Loading(true);
    try {
      const res = await fetch(`${API_URL}/pm2/list`);
      const data = await res.json();
      if (data.success) {
        // Find processes associated with project: by name or by cwd
        const matches = (data.processes || []).filter(p => {
          if (project.pm2Name && p.name === project.pm2Name) return true;
          if (p.pm2_env?.pm_cwd && p.pm2_env.pm_cwd === project.path) return true;
          if (p.pm2_env?.PWD && p.pm2_env.PWD === project.path) return true;
          return false;
        });
        setPm2Detail(matches.length > 0 ? matches : null);
      }
    } catch {} finally { setPm2Loading(false); }
  };

  const pm2Control = async (processName, action) => {
    setPm2ActionLoading(`${action}-${processName}`);
    try {
      const res = await fetch(`${API_URL}/pm2/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, processId: processName })
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(fetchPm2Detail, 1000);
      } else { alert(data.error); }
    } catch { alert(`Failed to ${action} process`); }
    finally { setPm2ActionLoading(''); }
  };

  const envPairs = envContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).map(line => {
    const idx = line.indexOf('=');
    if (idx === -1) return { key: line, value: '' };
    return { key: line.substring(0, idx), value: line.substring(idx + 1) };
  });

  const associatedSite = sitesList.find(s => (s.domain || s.name) === project.domain);
  const associatedPm2 = pm2List.find(p => p.name === project.pm2Name);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderGit2 },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'env', label: 'Environment', icon: Key },
    { id: 'apache', label: 'Apache', icon: Server },
    { id: 'pm2', label: 'PM2', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-blue-500" />
              {project.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{project.path}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ---- Overview Tab ---- */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {currentBranch && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <GitBranch className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Branch:</span>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{currentBranch}</span>
                </div>
              )}

              {/* Associated Site */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" /> Associated Site
                </h4>
                {project.domain ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{project.domain}</span>
                      <div className="flex items-center gap-2">
                        {associatedSite ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Hosted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Not configured
                          </span>
                        )}
                        <a href={`http://${project.domain}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Visit
                        </a>
                      </div>
                    </div>
                    {associatedSite && associatedSite.ssl && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> SSL enabled</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No domain associated. Configure in Settings tab.</p>
                )}
              </div>

              {/* PM2 Process */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> PM2 Process
                </h4>
                {project.pm2Name ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{project.pm2Name}</span>
                    {associatedPm2 ? (
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          associatedPm2.pm2_env?.status === 'online'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{associatedPm2.pm2_env?.status || 'unknown'}</span>
                        {associatedPm2.pm2_env?.status === 'online' && (
                          <span className="text-xs text-gray-400">
                            CPU: {associatedPm2.monit?.cpu || 0}% | Mem: {((associatedPm2.monit?.memory || 0) / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-500">Process not found</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No PM2 process associated. Configure in Settings tab.</p>
                )}
              </div>

              {/* Git Remote */}
              {project.gitUrl && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Github className="w-4 h-4" /> Repository
                  </h4>
                  <a href={project.gitUrl.replace(/\.git$/, '')} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                    {project.gitUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Env Quick View */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-500" /> Environment Variables
                  <span className="text-xs font-normal text-gray-400">(.env)</span>
                </h4>
                {envLoading ? (
                  <Loader className="w-4 h-4 animate-spin text-gray-400" />
                ) : envExists ? (
                  <div className="text-xs text-gray-500">
                    {envPairs.length} variable{envPairs.length !== 1 ? 's' : ''} defined
                    <button onClick={() => setActiveTab('env')} className="text-blue-500 hover:underline ml-2">Edit</button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    No .env file.
                    <button onClick={() => setActiveTab('env')} className="text-blue-500 hover:underline ml-2">Create one</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Branches Tab ---- */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Branches</h4>
                <button onClick={fetchBranches} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {branchLoading ? (
                <div className="flex justify-center py-8"><Loader className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : branches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No branches found</p>
              ) : (
                <div className="space-y-1">
                  {branches.map(branch => {
                    const cleanName = branch.replace(/^remotes\/origin\//, '');
                    const isRemote = branch.startsWith('remotes/');
                    const isCurrent = cleanName === currentBranch;
                    return (
                      <div
                        key={branch}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition ${
                          isCurrent
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch className={`w-4 h-4 ${isCurrent ? 'text-blue-500' : 'text-gray-400'}`} />
                          <span className={`text-sm font-mono ${isCurrent ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                            {cleanName}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">CURRENT</span>
                          )}
                          {isRemote && !isCurrent && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-200 dark:bg-gray-700 text-gray-500 font-medium">REMOTE</span>
                          )}
                        </div>
                        {!isCurrent && (
                          <button
                            onClick={() => checkoutBranch(branch)}
                            disabled={!!checkoutLoading}
                            className="px-3 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {checkoutLoading === cleanName ? <Loader className="w-3 h-3 animate-spin" /> : 'Checkout'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---- Environment Tab ---- */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-500" /> .env File
                  {envDirty && <span className="text-yellow-500 text-xs">● Unsaved</span>}
                </h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEnvValues(!showEnvValues)}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    title={showEnvValues ? 'Hide values' : 'Show values'}>
                    {showEnvValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={saveEnv} disabled={envSaving || !envDirty}
                    className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50">
                    {envSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              </div>

              {envLoading ? (
                <div className="flex justify-center py-8"><Loader className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : (
                <>
                  {envPairs.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">Key</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {envPairs.map((pair, i) => (
                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{pair.key}</td>
                              <td className="px-3 py-1.5 font-mono text-gray-600 dark:text-gray-400">
                                {showEnvValues ? pair.value : '••••••••'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Raw Editor</label>
                    <textarea
                      value={envContent}
                      onChange={e => { setEnvContent(e.target.value); setEnvDirty(true); }}
                      placeholder={"# Environment Variables\nDB_HOST=localhost\nDB_PORT=3306\nSECRET_KEY=your-secret"}
                      rows={12}
                      className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-950 text-green-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                      spellCheck={false}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---- Apache Tab ---- */}
          {activeTab === 'apache' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-red-500" /> Apache Virtual Host Config
                  {apacheDirty && <span className="text-yellow-500 text-xs">● Unsaved</span>}
                </h4>
                <div className="flex items-center gap-2">
                  <button onClick={fetchApacheConfig} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  {apacheConfig && (
                    <button onClick={saveApacheConfig} disabled={apacheSaving || !apacheDirty}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50">
                      {apacheSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save & Test
                    </button>
                  )}
                </div>
              </div>

              {apacheLoading ? (
                <div className="flex justify-center py-8"><Loader className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : !apacheConfig ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Server className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No Apache config found for this project.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a site with domain <span className="font-mono text-blue-500">{project.domain || 'your-domain.com'}</span> pointing to <span className="font-mono text-blue-500">{project.path}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Config info bar */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-mono">{apacheConfig.name}.conf</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      apacheConfig.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {apacheConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Config editor */}
                  <textarea
                    value={apacheConfigContent}
                    onChange={e => { setApacheConfigContent(e.target.value); setApacheDirty(true); }}
                    rows={18}
                    className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-950 text-green-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* ---- PM2 Tab ---- */}
          {activeTab === 'pm2' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> PM2 Processes
                </h4>
                <button onClick={fetchPm2Detail} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {pm2Loading ? (
                <div className="flex justify-center py-8"><Loader className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : !pm2Detail ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No PM2 processes found for this project.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a process with working directory <span className="font-mono text-blue-500">{project.path}</span> or associate one in Settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pm2Detail.map(proc => (
                    <div key={proc.pm_id} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Process header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            proc.pm2_env?.status === 'online' ? 'bg-green-500' :
                            proc.pm2_env?.status === 'stopping' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{proc.name}</span>
                            <span className="text-xs text-gray-400 ml-2">ID: {proc.pm_id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            proc.pm2_env?.status === 'online'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {proc.pm2_env?.status || 'unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {proc.pm2_env?.status === 'online' ? (
                            <>
                              <button onClick={() => pm2Control(proc.name, 'restart')}
                                disabled={!!pm2ActionLoading}
                                className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
                                title="Restart">
                                {pm2ActionLoading === `restart-${proc.name}` ? <Loader className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                                Restart
                              </button>
                              <button onClick={() => pm2Control(proc.name, 'stop')}
                                disabled={!!pm2ActionLoading}
                                className="px-2.5 py-1.5 text-xs rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition flex items-center gap-1 disabled:opacity-50"
                                title="Stop">
                                {pm2ActionLoading === `stop-${proc.name}` ? <Loader className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                                Stop
                              </button>
                            </>
                          ) : (
                            <button onClick={() => pm2Control(proc.name, 'restart')}
                              disabled={!!pm2ActionLoading}
                              className="px-2.5 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                              title="Start">
                              {pm2ActionLoading === `restart-${proc.name}` ? <Loader className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                              Start
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Process stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">CPU</div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{proc.monit?.cpu || 0}%</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Memory</div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{((proc.monit?.memory || 0) / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Uptime</div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {proc.pm2_env?.pm_uptime ? (() => {
                              const ms = Date.now() - proc.pm2_env.pm_uptime;
                              const h = Math.floor(ms / 3600000);
                              const m = Math.floor((ms % 3600000) / 60000);
                              return h > 0 ? `${h}h ${m}m` : `${m}m`;
                            })() : '-'}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Restarts</div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{proc.pm2_env?.restart_time || 0}</div>
                        </div>
                      </div>

                      {/* Process details */}
                      <div className="px-4 pb-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">Script:</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300 truncate">{proc.pm2_env?.pm_exec_path || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">CWD:</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300 truncate">{proc.pm2_env?.pm_cwd || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">Node:</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300">{proc.pm2_env?.node_version || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">Mode:</span>
                          <span className="font-mono text-gray-600 dark:text-gray-300">{proc.pm2_env?.exec_mode || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- Settings Tab ---- */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Associated Domain</label>
                {sitesList.length > 0 ? (
                  <select value={editForm.domain} onChange={e => setEditForm({ ...editForm, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    {sitesList.map((site, i) => (
                      <option key={i} value={site.domain || site.name}>{site.domain || site.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={editForm.domain} onChange={e => setEditForm({ ...editForm, domain: e.target.value })}
                    placeholder="myapp.example.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PM2 Process</label>
                {pm2List.length > 0 ? (
                  <select value={editForm.pm2Name} onChange={e => setEditForm({ ...editForm, pm2Name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    {pm2List.map((proc, i) => (
                      <option key={i} value={proc.name}>{proc.name} ({proc.pm2_env?.status})</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={editForm.pm2Name} onChange={e => setEditForm({ ...editForm, pm2Name: e.target.value })}
                    placeholder="my-app-server"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Git Repository URL</label>
                <input type="text" value={editForm.gitUrl} onChange={e => setEditForm({ ...editForm, gitUrl: e.target.value })}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
              </div>

              <button onClick={saveProjectSettings} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
