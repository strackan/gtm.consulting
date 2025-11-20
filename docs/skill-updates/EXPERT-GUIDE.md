# Expert Guide: Living Document Updates

Welcome to the MCP-World Living Document Update System! This guide explains how to add updates to your Skill as you create new content, frameworks, examples, and improvements.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding the Update System](#understanding-the-update-system)
3. [Creating Updates](#creating-updates)
4. [Update Types](#update-types)
5. [YAML Frontmatter Reference](#yaml-frontmatter-reference)
6. [Integration Process](#integration-process)
7. [Best Practices](#best-practices)
8. [FAQ](#faq)

---

## Quick Start

**To add new content to your Skill:**

1. Navigate to your `_updates/` folder
2. Create a new file: `YYYY-MM-DD-short-description.md`
3. Add YAML frontmatter (see template in your folder)
4. Write your content below the frontmatter
5. Save the file

**That's it!** The system automatically detects your update, validates it, and queues it for integration into your main SKILL.md file.

---

## Understanding the Update System

### The Living Document Concept

Your Skill is a "living document" that evolves as you:
- Create new frameworks and methodologies
- Share real-world examples and case studies
- Refine existing content based on feedback
- Fix typos or clarify concepts
- Add playbooks and templates

Instead of manually editing SKILL.md, you drop updates into the `_updates/` folder, and the system handles integration automatically (with your approval).

### How It Works

```
┌─────────────────────┐
│  You create update  │
│  in _updates/ folder│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  System detects &   │
│  validates update   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Integration Engine │
│  processes content  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  You review & approve│
│  (if required)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update published   │
│  to SKILL.md        │
└─────────────────────┘
```

---

## Creating Updates

### File Naming Convention

**Format:** `YYYY-MM-DD-short-description.md`

**Examples:**
```
2024-11-20-new-discovery-framework.md
2024-11-21-fix-typo-in-opening-templates.md
2024-11-22-add-sales-call-playbook.md
2024-11-23-expand-metrics-section.md
```

**Why this format?**
- **Chronological sorting**: Updates stay organized by date
- **Descriptive**: Easy to find specific updates later
- **Unique**: Prevents filename conflicts

### File Structure

Every update file has two parts:

```markdown
---
type: framework
category: sales
priority: high
targetSection: "Frameworks & Methodologies"
status: ready
author: Your Name
dateAdded: 2024-11-20
tags: [discovery, qualification, framework]
---

# Your content starts here

Everything below the YAML frontmatter (above) is your actual content.
Write naturally in markdown. The system preserves your voice and formatting.
```

---

## Update Types

### 1. **framework**
New frameworks, methodologies, or structured approaches.

**Use when:** You've developed a new way of thinking about or solving a problem.

**Example:** A new qualification framework for complex deals.

### 2. **playbook**
Step-by-step guides for specific situations.

**Use when:** You want to share a repeatable process or workflow.

**Example:** "How to Run a Discovery Call Playbook"

### 3. **example**
Real-world examples, case studies, or use cases.

**Use when:** You have a story or example that illustrates a concept.

**Example:** How a rep used your framework to close a $500K deal.

### 4. **template**
Reusable templates (email templates, call scripts, etc.).

**Use when:** Sharing a template others can copy and customize.

**Example:** A LinkedIn outreach message template.

### 5. **correction**
Fix typos, errors, or clarify existing content.

**Use when:** You spot a mistake or want to improve clarity.

**Note:** Corrections can be auto-approved (depending on your config).

### 6. **expansion**
Add detail or depth to existing content.

**Use when:** Expanding on something already in your Skill.

**Example:** Adding more detail to an existing framework.

### 7. **case-study**
Detailed case studies with before/after results.

**Use when:** Sharing an in-depth success story with metrics.

**Example:** A 6-month transformation story with specific outcomes.

---

## YAML Frontmatter Reference

### Required Fields

```yaml
type: framework                    # See "Update Types" section
category: sales                    # Your categorization (e.g., sales, writing, leadership)
priority: high                     # low | medium | high | critical
targetSection: "Section Name"      # Where this should be integrated
status: ready                      # draft | ready | published
author: Your Name                  # Your name
dateAdded: 2024-11-20             # Date you created this (YYYY-MM-DD)
```

### Optional Fields

```yaml
tags: [tag1, tag2, tag3]          # Tags for organization/search
applyTo: "Specific subsection"    # More specific target than section
applyTo: ["Section A", "Section B"] # Or array for multiple targets
```

### Field Descriptions

| Field | Description | Examples |
|-------|-------------|----------|
| `type` | What kind of update | `framework`, `playbook`, `example`, `template` |
| `category` | Your categorization | `sales`, `writing`, `discovery`, `negotiation` |
| `priority` | How important | `low`, `medium`, `high`, `critical` |
| `targetSection` | Where it goes in SKILL.md | `"Frameworks & Methodologies"`, `"Opening Templates"` |
| `status` | Readiness state | `draft` (not ready), `ready` (ready to integrate), `published` (already live) |
| `author` | Your name | `"Scott Leese"`, `"Justin Strackany"` |
| `dateAdded` | Creation date | `2024-11-20` |
| `tags` | Keywords | `[discovery, b2b, enterprise]` |
| `applyTo` | Specific location | Can be string or array |

---

## Integration Process

### Automatic Detection

When you save a file to `_updates/`, the system:
1. **Detects** the new file within seconds
2. **Validates** YAML frontmatter and content
3. **Logs** the update for processing
4. **Queues** for integration

### Integration Modes

Your `skill-config.json` defines how updates are handled:

#### Auto-Approve Mode
- **What:** Updates integrate automatically
- **When:** Usually for `corrections` with minimal changes
- **Your role:** Notification only, review after if desired

#### Review Required Mode (Default)
- **What:** You review before integration
- **When:** Most content types (frameworks, examples, etc.)
- **Your role:** Review proposed integration, approve or request changes

### Approval Workflow

1. **Notification:** You receive notification of new update
2. **Review:** System shows you the proposed integration
3. **Decision:** You approve, request changes, or reject
4. **Integration:** Approved updates are merged into SKILL.md
5. **Changelog:** System updates CHANGELOG.md automatically

---

## Best Practices

### Writing Updates

✅ **Do:**
- Write in your natural voice
- Include concrete examples and metrics
- Reference existing content when expanding
- Use clear, descriptive section names
- Add relevant tags for discoverability

❌ **Don't:**
- Mix multiple unrelated topics in one update
- Skip the YAML frontmatter
- Use vague section targets
- Leave updates in `draft` status indefinitely

### File Organization

**Good:**
```
_updates/
├── 2024-11-20-new-discovery-framework.md
├── 2024-11-21-sales-call-playbook.md
├── 2024-11-22-fix-metrics-typo.md
└── 2024-11-23-add-case-study-acme-corp.md
```

**Not recommended:**
```
_updates/
├── update1.md
├── new-stuff.md
├── notes.md
└── untitled.md
```

### Voice Consistency

The system is tuned to your voice profile. Write naturally and the integration engine will:
- Preserve your characteristic style
- Maintain your formatting preferences
- Keep your unique phrases and patterns

**Your voice profile is in `skill-config.json`** if you want to review it.

### Priority Guidelines

| Priority | Use When | Example |
|----------|----------|---------|
| `low` | Nice-to-have additions | Additional example for existing framework |
| `medium` | Standard new content | New template or case study |
| `high` | Important frameworks or fixes | New core methodology or critical correction |
| `critical` | Time-sensitive or critical | Urgent correction or highly requested content |

---

## FAQ

### Q: What happens if I make a mistake in the YAML?

**A:** The system validates your YAML and will log an error if something's wrong. Check the logs or notifications for details. Common issues:
- Missing required field
- Invalid enum value (e.g., `priority: super-high` instead of `high`)
- Malformed YAML syntax

### Q: Can I edit an update after I've saved it?

**A:** Yes! If the update hasn't been integrated yet, you can edit the file. The system will re-process it. Once integrated, edit your SKILL.md directly or create a new correction/expansion update.

### Q: How do I know what sections exist in my SKILL.md?

**A:** Open your SKILL.md and look at the markdown headers. Use exact names:
```markdown
## Frameworks & Methodologies  ← Use: "Frameworks & Methodologies"
## Opening Templates            ← Use: "Opening Templates"
## Examples & Use Cases         ← Use: "Examples & Use Cases"
```

### Q: What if I want to add content that doesn't fit existing sections?

**A:** Great question! You have two options:
1. **Create a new section name** in `targetSection` and the system can add it
2. **Consult your skill-config.json** to see if there's a preferred way to handle it

### Q: Can I create draft updates?

**A:** Yes! Set `status: draft` in your YAML. The system will detect the file but won't queue it for integration until you change to `status: ready`.

### Q: How quickly are updates processed?

**A:** Detection is near-instant (within seconds). Integration timing depends on:
- Your approval required setting
- Integration engine schedule
- Priority level

### Q: Where can I see the history of my updates?

**A:** Check your `CHANGELOG.md` file! It's automatically updated with each integration.

### Q: What if I want to completely rewrite a section?

**A:** Use type `expansion` with `preserveExisting: false` in your config, or create an update that replaces the section. Consult with the system admin for major restructuring.

---

## Getting Help

- **Check your `_updates/README.md`** for quick reference
- **Review `_TEMPLATE-update.md`** for a working example
- **Look at `skill-config.json`** to see your specific rules
- **Contact support** for technical issues

---

**Remember:** This system is designed to make your life easier. Write naturally, follow the simple conventions, and let the system handle the complexity of integration!
