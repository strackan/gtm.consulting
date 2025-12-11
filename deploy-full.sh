#!/bin/bash
# Full deployment script for gtm.consulting
# Uploads complete static site replacing PHP version

# Configuration
REMOTE_USER="gtm.consulting"
REMOTE_HOST="sftp.gtm.consulting"
REMOTE_PORT="9022"
SSH_KEY=".ssh/deploy_key"
REMOTE_PATH="/home/gtm.consulting/www"

echo "🚀 Full Deployment to gtm.consulting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Step 1: Backup existing index.php
echo "📦 Step 1: Backing up existing index.php..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
    "cp $REMOTE_PATH/index.php $REMOTE_PATH/index.php.bak.$TIMESTAMP" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup created: index.php.bak.$TIMESTAMP"
else
    echo "⚠️  No existing index.php to backup (or backup failed)"
fi
echo ""

# Step 2: Create assets directories
echo "📁 Step 2: Creating asset directories..."
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
mkdir -p /home/gtm.consulting/www/assets/css
mkdir -p /home/gtm.consulting/www/assets/js
mkdir -p /home/gtm.consulting/www/assets/img/v
mkdir -p /home/gtm.consulting/www/assets/img/clients
mkdir -p /home/gtm.consulting/www/assets/img/testimonials
EOF
echo "✅ Directories created"
echo ""

# Step 3: Upload index.html as index.php
echo "📄 Step 3: Uploading index.html → index.php..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" index.html "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/index.php"
echo ""

# Step 4: Upload CSS
echo "🎨 Step 4: Uploading CSS..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" assets/css/style.css "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/css/"
echo ""

# Step 5: Upload JavaScript
echo "📜 Step 5: Uploading JavaScript..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" \
    assets/js/main.js \
    assets/js/vendor.js \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/js/"
echo ""

# Step 6: Upload images
echo "🖼️  Step 6: Uploading images..."
echo "  → Hero background (2.4MB)..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" \
    assets/img/priscilla-du-preez-XkKCui44iM0-unsplash.jpg \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/"

echo "  → Service tab images..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" \
    assets/img/tabs-1.jpg \
    assets/img/tabs-2.jpg \
    assets/img/tabs-3.jpg \
    assets/img/tabs-4.jpg \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/"

echo "  → Client logos (7 files)..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" assets/img/clients/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/clients/"

echo "  → Testimonial photos (5 files)..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" assets/img/testimonials/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/testimonials/"
echo ""

# Step 7: Upload Phase 1 videos
echo "📹 Step 7: Uploading Phase 1 videos (~3.5MB)..."
scp -i "$SSH_KEY" -P "$REMOTE_PORT" \
    assets/img/v/ph1a.mp4 \
    assets/img/v/ph1b.mp4 \
    assets/img/v/ph1c.mp4 \
    assets/img/v/ph1d.mp4 \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/assets/img/v/"
echo ""

if [ $? -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Deployment Complete!"
    echo ""
    echo "📊 Deployed:"
    echo "  • index.html → index.php"
    echo "  • style.css + main.js + vendor.js"
    echo "  • Hero image (2.4MB)"
    echo "  • 7 client logos"
    echo "  • 5 testimonial photos"
    echo "  • 4 service images"
    echo "  • 4 Phase 1 videos (3.5MB)"
    echo ""
    echo "🌐 Visit: https://gtm.consulting"
    echo "🎬 Phase 1 logo animation auto-plays!"
    echo ""
    echo "📝 Note: Original index.php backed up as index.php.bak.$TIMESTAMP"
else
    echo ""
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi
