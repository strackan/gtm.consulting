#!/bin/bash
# Deploy via home directory upload then SSH move

REMOTE_USER="gtm.consulting"
REMOTE_HOST="sftp.gtm.consulting"
REMOTE_PORT="9022"
SSH_KEY=".ssh/deploy_key"
DEPLOY_TMP="~/deploy_tmp"
REMOTE_PATH="/home/gtm.consulting/www"

echo "🚀 Full Deployment to gtm.consulting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Upload to home directory
echo "📦 Step 1: Uploading files to temporary location..."

# Upload index.html
scp -i "$SSH_KEY" -P "$REMOTE_PORT" index.html "$REMOTE_USER@$REMOTE_HOST:~/"

# Upload assets directory (recursive)
scp -i "$SSH_KEY" -P "$REMOTE_PORT" -r assets "$REMOTE_USER@$REMOTE_HOST:~/"

echo ""
echo "📂 Step 2: Moving files to www directory via SSH..."

# Execute commands on server to move files
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
# Backup existing index.php
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp www/index.php www/index.php.bak.$TIMESTAMP 2>/dev/null

# Move index.html to www/index.php
cp ~/index.html www/index.php

# Sync assets directory
rsync -av --delete ~/assets/ www/assets/

# Clean up temp files
rm -rf ~/index.html

echo "✅ Files moved to www directory"
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Deployment Complete!"
    echo ""
    echo "📊 Deployed:"
    echo "  • index.html → index.php"
    echo "  • Complete assets directory (~6MB)"
    echo "  • Phase 1 videos ready"
    echo ""
    echo "🌐 Visit: https://gtm.consulting"
    echo "🎬 Logo animation auto-plays!"
else
    echo ""
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi
