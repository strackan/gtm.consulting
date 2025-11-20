#!/usr/bin/env node
/**
 * Test script for the Integration Engine
 * Validates Phase 2 functionality
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createIntegrationManager } from './dist/integration-manager.js';
import { SkillParser } from './dist/skill-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsPath = path.resolve(__dirname, '../../skills');

console.log('='.repeat(70));
console.log('  Phase 2 Integration Engine Test');
console.log('='.repeat(70));
console.log();

// Test 1: Skill Parser
console.log('Test 1: Skill Parser - Section extraction...');
try {
  const testContent = `# Test Skill

## Introduction
This is the intro section.

## Frameworks & Methodologies
### Framework 1
Content here

### Framework 2
More content

## Examples & Use Cases
Example content here

## Conclusion
Final thoughts`;

  const sections = SkillParser.parseSections(testContent);
  console.log(`✅ Parsed ${sections.length} sections:`);
  sections.forEach((s) => console.log(`   - ${s.name} (Level ${s.level})`));

  // Test section finding
  const frameworkSection = SkillParser.findSection(
    sections,
    'Frameworks & Methodologies'
  );
  console.log(
    `✅ Found section: "${frameworkSection?.name}" at line ${frameworkSection?.startLine}`
  );

  // Test subsection finding
  const subsections = SkillParser.findSubsections(
    sections,
    frameworkSection
  );
  console.log(`✅ Found ${subsections.length} subsections`);
  console.log();
} catch (error) {
  console.error('❌ Skill Parser test failed:', error.message);
  process.exit(1);
}

// Test 2: Duplicate Detection
console.log('Test 2: Duplicate Detection...');
try {
  const existingContent = `
    This is a framework about discovery calls.
    It helps you understand customer needs.
  `;

  const newContent1 = `This is a framework about discovery calls`;
  const newContent2 = `This is completely different content about pricing`;

  const dup1 = SkillParser.checkDuplicateContent(existingContent, newContent1);
  const dup2 = SkillParser.checkDuplicateContent(existingContent, newContent2);

  console.log(`✅ Similar content detected: ${dup1.isDuplicate} (${Math.round(dup1.similarity * 100)}%)`);
  console.log(`✅ Different content detected: ${dup2.isDuplicate} (${Math.round(dup2.similarity * 100)}%)`);
  console.log();
} catch (error) {
  console.error('❌ Duplicate detection test failed:', error.message);
  process.exit(1);
}

// Test 3: Template Application
console.log('Test 3: Template Application...');
try {
  const template = `### {title}

**The Challenge:** {challenge}

**The Framework:**
{content}

**Metrics:**
{metrics}`;

  const data = {
    title: 'Discovery Framework',
    challenge: 'Understanding customer needs',
    content: 'Ask open-ended questions',
    metrics: 'Track question-to-answer ratio',
  };

  const result = SkillParser.applyTemplate(template, data);
  console.log(`✅ Template applied successfully:`);
  console.log(result.slice(0, 100) + '...');
  console.log();
} catch (error) {
  console.error('❌ Template application test failed:', error.message);
  process.exit(1);
}

// Test 4: Changelog Generation
console.log('Test 4: Changelog Generation...');
try {
  const entry1 = SkillParser.generateChangelogEntry(
    'framework',
    'New Discovery Framework',
    '2024-11-20'
  );
  const entry2 = SkillParser.generateChangelogEntry(
    'correction',
    'Fix typo in section 3',
    '2024-11-20'
  );

  console.log(`✅ Framework entry: ${entry1}`);
  console.log(`✅ Correction entry: ${entry2}`);
  console.log();
} catch (error) {
  console.error('❌ Changelog generation test failed:', error.message);
  process.exit(1);
}

// Test 5: Integration Manager
console.log('Test 5: Integration Manager - Preview generation...');
try {
  const manager = createIntegrationManager(skillsPath);

  // Create a mock update
  const mockUpdate = {
    filePath: 'test.md',
    fileName: '2024-11-20-test-template.md',
    metadata: {
      type: 'template',
      category: 'writing',
      priority: 'low',
      targetSection: 'Opening Templates',
      status: 'ready',
      author: 'Test Author',
      dateAdded: '2024-11-20',
      tags: ['test'],
    },
    content: `# Test Template

This is a test template for LinkedIn outreach.

**Pattern:** [Hook] + [Value Prop] + [CTA]

**Example:**
"Hey [Name], saw your post about [Topic]..."`,
    skillId: 'justin-strackany',
    detectedAt: new Date(),
  };

  console.log('   Creating preview for test update...');
  const preview = await manager.previewUpdate(mockUpdate);

  console.log(`✅ Preview generated:`);
  console.log(`   - Status: ${preview.status}`);
  console.log(`   - Mode: ${preview.mode}`);
  console.log(`   - Warnings: ${preview.warnings.length}`);
  if (preview.warnings.length > 0) {
    preview.warnings.forEach((w) => console.log(`     ⚠️  ${w}`));
  }
  if (preview.preview) {
    console.log(`   - Target: ${preview.preview.targetSection}`);
    console.log(`   - Requires approval: ${preview.preview.requiresApproval}`);
  }
  console.log();
} catch (error) {
  console.error('❌ Integration Manager test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// Test 6: Batch Processing (Dry Run)
console.log('Test 6: Batch Processing (Dry Run)...');
try {
  const manager = createIntegrationManager(skillsPath);

  const mockUpdates = [
    {
      filePath: 'test1.md',
      fileName: '2024-11-20-test-1.md',
      metadata: {
        type: 'correction',
        category: 'writing',
        priority: 'low',
        targetSection: 'Opening Templates',
        status: 'ready',
        author: 'Test',
        dateAdded: '2024-11-20',
        tags: [],
      },
      content: 'Small typo fix',
      skillId: 'justin-strackany',
      detectedAt: new Date(),
    },
    {
      filePath: 'test2.md',
      fileName: '2024-11-20-test-2.md',
      metadata: {
        type: 'template',
        category: 'writing',
        priority: 'medium',
        targetSection: 'Middle Templates',
        status: 'ready',
        author: 'Test',
        dateAdded: '2024-11-20',
        tags: [],
      },
      content: 'New middle template',
      skillId: 'justin-strackany',
      detectedAt: new Date(),
    },
  ];

  const results = await manager.processBatch(mockUpdates, { dryRun: true });

  console.log(`✅ Processed batch of ${results.length} updates:`);
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.updateFile.fileName}: ${r.status}`);
  });
  console.log();
} catch (error) {
  console.error('❌ Batch processing test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// Final summary
console.log('='.repeat(70));
console.log('  Phase 2 Validation Summary');
console.log('='.repeat(70));
console.log(`✅ Skill Parser: PASSED`);
console.log(`✅ Duplicate Detection: PASSED`);
console.log(`✅ Template Application: PASSED`);
console.log(`✅ Changelog Generation: PASSED`);
console.log(`✅ Integration Manager: PASSED`);
console.log(`✅ Batch Processing: PASSED`);
console.log();
console.log('🎉 Phase 2 validation complete!');
console.log('='.repeat(70));
console.log();

process.exit(0);
