const express = require('express');
const router = express.Router();
const { readDomains, writeDomains } = require('../utils/domains');

// GET all domains
router.get('/', (req, res) => {
  const domains = readDomains();
  res.json({ success: true, domains });
});

// POST add new domain
router.post('/', (req, res) => {
  const { domain, status = 'active' } = req.body;
  const io = req.app.get('io');
  
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Domain name is required' });
  }
  
  const domains = readDomains();
  
  // Check if domain already exists
  const exists = domains.find(d => d.domain === domain);
  if (exists) {
    return res.status(400).json({ success: false, error: 'Domain already exists' });
  }
  
  const newDomain = {
    id: Date.now().toString(),
    domain,
    status,
    addedAt: new Date().toISOString()
  };
  
  domains.push(newDomain);
  
  if (writeDomains(domains)) {
    if (io) io.emit('domains:updated', domains);
    res.json({ success: true, domain: newDomain });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save domain' });
  }
});

// DELETE domain
router.delete('/:domain', (req, res) => {
  const { domain } = req.params;
  const io = req.app.get('io');
  
  const domains = readDomains();
  const filtered = domains.filter(d => d.domain !== domain);
  
  if (domains.length === filtered.length) {
    return res.status(404).json({ success: false, error: 'Domain not found' });
  }
  
  if (writeDomains(filtered)) {
    if (io) io.emit('domains:updated', filtered);
    res.json({ success: true, message: 'Domain deleted' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to delete domain' });
  }
});

module.exports = router;
