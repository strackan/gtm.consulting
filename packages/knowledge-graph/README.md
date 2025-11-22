# PowerPak Knowledge Graph

**Neo4j-powered knowledge graph for PowerPak experts, frameworks, and concepts**

## Overview

The PowerPak Knowledge Graph system extracts structured knowledge from SKILL.md files and loads it into Neo4j via Memento MCP. This creates a visual, semantic knowledge base showing relationships between:

- **Experts** - PowerPak profile owners (Justin, Scott, etc.)
- **Frameworks** - Methodologies and systems taught by experts
- **Concepts** - Principles, rules, and best practices
- **Skills** - Core expertise areas

## Architecture

```
SKILL.md files
      ↓
Graph Extractor (parses and structures)
      ↓
Knowledge Graph Data (entities + relations)
      ↓
Graph Loader (via Memento MCP)
      ↓
Neo4j Database (graph + vector embeddings)
```

## Entity Types

### Expert
- **Properties:** Name, bio, tier, core expertise
- **Example:** Justin Strackany (Revenue Ops expert)

### Framework
- **Properties:** Name, description, components
- **Example:** "Pricing Calculator", "11-7-12 Writing System"

### Concept
- **Properties:** Name, description
- **Example:** "Writing Rules", "Sales Philosophy"

### Skill
- **Properties:** Name, description
- **Example:** "Revenue Operations", "Sales Leadership"

## Relationship Types

### Expert Relationships
- `HAS_EXPERTISE` → Skill (strength: 1.0)
- `TEACHES` → Framework (strength: 0.9)
- `BELIEVES_IN` → Concept (strength: 0.8)
- `COLLABORATES_WITH` → Expert (strength: 0.8)

### Framework Relationships
- `REQUIRES` → Skill (strength: 0.7)
- `IMPLEMENTS` → Concept (strength: 0.8)

## Prerequisites

### 1. Neo4j Database

**Option A: Docker (Recommended)**
```bash
# From project root
docker-compose up -d neo4j
```

**Option B: Neo4j Desktop**
1. Download from https://neo4j.com/download/
2. Create database with password: `powerpak_password`
3. Start database

### 2. OpenAI API Key

Required for vector embeddings (semantic search):
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

Get your API key from: https://platform.openai.com/api-keys

## Installation

```bash
# From knowledge-graph package
npm install
npm run build
```

## Usage

### Load PowerPak Data into Neo4j

```bash
# Set required environment variable
export OPENAI_API_KEY="your-key"

# Load knowledge graph
npm run load
```

