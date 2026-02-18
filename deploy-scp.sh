#!/bin/bash
# Simple SCP deployment script for gtm.consulting Phase 1

# Configuration
REMOTE_USER="gtm.consulting"
REMOTE_HOST="sftp.gtm.consulting"
REMOTE_PORT="9022"
SSH_KEY=".ssh/deploy_key"
REMOTE_PATH="/home/gtm.consulting/www"

echo "🚀 Deploying Phase 1 to gtm.consulting (using SCP)..."
echo ""

# Check if key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Upload index.html
echo "📄 Uploading index.html..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" index.html "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

# Upload vendor.js
echo "📄 Uploading assets/js/vendor.js..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" assets/js/vendor.js "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/js/"

# Create video directory on remote
echo "📁 Creating assets/img/v/ directory..."
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH/assets/img/v"

# Upload video files
echo "📹 Uploading video files (this may take a moment)..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" \
    assets/img/v/ph1a.mp4 \
    assets/img/v/ph1b.mp4 \
    assets/img/v/ph1c.mp4 \
    assets/img/v/ph1d.mp4 \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/v/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Visit https://gtm.consulting to see Phase 1 live"
    echo ""
    echo "🎬 Phase 1 Features:"
    echo "  • Animated logo (auto-plays on load)"
    echo "  • Hero video trigger: _t('h')"
    echo "  • Tabs videos: _t('t1'), _t('t2')"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
