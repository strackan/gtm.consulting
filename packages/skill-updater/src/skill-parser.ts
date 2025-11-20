import { SkillSection } from './integrator-types.js';

/**
 * Parse SKILL.md file and extract sections
 */
export class SkillParser {
  /**
   * Parse markdown content and extract all sections
   */
  static parseSections(content: string): SkillSection[] {
    const lines = content.split('\n');
    const sections: SkillSection[] = [];
    let currentSection: SkillSection | null = null;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      // Check if line is a header
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection !== null) {
          currentSection.endLine = index - 1;
          currentSection.content = lines
            .slice(currentSection.startLine, currentSection.endLine + 1)
            .join('\n');
          sections.push(currentSection);
        }

        // Start new section
        const level = headerMatch[1].length;
        const name = headerMatch[2].trim();
        currentSection = {
          name,
          level,
          startLine: index,
          endLine: index,
          content: '',
        };
      }
    }

    // Save last section
    if (currentSection !== null) {
      currentSection.endLine = lines.length - 1;
      currentSection.content = lines
        .slice(currentSection.startLine, currentSection.endLine + 1)
        .join('\n');
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Find section by name (case-insensitive, flexible matching)
   */
  static findSection(
    sections: SkillSection[],
    sectionName: string
  ): SkillSection | null {
    const normalizedTarget = sectionName.toLowerCase().trim();

    // Exact match
    const exactMatch = sections.find(
      (s) => s.name.toLowerCase() === normalizedTarget
    );
    if (exactMatch) return exactMatch;

    // Partial match (target contains section name or vice versa)
    const partialMatch = sections.find((s) => {
      const normalized = s.name.toLowerCase();
      return (
        normalized.includes(normalizedTarget) ||
        normalizedTarget.includes(normalized)
      );
    });

    return partialMatch || null;
  }

  /**
   * Find all subsections within a parent section
   */
  static findSubsections(
    sections: SkillSection[],
    parentSection: SkillSection
  ): SkillSection[] {
    return sections.filter(
      (s) =>
        s.level > parentSection.level &&
        s.startLine > parentSection.startLine &&
        s.startLine < parentSection.endLine
    );
  }

  /**
   * Get content between sections (for insertion)
   */
  static getInsertionPoint(
    content: string,
    section: SkillSection,
    position: 'start' | 'end' = 'end'
  ): number {
    const lines = content.split('\n');

    if (position === 'start') {
      // Insert after section header
      return section.startLine + 1;
    } else {
      // Insert before next section or at end
      return section.endLine;
    }
  }

  /**
   * Extract YAML frontmatter from SKILL.md
   */
  static extractFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    contentWithoutFrontmatter: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {
        frontmatter: {},
        contentWithoutFrontmatter: content,
      };
    }

    try {
      // Simple YAML parsing (basic key: value pairs)
      const frontmatterText = match[1];
      const frontmatter: Record<string, any> = {};

      frontmatterText.split('\n').forEach((line) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          frontmatter[key] = value;
        }
      });

      const contentWithoutFrontmatter = content.slice(match[0].length);

      return { frontmatter, contentWithoutFrontmatter };
    } catch {
      return {
        frontmatter: {},
        contentWithoutFrontmatter: content,
      };
    }
  }

  /**
   * Check if content exists in skill (duplicate detection)
   */
  static checkDuplicateContent(
    skillContent: string,
    newContent: string,
    threshold: number = 0.8
  ): { isDuplicate: boolean; similarity: number; match?: string } {
    // Normalize both strings for comparison
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();

    const normalizedNew = normalize(newContent);
    const normalizedSkill = normalize(skillContent);

    // Check for exact substring match
    if (normalizedSkill.includes(normalizedNew)) {
      return { isDuplicate: true, similarity: 1.0 };
    }

    // Check for high similarity using simple word overlap
    const newWords = new Set(normalizedNew.split(' '));
    const skillWords = normalizedSkill.split(' ');

    let matchCount = 0;
    skillWords.forEach((word) => {
      if (newWords.has(word)) matchCount++;
    });

    const similarity = matchCount / newWords.size;

    return {
      isDuplicate: similarity >= threshold,
      similarity,
    };
  }

  /**
   * Apply template to update content
   */
  static applyTemplate(
    template: string,
    data: Record<string, string>
  ): string {
    let result = template;

    // Replace {placeholder} with data values
    Object.keys(data).forEach((key) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    return result;
  }

  /**
   * Generate changelog entry
   */
  static generateChangelogEntry(
    updateType: string,
    description: string,
    date: string
  ): string {
    const typeEmoji: Record<string, string> = {
      framework: '🎯',
      playbook: '📋',
      example: '💡',
      template: '📝',
      correction: '✏️',
      expansion: '📚',
      'case-study': '📊',
    };

    const emoji = typeEmoji[updateType] || '✨';
    return `- ${emoji} ${description}`;
  }
}
