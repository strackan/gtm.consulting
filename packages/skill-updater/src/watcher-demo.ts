#!/usr/bin/env node
/**
 * Demo script for the Update Watcher
 * Run with: npm run watch
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createWatcher } from './watcher.js';
import { UpdateFile } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get skills path (relative to package root)
const skillsPath = path.resolve(__dirname, '../../../skills');

console.log('='.repeat(60));
console.log('  MCP-World Skill Update Watcher - Demo');
console.log('='.repeat(60));
console.log();
console.log('Watching for updates in:', skillsPath);
console.log('Press Ctrl+C to stop');
console.log();

// Create watcher
const watcher = await createWatcher({
  skillsPath,
  ignoreInitial: true,
  onUpdate: async (update: UpdateFile) => {
    console.log();
    console.log('━'.repeat(60));
    console.log('🆕 NEW UPDATE DETECTED');
    console.log('━'.repeat(60));
    console.log(`Skill:     ${update.skillId}`);
    console.log(`File:      ${update.fileName}`);
    console.log(`Type:      ${update.metadata.type}`);
    console.log(`Category:  ${update.metadata.category}`);
    console.log(`Priority:  ${update.metadata.priority}`);
    console.log(`Author:    ${update.metadata.author}`);
    console.log(`Status:    ${update.metadata.status}`);
    console.log(`Target:    ${update.metadata.targetSection}`);
    if (update.metadata.tags && update.metadata.tags.length > 0) {
      console.log(`Tags:      ${update.metadata.tags.join(', ')}`);
    }
    console.log();
    console.log('Content preview:');
    console.log(
      update.content.substring(0, 200) +
        (update.content.length > 200 ? '...' : '')
    );
    console.log('━'.repeat(60));
    console.log();

    // Show statistics
    const stats = watcher.getStats();
    console.log('📊 Statistics:');
    console.log(`  Total updates: ${stats.totalUpdatesDetected}`);
    console.log(
      `  By skill: ${JSON.stringify(stats.updatesBySkill, null, 2)}`
    );
    console.log(`  By type: ${JSON.stringify(stats.updatesByType, null, 2)}`);
    console.log();
  },
  onError: (error: Error, filePath: string) => {
    console.error();
    console.error('❌ ERROR:', error.message);
    if (filePath) {
      console.error('   File:', filePath);
    }
    console.error();
  },
});

// Show initial stats
console.log('📊 Initial Statistics:', watcher.getStats());
console.log();
console.log('✅ Watcher is running...');
console.log();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log();
  console.log('Stopping watcher...');
  await watcher.stop();
  console.log('Watcher stopped. Goodbye!');
  process.exit(0);
});
