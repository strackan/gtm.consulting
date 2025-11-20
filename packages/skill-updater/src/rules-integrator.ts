import fs from 'fs/promises';
import path from 'path';
import {
  Integrator,
  IntegrationContext,
  IntegrationPreview,
  IntegrationResult,
  IntegrationOptions,
  DuplicateCheckResult,
  VoiceValidationResult,
} from './integrator-types.js';
import { SkillParser } from './skill-parser.js';

/**
 * Rules-based integrator for simple, deterministic integrations
 * Handles: corrections, templates, simple examples
 */
export class RulesBasedIntegrator implements Integrator {
  /**
   * Generate preview of integration
   */
  async preview(context: IntegrationContext): Promise<IntegrationPreview> {
    const { update, config, skillContent } = context;

    // Parse sections
    const sections = SkillParser.parseSections(skillContent);
    const targetSection = SkillParser.findSection(
      sections,
      update.metadata.targetSection
    );

    if (!targetSection) {
      throw new Error(
        `Target section "${update.metadata.targetSection}" not found in SKILL.md`
      );
    }

    // Get integration rules for this update type
    const integrationRule = config.integrationRules[update.metadata.type];

    // Generate proposed content
    let proposedContent: string;

    if (integrationRule?.template) {
      // Apply template
      const data: Record<string, string> = {
        title: this.extractTitle(update.content),
        content: update.content,
        type: update.metadata.type,
        category: update.metadata.category,
        priority: update.metadata.priority,
        targetSection: update.metadata.targetSection,
        status: update.metadata.status,
        author: update.metadata.author,
        dateAdded: update.metadata.dateAdded,
        tags: update.metadata.tags ? update.metadata.tags.join(', ') : '',
      };
      proposedContent = SkillParser.applyTemplate(integrationRule.template, data);
    } else {
      // Simple append
      proposedContent = `\n\n${update.content}`;
    }

    // Generate before/after
    const lines = skillContent.split('\n');
    const insertionLine = SkillParser.getInsertionPoint(
      skillContent,
      targetSection,
      'end'
    );

    const before = lines.slice(
      Math.max(0, insertionLine - 5),
      insertionLine + 1
    ).join('\n');

    lines.splice(insertionLine + 1, 0, proposedContent);

    const after = lines.slice(
      Math.max(0, insertionLine - 5),
      insertionLine + 10
    ).join('\n');

    const diff = this.generateDiff(before, proposedContent);

    // Check if approval is required
    const requiresApproval = this.requiresApproval(update, config);

    // Generate warnings
    const warnings: string[] = [];
    if (!integrationRule) {
      warnings.push(`No integration rule defined for type: ${update.metadata.type}`);
    }

    return {
      updateFile: update,
      mode: 'rules-based',
      targetSection: targetSection.name,
      proposedChanges: {
        before,
        after,
        diff,
      },
      warnings,
      requiresApproval,
    };
  }

  /**
   * Integrate update into skill
   */
  async integrate(
    context: IntegrationContext,
    options: IntegrationOptions = {}
  ): Promise<IntegrationResult> {
    const { update, config, skillContent, skillPath } = context;

    try {
      // Check for duplicates
      if (!options.skipDuplicateCheck && config.validation?.noDuplicates) {
        const duplicateCheck = await this.checkDuplicate(
          update.content,
          skillContent
        );
        if (duplicateCheck.isDuplicate) {
          return {
            status: 'duplicate',
            updateFile: update,
            mode: 'rules-based',
            error: `Content appears to be duplicate (${Math.round(duplicateCheck.similarity * 100)}% similar)`,
            warnings: [
              `Matched content in section: ${duplicateCheck.matchedSection || 'unknown'}`,
            ],
          };
        }
      }

      // Voice validation
      if (!options.skipVoiceValidation && config.validation?.checkVoice) {
        const voiceCheck = await this.validateVoice(
          update.content,
          config.expert.voiceProfile || ''
        );
        if (!voiceCheck.isValid && voiceCheck.confidence < 0.7) {
          return {
            status: 'voice-mismatch',
            updateFile: update,
            mode: 'rules-based',
            error: 'Voice validation failed',
            warnings: voiceCheck.issues,
          };
        }
      }

      // Generate preview
      const preview = await this.preview(context);

      // Check if approval required
      if (
        (preview.requiresApproval || options.forceApproval) &&
        !options.dryRun
      ) {
        return {
          status: 'pending-review',
          updateFile: update,
          mode: 'rules-based',
          preview,
          warnings: preview.warnings,
        };
      }

      // Perform integration
      if (options.dryRun) {
        return {
          status: 'success',
          updateFile: update,
          mode: 'rules-based',
          preview,
          warnings: [...preview.warnings, 'DRY RUN - No changes made'],
        };
      }

      // Actually modify the file
      const integratedContent = this.applyIntegration(
        skillContent,
        preview
      );

      // Write to file
      await fs.writeFile(skillPath, integratedContent, 'utf-8');

      // Generate changelog entry
      const changelogEntry = SkillParser.generateChangelogEntry(
        update.metadata.type,
        this.extractTitle(update.content),
        update.metadata.dateAdded
      );

      // Update CHANGELOG.md
      await this.updateChangelog(
        path.dirname(skillPath),
        changelogEntry
      );

      return {
        status: 'success',
        updateFile: update,
        mode: 'rules-based',
        integratedContent,
        warnings: preview.warnings,
        changelogEntry,
      };
    } catch (error) {
      return {
        status: 'failed',
        updateFile: update,
        mode: 'rules-based',
        error: (error as Error).message,
        warnings: [],
      };
    }
  }

  /**
   * Check for duplicate content
   */
  async checkDuplicate(
    content: string,
    skillContent: string
  ): Promise<DuplicateCheckResult> {
    const result = SkillParser.checkDuplicateContent(
      skillContent,
      content,
      0.8
    );

    return {
      isDuplicate: result.isDuplicate,
      similarity: result.similarity,
      matchedContent: result.match,
    };
  }

  /**
   * Validate voice consistency (basic implementation)
   */
  async validateVoice(
    content: string,
    voiceProfile: string
  ): Promise<VoiceValidationResult> {
    // Basic voice validation - check for profanity, excessive caps, etc.
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for excessive caps
    const capsRatio =
      (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      issues.push('Excessive use of capital letters');
      suggestions.push('Consider using sentence case');
    }

    // Check for minimum content length
    if (content.length < 50) {
      issues.push('Content is very short');
      suggestions.push('Consider adding more detail');
    }

    // Simple validation - passes if no major issues
    const isValid = issues.length === 0;
    const confidence = isValid ? 0.9 : 0.5;

    return {
      isValid,
      confidence,
      issues,
      suggestions,
    };
  }

  /**
   * Apply integration to content
   */
  private applyIntegration(
    skillContent: string,
    preview: IntegrationPreview
  ): string {
    // Parse sections
    const sections = SkillParser.parseSections(skillContent);
    const targetSection = SkillParser.findSection(
      sections,
      preview.targetSection
    );

    if (!targetSection) {
      throw new Error(`Target section "${preview.targetSection}" not found`);
    }

    // Insert content
    const lines = skillContent.split('\n');
    const insertionLine = SkillParser.getInsertionPoint(
      skillContent,
      targetSection,
      'end'
    );

    // Extract proposed content from diff
    const proposedContent = preview.proposedChanges.diff
      .split('\n')
      .filter((line) => line.startsWith('+'))
      .map((line) => line.slice(1))
      .join('\n');

    lines.splice(insertionLine + 1, 0, proposedContent);

    return lines.join('\n');
  }

  /**
   * Update CHANGELOG.md
   */
  private async updateChangelog(
    skillDir: string,
    entry: string
  ): Promise<void> {
    const changelogPath = path.join(skillDir, 'CHANGELOG.md');

    try {
      let content = await fs.readFile(changelogPath, 'utf-8');

      // Find the [Unreleased] section or create it
      const unreleasedMatch = content.match(/## \[Unreleased\]/);

      if (unreleasedMatch) {
        // Find the end of the Unreleased section
        const lines = content.split('\n');
        const unreleasedIndex = lines.findIndex((line) =>
          line.includes('[Unreleased]')
        );

        // Find next section or Added subsection
        let insertIndex = unreleasedIndex + 1;
        for (let i = unreleasedIndex + 1; i < lines.length; i++) {
          if (lines[i].startsWith('## [')) {
            // Next version section
            insertIndex = i - 1;
            break;
          }
          if (lines[i].startsWith('### Added')) {
            // Found Added section
            insertIndex = i + 1;
            break;
          }
        }

        lines.splice(insertIndex, 0, entry);
        content = lines.join('\n');
      } else {
        // Add Unreleased section
        const newSection = `## [Unreleased]\n\n### Added\n${entry}\n\n`;
        content = content.replace(
          /^(# Changelog\n)/,
          `$1\n${newSection}`
        );
      }

      await fs.writeFile(changelogPath, content, 'utf-8');
    } catch (error) {
      console.warn('Could not update CHANGELOG.md:', (error as Error).message);
    }
  }

  /**
   * Check if approval is required
   */
  private requiresApproval(
    update: any,
    config: any
  ): boolean {
    // Check expert-level approval setting
    if (config.expert.approvalRequired === false) {
      return false;
    }

    // Check type-specific auto-approve
    const integrationRule = config.integrationRules[update.metadata.type];
    if (integrationRule?.autoApprove) {
      // Check if within maxChanges limit
      if (integrationRule.maxChanges) {
        const changeCount = update.content.split('\n').length;
        if (changeCount <= integrationRule.maxChanges) {
          return !integrationRule.requireReview;
        }
      } else {
        return !integrationRule.requireReview;
      }
    }

    return true;
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string {
    const lines = content.trim().split('\n');
    const firstLine = lines[0];

    // Check if first line is a header
    const headerMatch = firstLine.match(/^#+\s+(.+)$/);
    if (headerMatch) {
      return headerMatch[1];
    }

    // Return first line or default
    return firstLine.slice(0, 60) + (firstLine.length > 60 ? '...' : '');
  }

  /**
   * Generate simple diff
   */
  private generateDiff(before: string, added: string): string {
    const diff: string[] = [];

    before.split('\n').forEach((line) => {
      diff.push(` ${line}`);
    });

    added.split('\n').forEach((line) => {
      diff.push(`+${line}`);
    });

    return diff.join('\n');
  }
}
