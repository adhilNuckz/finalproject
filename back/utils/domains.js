const fs = require('fs');
const path = require('path');

const DOMAINS_FILE = path.join(__dirname, '../domains.json');

// Helper to read domains
function readDomains() {
  try {
    if (!fs.existsSync(DOMAINS_FILE)) {
      fs.writeFileSync(DOMAINS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DOMAINS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading domains:', e);
    return [];
  }
}

// Helper to write domains
function writeDomains(domains) {
  try {
    fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing domains:', e);
    return false;
  }
}

module.exports = {
  readDomains,
  writeDomains
};
