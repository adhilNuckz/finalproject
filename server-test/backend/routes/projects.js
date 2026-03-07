const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { isAllowedPath } = require('../utils/security');

const PROJECTS_FILE = path.join(__dirname, '..', 'projects.json');
const GITHUB_AUTH_FILE = path.join(__dirname, '..', 'github-auth.json');

// ==================== Helpers ====================

function readProjects() {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function readGithubAuth() {
  try {
    if (!fs.existsSync(GITHUB_AUTH_FILE)) return null;
    return JSON.parse(fs.readFileSync(GITHUB_AUTH_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function writeGithubAuth(auth) {
  fs.writeFileSync(GITHUB_AUTH_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Run a git command in a specific directory, return promise
function gitExec(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

// Build an authenticated git remote URL by embedding token
function getAuthUrl(remoteUrl) {
  const auth = readGithubAuth();
  if (!auth || !auth.token || !remoteUrl) return remoteUrl;
  // https://github.com/user/repo.git -> https://user:token@github.com/user/repo.git
  return remoteUrl.replace(/^https:\/\//, `https://${encodeURIComponent(auth.username)}:${encodeURIComponent(auth.token)}@`);
}

// Get git identity flags for commits
function getGitIdentity() {
  const auth = readGithubAuth();
  if (!auth) return '';
  const email = auth.email || `${auth.username}@users.noreply.github.com`;
  return `-c user.name="${auth.username}" -c user.email="${email}"`;
}

// ==================== Project CRUD ====================

// GET all projects (with live git + pm2 status)
router.get('/', async (req, res) => {
  try {
    const projects = readProjects();

    // Enrich each project with live data
    const enriched = await Promise.all(projects.map(async (project) => {
      const result = { ...project };

      // Git status
      if (fs.existsSync(path.join(project.path, '.git'))) {
        try {
          const branch = await gitExec('git rev-parse --abbrev-ref HEAD', project.path);
          const status = await gitExec('git status --porcelain', project.path);
          const logRaw = await gitExec('git log --oneline -5 2>/dev/null || echo ""', project.path);
          result.git = {
            branch,
            hasChanges: status.length > 0,
            changedFiles: status ? status.split('\n').filter(Boolean).length : 0,
            recentCommits: logRaw ? logRaw.split('\n').filter(Boolean) : []
          };
        } catch {
          result.git = { error: 'Failed to read git status' };
        }
      } else {
        result.git = null;
      }

      // PM2 status
      if (project.pm2Name) {
        try {
          const pm2Out = await new Promise((resolve, reject) => {
            exec('pm2 jlist', (err, stdout) => {
              if (err) return reject(err);
              resolve(stdout);
            });
          });
          const processes = JSON.parse(pm2Out);
          const proc = processes.find(p => p.name === project.pm2Name);
          result.pm2 = proc ? {
            status: proc.pm2_env?.status || 'unknown',
            cpu: proc.monit?.cpu || 0,
            memory: proc.monit?.memory || 0,
            uptime: proc.pm2_env?.pm_uptime || null
          } : { status: 'not-found' };
        } catch {
          result.pm2 = { status: 'unknown' };
        }
      }

      // Site status
      if (project.domain) {
        try {
          const confPath = `/etc/apache2/sites-enabled/${project.domain}.conf`;
          result.siteEnabled = fs.existsSync(confPath);
        } catch {
          result.siteEnabled = false;
        }
      }

      return result;
    }));

    res.json({ success: true, projects: enriched });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST create a new project
router.post('/', async (req, res) => {
  const { name, path: projectPath, domain, pm2Name, gitUrl, branch } = req.body;

  if (!name || !projectPath) {
    return res.status(400).json({ success: false, error: 'Name and path are required' });
  }

  if (!isAllowedPath(projectPath)) {
    return res.status(403).json({ success: false, error: 'Path not allowed' });
  }

  const projects = readProjects();
  if (projects.find(p => p.name === name)) {
    return res.status(400).json({ success: false, error: 'Project with this name already exists' });
  }

  const project = {
    id: generateId(),
    name,
    path: projectPath,
    domain: domain || null,
    pm2Name: pm2Name || null,
    gitUrl: gitUrl || null,
    branch: branch || 'main',
    createdAt: new Date().toISOString()
  };

  // If gitUrl provided, clone the repo
  if (gitUrl) {
    try {
      // Ensure parent directory exists
      const parentDir = path.dirname(projectPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0) {
        return res.status(400).json({ success: false, error: 'Target directory is not empty. Choose a different path or empty the directory.' });
      }

      const branchFlag = branch ? `-b ${branch}` : '';
      const cloneUrl = getAuthUrl(gitUrl);
      await gitExec(`git clone ${branchFlag} ${cloneUrl} ${projectPath}`, parentDir);
    } catch (e) {
      return res.status(500).json({ success: false, error: `Git clone failed: ${e.message}` });
    }
  } else {
    // Just ensure the directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
  }

  projects.push(project);
  writeProjects(projects);

  const io = req.app.get('io');
  if (io) io.emit('projects:updated', projects);

  res.json({ success: true, project });
});

// ==================== GitHub Auth ====================

// GET github auth status
router.get('/github/auth', (req, res) => {
  const auth = readGithubAuth();
  if (auth) {
    res.json({ success: true, authenticated: true, username: auth.username, email: auth.email || '' });
  } else {
    res.json({ success: true, authenticated: false });
  }
});

// POST github auth (sign in with PAT)
router.post('/github/auth', async (req, res) => {
  const { username, token } = req.body;
  if (!username || !token) {
    return res.status(400).json({ success: false, error: 'Username and token are required' });
  }

  try {
    // Verify the token works by calling GitHub API
    const https = require('https');
    const verifyToken = () => new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/user',
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'ServerPanel',
          'Accept': 'application/vnd.github.v3+json'
        }
      };
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error('Invalid token or authentication failed'));
          }
        });
      });
      request.on('error', reject);
      request.end();
    });

    const ghUser = await verifyToken();
    const auth = {
      username: ghUser.login,
      email: ghUser.email || `${ghUser.login}@users.noreply.github.com`,
      token,
      avatarUrl: ghUser.avatar_url,
      name: ghUser.name || ghUser.login
    };
    writeGithubAuth(auth);

    res.json({
      success: true,
      username: auth.username,
      email: auth.email,
      avatarUrl: auth.avatarUrl,
      name: auth.name
    });
  } catch (e) {
    res.status(401).json({ success: false, error: e.message });
  }
});

// DELETE github auth (sign out)
router.delete('/github/auth', (req, res) => {
  try {
    if (fs.existsSync(GITHUB_AUTH_FILE)) {
      fs.unlinkSync(GITHUB_AUTH_FILE);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST list remote branches from a git URL (no clone needed)
router.post('/git/remote-branches', async (req, res) => {
  const { gitUrl } = req.body;
  if (!gitUrl) return res.status(400).json({ success: false, error: 'Git URL is required' });

  try {
    const authUrl = getAuthUrl(gitUrl);
    const output = await gitExec(`git ls-remote --heads ${authUrl}`, '/tmp');
    const branches = output.split('\n').filter(Boolean).map(line => {
      const ref = line.split('\t')[1] || '';
      return ref.replace('refs/heads/', '');
    }).filter(Boolean);
    res.json({ success: true, branches });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET env file for a project
router.get('/env/:id', (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const envPath = path.join(project.path, '.env');
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      res.json({ success: true, content, exists: true });
    } else {
      res.json({ success: true, content: '', exists: false });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT save env file for a project
router.put('/env/:id', (req, res) => {
  const { content } = req.body;
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  const envPath = path.join(project.path, '.env');
  try {
    fs.writeFileSync(envPath, content, { mode: 0o600 });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== Project by ID ====================

// PUT update a project
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, domain, pm2Name, gitUrl, branch } = req.body;

  const projects = readProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  if (name) projects[index].name = name;
  if (domain !== undefined) projects[index].domain = domain;
  if (pm2Name !== undefined) projects[index].pm2Name = pm2Name;
  if (gitUrl !== undefined) projects[index].gitUrl = gitUrl;
  if (branch !== undefined) projects[index].branch = branch;

  writeProjects(projects);

  const io = req.app.get('io');
  if (io) io.emit('projects:updated', projects);

  res.json({ success: true, project: projects[index] });
});

// DELETE a project (deletes metadata, optionally files)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { deleteFiles } = req.query;

  const projects = readProjects();
  const project = projects.find(p => p.id === id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  if (deleteFiles === 'true' && project.path && isAllowedPath(project.path)) {
    try {
      fs.rmSync(project.path, { recursive: true, force: true });
    } catch (e) {
      return res.status(500).json({ success: false, error: `Failed to delete files: ${e.message}` });
    }
  }

  const updated = projects.filter(p => p.id !== id);
  writeProjects(updated);

  const io = req.app.get('io');
  if (io) io.emit('projects:updated', updated);

  res.json({ success: true });
});

// ==================== Git Operations ====================

// POST git pull
router.post('/:id/git/pull', async (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const branch = project.branch || 'main';
    const remoteUrl = project.gitUrl || await gitExec('git remote get-url origin', project.path).catch(() => '');
    const url = getAuthUrl(remoteUrl);
    const output = await gitExec(`git pull ${url ? url : 'origin'} ${branch}`, project.path);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST git push
router.post('/:id/git/push', async (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const branch = project.branch || 'main';
    const remoteUrl = project.gitUrl || await gitExec('git remote get-url origin', project.path).catch(() => '');
    const url = getAuthUrl(remoteUrl);
    const output = await gitExec(`git push ${url ? url : 'origin'} ${branch}`, project.path);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST git commit (stage all + commit)
router.post('/:id/git/commit', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Commit message is required' });

  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    await gitExec('git add -A', project.path);
    const identity = getGitIdentity();
    const output = await gitExec(`git ${identity} commit -m "${message.replace(/"/g, '\\"')}"`, project.path);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET git status (detailed)
router.get('/:id/git/status', async (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const branch = await gitExec('git rev-parse --abbrev-ref HEAD', project.path);
    const status = await gitExec('git status --porcelain', project.path);
    const log = await gitExec('git log --oneline -10', project.path);
    const remote = await gitExec('git remote -v', project.path).catch(() => '');
    const diff = await gitExec('git diff --stat', project.path).catch(() => '');

    // Parse changed files
    const changedFiles = status ? status.split('\n').filter(Boolean).map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3)
    })) : [];

    res.json({
      success: true,
      branch,
      changedFiles,
      recentCommits: log ? log.split('\n').filter(Boolean) : [],
      remote: remote || 'No remote configured',
      diffStat: diff || 'No changes'
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET git branches
router.get('/:id/git/branches', async (req, res) => {
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const branchOutput = await gitExec('git branch -a', project.path);
    const current = await gitExec('git rev-parse --abbrev-ref HEAD', project.path);
    const branches = branchOutput.split('\n').filter(Boolean).map(b => b.replace('*', '').trim());

    res.json({ success: true, branches, current });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST git checkout branch
router.post('/:id/git/checkout', async (req, res) => {
  const { branch } = req.body;
  if (!branch) return res.status(400).json({ success: false, error: 'Branch is required' });

  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    const output = await gitExec(`git checkout ${branch}`, project.path);
    // Update stored branch
    projects[projects.indexOf(project)].branch = branch;
    writeProjects(projects);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST git init (for projects without git)
router.post('/:id/git/init', async (req, res) => {
  const { gitUrl, branch } = req.body;

  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  try {
    // Check if .git already exists
    if (fs.existsSync(path.join(project.path, '.git'))) {
      return res.status(400).json({ success: false, error: 'Git is already initialized in this project' });
    }

    await gitExec('git init', project.path);

    if (gitUrl) {
      await gitExec(`git remote add origin ${gitUrl}`, project.path);
      project.gitUrl = gitUrl;
    }
    if (branch) {
      await gitExec(`git checkout -b ${branch}`, project.path);
      project.branch = branch;
    }

    writeProjects(projects);
    res.json({ success: true, output: 'Git initialized successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
