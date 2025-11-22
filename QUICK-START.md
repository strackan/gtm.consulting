# PowerPak Quick Start Guide

**Get PowerPak up and running in 5 minutes**

## Prerequisites

- Node.js 20+ installed
- Docker installed (for Neo4j)
- OpenAI API key (for knowledge graph)
- Git installed

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/strackan/MCP-World.git
cd MCP-World

# Install dependencies
npm install

# Build all packages
npm run build
```

## Step 2: Start Neo4j (Knowledge Graph)

```bash
# Start Neo4j via Docker
docker-compose up -d neo4j

# Verify Neo4j is running
docker ps

# Access Neo4j Browser (optional)
# Open: http://localhost:7474
# Login: neo4j / powerpak_password
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# Required: OPENAI_API_KEY=sk-your-key-here

# Optional: Add Slack/GitHub tokens for backend integrations
```

## Step 4: Load Knowledge Graph

```bash
# Set OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"

# Load PowerPak data into Neo4j
cd packages/knowledge-graph
npm install
npm run build
npm run load
```

**Expected Output:**
```
✓ Connected to Memento MCP
✓ Loaded entity: Justin Strackany (Expert)
✓ Loaded entity: Pricing Calculator (Framework)
...
🎉 Knowledge Graph Load Complete!
```

## Step 5: Run PowerPak MCP Servers

**Option A: Basic Mode (No Backend)**
```bash
# Justin's PowerPak
node packages/powerpak-server/dist/index.js justin-strackany platinum

# Scott's PowerPak
node packages/powerpak-server/dist/index.js scott-leese platinum
```

**Option B: Production Mode (With Backend)**
```bash
# Requires: SLACK_BOT_TOKEN, GITHUB_PERSONAL_ACCESS_TOKEN in .env
node packages/powerpak-server/dist/index.js justin-strackany platinum --with-backend
```

## Step 6: Install in Claude Desktop (Optional)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "justin-strackany": {
      "command": "node",
      "args": [
        "/path/to/MCP-World/packages/powerpak-server/dist/index.js",
        "justin-strackany",
        "platinum"
      ]
    },
    "memento-powerpak": {
      "command": "npx",
      "args": ["-y", "@gannonh/memento-mcp"],
      "env": {
        "MEMORY_STORAGE_TYPE": "neo4j",
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "powerpak_password",
        "OPENAI_API_KEY": "your-key"
      }
    }
  }
}
```

## What You Get

### PowerPak MCP Servers
- **2 PLATINUM profiles:** Justin Strackany, Scott Leese
- **6 MCP tools each:** query_skill, get_framework, search_content, hire, message, book_meeting
- **Full SKILL.md content:** 12-15 sections per expert

### Knowledge Graph (Neo4j)
- **30-40 entities:** Experts, Frameworks, Concepts, Skills
- **60-80 relationships:** HAS_EXPERTISE, TEACHES, BELIEVES_IN, etc.
- **Semantic search:** Vector embeddings for intelligent queries
- **Graph visualization:** Neo4j Browser UI

### Backend Integrations (Optional)
- **Slack notifications:** Hire/message/booking requests
- **GitHub issue tracking:** Hire request workflow
- **Audit logs:** JSONL format for all requests

## Testing the System

### Test PowerPak MCP Server

```bash
# Using MCP Inspector (if installed)
mcp-inspector --server "node packages/powerpak-server/dist/index.js justin-strackany platinum"

# Or manually via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node packages/powerpak-server/dist/index.js justin-strackany platinum
```

### Test Knowledge Graph

**Neo4j Browser:**
1. Open http://localhost:7474
2. Run query: `MATCH (n) RETURN n LIMIT 25`
3. Explore graph visually

**Cypher Queries:**
```cypher
// Find Justin's frameworks
MATCH (e:Expert {name: "Justin Strackany"})-[:TEACHES]->(f:Framework)
RETURN e, f

// Find shared skills
MATCH (e1:Expert)-[:HAS_EXPERTISE]->(s:Skill)<-[:HAS_EXPERTISE]-(e2:Expert)
WHERE e1.name <> e2.name
RETURN e1, s, e2

// Find frameworks requiring Revenue Operations
MATCH (f:Framework)-[:REQUIRES]->(s:Skill {name: "Revenue Operations"})
RETURN f.name, s.name
```

### Test Backend Integrations

```bash
# Test hire request (with backend enabled)
# Requires: SLACK_BOT_TOKEN, GITHUB_PERSONAL_ACCESS_TOKEN

# Run server with backend
export SLACK_BOT_TOKEN="xoxb-your-token"
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your-token"

node packages/powerpak-server/dist/index.js justin-strackany platinum --with-backend

# Use hire tool via MCP client
# Should create: Slack notification + GitHub issue + Audit log
```

## Troubleshooting

### Neo4j Not Starting
```bash
# Check Docker
docker ps

# View logs
docker logs powerpak-neo4j

# Restart
docker-compose restart neo4j
```

### Knowledge Graph Load Failed
```bash
# Verify OpenAI API key
echo $OPENAI_API_KEY

# Check Neo4j connection
npm run neo4j:test  # (from knowledge-graph package)

# View detailed logs
npm run load 2>&1 | tee load.log
```

### MCP Server Connection Failed
```bash
# Verify build
cd packages/powerpak-server
npm run build

# Check SKILL.md files exist
ls ../../skills/platinum/*/SKILL.md

# Run with debug logging
NODE_DEBUG=* node dist/index.js justin-strackany platinum
```

## Next Steps

### Week 2.2: Electron Desktop App
- Fork Better Chatbot for Electron foundation
- System tray integration for notifications
- Rich PowerPak profile UI
- Knowledge graph visualization

### Week 2.3: Desktop Features
- Native OS notifications for hire/message/booking
- System tray menu for quick access
- Offline PowerPak caching
- Background knowledge graph sync

### Week 3: Polish & Demo
- Custom UI for Skill browsing
- Workflow integration (skill updates)
- Demo preparation for December 4

## Resources

- **Documentation:**
  - PowerPak Server: `packages/powerpak-server/README.md`
  - Backend Integrations: `packages/powerpak-server/BACKEND-INTEGRATIONS.md`
  - Knowledge Graph: `packages/knowledge-graph/README.md`

- **Configuration Examples:**
  - Claude Desktop: `packages/powerpak-server/configs/*.json`
  - Memento MCP: `packages/knowledge-graph/configs/*.json`

- **Testing:**
  - Phase 1-3 Tests: `docs/TESTING-PLAN.md`
  - Quick Tests: `docs/TESTING-QUICKSTART.md`

## Support

- **GitHub Issues:** https://github.com/strackan/MCP-World/issues
- **Documentation:** `docs/` folder
- **Examples:** `packages/*/README.md`

---

**Happy PowerPak-ing!** 🚀
