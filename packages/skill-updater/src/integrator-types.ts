import { z } from 'zod';
import { UpdateFile, SkillConfig } from './types.js';

/**
 * Integration modes
 */
export type IntegrationMode = 'rules-based' | 'ai-powered' | 'hybrid';

/**
 * Integration result status
 */
export type IntegrationStatus =
  | 'success'
  | 'pending-review'
  | 'failed'
  | 'duplicate'
  | 'voice-mismatch';

/**
 * Preview of proposed integration
 */
export interface IntegrationPreview {
  updateFile: UpdateFile;
  mode: IntegrationMode;
  targetSection: string;
  proposedChanges: {
    before: string;
    after: string;
    diff: string;
  };
  warnings: string[];
  requiresApproval: boolean;
}

/**
 * Result of an integration attempt
 */
export interface IntegrationResult {
  status: IntegrationStatus;
  updateFile: UpdateFile;
  mode: IntegrationMode;
  preview?: IntegrationPreview;
  integratedContent?: string;
  error?: string;
  warnings: string[];
  changelogEntry?: string;
}

/**
 * Integration context - all info needed to integrate an update
 */
export interface IntegrationContext {
  update: UpdateFile;
  config: SkillConfig;
  skillContent: string;
  skillPath: string;
}

/**
 * Section info extracted from SKILL.md
 */
export interface SkillSection {
  name: string;
  level: number;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  matchedContent?: string;
  matchedSection?: string;
}

/**
 * Voice validation result
 */
export interface VoiceValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Integration options
 */
export interface IntegrationOptions {
  mode?: IntegrationMode;
  skipDuplicateCheck?: boolean;
  skipVoiceValidation?: boolean;
  forceApproval?: boolean;
  dryRun?: boolean;
}

/**
 * Integrator interface
 */
export interface Integrator {
  /**
   * Generate preview of integration
   */
  preview(context: IntegrationContext): Promise<IntegrationPreview>;

  /**
   * Integrate update into skill
   */
  integrate(
    context: IntegrationContext,
    options?: IntegrationOptions
  ): Promise<IntegrationResult>;

  /**
   * Check for duplicates
   */
  checkDuplicate(
    content: string,
    skillContent: string
  ): Promise<DuplicateCheckResult>;

  /**
   * Validate voice consistency
   */
  validateVoice(
    content: string,
    voiceProfile: string
  ): Promise<VoiceValidationResult>;
}
