/**
 * Knowledge Graph Types
 */

export interface GraphEntity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface GraphRelation {
  from: string;
  to: string;
  relationType: string;
  strength?: number;
  confidence?: number;
  metadata?: {
    source?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface PowerPakGraphData {
  expert: GraphEntity;
  frameworks: GraphEntity[];
  concepts: GraphEntity[];
  skills: GraphEntity[];
  relations: GraphRelation[];
}

export interface Neo4jConnection {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

export interface MementoConfig {
  neo4j: Neo4jConnection;
  openai: {
    apiKey: string;
    embeddingModel?: string;
  };
}
