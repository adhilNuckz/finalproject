const path = require('path');
const os = require('os');

// Security: only allow operations under these roots
const ALLOWED_ROOTS = [
  '/var/www/html',
  os.homedir(),
  '/home'
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
