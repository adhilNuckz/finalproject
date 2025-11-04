# 🔍 Finding Your Project Files

## Issue: `finalproject` folder not showing in `/root`

Console shows only these folders in `/root`:
- `.cache`, `.config`, `.local`, `.npm`, `.oh-my-zsh`, `.pki`, `.pm2`, `.ssh`, `.vscode`, `.vscode-root`, `linux-dash`
- **NO `finalproject`!**

## Commands to Run on Your Server

```bash
# 1. Find where finalproject actually is
sudo find / -name "finalproject" -type d 2>/dev/null

# 2. Check PM2 working directory
pm2 list
pm2 info myhost

# 3. List root directory
ls -la /root/

# 4. Check if in /home/ubuntu
ls -la /home/ubuntu/

# 5. Check current directory
pwd
```

## Most Likely Cause

You're logged in as **ubuntu** user, but File Manager shows `/root` (root user's home).

Your files are probably in `/home/ubuntu/finalproject`

**Try navigating to:** `/home/ubuntu` in the File Manager path input!

## Quick Solution

In the File Manager, type this path and click "Go":
```
/home/ubuntu
```

Or add `/home/ubuntu` to allowed roots in `back/utils/security.js`.

Let me know what `find / -name "finalproject"` returns!
