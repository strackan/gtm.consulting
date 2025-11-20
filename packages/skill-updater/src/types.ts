import { z } from 'zod';

/**
 * Update file metadata schema
 */
export const UpdateMetadataSchema = z.object({
  type: z.enum([
    'framework',
    'example',
    'template',
    'playbook',
    'correction',
    'expansion',
    'case-study',
  ]),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetSection: z.string(),
  applyTo: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.enum(['draft', 'ready', 'published']).default('ready'),
  author: z.string(),
  dateAdded: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export type UpdateMetadata = z.infer<typeof UpdateMetadataSchema>;

/**
 * Update file with parsed content
 */
export interface UpdateFile {
  filePath: string;
  fileName: string;
  metadata: UpdateMetadata;
  content: string;
  skillId: string;
  detectedAt: Date;
}

/**
 * Skill configuration schema
 */
export const SkillConfigSchema = z.object({
  version: z.string(),
  expert: z.object({
    name: z.string(),
    skillId: z.string(),
    tier: z.enum(['platinum', 'premium', 'regular', 'spotlight']),
    voiceProfile: z.string().optional(),
    approvalRequired: z.boolean().default(true),
    autoPublish: z.boolean().default(false),
  }),
  integrationRules: z.record(z.any()),
  validation: z.object({
    preserveStructure: z.boolean().default(true),
    checkVoice: z.boolean().default(true),
    noDuplicates: z.boolean().default(true),
    maintainFormatting: z.boolean().default(true),
    requireYAMLFrontmatter: z.boolean().default(true),
    allowedUpdateTypes: z.array(z.string()).optional(),
  }),
  voice: z
    .object({
      characteristics: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
    })
    .optional(),
  notifications: z
    .object({
      onNewUpdate: z.boolean().default(true),
      onIntegrationReady: z.boolean().default(true),
      onPublish: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'slack', 'webhook', 'none'])).optional(),
    })
    .optional(),
  research: z
    .object({
      enabled: z.boolean().default(false),
      researchFile: z.string().default('RESEARCH.md'),
      autoIntegrate: z.boolean().default(false),
      priorityTriggers: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SkillConfig = z.infer<typeof SkillConfigSchema>;

/**
 * Watcher options
 */
export interface WatcherOptions {
  skillsPath: string;
  pollInterval?: number;
  ignoreInitial?: boolean;
  onUpdate?: (update: UpdateFile) => void | Promise<void>;
  onError?: (error: Error, filePath: string) => void;
}

/**
 * Watcher statistics
 */
export interface WatcherStats {
  totalUpdatesDetected: number;
  updatesBySkill: Record<string, number>;
  updatesByType: Record<string, number>;
  lastUpdateAt: Date | null;
  errorsCount: number;
}
