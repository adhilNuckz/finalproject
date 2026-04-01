# GitHub Actions CI/CD Setup Guide

## 📋 Overview

This guide will help you set up automated deployment from GitHub to your production server at `142.93.220.168`.

**What happens when you push to `deploy` branch:**
1. ✅ Frontend is built from `front/` folder
2. ✅ Files are synced to server `/var/www/finalproject/server-test/`
3. ✅ Backend dependencies are installed
4. ✅ Frontend is rebuilt on server
5. ✅ PM2 service `server-test` is restarted
6. ✅ Apache is reloaded
7. ✅ Site is live at `http://142.93.220.168:5252`

---

## 🔐 Step 1: Generate SSH Key for GitHub Actions

On your **local machine** or **server**, generate a dedicated SSH key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**Press Enter** when asked for passphrase (leave it empty for automation).

This creates:
- `~/.ssh/github_actions_deploy` (private key) 
- `~/.ssh/github_actions_deploy.pub` (public key)

---

## 🔑 Step 2: Add Public Key to Server

Copy the **public key** to your server:

```bash
# View the public key
cat ~/.ssh/github_actions_deploy.pub

# Copy it and then add it to your server
ssh root@142.93.220.168
nano ~/.ssh/authorized_keys
# Paste the public key at the end
# Save and exit (Ctrl+X, Y, Enter)
```

Or use this one-liner:

```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@142.93.220.168
```

**Test the connection:**
```bash
ssh -i ~/.ssh/github_actions_deploy root@142.93.220.168
```

---

## 📦 Step 3: Configure GitHub Repository Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add the following secrets:

### Secret 1: SSH_PRIVATE_KEY
```
Name: SSH_PRIVATE_KEY
Value: [Paste the entire content of ~/.ssh/github_actions_deploy file]
```

To get the private key content:
```bash
cat ~/.ssh/github_actions_deploy
```

Copy everything including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Secret 2: SERVER_IP
```
Name: SERVER_IP
Value: 142.93.220.168
```

### Secret 3: SERVER_USER
```
Name: SERVER_USER
Value: root
```

---

## ✅ Step 4: Verify Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`.

You can view it:
```bash
cat .github/workflows/deploy.yml
```

---

## 🚀 Step 5: Commit and Push the Workflow

```bash
cd /home/cofinnail/finalproject

# Switch to deploy branch
git checkout deploy

# Add the workflow file
git add .github/workflows/deploy.yml

# Commit
git commit -m "Add GitHub Actions CI/CD workflow

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Push to trigger deployment
git push origin deploy
```

---

## 🎯 Step 6: Monitor the Deployment

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. You'll see the workflow running
4. Click on it to see live logs

**Deployment stages:**
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install & build frontend locally
- ✅ Setup SSH connection
- ✅ Sync files to server
- ✅ Install backend dependencies on server
- ✅ Build frontend on server
- ✅ Restart PM2 service
- ✅ Reload Apache
- ✅ Verify deployment

---

## 🔍 What Gets Deployed

### Backend (`back/` → `server-test/backend/`)
- All `.js` files
- `package.json`
- Routes and utilities
- **Excluded:** `node_modules`, `.env`, `uploads`, `*.json` (data files)

### Frontend (`front/` → `server-test/frontend/`)
- All source files
- Components, contexts, config
- **Excluded:** `node_modules`, `dist`, `.env`
- Frontend is rebuilt on server to generate new `dist/` folder

---

## 📝 Server Configuration (Already Set Up)

### Apache Config: `/etc/apache2/sites-enabled/manserver.conf`
```apache
<VirtualHost *:5252>
    ServerName 142.93.220.168
    DocumentRoot /var/www/finalproject/server-test/frontend/dist
    
    # Proxy API requests to backend
    ProxyPass /api http://127.0.0.1:5002/api
    ProxyPassReverse /api http://127.0.0.1:5002/api
    
    # Proxy Socket.IO
    ProxyPass /socket.io http://127.0.0.1:5002/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:5002/socket.io
</VirtualHost>
```

### PM2 Service: `server-test`
- **Script:** `/var/www/finalproject/server-test/backend/server.js`
- **Port:** 5002
- **Status:** Auto-restart enabled

