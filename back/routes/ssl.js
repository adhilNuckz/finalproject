const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// POST Install SSL for a site
router.post('/install', async (req, res) => {
  const { domain, email } = req.body;
  
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Domain is required' });
  }
  
  const adminEmail = email || `admin@${domain.split('.').slice(-2).join('.')}`;
  const certbotCmd = `sudo certbot --apache -d ${domain} --non-interactive --agree-tos --email ${adminEmail} --redirect`;
  
  try {
    exec(certbotCmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        return res.json({ 
          success: false, 
          error: stderr || 'SSL installation failed',
          output: stdout + stderr
        });
      }
      
      res.json({ 
        success: true, 
        message: 'SSL certificate installed successfully',
        output: stdout
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET SSL status for a domain
router.get('/status/:domain', (req, res) => {
  const { domain } = req.params;
  
  exec(`sudo certbot certificates | grep -A 5 "${domain}"`, (err, stdout, stderr) => {
    if (err || !stdout) {
      return res.json({ 
        success: true, 
        installed: false,
        message: 'No SSL certificate found for this domain'
      });
    }
    
    // Parse certbot output for expiry date
    const expiryMatch = stdout.match(/Expiry Date: (.+)/);
    const expiry = expiryMatch ? expiryMatch[1] : 'Unknown';
    
    res.json({ 
      success: true, 
      installed: true,
      expiry,
      details: stdout
    });
  });
});

// POST Renew SSL certificate
router.post('/renew', (req, res) => {
  const { domain } = req.body;
  
  const renewCmd = domain 
    ? `sudo certbot renew --cert-name ${domain}`
    : `sudo certbot renew`;
  
  exec(renewCmd, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ 
        success: false, 
        error: stderr || 'SSL renewal failed',
        output: stdout + stderr
      });
    }
    
    res.json({ 
      success: true, 
      message: 'SSL certificate renewed successfully',
      output: stdout
    });
  });
});

// DELETE Remove SSL certificate
router.delete('/remove/:domain', (req, res) => {
  const { domain } = req.params;
  
  const removeCmd = `sudo certbot delete --cert-name ${domain} --non-interactive`;
  
  exec(removeCmd, (err, stdout, stderr) => {
    if (err) {
      return res.json({ 
        success: false, 
        error: stderr || 'SSL removal failed'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'SSL certificate removed successfully'
    });
  });
});

module.exports = router;
