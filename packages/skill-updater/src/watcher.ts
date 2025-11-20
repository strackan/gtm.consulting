import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import {
  UpdateFile,
  UpdateMetadataSchema,
  WatcherOptions,
  WatcherStats,
} from './types.js';

/**
 * File system watcher for Skill update detection
 */
export class UpdateWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private stats: WatcherStats = {
    totalUpdatesDetected: 0,
    updatesBySkill: {},
    updatesByType: {},
    lastUpdateAt: null,
    errorsCount: 0,
  };

  constructor(private options: WatcherOptions) {}

  /**
   * Start watching for update files
   */
  async start(): Promise<void> {
    const pattern = path.join(
      this.options.skillsPath,
      '*',
      '*',
      '_updates',
      '*.md'
    );

    console.log(`[UpdateWatcher] Starting watcher on: ${pattern}`);

    this.watcher = chokidar.watch(pattern, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /README\.md$/i, // ignore README files
        /_TEMPLATE.*\.md$/i, // ignore template files
      ],
      persistent: true,
      ignoreInitial: this.options.ignoreInitial ?? true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', async (filePath: string) => {
      await this.handleNewUpdate(filePath);
    });

    this.watcher.on('error', (error: Error) => {
      console.error('[UpdateWatcher] Watcher error:', error);
      this.stats.errorsCount++;
      if (this.options.onError) {
        this.options.onError(error, '');
      }
    });

    console.log('[UpdateWatcher] Watcher started successfully');
  }

  /**
   * Stop watching for updates
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('[UpdateWatcher] Watcher stopped');
    }
  }

  /**
   * Handle detection of a new update file
   */
  private async handleNewUpdate(filePath: string): Promise<void> {
    try {
      console.log(`[UpdateWatcher] New update detected: ${filePath}`);

      // Extract skill ID from file path
      const skillId = this.extractSkillId(filePath);
      if (!skillId) {
        throw new Error(`Could not extract skill ID from path: ${filePath}`);
      }

      // Read and parse the file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      // Convert dateAdded from Date to string if needed (gray-matter auto-parses dates)
      if (data.dateAdded instanceof Date) {
        const date = data.dateAdded;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        data.dateAdded = `${year}-${month}-${day}`;
      }

      // Validate metadata
      const metadata = UpdateMetadataSchema.parse(data);

      // Create UpdateFile object
      const updateFile: UpdateFile = {
        filePath,
        fileName: path.basename(filePath),
        metadata,
        content: content.trim(),
        skillId,
        detectedAt: new Date(),
      };

      // Update statistics
      this.updateStats(skillId, metadata.type);

      // Call user callback if provided
      if (this.options.onUpdate) {
        await this.options.onUpdate(updateFile);
      }

      console.log(
        `[UpdateWatcher] Successfully processed update: ${updateFile.fileName} (${metadata.type})`
      );
    } catch (error) {
      const err = error as Error;
      console.error(`[UpdateWatcher] Error processing ${filePath}:`, err);
      this.stats.errorsCount++;
      if (this.options.onError) {
        this.options.onError(err, filePath);
      }
    }
  }

  /**
   * Extract skill ID from file path
   * Pattern: skills/{tier}/{skillId}/_updates/{file}.md
   */
  private extractSkillId(filePath: string): string | null {
    const normalized = filePath.replace(/\\/g, '/');
    const match = normalized.match(/skills\/[^\/]+\/([^\/]+)\/_updates/);
    return match ? match[1] : null;
  }

  /**
   * Update watcher statistics
   */
  private updateStats(skillId: string, updateType: string): void {
    this.stats.totalUpdatesDetected++;
    this.stats.lastUpdateAt = new Date();

    // Update by skill
    if (!this.stats.updatesBySkill[skillId]) {
      this.stats.updatesBySkill[skillId] = 0;
    }
    this.stats.updatesBySkill[skillId]++;

    // Update by type
    if (!this.stats.updatesByType[updateType]) {
      this.stats.updatesByType[updateType] = 0;
    }
    this.stats.updatesByType[updateType]++;
  }

  /**
   * Get current watcher statistics
   */
  getStats(): WatcherStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalUpdatesDetected: 0,
      updatesBySkill: {},
      updatesByType: {},
      lastUpdateAt: null,
      errorsCount: 0,
    };
  }
}

/**
 * Create and start a new watcher instance
 */
export async function createWatcher(
  options: WatcherOptions
): Promise<UpdateWatcher> {
  const watcher = new UpdateWatcher(options);
  await watcher.start();
  return watcher;
}
