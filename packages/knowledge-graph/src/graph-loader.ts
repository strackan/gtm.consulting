/**
 * Graph Loader
 * Loads PowerPak knowledge graph data into Neo4j via Memento MCP
 */

import { MCPClient } from '../../powerpak-server/src/mcp-client.js';
import type { PowerPakGraphData, MementoConfig } from './types.js';

export class GraphLoader {
  public client: MCPClient;  // Public for direct tool access
  private config: MementoConfig;

  constructor(config: MementoConfig) {
    this.config = config;

    // Create Memento MCP client
    this.client = new MCPClient(
      {
        command: 'npx',
        args: ['-y', '@gannonh/memento-mcp'],
        env: {
          MEMORY_STORAGE_TYPE: 'neo4j',
          NEO4J_URI: config.neo4j.uri,
          NEO4J_USERNAME: config.neo4j.username,
          NEO4J_PASSWORD: config.neo4j.password,
          NEO4J_DATABASE: config.neo4j.database || 'neo4j',
          NEO4J_VECTOR_INDEX: 'entity_embeddings',
          NEO4J_VECTOR_DIMENSIONS: '1536',
          NEO4J_SIMILARITY_FUNCTION: 'cosine',
          OPENAI_API_KEY: config.openai.apiKey,
          OPENAI_EMBEDDING_MODEL: config.openai.embeddingModel || 'text-embedding-3-small',
        },
      },
      'memento'
    );
  }

  /**
   * Connect to Memento MCP
   */
  async connect(): Promise<void> {
    await this.client.connect();
    console.log('✓ Connected to Memento MCP');
  }

  /**
   * Load PowerPak graph data into Neo4j
   */
  async load(graphData: PowerPakGraphData): Promise<void> {
    console.log('\nLoading knowledge graph...');
    console.log(`  Expert: ${graphData.expert.name}`);
    console.log(`  Frameworks: ${graphData.frameworks.length}`);
    console.log(`  Concepts: ${graphData.concepts.length}`);
    console.log(`  Skills: ${graphData.skills.length}`);
    console.log(`  Relations: ${graphData.relations.length}`);
    console.log();

    // Load expert entity
    await this.loadEntity(graphData.expert);

    // Load framework entities
    for (const framework of graphData.frameworks) {
      await this.loadEntity(framework);
    }

    // Load concept entities
    for (const concept of graphData.concepts) {
      await this.loadEntity(concept);
    }

    // Load skill entities
    for (const skill of graphData.skills) {
      await this.loadEntity(skill);
    }

    // Load relations
    for (const relation of graphData.relations) {
      await this.loadRelation(relation);
    }

    console.log('✓ Knowledge graph loaded successfully');
  }

  /**
   * Load a single entity into the knowledge graph
   */
  private async loadEntity(entity: { name: string; entityType: string; observations: string[] }): Promise<void> {
    try {
      const result = await this.client.callTool('create_entities', {
        entities: [
          {
            name: entity.name,
            entityType: entity.entityType,
            observations: entity.observations,
          },
        ],
      });

      console.log(`  ✓ Loaded entity: ${entity.name} (${entity.entityType})`);
    } catch (error) {
      console.error(`  ✗ Failed to load entity: ${entity.name}`, error);
    }
  }

  /**
   * Load a single relation into the knowledge graph
   */
  private async loadRelation(relation: {
    from: string;
    to: string;
    relationType: string;
    strength?: number;
    confidence?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      const result = await this.client.callTool('create_relations', {
        relations: [
          {
            from: relation.from,
            to: relation.to,
            relationType: relation.relationType,
            strength: relation.strength || 0.8,
            confidence: relation.confidence || 0.8,
            metadata: relation.metadata || {},
          },
        ],
      });

      console.log(`  ✓ Loaded relation: ${relation.from} --[${relation.relationType}]--> ${relation.to}`);
    } catch (error) {
      console.error(
        `  ✗ Failed to load relation: ${relation.from} -> ${relation.to}`,
        error
      );
    }
  }

  /**
   * Query the knowledge graph
   */
  async query(query: string): Promise<any> {
    try {
      const result = await this.client.callTool('search_nodes', {
        query,
      });
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }

  /**
   * Get the entire graph
   */
  async getGraph(): Promise<any> {
    try {
      const result = await this.client.callTool('read_graph', {});
      return result;
    } catch (error) {
      console.error('Failed to read graph:', error);
      throw error;
    }
  }

  /**
   * Semantic search in the knowledge graph
   */
  async semanticSearch(query: string, threshold: number = 0.7): Promise<any> {
    try {
      const result = await this.client.callTool('semantic_search', {
        query,
        threshold,
      });
      return result;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Memento MCP
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log('✓ Disconnected from Memento MCP');
  }
}
