/**
 * Graph Extractor
 * Extracts entities and relationships from PowerPak SKILL.md files
 */

import { SkillParser } from '../../powerpak-server/src/parser.js';
import type { PowerPakData } from '../../powerpak-server/src/types.js';
import type { GraphEntity, GraphRelation, PowerPakGraphData } from './types.js';

export class GraphExtractor {
  private parser: SkillParser;

  constructor() {
    this.parser = new SkillParser();
  }

  /**
   * Extract knowledge graph data from a PowerPak SKILL.md file
   */
  async extract(skillPath: string): Promise<PowerPakGraphData> {
    const powerpakData = await this.parser.parse(skillPath);

    // Extract expert entity
    const expert = this.extractExpertEntity(powerpakData);

    // Extract framework entities
    const frameworks = this.extractFrameworkEntities(powerpakData);

    // Extract concept entities
    const concepts = this.extractConceptEntities(powerpakData);

    // Extract skill entities
    const skills = this.extractSkillEntities(powerpakData);

    // Create relationships
    const relations = this.createRelations(expert, frameworks, concepts, skills);

    return {
      expert,
      frameworks,
      concepts,
      skills,
      relations,
    };
  }

  /**
   * Extract expert entity from profile
   */
  private extractExpertEntity(data: PowerPakData): GraphEntity {
    const profile = data.profile;
    const metadata = data.metadata;

    const observations: string[] = [];

    if (profile?.bio) {
      observations.push(`Bio: ${profile.bio}`);
    }

    if (profile?.tier) {
      observations.push(`Tier: ${profile.tier}`);
    }

    if (profile?.coreExpertise) {
      observations.push(`Core Expertise: ${profile.coreExpertise.join(', ')}`);
    }

    // Add metadata description
    if (metadata.description) {
      observations.push(`Description: ${metadata.description}`);
    }

    return {
      name: profile?.expert || metadata.name,
      entityType: 'Expert',
      observations,
    };
  }

  /**
   * Extract framework entities from sections
   */
  private extractFrameworkEntities(data: PowerPakData): GraphEntity[] {
    const frameworks: GraphEntity[] = [];
    const frameworkKeywords = [
      'framework',
      'methodology',
      'system',
      'process',
      'model',
      'approach',
      'strategy',
    ];

    for (const section of data.sections) {
      const title = section.title.toLowerCase();

      // Check if section is a framework
      const isFramework = frameworkKeywords.some((keyword) => title.includes(keyword));

      if (isFramework) {
        const observations: string[] = [];

        // Add section content summary (first 300 chars)
        const contentSummary = section.content
          .replace(/\n+/g, ' ')
          .trim()
          .substring(0, 300);
        observations.push(`Description: ${contentSummary}...`);

        // Add subsection titles as observations
        if (section.subsections && section.subsections.length > 0) {
          const subsectionTitles = section.subsections
            .map((s) => s.title)
            .join(', ');
          observations.push(`Components: ${subsectionTitles}`);
        }

        frameworks.push({
          name: section.title,
          entityType: 'Framework',
          observations,
        });
      }

      // Recursively check subsections
      if (section.subsections) {
        for (const subsection of section.subsections) {
          const subTitle = subsection.title.toLowerCase();
          const isSubFramework = frameworkKeywords.some((keyword) =>
            subTitle.includes(keyword)
          );

          if (isSubFramework) {
            const observations: string[] = [];
            const contentSummary = subsection.content
              .replace(/\n+/g, ' ')
              .trim()
              .substring(0, 300);
            observations.push(`Description: ${contentSummary}...`);

            frameworks.push({
              name: subsection.title,
              entityType: 'Framework',
              observations,
            });
          }
        }
      }
    }

    return frameworks;
  }

