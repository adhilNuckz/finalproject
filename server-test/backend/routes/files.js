const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAllowedPath } = require('../utils/security');

// Traverse multiple directories and return basic listing
router.post('/list', (req, res) => {
  const { dirs } = req.body;
  if (!Array.isArray(dirs) || dirs.length === 0) {
    return res.status(400).json({ success: false, error: 'dirs must be a non-empty array' });
  }

  try {
    const result = {};
    dirs.forEach((d) => {
      try {
        if (!isAllowedPath(d)) throw new Error('Path not allowed');
        const entries = fs.readdirSync(d).map((name) => {
          const full = path.join(d, name);
          const stat = fs.statSync(full);
          return { name, path: full, isDirectory: stat.isDirectory(), size: stat.size, modified: stat.mtimeMs };
        });
        result[d] = { success: true, entries };
      } catch (e) {
        result[d] = { success: false, error: e.message };
      }
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Read file content
router.post('/read', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(filePath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return res.status(400).json({ success: false, error: 'path is a directory' });
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content, size: stat.size, modified: stat.mtimeMs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Write file content
router.post('/write', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(filePath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  
  try {
    fs.writeFileSync(filePath, content || '', 'utf8');
    const stat = fs.statSync(filePath);
    res.json({ success: true, size: stat.size, modified: stat.mtimeMs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Create file or directory
router.post('/create', (req, res) => {
  const { path: targetPath, isDirectory } = req.body;
  if (!targetPath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(targetPath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  
  try {
    if (isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true });
      return res.json({ success: true });
    } else {
      fs.writeFileSync(targetPath, '', 'utf8');
      return res.json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete file or directory
router.post('/delete', (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ success: false, error: 'path required' });
  if (!isAllowedPath(targetPath)) return res.status(403).json({ success: false, error: 'path not allowed' });
  
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Upload files to a directory
// This route will be handled with multer middleware in main server

module.exports = router;
