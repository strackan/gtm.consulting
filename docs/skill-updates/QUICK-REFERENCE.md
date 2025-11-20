# Quick Reference: Skill Updates

Fast reference for creating and managing Skill updates.

## Create an Update (3 Steps)

1. **Create file** in `_updates/` folder
   ```
   YYYY-MM-DD-short-description.md
   ```

2. **Add YAML frontmatter**
   ```yaml
   ---
   type: framework
   category: sales
   priority: medium
   targetSection: "Section Name"
   status: ready
   author: Your Name
   dateAdded: 2024-11-20
   tags: [tag1, tag2]
   ---
   ```

3. **Write content** below the `---`

**Done!** System auto-detects and processes.

---

## Update Types

| Type | Use When | Auto-Approve? |
|------|----------|---------------|
| `framework` | New methodology or structured approach | No |
| `playbook` | Step-by-step guide | No |
| `example` | Real-world example or case | No |
| `template` | Reusable template | No |
| `correction` | Fix typo or error | Often yes* |
| `expansion` | Add detail to existing content | No |
| `case-study` | Detailed success story | No |

*Depends on your config

---

## YAML Fields

### Required

```yaml
type: framework           # See types above
category: sales          # Your category
priority: medium         # low | medium | high | critical
targetSection: "Name"    # Exact section name from SKILL.md
status: ready           # draft | ready | published
author: Your Name       # Your name
dateAdded: 2024-11-20  # YYYY-MM-DD
```

### Optional

```yaml
tags: [tag1, tag2, tag3]              # Array of tags
applyTo: "Specific subsection"        # More specific target
applyTo: ["Section A", "Section B"]   # Multiple targets
```

---

## Priority Guidelines

| Priority | Use When |
|----------|----------|
| `low` | Nice-to-have, non-urgent |
| `medium` | Standard new content |
| `high` | Important framework or fix |
| `critical` | Urgent or time-sensitive |

---

## File Naming Examples

```
✅ Good:
2024-11-20-new-discovery-framework.md
2024-11-21-fix-typo-in-section-3.md
2024-11-22-add-acme-case-study.md

❌ Bad:
update.md
new-stuff.md
untitled.md
my update nov 20.md
```

---

## Common Sections

Check your SKILL.md for exact names. Common ones:

- `"Frameworks & Methodologies"`
- `"Opening Templates"`
- `"Examples & Use Cases"`
- `"Playbooks"`
- `"Case Studies"`

**Use exact capitalization and punctuation!**

---

## Status Flow

```
draft → ready → published
  ↑       ↑         ↑
  |       |         |
  You   System    Live
 edit   queues  in SKILL.md
```

---

## Workflow

```
1. Create update file
   ↓
2. System detects (seconds)
   ↓
3. Validates YAML & content
   ↓
4. Queues for integration
   ↓
5. You review (if required)
   ↓
6. Publishes to SKILL.md
   ↓
7. Updates CHANGELOG.md
```

---

## Troubleshooting

### "Invalid YAML" Error
- Check for missing required fields
- Ensure proper indentation
- Use quotes around values with special characters
- Validate arrays use `[item1, item2]` format

### "Section not found" Error
- Check section name spelling
- Verify capitalization matches SKILL.md
- Include punctuation (e.g., `&`, `-`)

### "Update not detected"
- Ensure file is in `_updates/` folder
- Check filename format: `YYYY-MM-DD-description.md`
- Verify file has `.md` extension
- Wait a few seconds (detection is near-instant but not immediate)

### "Auto-approval failed"
- Check if `maxChanges` limit exceeded
- Verify update type allows auto-approval
- Review `skill-config.json` rules

---

## Template (Copy & Paste)

```markdown
---
type: framework
category: sales
priority: medium
targetSection: "Frameworks & Methodologies"
status: ready
author: Your Name
dateAdded: 2024-11-20
tags: [discovery, qualification]
---

# Your Title Here

Your content goes here. Write naturally in markdown.

## Subsections

Use standard markdown formatting:
- Bullet lists
- **Bold** and *italic*
- [Links](https://example.com)
- Code blocks
- Tables

The system preserves your voice and formatting.
```

---

## Commands

### View Watcher Logs
```bash
npm run watch
```

### Check Build Status
```bash
npm run build
```

### Validate Config
```bash
# From skill directory
cat skill-config.json | jq .
```

---

## File Locations

```
your-skill/
├── SKILL.md                    # Main skill file
├── CHANGELOG.md                # Auto-updated history
├── skill-config.json           # Your configuration
├── _updates/                   # Drop updates here
│   ├── README.md              # Instructions
│   ├── _TEMPLATE-update.md    # Copy this
│   └── YYYY-MM-DD-*.md        # Your updates
├── playbooks/                  # Optional: separate files
└── examples/                   # Optional: separate files
```

---

## Voice Characteristics

Your voice profile is in `skill-config.json`. Write updates in your natural style—the system preserves it.

**Example characteristics:**
- Direct, actionable language
- Numbered lists
- Specific metrics
- Real examples
- Conversational tone

Check your config to see your specific profile.

---

## Getting Help

- **Full guide:** `docs/skill-updates/EXPERT-GUIDE.md`
- **Config reference:** `docs/skill-updates/CONFIG-REFERENCE.md`
- **Template:** `_updates/_TEMPLATE-update.md`
- **Your config:** `skill-config.json`
- **Support:** Contact admin

---

## Cheat Sheet

```yaml
# Minimum viable update
---
type: example
category: sales
priority: medium
targetSection: "Examples & Use Cases"
status: ready
author: Your Name
dateAdded: 2024-11-20
---

Content here...
```

**That's literally all you need!**

Save it as `YYYY-MM-DD-description.md` in `_updates/` and you're done.