**What happens:**
1. Connects to Neo4j (bolt://127.0.0.1:7687)
2. Connects to Memento MCP
3. Extracts knowledge from Justin's SKILL.md
4. Extracts knowledge from Scott's SKILL.md
5. Creates entities (Expert, Framework, Concept, Skill)
6. Creates relationships between entities
7. Generates vector embeddings for semantic search

**Expected Output:**
```
======================================================================
  PowerPak Knowledge Graph Loader
======================================================================

Configuration:
  Neo4j URI: bolt://127.0.0.1:7687
  Neo4j Database: neo4j
  OpenAI Model: text-embedding-3-small
  PowerPak Skills: 2

✓ Connected to Memento MCP

======================================================================
  Loading: justin-strackany (platinum)
======================================================================

Extracting knowledge graph data...

Loading knowledge graph...
  Expert: Justin Strackany
  Frameworks: 8
  Concepts: 3
  Skills: 4
  Relations: 45

  ✓ Loaded entity: Justin Strackany (Expert)
  ✓ Loaded entity: Pricing Calculator (Framework)
  ...
  ✓ Loaded relation: Justin Strackany --[TEACHES]--> Pricing Calculator
  ...

✓ Knowledge graph loaded successfully

======================================================================
🎉 Knowledge Graph Load Complete!
======================================================================
```

### Access the Knowledge Graph

**1. Neo4j Browser**
```
URL: http://localhost:7474
Username: neo4j
Password: powerpak_password
```

**2. Example Cypher Queries**

View all entities:
```cypher
MATCH (n) RETURN n LIMIT 50
```

Find expert and their frameworks:
```cypher
MATCH (e:Expert {name: "Justin Strackany"})-[:TEACHES]->(f:Framework)
RETURN e, f
```

Find shared concepts between experts:
```cypher
MATCH (e1:Expert)-[:BELIEVES_IN]->(c:Concept)<-[:BELIEVES_IN]-(e2:Expert)
WHERE e1.name <> e2.name
RETURN e1, c, e2
```

Find frameworks requiring a specific skill:
```cypher
MATCH (f:Framework)-[:REQUIRES]->(s:Skill {name: "Revenue Operations"})
RETURN f, s
```

## Environment Variables

### Required
- `OPENAI_API_KEY` - OpenAI API key for embeddings

### Optional (with defaults)
- `NEO4J_URI` - Neo4j connection URI (default: `bolt://127.0.0.1:7687`)
- `NEO4J_USERNAME` - Neo4j username (default: `neo4j`)
- `NEO4J_PASSWORD` - Neo4j password (default: `powerpak_password`)
- `NEO4J_DATABASE` - Neo4j database name (default: `neo4j`)
- `OPENAI_EMBEDDING_MODEL` - Embedding model (default: `text-embedding-3-small`)

## Memento MCP Integration

The knowledge graph is accessible via Memento MCP tools:

### Available Tools

**Entity Management:**
- `create_entities` - Add new entities
- `add_observations` - Update entity observations
- `delete_entities` - Remove entities

**Relation Management:**
- `create_relations` - Add relationships
- `update_relation` - Modify relationships
- `delete_relations` - Remove relationships

**Search & Query:**
- `search_nodes` - Keyword search
- `semantic_search` - Vector similarity search
- `read_graph` - Get entire graph
- `open_nodes` - Get specific entities

**Temporal:**
- `get_entity_history` - Version history
- `get_graph_at_time` - Point-in-time graph

## Semantic Search Examples

**Find experts with customer success expertise:**
```javascript
await mementoClient.callTool('semantic_search', {
  query: 'customer success and retention strategies',
  threshold: 0.7
});
```

**Find frameworks related to pricing:**
```javascript
await mementoClient.callTool('semantic_search', {
  query: 'pricing strategy and value-based pricing',
  threshold: 0.75
});
```

## Electron App Integration

The Electron app can visualize the knowledge graph using:

1. **Neo4j Bolt Driver** - Direct graph queries
2. **Memento MCP Tools** - Semantic search and entity operations
3. **D3.js / Vis.js** - Graph visualization libraries
4. **Cytoscape.js** - Interactive network graphs

Example integration in Electron:
```typescript
import { MCPClient } from '@mcp-world/powerpak-server';

// Connect to Memento MCP
const memento = new MCPClient(/* memento config */);
await memento.connect();

// Search for related frameworks
const results = await memento.callTool('semantic_search', {
  query: userQuery,
  threshold: 0.7
});

// Visualize in UI
renderKnowledgeGraph(results);
```

## Troubleshooting

### Neo4j Connection Failed
```
Error: ServiceUnavailable: WebSocket connection failure
```

**Solutions:**
1. Ensure Neo4j is running: `docker ps` or check Neo4j Desktop
2. Verify connection URI: `bolt://127.0.0.1:7687`
3. Check credentials: `neo4j / powerpak_password`

### OpenAI API Key Error
```
Error: OPENAI_API_KEY environment variable is required
```

**Solution:**
```bash
export OPENAI_API_KEY="sk-your-key-here"
npm run load
```

### Memento MCP Connection Failed
```
Error: Failed to spawn npx
```

**Solutions:**
1. Ensure npx is available: `which npx`
2. Install @gannonh/memento-mcp globally: `npm install -g @gannonh/memento-mcp`
3. Check network connectivity for npx package downloads

## Graph Statistics

After loading both PowerPak profiles, you can expect:

- **Total Entities:** ~30-40
  - 2 Experts (Justin, Scott)
  - 15-20 Frameworks
  - 5-8 Concepts
  - 8-10 Skills

- **Total Relationships:** ~60-80
  - HAS_EXPERTISE: 8-10
  - TEACHES: 15-20
  - BELIEVES_IN: 5-8
  - REQUIRES: 20-30
  - IMPLEMENTS: 10-15
  - COLLABORATES_WITH: 2

## Future Enhancements

- [ ] Auto-detect cross-framework relationships
- [ ] Temporal confidence decay visualization
- [ ] Graph-based recommendation engine
- [ ] Import additional PowerPak profiles (Premium, Basic)
- [ ] Export graph to Gephi/Graphviz
- [ ] Real-time graph updates on SKILL.md changes
- [ ] Community detection (expert clusters)

## License

MIT