---

## 🐛 Troubleshooting

### Deployment fails with "Permission denied"
**Solution:** Verify SSH key is added to server's `authorized_keys`:
```bash
ssh root@142.93.220.168 'cat ~/.ssh/authorized_keys'
```

### Deployment fails with "rsync: command not found"
**Solution:** Install rsync on GitHub Actions runner (already included in workflow).

### Frontend not updating
**Solution:** 
1. Check if build completed: `ls -la /var/www/finalproject/server-test/frontend/dist`
2. Clear browser cache
3. Check Apache logs: `tail -f /var/log/apache2/app-error.log`

### PM2 service not restarting
**Solution:**
```bash
ssh root@142.93.220.168
pm2 restart server-test
pm2 logs server-test
```

### Backend API not responding
**Solution:**
```bash
ssh root@142.93.220.168
cd /var/www/finalproject/server-test/backend
cat .env  # Verify environment variables
pm2 logs server-test --lines 50
```

---

## 🔄 Manual Deployment (If Needed)

If you need to deploy manually without GitHub Actions:

```bash
# From your local machine
cd /home/cofinnail/finalproject

# Sync backend
rsync -avz --delete \
  --exclude 'node_modules' --exclude '.env' --exclude 'uploads' \
  back/ root@142.93.220.168:/var/www/finalproject/server-test/backend/

# Sync frontend
rsync -avz --delete \
  --exclude 'node_modules' --exclude 'dist' --exclude '.env' \
  front/ root@142.93.220.168:/var/www/finalproject/server-test/frontend/

# Deploy on server
ssh root@142.93.220.168 << 'EOF'
cd /var/www/finalproject/server-test/backend
npm install --production

cd /var/www/finalproject/server-test/frontend
npm install
npm run build

chown -R www-data:www-data /var/www/finalproject/server-test/frontend/dist
chmod -R 755 /var/www/finalproject/server-test/frontend/dist

pm2 restart server-test
systemctl reload apache2
EOF
```

---

## 📊 Monitoring After Deployment

### Check PM2 Status
```bash
ssh root@142.93.220.168 'pm2 status'
```

### Check Backend Logs
```bash
ssh root@142.93.220.168 'pm2 logs server-test --lines 30'
```

### Check Apache Logs
```bash
ssh root@142.93.220.168 'tail -f /var/log/apache2/app-access.log'
ssh root@142.93.220.168 'tail -f /var/log/apache2/app-error.log'
```

### Test the Site
```bash
# Test frontend
curl http://142.93.220.168:5252

# Test backend API
curl http://142.93.220.168:5252/api/sites
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] GitHub Actions workflow completed successfully
- [ ] Frontend is accessible at `http://142.93.220.168:5252`
- [ ] API endpoints respond at `http://142.93.220.168:5252/api/*`
- [ ] Socket.IO connection works
- [ ] PM2 service is running: `pm2 status server-test`
- [ ] No errors in PM2 logs: `pm2 logs server-test --nostream`
- [ ] Apache is serving files correctly
- [ ] All features work on production site

---

## 🔐 Security Best Practices

1. ✅ Use dedicated SSH key for GitHub Actions (not your personal key)
2. ✅ SSH key has no passphrase (required for automation)
3. ✅ Private key is only in GitHub Secrets (encrypted)
4. ✅ Public key is only on the server
5. ✅ `.env` files are excluded from deployment (server has its own)
6. ✅ `node_modules` are excluded (installed fresh on server)
7. ✅ Database files (`*.json`) are not overwritten

---

## 📚 Additional Resources

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Apache Documentation:** https://httpd.apache.org/docs/2.4/
- **Rsync Manual:** https://linux.die.net/man/1/rsync

---

## 🆘 Need Help?

If deployment fails:
1. Check GitHub Actions logs in the "Actions" tab
2. SSH into server and check logs manually
3. Verify all secrets are set correctly in GitHub
4. Test SSH connection manually
5. Check server has enough disk space: `df -h`
6. Check server has enough memory: `free -h`

**Support Contact:** Check PM2 and Apache logs for detailed error messages.
