# Skill Updates Documentation

Welcome to the MCP-World Living Document Update System documentation!

## Overview

This system allows Skills to evolve as "living documents" - experts can add new content, frameworks, examples, and improvements without manually editing their main SKILL.md file.

## Documentation

### For Experts

1. **[Expert Guide](./EXPERT-GUIDE.md)** - Complete guide to using the update system
   - Quick start
   - Understanding the system
   - Creating updates
   - Update types and best practices
   - FAQ

2. **[Quick Reference](./QUICK-REFERENCE.md)** - Fast cheat sheet
   - 3-step process
   - YAML field reference
   - Common issues and solutions
   - Copy-paste template

3. **[Configuration Reference](./CONFIG-REFERENCE.md)** - Technical reference for skill-config.json
   - All configuration options
   - Integration rules
   - Validation settings
   - Voice profiles
   - Complete examples

### For Developers

See the main project documentation:
- System Architecture: `PROJECT-SUMMARY.md`
- Package Documentation: `packages/skill-updater/README.md` (coming soon)
- API Reference: TypeScript types in `packages/skill-updater/src/types.ts`

## Quick Links

### Getting Started
- New to the system? Start with the [Expert Guide](./EXPERT-GUIDE.md)
- Need a quick reminder? Use the [Quick Reference](./QUICK-REFERENCE.md)
- Configuring your Skill? See the [Configuration Reference](./CONFIG-REFERENCE.md)

### Common Tasks
- **Create your first update:** [Expert Guide - Quick Start](./EXPERT-GUIDE.md#quick-start)
- **Understand update types:** [Expert Guide - Update Types](./EXPERT-GUIDE.md#update-types)
- **Configure integration rules:** [Configuration Reference - Integration Rules](./CONFIG-REFERENCE.md#integration-rules)
- **Set up notifications:** [Configuration Reference - Notifications](./CONFIG-REFERENCE.md#notifications)
- **Troubleshoot issues:** [Quick Reference - Troubleshooting](./QUICK-REFERENCE.md#troubleshooting)

## File Structure

```
docs/skill-updates/
├── README.md                  # This file
├── EXPERT-GUIDE.md           # Complete user guide
├── QUICK-REFERENCE.md        # Cheat sheet
└── CONFIG-REFERENCE.md       # Technical configuration reference
```

## System Components

### For Each Skill

```
skills/{tier}/{skillId}/
├── SKILL.md                  # Main skill document (auto-updated)
├── CHANGELOG.md              # Version history (auto-updated)
├── skill-config.json         # Configuration file
└── _updates/                 # Drop updates here
    ├── README.md            # Quick instructions
    ├── _TEMPLATE-update.md  # Template to copy
    └── *.md                 # Your update files
```

### Core System

```
packages/skill-updater/
├── src/
│   ├── types.ts            # TypeScript types and schemas
│   ├── watcher.ts          # File system watcher
│   ├── utils.ts            # Helper functions
│   └── index.ts            # Package exports
└── package.json
```

## Workflow Overview

```
┌──────────────────────────────────────────────────┐
│  Expert creates update in _updates/ folder       │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│  System detects and validates (seconds)          │
│  - Checks YAML frontmatter                       │
│  - Validates against schema                      │
│  - Extracts metadata                             │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│  Integration Engine processes                    │
│  - Applies integration rules from config         │
│  - Preserves voice and formatting                │
│  - Creates proposed integration                  │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│  Expert reviews (if approvalRequired: true)      │
│  - Approve                                       │
│  - Request changes                               │
│  - Reject                                        │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│  System publishes                                │
│  - Updates SKILL.md                              │
│  - Updates CHANGELOG.md                          │
│  - Archives update file                          │
│  - Sends notification                            │
└──────────────────────────────────────────────────┘
```

## Supported Update Types

| Type | Purpose | Typical Use |
|------|---------|-------------|
| `framework` | New methodologies | Core expertise content |
| `playbook` | Step-by-step guides | Actionable processes |
| `example` | Real-world examples | Case studies, stories |
| `template` | Reusable templates | Email templates, scripts |
| `correction` | Fix errors | Typos, clarifications |
| `expansion` | Add detail | Extend existing content |
| `case-study` | Detailed stories | Success stories with metrics |

## Key Features

- **Automatic Detection:** Updates detected within seconds of saving
- **Validation:** YAML frontmatter and content validated automatically
- **Voice Preservation:** System maintains your unique writing style
- **Flexible Integration:** Rules-based for simple updates, AI-powered for complex
- **Version Control:** CHANGELOG.md automatically updated
- **Approval Workflow:** Optional expert approval before publishing
- **Notifications:** Multi-channel notifications (email, Slack, webhook)
- **Research Integration:** Optional sync with RESEARCH.md

## Configuration Highlights

### Minimal Config
```json
{
  "version": "1.0.0",
  "expert": {
    "name": "Your Name",
    "skillId": "your-id",
    "tier": "platinum"
  },
  "integrationRules": {},
  "validation": {}
}
```

### Key Settings
- **Auto-Approve:** Auto-integrate certain update types (e.g., typo fixes)
- **Voice Profile:** Define your writing style for consistency checking
- **Integration Rules:** Control where and how updates are integrated
- **Notifications:** Choose when and how you're notified
- **Research Sync:** Optionally integrate curated research content

## Getting Help

### Documentation
- Start here: [Expert Guide](./EXPERT-GUIDE.md)
- Quick answers: [Quick Reference](./QUICK-REFERENCE.md)
- Deep dive: [Configuration Reference](./CONFIG-REFERENCE.md)

### Examples
- Check `_TEMPLATE-update.md` in your `_updates/` folder
- Review `skill-config.json` in PLATINUM Skills
- See `CHANGELOG.md` for integration examples

### Support
- Technical issues: Contact system administrator
- Feature requests: Submit via project channels
- Bug reports: Include error messages and file paths

## Development Status

**Current Phase:** Phase 1 - Foundation ✅
- ✅ Folder structure and templates
- ✅ Configuration schema
- ✅ File watcher implementation
- ✅ Expert documentation

**Next Phases:**
- Phase 2: Integration Engine (rules-based + AI-powered)
- Phase 3: Workflow Automation (approval, publishing)
- Phase 4: Advanced Features (bulk operations, analytics)
- Phase 5: Distribution (marketplace integration)

## Version

**Documentation Version:** 1.0.0
**System Version:** 0.1.0 (Phase 1)
**Last Updated:** 2024-11-20

---

**Need help?** Start with the [Expert Guide](./EXPERT-GUIDE.md) or jump to the [Quick Reference](./QUICK-REFERENCE.md) for fast answers!
