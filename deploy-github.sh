#!/bin/bash
# Deploy via GitHub (avoids local SSH key permission issues)

REMOTE_USER="gtm.consulting"
REMOTE_HOST="sftp.gtm.consulting"
REMOTE_PORT="9022"
SSH_KEY=".ssh/deploy_key"
REMOTE_PATH="/home/gtm.consulting/www"
GITHUB_REPO="" # Add your GitHub repo URL here

echo "🚀 GitHub-based Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Push to GitHub
echo "📤 Step 1: Pushing to GitHub..."
git push origin master

if [ $? -ne 0 ]; then
    echo "❌ Git push failed. Please set up GitHub remote first:"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin master"
    exit 1
fi
echo ""

# Step 2: Pull on server
echo "📥 Step 2: Pulling on server..."
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
cd $REMOTE_PATH
# Backup current index.php
cp index.php index.php.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null
# Clone or pull
if [ -d .git ]; then
    git pull
else
    git clone $GITHUB_REPO .
fi
# Rename index.html to index.php
cp index.html index.php
echo "✅ Deployment complete"
EOF

echo ""
echo "✅ Deployed via GitHub!"
echo "🌐 Visit: https://gtm.consulting"
