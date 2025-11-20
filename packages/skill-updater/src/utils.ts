import fs from 'fs/promises';
import path from 'path';
import { SkillConfig, SkillConfigSchema } from './types.js';

/**
 * Load and validate skill-config.json
 */
export async function loadSkillConfig(
  skillPath: string
): Promise<SkillConfig> {
  const configPath = path.join(skillPath, 'skill-config.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return SkillConfigSchema.parse(config);
  } catch (error) {
    throw new Error(
      `Failed to load skill config from ${configPath}: ${
        (error as Error).message
      }`
    );
  }
}

/**
 * Check if a skill has a config file
 */
export async function hasSkillConfig(skillPath: string): Promise<boolean> {
  const configPath = path.join(skillPath, 'skill-config.json');
  try {
    await fs.access(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all skills with config files
 */
export async function getConfiguredSkills(
  skillsPath: string
): Promise<string[]> {
  const configuredSkills: string[] = [];

  try {
    const tiers = await fs.readdir(skillsPath);

    for (const tier of tiers) {
      const tierPath = path.join(skillsPath, tier);
      const stat = await fs.stat(tierPath);

      if (!stat.isDirectory()) continue;

      const skills = await fs.readdir(tierPath);

      for (const skill of skills) {
        const skillPath = path.join(tierPath, skill);
        const skillStat = await fs.stat(skillPath);

        if (!skillStat.isDirectory()) continue;

        if (await hasSkillConfig(skillPath)) {
          configuredSkills.push(path.join(tier, skill));
        }
      }
    }
  } catch (error) {
    console.error('Error scanning skills:', error);
  }

  return configuredSkills;
}

/**
 * Ensure _updates directory exists for a skill
 */
export async function ensureUpdatesDirectory(
  skillPath: string
): Promise<void> {
  const updatesPath = path.join(skillPath, '_updates');

  try {
    await fs.mkdir(updatesPath, { recursive: true });
  } catch (error) {
    throw new Error(
      `Failed to create _updates directory: ${(error as Error).message}`
    );
  }
}

/**
 * Format date for file naming (YYYY-MM-DD)
 */
export function formatDateForFileName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sanitize string for use in file names
 */
export function sanitizeFileName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate update file name
 */
export function generateUpdateFileName(
  description: string,
  date: Date = new Date()
): string {
  const dateStr = formatDateForFileName(date);
  const sanitized = sanitizeFileName(description);
  return `${dateStr}-${sanitized}.md`;
}
