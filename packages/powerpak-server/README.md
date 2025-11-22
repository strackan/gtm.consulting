# PowerPak MCP Server

**Dynamic MCP server that exposes PowerPak expert profiles through the Model Context Protocol.**

## Overview

The PowerPak MCP Server is a generic server that can load and expose any PowerPak profile (Platinum, Premium, or Basic) through MCP. Each PowerPak includes:

- **Profile** - Expert information, tier, bio, expertise, links
- **Knowledge** - Frameworks, methodologies, playbooks, templates
- **Tools** - Query, search, hire, message, book meetings

## Features

### Resources

Each PowerPak exposes the following resources:

- `powerpak://<skill-id>/profile` - Expert profile information
- `powerpak://<skill-id>/sections` - List all available sections
- `powerpak://<skill-id>/section/<section-id>` - Get specific section
- `powerpak://<skill-id>/full` - Full SKILL.md content

### Tools

- **query_skill** - Query PowerPak content by section or keywords
- **get_framework** - Get specific framework or methodology
- **search_content** - Search across all PowerPak content
- **hire** - Request to hire the expert
- **message** - Send a message to the expert
- **book_meeting** - Book a meeting with the expert

## Usage

### Run Directly

```bash
# Run Justin's PowerPak
node dist/index.js justin-strackany platinum

# Run Scott's PowerPak
node dist/index.js scott-leese platinum
```

### Install in Claude Code

Add to your `claude_desktop_config.json` or Claude Code MCP settings:

#### Justin Strackany PowerPak

```json
{
  "mcpServers": {
    "justin-strackany": {
      "command": "node",
      "args": [
        "/path/to/MCP-World/packages/powerpak-server/dist/index.js",
        "justin-strackany",
        "platinum"
      ],
      "description": "Justin Strackany PowerPak - Revenue Ops + Customer Success + Authentic Writing"
    }
  }
}
```

#### Scott Leese PowerPak

```json
{
  "mcpServers": {
    "scott-leese": {
      "command": "node",
      "args": [
        "/path/to/MCP-World/packages/powerpak-server/dist/index.js",
        "scott-leese",
        "platinum"
      ],
      "description": "Scott Leese PowerPak - Sales Leadership + Team Building + Org Design"
    }
  }
}
```

## PowerPak Tiers

### 🏆 Platinum ($199/month)
- Full access to all frameworks and methodologies
- Complete skill content with examples
- Priority support for hire/message/booking tools
- **Currently Available:** Justin Strackany, Scott Leese

### 💎 Premium (Price TBD)
- Curated frameworks and key methodologies
- Public discoverability
- Standard access to tools
- **Coming Soon:** 3 Premium PowerPaks

### ⚡ Basic (Free)
- Terminal-only access
- Friend-discoverable (not publicly searchable)
- Limited framework access
- **Coming Soon:** 4 Basic PowerPaks (2 college + 2 professional)

## Architecture

```
PowerPak MCP Server
├── Parser (parser.ts)
│   └── Extracts metadata, profile, sections from SKILL.md
├── Resources
│   ├── Profile
│   ├── Sections list
│   ├── Individual sections
│   └── Full content
└── Tools
    ├── query_skill
    ├── get_framework
    ├── search_content
    ├── hire
    ├── message
    └── book_meeting
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
# Test with Justin's PowerPak
npm start justin-strackany platinum

# Test with Scott's PowerPak
npm start scott-leese platinum
```

### Add New PowerPak

1. Create `skills/<tier>/<skill-id>/SKILL.md`
2. Ensure it has YAML frontmatter with `name` and `description`
3. Add structured `## Profile` section
4. Run: `node dist/index.js <skill-id> <tier>`

## Examples

### Query a Framework

```typescript
// Use the query_skill tool
{
  "section": "pricing-calculator",
  "keywords": ["pricing", "value"]
}
```

### Get Justin's Writing Templates

```typescript
// Use the get_framework tool
{
  "frameworkName": "Opening Templates"
}
```

### Search Scott's Hiring Frameworks

```typescript
// Use the search_content tool
{
  "query": "hiring interview questions",
  "maxResults": 5
}
```

## Integration

The PowerPak MCP Server integrates with:

- **Slack MCP** - For hire/message notifications (coming soon)
- **Filesystem MCP** - For reading SKILL.md files
- **GitHub MCP** - For PR-based updates
- **Memento MCP** - For knowledge graph visualization
- **Better Chatbot (Electron)** - For rich UI client

## License

MIT

## Author

MCP-World Team
