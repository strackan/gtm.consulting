# Deployment Guide

## Quick Deploy (FULL SITE)

To deploy the complete static site with Phase 1:

```bash
./deploy-full.sh
```

This is a **complete deployment** that replaces the PHP version with our static HTML.

## What Gets Deployed

Complete site deployment includes:

### 1. HTML
- **index.html** → uploaded as **index.php** (replaces current PHP version)
- Original `index.php` backed up as `index.php.bak.TIMESTAMP`

### 2. CSS & JavaScript
- **assets/css/style.css** - Presento template CSS (~24KB)
- **assets/js/main.js** - Presento template JS
- **assets/js/vendor.js** - Phase 1 video animation system (NEW)

### 3. Images (~2.6MB)
- **Hero:** priscilla-du-preez-XkKCui44iM0-unsplash.jpg (2.4MB)
- **Client logos (7):** Stylo, Cast, Zoee, Eva, Replayz, SL, Techvestor
- **Testimonials (5):** Jeff, Nichole, Austin, Channing, Lindsey
- **Service tabs (4):** tabs-1.jpg through tabs-4.jpg

### 4. Phase 1 Videos (~3.5MB)
- **assets/img/v/ph1a.mp4** - Hero video (2.3MB)
- **assets/img/v/ph1b.mp4** - Logo video (extended)
- **assets/img/v/ph1c.mp4** - Tabs-1 first instance (92KB)
- **assets/img/v/ph1d.mp4** - Tabs-1 second instance (92KB)

**Total upload size:** ~6MB

## Alternative: Phase 1 Only Update

If you just need to update Phase 1 files (assumes base already deployed):

```bash
./deploy-scp.sh
```

## Server Configuration

- **Host:** sftp.gtm.consulting
- **Port:** 9022
- **User:** gtm.consulting
- **Remote Path:** /home/gtm.consulting/www
- **SSH Key:** .ssh/deploy_key

## Manual Deployment

If scripts don't work, you can manually upload via SCP/SFTP.

### Quick Manual Deploy (Full Site):

```bash
# 1. Backup current index.php
ssh -i .ssh/deploy_key -p 9022 gtm.consulting@sftp.gtm.consulting \
    "cp www/index.php www/index.php.bak.$(date +%Y%m%d)"

# 2. Upload entire assets directory
scp -i .ssh/deploy_key -P 9022 -r assets gtm.consulting@sftp.gtm.consulting:/home/gtm.consulting/www/

# 3. Upload index.html as index.php
scp -i .ssh/deploy_key -P 9022 index.html gtm.consulting@sftp.gtm.consulting:/home/gtm.consulting/www/index.php
```

### Or use SFTP client (FileZilla, Cyberduck, etc.):
1. Host: `sftp://sftp.gtm.consulting:9022`
2. Username: `gtm.consulting`
3. Private key: `.ssh/deploy_key`
4. Upload to: `/home/gtm.consulting/www/`

## Verify Deployment

After deployment, visit https://gtm.consulting and check:

1. ✅ Logo animates automatically on page load
2. ✅ Console shows "Video system ready" (localhost only)
3. ✅ Test hero video: Open console and run `_t('h')`
4. ✅ Test tabs videos: `_t('t1')` and `_t('t2')`

## Troubleshooting

**Permission denied:**
- Ensure SSH key has correct permissions: `chmod 600 .ssh/deploy_key`

**Wrong path:**
- Update `REMOTE_PATH` in deploy script if your server uses a different directory

**Connection refused:**
- Verify port 9022 is correct
- Check if your IP needs to be whitelisted

**Videos not loading:**
- Check browser console for 404 errors
- Verify video files uploaded to correct path: `/assets/img/v/`

## Security Notes

- SSH key is stored in `.ssh/deploy_key` (gitignored, never committed)
- Video files use obfuscated names (ph1a-ph1d) for stealth
- All videos are served from `/assets/img/v/` subdirectory
