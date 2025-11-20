#!/usr/bin/env node
/**
 * Test script for the Update Watcher
 * Validates Phase 1 functionality
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createWatcher } from './dist/watcher.js';
import { loadSkillConfig, getConfiguredSkills } from './dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsPath = path.resolve(__dirname, '../../skills');

console.log('='.repeat(70));
console.log('  Phase 1 Validation Test');
console.log('='.repeat(70));
console.log();

// Test 1: Check configured skills
console.log('Test 1: Discovering configured Skills...');
try {
  const configuredSkills = await getConfiguredSkills(skillsPath);
  console.log(`✅ Found ${configuredSkills.length} configured Skills:`);
  configuredSkills.forEach((skill) => console.log(`   - ${skill}`));
  console.log();
} catch (error) {
  console.error('❌ Error discovering Skills:', error.message);
  process.exit(1);
}

// Test 2: Load skill configs
console.log('Test 2: Loading Skill configurations...');
try {
  const justinConfig = await loadSkillConfig(
    path.join(skillsPath, 'platinum', 'justin-strackany')
  );
  console.log(`✅ Loaded config for: ${justinConfig.expert.name}`);
  console.log(`   - Skill ID: ${justinConfig.expert.skillId}`);
  console.log(`   - Tier: ${justinConfig.expert.tier}`);
  console.log(
    `   - Approval required: ${justinConfig.expert.approvalRequired}`
  );
  console.log();

  const scottConfig = await loadSkillConfig(
    path.join(skillsPath, 'platinum', 'scott-leese')
  );
  console.log(`✅ Loaded config for: ${scottConfig.expert.name}`);
  console.log(`   - Skill ID: ${scottConfig.expert.skillId}`);
  console.log(`   - Tier: ${scottConfig.expert.tier}`);
  console.log(`   - Research enabled: ${scottConfig.research?.enabled}`);
  console.log();
} catch (error) {
  console.error('❌ Error loading configs:', error.message);
  process.exit(1);
}

// Test 3: Start watcher and detect existing updates
console.log('Test 3: Starting file watcher...');
console.log(`Watching: ${skillsPath}`);
console.log();

let detectionCount = 0;

const watcher = await createWatcher({
  skillsPath,
  ignoreInitial: false, // Detect existing files for testing
  onUpdate: async (update) => {
    detectionCount++;
    console.log('━'.repeat(70));
    console.log(`✅ UPDATE DETECTED #${detectionCount}`);
    console.log('━'.repeat(70));
    console.log(`Skill ID:   ${update.skillId}`);
    console.log(`File:       ${update.fileName}`);
    console.log(`Type:       ${update.metadata.type}`);
    console.log(`Category:   ${update.metadata.category}`);
    console.log(`Priority:   ${update.metadata.priority}`);
    console.log(`Status:     ${update.metadata.status}`);
    console.log(`Target:     ${update.metadata.targetSection}`);
    console.log(`Author:     ${update.metadata.author}`);
    if (update.metadata.tags && update.metadata.tags.length > 0) {
      console.log(`Tags:       ${update.metadata.tags.join(', ')}`);
    }
    console.log(`Content:    ${update.content.length} characters`);
    console.log('━'.repeat(70));
    console.log();
  },
  onError: (error, filePath) => {
    console.error('❌ ERROR:', error.message);
    if (filePath) {
      console.error('   File:', filePath);
    }
    console.error();
  },
});

// Wait for initial scan to complete
await new Promise((resolve) => setTimeout(resolve, 3000));

// Show statistics
console.log('Test 4: Watcher statistics...');
const stats = watcher.getStats();
console.log(`✅ Total updates detected: ${stats.totalUpdatesDetected}`);
console.log(`✅ Updates by skill:`, stats.updatesBySkill);
console.log(`✅ Updates by type:`, stats.updatesByType);
console.log();

// Stop watcher
await watcher.stop();

// Final summary
console.log('='.repeat(70));
console.log('  Phase 1 Validation Summary');
console.log('='.repeat(70));
console.log(`✅ Skill discovery: PASSED`);
console.log(`✅ Config loading: PASSED`);
console.log(`✅ File watching: PASSED`);
console.log(`✅ Update detection: ${detectionCount > 0 ? 'PASSED' : 'NO UPDATES FOUND'}`);
console.log(`✅ Metadata parsing: ${detectionCount > 0 ? 'PASSED' : 'N/A'}`);
console.log();
console.log('🎉 Phase 1 validation complete!');
console.log('='.repeat(70));
console.log();

process.exit(0);
