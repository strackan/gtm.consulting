#!/bin/bash
# Deployment script for gtm.consulting Phase 1

# Configuration
REMOTE_USER="gtm.consulting"
REMOTE_HOST="sftp.gtm.consulting"
REMOTE_PORT="9022"
SSH_KEY=".ssh/deploy_key"
REMOTE_PATH="/home/gtm.consulting/www"

echo "🚀 Deploying Phase 1 to gtm.consulting..."
echo ""

# Check if key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Create SFTP batch file
cat > .sftp_batch <<EOF
cd $REMOTE_PATH
put index.html
cd assets/js
put assets/js/vendor.js
cd ../img
mkdir v
cd v
put assets/img/v/ph1a.mp4
put assets/img/v/ph1b.mp4
put assets/img/v/ph1c.mp4
put assets/img/v/ph1d.mp4
bye
EOF

echo "📦 Files to upload:"
echo "  - index.html"
echo "  - assets/js/vendor.js"
echo "  - assets/img/v/ (4 videos, ~3.5MB total)"
echo ""

# Upload files via SFTP
echo "⬆️  Uploading files..."
sftp -i "$SSH_KEY" -P "$REMOTE_PORT" -b .sftp_batch "$REMOTE_USER@$REMOTE_HOST"

# Clean up batch file
rm .sftp_batch

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Visit https://gtm.consulting to see Phase 1 live"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
