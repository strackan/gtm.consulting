/**
 * SKILL.md Parser
 * Extracts metadata, profile, and sections from PowerPak SKILL.md files
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import {
  PowerPakData,
  PowerPakMetadata,
  PowerPakProfile,
  PowerPakSection,
} from './types.js';

export class SkillParser {
  /**
   * Parse a SKILL.md file and extract all components
   */
  async parse(skillPath: string): Promise<PowerPakData> {
    const content = await fs.readFile(skillPath, 'utf-8');
    const { data, content: markdownContent } = matter(content);

    const metadata = data as PowerPakMetadata;
    const sections = this.extractSections(markdownContent);
    const profile = this.extractProfile(sections);

    return {
      metadata,
      profile,
      sections,
      rawContent: markdownContent,
    };
  }

  /**
   * Extract Profile section
   */
  private extractProfile(sections: PowerPakSection[]): PowerPakProfile | undefined {
    const profileSection = sections.find((s) => s.title.toLowerCase() === 'profile');
    if (!profileSection) return undefined;

    const profile: PowerPakProfile = {};

    // Extract Expert subsection
    const expertSub = profileSection.subsections?.find(
      (s) => s.title.toLowerCase() === 'expert'
    );
    if (expertSub) {
      profile.expert = expertSub.content.trim();
    }

    // Extract Tier subsection
    const tierSub = profileSection.subsections?.find(
      (s) => s.title.toLowerCase() === 'tier'
    );
    if (tierSub) {
      profile.tier = tierSub.content.trim();
    }

    // Extract Bio subsection
    const bioSub = profileSection.subsections?.find((s) => s.title.toLowerCase() === 'bio');
    if (bioSub) {
      profile.bio = bioSub.content.trim();
    }

    // Extract Core Expertise subsection
    const expertiseSub = profileSection.subsections?.find(
      (s) => s.title.toLowerCase() === 'core expertise'
    );
    if (expertiseSub) {
      // Parse bullet points
      const lines = expertiseSub.content.split('\n');
      profile.coreExpertise = lines
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.trim().substring(1).trim());
    }

    // Extract Photo subsection
    const photoSub = profileSection.subsections?.find(
      (s) => s.title.toLowerCase() === 'photo'
    );
    if (photoSub) {
      // Extract image URL from markdown syntax
      const match = photoSub.content.match(/!\[.*?\]\((.*?)\)/);
      if (match) {
        profile.photo = match[1];
      }
    }

    // Extract Links subsection
    const linksSub = profileSection.subsections?.find(
      (s) => s.title.toLowerCase() === 'links'
    );
    if (linksSub) {
      // Parse markdown links
      const lines = linksSub.content.split('\n');
      profile.links = lines
        .filter((line) => line.includes('[') && line.includes(']('))
        .map((line) => {
          const match = line.match(/\[(.*?)\]\((.*?)\)/);
          if (match) {
            return { label: match[1], url: match[2] };
          }
          return null;
        })
        .filter((link): link is { label: string; url: string } => link !== null);
    }

    return profile;
  }

  /**
   * Extract all sections from markdown content
   */
  private extractSections(content: string): PowerPakSection[] {
    const lines = content.split('\n');
    const sections: PowerPakSection[] = [];
    let currentSection: PowerPakSection | null = null;
    let currentContent: string[] = [];
    const sectionStack: PowerPakSection[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
        }

        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        const newSection: PowerPakSection = {
          id: this.generateSectionId(title),
          title,
          level,
          content: '',
          subsections: [],
        };

        // Determine where to attach this section
        if (level === 2) {
          // Top-level section
          sections.push(newSection);
          sectionStack.length = 0;
          sectionStack.push(newSection);
        } else {
          // Find parent section
          while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
            sectionStack.pop();
          }

          if (sectionStack.length > 0) {
            const parent = sectionStack[sectionStack.length - 1];
            parent.subsections = parent.subsections || [];
            parent.subsections.push(newSection);
          } else {
            sections.push(newSection);
          }

          sectionStack.push(newSection);
        }

        currentSection = newSection;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Generate a URL-safe section ID from title
   */
  private generateSectionId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Find a section by ID or title
   */
  findSection(sections: PowerPakSection[], query: string): PowerPakSection | null {
    const normalizedQuery = query.toLowerCase();

    for (const section of sections) {
      if (
        section.id === normalizedQuery ||
        section.title.toLowerCase() === normalizedQuery
      ) {
        return section;
      }

      if (section.subsections) {
        const found = this.findSection(section.subsections, query);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Search sections by keywords
   */
  searchSections(sections: PowerPakSection[], keywords: string[]): PowerPakSection[] {
    const results: PowerPakSection[] = [];
    const normalizedKeywords = keywords.map((k) => k.toLowerCase());

    const searchRecursive = (sections: PowerPakSection[]) => {
      for (const section of sections) {
        const searchText = `${section.title} ${section.content}`.toLowerCase();
        const matches = normalizedKeywords.some((keyword) => searchText.includes(keyword));

        if (matches) {
          results.push(section);
        }

        if (section.subsections) {
          searchRecursive(section.subsections);
        }
      }
    };

    searchRecursive(sections);
    return results;
  }
}
