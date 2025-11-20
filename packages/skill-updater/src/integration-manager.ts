import fs from 'fs/promises';
import path from 'path';
import {
  Integrator,
  IntegrationContext,
  IntegrationResult,
  IntegrationOptions,
} from './integrator-types.js';
import { RulesBasedIntegrator } from './rules-integrator.js';
import { UpdateFile, SkillConfig } from './types.js';
import { loadSkillConfig } from './utils.js';

/**
 * Central manager for update integration
 * Coordinates between watcher, integrators, and workflow
 */
export class IntegrationManager {
  private rulesIntegrator: Integrator;
  private skillsPath: string;

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
    this.rulesIntegrator = new RulesBasedIntegrator();
  }

  /**
   * Process an update file
   */
  async processUpdate(
    update: UpdateFile,
    options: IntegrationOptions = {}
  ): Promise<IntegrationResult> {
    console.log(`[IntegrationManager] Processing update: ${update.fileName}`);

    try {
      // Load skill configuration
      const skillPath = this.getSkillPath(update.skillId);
      const config = await loadSkillConfig(skillPath);

      // Load SKILL.md content
      const skillFilePath = path.join(skillPath, 'SKILL.md');
      let skillContent: string;
      try {
        skillContent = await fs.readFile(skillFilePath, 'utf-8');
      } catch {
        throw new Error(`SKILL.md not found at ${skillFilePath}`);
      }

      // Create integration context
      const context: IntegrationContext = {
        update,
        config,
        skillContent,
        skillPath: skillFilePath,
      };

      // Determine integration mode
      const mode = this.determineMode(update, config);

      // Route to appropriate integrator
      let result: IntegrationResult;

      if (mode === 'rules-based') {
        result = await this.rulesIntegrator.integrate(context, options);
      } else {
        // For Phase 2, we'll use rules-based for all
        // AI-powered integration comes in future phases
        console.log(
          `[IntegrationManager] AI-powered mode requested but not yet implemented, falling back to rules-based`
        );
        result = await this.rulesIntegrator.integrate(context, options);
      }

      console.log(
        `[IntegrationManager] Integration ${result.status}: ${update.fileName}`
      );

      return result;
    } catch (error) {
      console.error(
        `[IntegrationManager] Error processing update:`,
        (error as Error).message
      );

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
   * Process multiple updates in batch
   */
  async processBatch(
    updates: UpdateFile[],
    options: IntegrationOptions = {}
  ): Promise<IntegrationResult[]> {
    console.log(
      `[IntegrationManager] Processing batch of ${updates.length} updates`
    );

    const results: IntegrationResult[] = [];

    for (const update of updates) {
      const result = await this.processUpdate(update, options);
      results.push(result);

      // Stop on first failure if not in batch mode
      if (result.status === 'failed' && !options.dryRun) {
        console.warn(
          `[IntegrationManager] Stopping batch processing due to failure`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Generate preview for update without applying
   */
  async previewUpdate(update: UpdateFile): Promise<IntegrationResult> {
    return this.processUpdate(update, { dryRun: true });
  }

  /**
   * Get integration statistics
   */
  async getStats(): Promise<{
    totalProcessed: number;
    byStatus: Record<string, number>;
    bySkill: Record<string, number>;
  }> {
    // This would be tracked over time
    // For now, return empty stats
    return {
      totalProcessed: 0,
      byStatus: {},
      bySkill: {},
    };
  }

  /**
   * Determine integration mode based on update type and config
   */
  private determineMode(
    update: UpdateFile,
    config: SkillConfig
  ): 'rules-based' | 'ai-powered' {
    const updateType = update.metadata.type;

    // Simple types use rules-based
    const simpleTypes = ['correction', 'template'];
    if (simpleTypes.includes(updateType)) {
      return 'rules-based';
    }

    // Complex types would use AI-powered (future)
    const complexTypes = ['framework', 'expansion', 'case-study'];
    if (complexTypes.includes(updateType)) {
      // For Phase 2, fall back to rules-based
      return 'rules-based';
    }

    // Default to rules-based
    return 'rules-based';
  }

  /**
   * Get skill directory path
   */
  private getSkillPath(skillId: string): string {
    // Skills are in {tier}/{skillId} structure
    // We need to find the right tier
    const tiers = ['platinum', 'premium', 'regular', 'spotlight'];

    for (const tier of tiers) {
      const skillPath = path.join(this.skillsPath, tier, skillId);
      // We'll assume it exists for now
      // In production, we'd check with fs.access
      return skillPath;
    }

    throw new Error(`Could not determine path for skill: ${skillId}`);
  }
}

/**
 * Create integration manager instance
 */
export function createIntegrationManager(
  skillsPath: string
): IntegrationManager {
  return new IntegrationManager(skillsPath);
}
