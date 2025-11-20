# Updates Folder

This folder contains new content waiting to be integrated into the main SKILL.md file.

## How to Add an Update

1. **Create a new markdown file** with format: `YYYY-MM-DD-short-description.md`
   - Example: `2024-11-20-sdr-manager-framework.md`

2. **Add YAML frontmatter** at the top of your file:
```yaml
---
type: framework | example | playbook | correction | expansion
category: hiring | coaching | management | sales-ops | leadership
priority: low | medium | high | critical
targetSection: "Section Name in SKILL.md"
status: ready
author: Scott Leese
dateAdded: 2024-11-20
tags: [sdr, management, hiring]
---
```

3. **Write your content** below the frontmatter in standard markdown

4. **Save the file** to this `_updates/` folder

5. **The system will**:
   - Detect your new file
   - Validate the metadata
   - Queue it for integration
   - Notify you when ready for review

## Update Types

- **framework**: New methodology or system
- **example**: Real-world case study or interview process
- **playbook**: Step-by-step tactical guide
- **correction**: Fix typos or errors
- **expansion**: Add detail to existing section

## Priority Levels

- **critical**: Incorrect information, fix immediately
- **high**: Important new framework, integrate within 24h
- **medium**: Valuable addition, integrate within week
- **low**: Minor improvement, batch with other updates

## Sample Update

See `_TEMPLATE-update.md` for a complete example.

## Questions?

See `/docs/skill-updates/expert-guide.md` for full documentation.
