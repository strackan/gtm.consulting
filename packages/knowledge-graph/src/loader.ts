#!/usr/bin/env node

/**
 * PowerPak Knowledge Graph Loader
 *
 * Loads PowerPak SKILL.md files into Neo4j via Memento MCP
 *
 * Usage:
 *   npm run load
 *   node dist/loader.js
 */

import { GraphExtractor } from './graph-extractor.js';
import { GraphLoader } from './graph-loader.js';
import type { MementoConfig } from './types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config: MementoConfig = {
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://127.0.0.1:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'powerpak_password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
};

// PowerPak skill paths
const skillPaths = [
  {
    id: 'justin-strackany',
    tier: 'platinum',
    path: path.resolve(__dirname, '../../../skills/platinum/justin-strackany/SKILL.md'),
  },
  {
    id: 'scott-leese',
    tier: 'platinum',
    path: path.resolve(__dirname, '../../../skills/platinum/scott-leese/SKILL.md'),
  },
];

async function main() {
  console.log('='.repeat(70));
  console.log('  PowerPak Knowledge Graph Loader');
  console.log('='.repeat(70));
  console.log();

  // Validate configuration
  if (!config.openai.apiKey) {
    console.error('✗ OPENAI_API_KEY environment variable is required');
    console.error('  Set it with: export OPENAI_API_KEY=your-key');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Neo4j URI: ${config.neo4j.uri}`);
  console.log(`  Neo4j Database: ${config.neo4j.database}`);
  console.log(`  OpenAI Model: ${config.openai.embeddingModel}`);
  console.log(`  PowerPak Skills: ${skillPaths.length}`);
  console.log();

  const extractor = new GraphExtractor();
  const loader = new GraphLoader(config);

  try {
    // Connect to Memento MCP
    await loader.connect();
    console.log();

    // Load each PowerPak
    for (const skill of skillPaths) {
      console.log('='.repeat(70));
      console.log(`  Loading: ${skill.id} (${skill.tier})`);
      console.log('='.repeat(70));
      console.log();

      // Extract graph data
      console.log('Extracting knowledge graph data...');
      const graphData = await extractor.extract(skill.path);

      // Load into Neo4j
      await loader.load(graphData);
      console.log();
    }

    // Create cross-PowerPak relationships
    console.log('='.repeat(70));
    console.log('  Creating Cross-PowerPak Relationships');
    console.log('='.repeat(70));
    console.log();

    // Example: Connect Justin and Scott based on shared concepts
    // This could be expanded to automatically detect shared frameworks, skills, etc.
    console.log('  Creating expert-to-expert relationships...');

    // COLLABORATES_WITH relationship (both are revenue/sales experts)
    try {
      await loader.client.callTool('create_relations', {
        relations: [
          {
            from: 'Justin Strackany',
            to: 'Scott Leese',
            relationType: 'COLLABORATES_WITH',
            strength: 0.8,
            confidence: 0.8,
            metadata: {
              source: 'domain_analysis',
              tags: ['collaboration', 'revenue', 'sales'],
              reason: 'Both experts in revenue/sales domain with complementary expertise',
            },
          },
          {
            from: 'Scott Leese',
            to: 'Justin Strackany',
            relationType: 'COLLABORATES_WITH',
            strength: 0.8,
            confidence: 0.8,
            metadata: {
              source: 'domain_analysis',
              tags: ['collaboration', 'revenue', 'sales'],
              reason: 'Both experts in revenue/sales domain with complementary expertise',
            },
          },
        ],
      });
      console.log('  ✓ Created COLLABORATES_WITH relationships');
    } catch (error) {
      console.error('  ✗ Failed to create cross-expert relationships:', error);
    }

    console.log();

    // Display summary
    console.log('='.repeat(70));
    console.log('  Knowledge Graph Summary');
    console.log('='.repeat(70));
    console.log();

    try {
      const graph = await loader.getGraph();
      console.log('Graph successfully loaded into Neo4j!');
      console.log();
      console.log('Access the knowledge graph:');
      console.log('  1. Neo4j Browser: http://localhost:7474');
      console.log('  2. Credentials: neo4j / powerpak_password');
      console.log('  3. Run Cypher query: MATCH (n) RETURN n LIMIT 25');
      console.log();
      console.log('MCP Integration:');
      console.log('  - Memento MCP server is running');
      console.log('  - Use semantic search via MCP tools');
      console.log('  - Electron app can visualize the graph');
      console.log();
    } catch (error) {
      console.error('Failed to retrieve graph summary:', error);
    }

    // Disconnect
    await loader.disconnect();

    console.log('='.repeat(70));
    console.log('🎉 Knowledge Graph Load Complete!');
    console.log('='.repeat(70));
    console.log();

  } catch (error) {
    console.error('Fatal error:', error);
    await loader.disconnect();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