  /**
   * Extract concept entities from sections
   */
  private extractConceptEntities(data: PowerPakData): GraphEntity[] {
    const concepts: GraphEntity[] = [];
    const conceptKeywords = [
      'concept',
      'principle',
      'rule',
      'guideline',
      'best practice',
      'pattern',
    ];

    for (const section of data.sections) {
      const title = section.title.toLowerCase();

      // Check if section represents a concept
      const isConcept = conceptKeywords.some((keyword) => title.includes(keyword));

      if (isConcept) {
        const observations: string[] = [];
        const contentSummary = section.content
          .replace(/\n+/g, ' ')
          .trim()
          .substring(0, 300);
        observations.push(`Description: ${contentSummary}...`);

        concepts.push({
          name: section.title,
          entityType: 'Concept',
          observations,
        });
      }
    }

    return concepts;
  }

  /**
   * Extract skill entities from core expertise
   */
  private extractSkillEntities(data: PowerPakData): GraphEntity[] {
    const skills: GraphEntity[] = [];

    if (data.profile?.coreExpertise) {
      for (const expertise of data.profile.coreExpertise) {
        // Parse "**Skill Name** - Description" format
        const match = expertise.match(/\*\*(.*?)\*\*(.*)/);

        if (match) {
          const skillName = match[1].trim();
          const description = match[2].trim().replace(/^-\s*/, '');

          skills.push({
            name: skillName,
            entityType: 'Skill',
            observations: [`Description: ${description}`],
          });
        } else {
          // Simple skill without description
          skills.push({
            name: expertise.trim(),
            entityType: 'Skill',
            observations: [],
          });
        }
      }
    }

    return skills;
  }

  /**
   * Create relationships between entities
   */
  private createRelations(
    expert: GraphEntity,
    frameworks: GraphEntity[],
    concepts: GraphEntity[],
    skills: GraphEntity[]
  ): GraphRelation[] {
    const relations: GraphRelation[] = [];

    // Expert -> Skills (HAS_EXPERTISE)
    for (const skill of skills) {
      relations.push({
        from: expert.name,
        to: skill.name,
        relationType: 'HAS_EXPERTISE',
        strength: 1.0,
        confidence: 1.0,
        metadata: {
          source: 'core_expertise',
          tags: ['expertise', 'skill'],
        },
      });
    }

    // Expert -> Frameworks (CREATED/TEACHES)
    for (const framework of frameworks) {
      relations.push({
        from: expert.name,
        to: framework.name,
        relationType: 'TEACHES',
        strength: 0.9,
        confidence: 0.9,
        metadata: {
          source: 'skill_md',
          tags: ['framework', 'teaching'],
        },
      });
    }

    // Expert -> Concepts (BELIEVES_IN)
    for (const concept of concepts) {
      relations.push({
        from: expert.name,
        to: concept.name,
        relationType: 'BELIEVES_IN',
        strength: 0.8,
        confidence: 0.8,
        metadata: {
          source: 'skill_md',
          tags: ['concept', 'philosophy'],
        },
      });
    }

    // Frameworks -> Skills (REQUIRES)
    // Infer skills required by frameworks based on content
    for (const framework of frameworks) {
      for (const skill of skills) {
        // Check if framework mentions the skill
        const frameworkContent = framework.observations.join(' ').toLowerCase();
        const skillName = skill.name.toLowerCase();

        if (frameworkContent.includes(skillName)) {
          relations.push({
            from: framework.name,
            to: skill.name,
            relationType: 'REQUIRES',
            strength: 0.7,
            confidence: 0.7,
            metadata: {
              source: 'content_analysis',
              tags: ['prerequisite'],
            },
          });
        }
      }
    }

    // Frameworks -> Concepts (IMPLEMENTS)
    for (const framework of frameworks) {
      for (const concept of concepts) {
        const frameworkContent = framework.observations.join(' ').toLowerCase();
        const conceptName = concept.name.toLowerCase();

        if (frameworkContent.includes(conceptName)) {
          relations.push({
            from: framework.name,
            to: concept.name,
            relationType: 'IMPLEMENTS',
            strength: 0.8,
            confidence: 0.7,
            metadata: {
              source: 'content_analysis',
              tags: ['implementation'],
            },
          });
        }
      }
    }

    return relations;
  }
}
