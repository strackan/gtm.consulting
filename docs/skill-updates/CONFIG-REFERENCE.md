# Configuration Reference: skill-config.json

This document provides detailed technical reference for the `skill-config.json` file that controls how updates are integrated into your Skill.

## Table of Contents

1. [Overview](#overview)
2. [File Location](#file-location)
3. [Schema Version](#schema-version)
4. [Configuration Sections](#configuration-sections)
5. [Integration Rules](#integration-rules)
6. [Validation Rules](#validation-rules)
7. [Voice Profile](#voice-profile)
8. [Notifications](#notifications)
9. [Research Integration](#research-integration)
10. [Examples](#examples)

---

## Overview

The `skill-config.json` file is the control center for your Skill's update system. It defines:

- **Who you are** (expert information)
- **How updates integrate** (rules by content type)
- **What gets validated** (quality controls)
- **Your writing voice** (for consistency checking)
- **When you're notified** (notification preferences)
- **Research integration** (optional RESEARCH.md sync)

**JSON Schema:** `schemas/skill-config.schema.json`

---

## File Location

```
skills/{tier}/{skillId}/skill-config.json
```

**Examples:**
```
skills/platinum/scott-leese/skill-config.json
skills/platinum/justin-strackany/skill-config.json
skills/premium/some-expert/skill-config.json
```

---

## Schema Version

```json
{
  "version": "1.0.0"
}
```

**Required:** Yes
**Format:** Semantic versioning (MAJOR.MINOR.PATCH)
**Purpose:** Ensures compatibility with the integration engine

---

## Configuration Sections

### 1. Expert Information

```json
{
  "expert": {
    "name": "Scott Leese",
    "skillId": "scott-leese",
    "tier": "platinum",
    "voiceProfile": "military-inspired, direct, actionable, no-BS",
    "approvalRequired": true,
    "autoPublish": false
  }
}
```

| Field | Required | Type | Options | Description |
|-------|----------|------|---------|-------------|
| `name` | Yes | string | Any | Your full name |
| `skillId` | Yes | string | `[a-z0-9-]+` | Unique identifier (must match folder name) |
| `tier` | Yes | string | `platinum`, `premium`, `regular`, `spotlight` | Your Skill tier |
| `voiceProfile` | No | string | Any | Brief description of your writing style |
| `approvalRequired` | No | boolean | `true`, `false` | Default: `true`. Whether you must approve integrations |
| `autoPublish` | No | boolean | `true`, `false` | Default: `false`. Auto-publish after approval |

---

## Integration Rules

The `integrationRules` object defines how each update type is handled.

### Structure

```json
{
  "integrationRules": {
    "frameworks": { /* rules */ },
    "playbooks": { /* rules */ },
    "examples": { /* rules */ },
    "templates": { /* rules */ },
    "corrections": { /* rules */ },
    "expansions": { /* rules */ },
    "case-study": { /* rules */ }
  }
}
```

### Rule Properties

#### Content Rules

```json
{
  "frameworks": {
    "section": "Frameworks & Methodologies",
    "template": "### {title}\n\n**The Challenge:** {challenge}\n\n{content}",
    "sortBy": "priority",
    "maxPerSection": 10
  }
}
```

| Property | Type | Options | Description |
|----------|------|---------|-------------|
| `section` | string | Any | Target section header in SKILL.md |
| `template` | string | Markdown with `{placeholders}` | Format template for this content type |
| `sortBy` | string | `priority`, `date`, `alphabetical`, `number` | How to order items |
| `maxPerSection` | number | Any positive integer | Maximum items allowed in section |

#### Storage Rules

```json
{
  "playbooks": {
    "location": "playbooks/",
    "format": "separate-file"
  }
}
```

| Property | Type | Options | Description |
|----------|------|---------|-------------|
| `location` | string | Path relative to skill root | Where to store files |
| `format` | string | `inline`, `separate-file` | Inline in SKILL.md or separate file |

#### Approval Rules

```json
{
  "corrections": {
    "autoApprove": true,
    "maxChanges": 5,
    "requireReview": false
  }
}
```

| Property | Type | Options | Description |
|----------|------|---------|-------------|
| `autoApprove` | boolean | `true`, `false` | Auto-approve this update type |
| `maxChanges` | number | Any positive integer | Max changes for auto-approval to apply |
| `requireReview` | boolean | `true`, `false` | Require review even if auto-approved |

#### Expansion Rules

```json
{
  "expansions": {
    "autoApprove": false,
    "preserveExisting": true
  }
}
```

| Property | Type | Options | Description |
|----------|------|---------|-------------|
| `preserveExisting` | boolean | `true`, `false` | Keep existing content when expanding |

### Example: Complete Integration Rules

```json
{
  "integrationRules": {
    "frameworks": {
      "section": "Frameworks & Methodologies",
      "template": "### {title}\n\n**The Challenge:** {challenge}\n\n**The Framework:**\n{content}\n\n**Metrics to Track:**\n{metrics}",
      "sortBy": "priority",
      "maxPerSection": 15
    },
    "playbooks": {
      "section": "Playbooks",
      "location": "playbooks/",
      "format": "separate-file"
    },
    "examples": {
      "section": "Examples & Use Cases",
      "location": "examples/",
      "format": "separate-file",
      "sortBy": "date"
    },
    "templates": {
      "section": "Opening Templates",
      "sortBy": "number",
      "maxPerSection": 15
    },
    "corrections": {
      "autoApprove": true,
      "maxChanges": 5,
      "requireReview": false
    },
    "expansions": {
      "autoApprove": false,
      "preserveExisting": true
    }
  }
}
```

---

## Validation Rules

Controls quality checks applied to all updates.

```json
{
  "validation": {
    "preserveStructure": true,
    "checkVoice": true,
    "noDuplicates": true,
    "maintainFormatting": true,
    "requireYAMLFrontmatter": true,
    "allowedUpdateTypes": [
      "framework",
      "playbook",
      "example",
      "template",
      "correction",
      "expansion"
    ]
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `preserveStructure` | boolean | `true` | Ensure SKILL.md structure is preserved |
| `checkVoice` | boolean | `true` | Validate voice consistency with your profile |
| `noDuplicates` | boolean | `true` | Prevent duplicate content |
| `maintainFormatting` | boolean | `true` | Maintain markdown formatting consistency |
| `requireYAMLFrontmatter` | boolean | `true` | All updates must have valid YAML frontmatter |
| `allowedUpdateTypes` | array | All types | Limit which update types are accepted |

**Limiting Update Types:**

```json
{
  "validation": {
    "allowedUpdateTypes": ["framework", "example", "correction"]
  }
}
```

This would reject `playbook`, `template`, `expansion`, and `case-study` updates.

---

## Voice Profile

Optional but recommended for maintaining consistency.

```json
{
  "voice": {
    "characteristics": [
      "Direct and to the point",
      "Military-style accountability",
      "Numbered lists and clear structure",
      "Metrics and quantifiable outcomes",
      "No excuses, results-focused"
    ],
    "avoid": [
      "Wishy-washy language",
      "Theoretical without practical",
      "Excuses or blame",
      "Complexity without necessity"
    ]
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `characteristics` | array of strings | Key traits of your writing style |
| `avoid` | array of strings | Things that don't match your voice |

**How It's Used:**

The integration engine uses this profile to:
1. Check that integrated content matches your voice
2. Suggest edits if content doesn't fit
3. Preserve your unique style during integration

---

## Notifications

Control when and how you're notified about updates.

```json
{
  "notifications": {
    "onNewUpdate": true,
    "onIntegrationReady": true,
    "onPublish": true,
    "channels": ["email", "slack"]
  }
}
```

| Property | Type | Options | Default | Description |
|----------|------|---------|---------|-------------|
| `onNewUpdate` | boolean | `true`, `false` | `true` | Notify when new update detected |
| `onIntegrationReady` | boolean | `true`, `false` | `true` | Notify when integration is ready for review |
| `onPublish` | boolean | `true`, `false` | `true` | Notify when update is published |
| `channels` | array | `email`, `slack`, `webhook`, `none` | `[]` | How to notify you |

### Notification Channels

- **`email`**: Receive email notifications
- **`slack`**: Get Slack DMs or channel messages
- **`webhook`**: POST to custom webhook URL
- **`none`**: Disable notifications (not recommended)

---

## Research Integration

Optional integration with RESEARCH.md file for curated research.

```json
{
  "research": {
    "enabled": true,
    "researchFile": "RESEARCH.md",
    "autoIntegrate": false,
    "priorityTriggers": [
      "new framework",
      "Surf & Sales mention",
      "published content",
      "testimonial"
    ]
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `false` | Whether research integration is enabled |
| `researchFile` | string | `"RESEARCH.md"` | Path to research file (relative to skill root) |
| `autoIntegrate` | boolean | `false` | Automatically integrate research content |
| `priorityTriggers` | array of strings | `[]` | Keywords that trigger priority integration |

### How Research Integration Works

1. **Manual Mode** (`autoIntegrate: false`):
   - System monitors RESEARCH.md
   - Notifies you of potential content to integrate
   - You create updates manually based on research

2. **Auto Mode** (`autoIntegrate: true`):
   - System extracts content from RESEARCH.md
   - Creates draft updates automatically
   - You review and approve before integration

3. **Priority Triggers**:
   - When research contains trigger keywords, it's flagged as high priority
   - You're notified immediately
   - Useful for time-sensitive content

---

## Examples

### Minimal Configuration

```json
{
  "$schema": "../../../schemas/skill-config.schema.json",
  "version": "1.0.0",
  "expert": {
    "name": "Jane Doe",
    "skillId": "jane-doe",
    "tier": "regular"
  },
  "integrationRules": {
    "corrections": {
      "autoApprove": true,
      "maxChanges": 3
    }
  },
  "validation": {}
}
```

### Full Configuration (Scott Leese Example)

```json
{
  "$schema": "../../../schemas/skill-config.schema.json",
  "version": "1.0.0",
  "expert": {
    "name": "Scott Leese",
    "skillId": "scott-leese",
    "tier": "platinum",
    "voiceProfile": "military-inspired, direct, actionable, no-BS, accountability-focused",
    "approvalRequired": true,
    "autoPublish": false
  },
  "integrationRules": {
    "frameworks": {
      "section": "Frameworks & Methodologies",
      "template": "### {title}\n\n**The Challenge:** {challenge}\n\n**The Framework:**\n{content}\n\n**Metrics to Track:**\n{metrics}",
      "sortBy": "priority"
    },
    "playbooks": {
      "section": "Playbooks",
      "location": "playbooks/",
      "format": "separate-file"
    },
    "examples": {
      "section": "Examples & Use Cases",
      "location": "examples/",
      "format": "separate-file"
    },
    "corrections": {
      "autoApprove": true,
      "maxChanges": 5,
      "requireReview": false
    },
    "expansions": {
      "autoApprove": false,
      "preserveExisting": true
    }
  },
  "validation": {
    "preserveStructure": true,
    "checkVoice": true,
    "noDuplicates": true,
    "maintainFormatting": true,
    "requireYAMLFrontmatter": true,
    "allowedUpdateTypes": [
      "framework",
      "playbook",
      "example",
      "correction",
      "expansion"
    ]
  },
  "voice": {
    "characteristics": [
      "Direct and to the point",
      "Military-style accountability",
      "Numbered lists and clear structure",
      "Metrics and quantifiable outcomes",
      "No excuses, results-focused"
    ],
    "avoid": [
      "Wishy-washy language",
      "Theoretical without practical",
      "Excuses or blame",
      "Complexity without necessity"
    ]
  },
  "notifications": {
    "onNewUpdate": true,
    "onIntegrationReady": true,
    "onPublish": true,
    "channels": ["email", "slack"]
  },
  "research": {
    "enabled": true,
    "researchFile": "RESEARCH.md",
    "autoIntegrate": false,
    "priorityTriggers": [
      "new framework",
      "Surf & Sales mention",
      "published content",
      "testimonial"
    ]
  }
}
```

---

## Validation & Testing

### Validate Your Config

Use the JSON Schema to validate your configuration:

```bash
# Using a JSON Schema validator
jsonschema -i skill-config.json ../../../schemas/skill-config.schema.json
```

### Common Validation Errors

**Error: Missing required property "version"**
```json
{
  // Missing version field
  "expert": { ... }
}
```
**Fix:** Add `"version": "1.0.0"` at the top level.

**Error: Invalid tier value**
```json
{
  "expert": {
    "tier": "gold"  // Invalid!
  }
}
```
**Fix:** Use one of: `platinum`, `premium`, `regular`, `spotlight`

**Error: Invalid skillId format**
```json
{
  "expert": {
    "skillId": "Scott_Leese"  // Underscores not allowed!
  }
}
```
**Fix:** Use only lowercase letters, numbers, and hyphens: `scott-leese`

---

## Best Practices

1. **Start Simple:** Begin with minimal config and add complexity as needed
2. **Test Integration Rules:** Create test updates to verify your rules work
3. **Document Your Voice:** Spend time on the voice profile—it pays off
4. **Use Auto-Approve Wisely:** Only for truly safe updates (typo fixes, etc.)
5. **Review Regularly:** Update your config as your content evolves
6. **Backup Before Changes:** Keep previous versions of your config

---

## Getting Help

- **Schema Reference:** `schemas/skill-config.schema.json`
- **Examples:** Look at other experts' configs in `skills/` folders
- **Validation:** Run JSON Schema validation before deploying
- **Support:** Contact system admin for configuration assistance
