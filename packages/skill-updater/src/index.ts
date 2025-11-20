/**
 * @mcp-world/skill-updater
 *
 * Living document update system for MCP-World Skills
 * Watches for new update files and manages the integration workflow
 */

// Core watcher
export { UpdateWatcher, createWatcher } from './watcher.js';

// Types
export type {
  UpdateMetadata,
  UpdateFile,
  SkillConfig,
  WatcherOptions,
  WatcherStats,
} from './types.js';

// Schemas for validation
export { UpdateMetadataSchema, SkillConfigSchema } from './types.js';

// Utilities
export {
  loadSkillConfig,
  hasSkillConfig,
  getConfiguredSkills,
  ensureUpdatesDirectory,
  formatDateForFileName,
  sanitizeFileName,
  generateUpdateFileName,
} from './utils.js';
