# PowerPak Backend Integrations

**Production-grade backend integrations for PowerPak MCP Server**

## Overview

The PowerPak server can optionally integrate with backend MCP services to provide real-world functionality for hire, message, and booking requests. This creates a complete workflow from MCP client → PowerPak server → Backend services (Slack, GitHub, Filesystem).

## Architecture

```
MCP Client (Claude Code, Electron App)
         ↓
PowerPak MCP Server
         ↓
Backend Integrator
         ├── Slack MCP (Notifications)
         ├── GitHub MCP (Issue Tracking)
         └── Filesystem MCP (Audit Trail)
```

## Backend Services

### 1. Slack MCP
**Purpose:** Real-time notifications for expert requests

**Features:**
- Send notifications to expert-specific channels
- Thread-based conversations for follow-ups
- Channel management for different request types

**Use Cases:**
- `hire` tool → Slack notification to #expert-requests
- `message` tool → Direct message to expert
- `book_meeting` tool → Calendar scheduling notification

**Configuration:**
```json
{
  "slack": {
    "enabled": true,
    "notificationChannel": "powerpak-notifications",
    "expertRequestsChannel": "expert-requests"
  }
}
```

**Required Environment Variables:**
- `SLACK_BOT_TOKEN` - Bot token (xoxb-...)
- `SLACK_TEAM_ID` - Team ID (T...)

**Required OAuth Scopes:**
- `channels:history`
- `channels:read`
- `chat:write`
- `reactions:write`
- `users:read`
- `users.profile:read`

### 2. GitHub MCP
**Purpose:** Issue tracking for hire requests and workflow automation

**Features:**
- Create GitHub issues for hire requests
- Track request status and resolution
- PR-based workflow for skill updates (future)

**Use Cases:**
- `hire` tool → GitHub issue created for tracking
- Skill update workflow → PR creation and review

**Configuration:**
```json
{
  "github": {
    "enabled": true,
    "repository": "strackan/MCP-World",
    "prLabels": ["skill-update", "needs-review"]
  }
}
```

**Required Environment Variables:**
- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub PAT

**Required Token Scopes:**
- `repo` - Full repository access
- `read:org` - Read organization data

### 3. Filesystem MCP
**Purpose:** Secure file operations and audit trail

**Features:**
- Write audit logs for all requests
- Read SKILL.md files
- Manage skill update queue
- Archive processed updates

**Use Cases:**
- All tool calls → Audit log entry created
- Skill parser → Read SKILL.md files
- Update workflow → File management

**Configuration:**
```json
{
  "filesystem": {
    "enabled": true,
    "auditLogPath": "./.audit"
  }
}
```

**No environment variables required** - Uses local filesystem

## Usage

### Basic Mode (No Backend)

```bash
# Default: Backend integrations disabled
node dist/index.js justin-strackany platinum
```

**Behavior:**
- `hire`, `message`, `book_meeting` tools return confirmation messages
- No actual notifications sent
- No audit trail created
- Suitable for development and testing

### Production Mode (With Backend)

```bash
# Enable backend integrations
node dist/index.js justin-strackany platinum --with-backend
```

**Behavior:**
- `hire` → Slack notification + GitHub issue + Audit log
- `message` → Slack notification + Audit log
- `book_meeting` → Slack notification + Audit log

## Tool Behavior with Backend

### hire Tool

**Without Backend:**
```json
{
  "status": "pending",
  "message": "Your hiring request has been received...",
  "requestId": "hire-1732234567890",
  "notificationSent": false,
  "issueCreated": false
}
```

**With Backend:**
```json
{
  "status": "received",
  "message": "Your hiring request has been received...",
  "notificationSent": true,
  "issueCreated": true
}
```

### message Tool

**Without Backend:**
```json
{
  "status": "sent",
  "message": "Your message has been sent...",
  "messageId": "msg-1732234567890",
  "notificationSent": false
}
```

**With Backend:**
```json
{
  "status": "sent",
  "message": "Your message has been sent...",
  "notificationSent": true
}
```

### book_meeting Tool

**Without Backend:**
```json
{
  "status": "pending",
  "message": "Meeting request received...",
  "bookingId": "booking-1732234567890",
  "notificationSent": false
}
```

**With Backend:**
```json
{
  "status": "pending",
  "message": "Meeting request received...",
  "notificationSent": true
}
```

## Setup Instructions

### 1. Slack Integration

**Step 1: Create Slack App**
1. Go to https://api.slack.com/apps
2. Create new app "PowerPak Notifications"
3. Add Bot Token Scopes (see above)
4. Install app to workspace
5. Copy Bot User OAuth Token (xoxb-...)

**Step 2: Create Channels**
```
#powerpak-notifications - General activity
#expert-requests - Hire/message/booking requests
#skill-updates - Skill update PR notifications
```

**Step 3: Invite Bot**
```
/invite @PowerPak Notifications
```

**Step 4: Set Environment Variables**
```bash
export SLACK_BOT_TOKEN="xoxb-your-token"
export SLACK_TEAM_ID="T0123456789"
```

### 2. GitHub Integration

**Step 1: Create Personal Access Token**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`
4. Copy token

**Step 2: Set Environment Variable**
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token"
```

