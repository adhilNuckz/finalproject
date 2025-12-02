const path = require('path');
const os = require('os');

// Security: only allow operations under these roots
const ALLOWED_ROOTS = [
  '/var/www/html',
  '/home/kali',
  '/home/ubuntu',    // Oracle Cloud default user
  '/root'            // Root user home (use cautiously)
];

function isAllowedPath(p) {
  try {
    const resolved = path.resolve(p);
    return ALLOWED_ROOTS.some(root => resolved === root || resolved.startsWith(root + path.sep));
  } catch (e) {
    return false;
  }
}

module.exports = {
  ALLOWED_ROOTS,
  isAllowedPath
};
