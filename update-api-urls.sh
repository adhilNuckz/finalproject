#!/bin/bash
# Script to update API URLs in frontend components to use centralized config

echo "🔄 Updating API URLs in components..."

# Update all files to import from config
find /home/kali/LOCALED/front/src/components -name "*.jsx" -type f -exec sed -i "s|const API_BASE = 'http://localhost:5000';|import { API_BASE } from '../../config/api';|g" {} \;
find /home/kali/LOCALED/front/src/components -name "*.jsx" -type f -exec sed -i "s|const API_URL = 'http://localhost:5000';|import { API_URL } from '../../config/api';|g" {} \;
find /home/kali/LOCALED/front/src/components -name "*.jsx" -type f -exec sed -i "s|const SOCKET_URL = 'http://localhost:5000';|import { SOCKET_URL } from '../../config/api';|g" {} \;

# Update inline fetch URLs
find /home/kali/LOCALED/front/src/components -name "*.jsx" -type f -exec sed -i "s|'http://localhost:5000/|\`\${API_BASE}/|g" {} \;
find /home/kali/LOCALED/front/src/components -name "*.jsx" -type f -exec sed -i "s|\"http://localhost:5000/|\`\${API_BASE}/|g" {} \;

echo "✅ All components updated!"
echo "📝 Manual check required for:"
echo "   - ApacheConfig.jsx"
echo "   - Dashboard.jsx"
echo "   - QuickActions.jsx"
echo ""
echo "🏗️  Next steps:"
echo "   1. cd /home/kali/LOCALED/front"
echo "   2. npm run build"
echo "   3. Test the build"