**Step 3: Verify Repository Access**
```bash
# Ensure token has access to your repository
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/repos/strackan/MCP-World
```

### 3. Filesystem Integration

**Step 1: Create Audit Directory**
```bash
mkdir -p .audit
```

**Step 2: Verify Permissions**
```bash
# Ensure write permissions
touch .audit/test.log
rm .audit/test.log
```

**No additional configuration required** - Works out of the box

## Audit Logs

Audit logs are written in JSONL format (one JSON object per line):

**Location:** `./.audit/{eventType}-{date}.jsonl`

**Example:** `.audit/hire-2024-11-21.jsonl`

**Format:**
```json
{"timestamp":"2024-11-21T22:15:30.123Z","eventType":"hire","data":{"expertName":"Justin Strackany","projectDescription":"Need help with RevOps","duration":"3 months","budget":"$50K","contactEmail":"client@example.com","requestId":"hire-1732234530123"}}
{"timestamp":"2024-11-21T22:20:45.456Z","eventType":"message","data":{"expertName":"Scott Leese","subject":"Sales team question","message":"How do I scale from 5 to 15 reps?","contactEmail":"client@example.com","messageId":"msg-1732234845456"}}
```

## Workflows

### Hire Request Workflow

1. **Client calls `hire` tool** via MCP client
2. **PowerPak server receives request**
   - Validates input (project description, contact email)
   - Generates unique `requestId`
3. **Backend Integrator processes:**
   - **Audit Log:** Write to `.audit/hire-{date}.jsonl`
   - **Slack:** Post to #expert-requests channel
   - **GitHub:** Create issue with label `hire-request`
4. **Return confirmation** to client with status flags

### Message Workflow

1. **Client calls `message` tool** via MCP client
2. **PowerPak server receives request**
   - Validates input (message, contact email)
   - Generates unique `messageId`
3. **Backend Integrator processes:**
   - **Audit Log:** Write to `.audit/message-{date}.jsonl`
   - **Slack:** Post to #expert-requests channel
4. **Return confirmation** to client

### Booking Workflow

1. **Client calls `book_meeting` tool** via MCP client
2. **PowerPak server receives request**
   - Validates input (topic, duration, contact email)
   - Generates unique `bookingId`
3. **Backend Integrator processes:**
   - **Audit Log:** Write to `.audit/booking-{date}.jsonl`
   - **Slack:** Post to #expert-requests channel
   - **Calendar:** (Future) Integrate with calendar API
4. **Return confirmation** to client

## Troubleshooting

### Slack Integration Issues

**Error:** "SLACK_BOT_TOKEN not found"
```bash
# Verify environment variable is set
echo $SLACK_BOT_TOKEN

# Should output: xoxb-...
```

**Error:** "channel_not_found"
```bash
# Ensure bot is invited to channel
/invite @PowerPak Notifications
```

**Error:** "missing_scope"
```bash
# Reinstall app with correct scopes:
# channels:read, chat:write, etc.
```

### GitHub Integration Issues

**Error:** "GITHUB_PERSONAL_ACCESS_TOKEN not found"
```bash
# Verify environment variable is set
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Should output: ghp_...
```

**Error:** "Bad credentials"
```bash
# Verify token is valid
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/user
```

**Error:** "Resource not accessible by integration"
```bash
# Ensure token has 'repo' scope
```

### Filesystem Integration Issues

**Error:** "EACCES: permission denied"
```bash
# Check directory permissions
ls -la .audit

# Fix permissions
chmod 755 .audit
```

**Error:** "ENOENT: no such file or directory"
```bash
# Create audit directory
mkdir -p .audit
```

## Production Deployment

### Environment Variables

Create `.env` file:
```bash
# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_TEAM_ID=T0123456789

# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-token

# Optional: Override defaults
AUDIT_LOG_PATH=./logs/audit
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with backend integrations
pm2 start dist/index.js --name powerpak-justin \
  -- justin-strackany platinum --with-backend

pm2 start dist/index.js --name powerpak-scott \
  -- scott-leese platinum --with-backend

# Save process list
pm2 save

# Auto-restart on reboot
pm2 startup
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY ../../skills ./skills

ENV SLACK_BOT_TOKEN=""
ENV SLACK_TEAM_ID=""
ENV GITHUB_PERSONAL_ACCESS_TOKEN=""

CMD ["node", "dist/index.js", "justin-strackany", "platinum", "--with-backend"]
```

## Future Enhancements

- [ ] Calendar API integration for automatic booking
- [ ] Email notifications as fallback
- [ ] SMS notifications via Twilio
- [ ] Analytics dashboard for request metrics
- [ ] Webhook support for custom integrations
- [ ] Multi-expert routing based on expertise
- [ ] Rate limiting and abuse protection
- [ ] Encryption for sensitive data in audit logs

## Security Considerations

1. **Tokens:** Store in environment variables, never commit to git
2. **Audit Logs:** May contain PII (contact emails) - handle according to GDPR
3. **Access Control:** Limit Slack bot permissions to minimum required
4. **GitHub:** Use fine-grained tokens with repository-specific access
5. **Filesystem:** Restrict audit log directory permissions (700 or 755)

## Support

For issues or questions:
- GitHub Issues: https://github.com/strackan/MCP-World/issues
- Slack: #powerpak-support
- Email: support@powerpak.com
