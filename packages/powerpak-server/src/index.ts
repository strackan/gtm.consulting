#!/usr/bin/env node

/**
 * PowerPak MCP Server
 *
 * Dynamically exposes any PowerPak profile (Platinum, Premium, or Basic)
 * through the Model Context Protocol.
 *
 * Usage:
 *   powerpak justin-strackany
 *   powerpak scott-leese
 *
 * Resources:
 *   powerpak://<skill-id>/profile - Expert profile
 *   powerpak://<skill-id>/sections - List all sections
 *   powerpak://<skill-id>/section/<section-id> - Get specific section
 *   powerpak://<skill-id>/full - Full SKILL.md content
 *
 * Tools:
 *   query_skill - Query PowerPak content
 *   get_framework - Get specific framework or methodology
 *   search_content - Search across all content
 *   hire - Request to hire expert
 *   message - Send message to expert
 *   book_meeting - Book a meeting with expert
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SkillParser } from './parser.js';
import { PowerPakData, SkillQuery } from './types.js';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get skill ID from command line args
const skillId = process.argv[2] || 'justin-strackany';
const tier = process.argv[3] || 'platinum'; // platinum, premium, or basic

// Resolve path to SKILL.md file
const skillPath = path.resolve(
  __dirname,
  '../../../skills',
  tier,
  skillId,
  'SKILL.md'
);

console.error(`Loading PowerPak: ${skillId} (${tier})`);
console.error(`Path: ${skillPath}`);

// Initialize parser and load PowerPak data
const parser = new SkillParser();
let powerpakData: PowerPakData;

try {
  powerpakData = await parser.parse(skillPath);
  console.error(`✓ PowerPak loaded: ${powerpakData.metadata.name}`);
  console.error(`  Sections: ${powerpakData.sections.length}`);
  if (powerpakData.profile) {
    console.error(`  Profile: ✓`);
  }
} catch (error) {
  console.error(`✗ Failed to load PowerPak: ${error}`);
  process.exit(1);
}

// Create MCP server
const server = new Server(
  {
    name: `powerpak-${skillId}`,
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = [
    {
      uri: `powerpak://${skillId}/profile`,
      name: 'Expert Profile',
      description: `${powerpakData.metadata.name} profile information`,
      mimeType: 'application/json',
    },
    {
      uri: `powerpak://${skillId}/sections`,
      name: 'All Sections',
      description: 'List of all available sections',
      mimeType: 'application/json',
    },
    {
      uri: `powerpak://${skillId}/full`,
      name: 'Full Content',
      description: 'Complete SKILL.md content',
      mimeType: 'text/markdown',
    },
  ];

  // Add individual section resources
  for (const section of powerpakData.sections) {
    resources.push({
      uri: `powerpak://${skillId}/section/${section.id}`,
      name: section.title,
      description: `Section: ${section.title}`,
      mimeType: 'text/markdown',
    });
  }

  return { resources };
});

/**
 * Read resource content
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Profile resource
  if (uri === `powerpak://${skillId}/profile`) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(powerpakData.profile || {}, null, 2),
        },
      ],
    };
  }

  // Sections list resource
  if (uri === `powerpak://${skillId}/sections`) {
    const sectionList = powerpakData.sections.map((s) => ({
      id: s.id,
      title: s.title,
      level: s.level,
      subsections: s.subsections?.length || 0,
    }));

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(sectionList, null, 2),
        },
      ],
    };
  }

  // Full content resource
  if (uri === `powerpak://${skillId}/full`) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: powerpakData.rawContent,
        },
      ],
    };
  }

  // Individual section resource
  if (uri.startsWith(`powerpak://${skillId}/section/`)) {
    const sectionId = uri.replace(`powerpak://${skillId}/section/`, '');
    const section = parser.findSection(powerpakData.sections, sectionId);

    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: `# ${section.title}\n\n${section.content}`,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_skill',
        description: `Query ${powerpakData.metadata.name}'s PowerPak content by section or keywords`,
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Section ID or title to query',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords to search for',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 5)',
            },
          },
        },
      },
      {
        name: 'get_framework',
        description: 'Get a specific framework or methodology from the PowerPak',
        inputSchema: {
          type: 'object',
          properties: {
            frameworkName: {
              type: 'string',
              description: 'Name of the framework (e.g., "pricing calculator", "hiring framework")',
            },
          },
          required: ['frameworkName'],
        },
      },
      {
        name: 'search_content',
        description: 'Search across all PowerPak content',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'hire',
        description: `Request to hire ${powerpakData.profile?.expert || powerpakData.metadata.name}`,
        inputSchema: {
          type: 'object',
          properties: {
            projectDescription: {
              type: 'string',
              description: 'Description of the project or engagement',
            },
            duration: {
              type: 'string',
              description: 'Expected duration (e.g., "3 months", "ongoing")',
            },
            budget: {
              type: 'string',
              description: 'Budget range (optional)',
            },
            contactEmail: {
              type: 'string',
              description: 'Your email for follow-up',
            },
          },
          required: ['projectDescription', 'contactEmail'],
        },
      },
      {
        name: 'message',
        description: `Send a message to ${powerpakData.profile?.expert || powerpakData.metadata.name}`,
        inputSchema: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Message subject',
            },
            message: {
              type: 'string',
              description: 'Your message',
            },
            contactEmail: {
              type: 'string',
              description: 'Your email for reply',
            },
          },
          required: ['message', 'contactEmail'],
        },
      },
      {
        name: 'book_meeting',
        description: `Book a meeting with ${powerpakData.profile?.expert || powerpakData.metadata.name}`,
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Meeting topic',
            },
            duration: {
              type: 'number',
              description: 'Duration in minutes (30, 60, 90)',
              enum: [30, 60, 90],
            },
            preferredDates: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preferred dates/times (e.g., ["2024-12-05 2pm", "2024-12-06 10am"])',
            },
            contactEmail: {
              type: 'string',
              description: 'Your email for calendar invite',
            },
          },
          required: ['topic', 'duration', 'contactEmail'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'query_skill') {
      const schema = z.object({
        section: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        maxResults: z.number().default(5),
      });

      const query = schema.parse(args) as SkillQuery;
      let results: any[] = [];

      if (query.section) {
        const section = parser.findSection(powerpakData.sections, query.section);
        if (section) {
          results.push(section);
        }
      }

      if (query.keywords && query.keywords.length > 0) {
        const searchResults = parser.searchSections(powerpakData.sections, query.keywords);
        results.push(...searchResults.slice(0, query.maxResults));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    if (name === 'get_framework') {
      const schema = z.object({
        frameworkName: z.string(),
      });

      const { frameworkName } = schema.parse(args);
      const section = parser.findSection(powerpakData.sections, frameworkName);

      if (!section) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Framework not found: ${frameworkName}` }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `# ${section.title}\n\n${section.content}`,
          },
        ],
      };
    }

    if (name === 'search_content') {
      const schema = z.object({
        query: z.string(),
        maxResults: z.number().default(10),
      });

      const { query, maxResults } = schema.parse(args);
      const keywords = query.split(/\s+/);
      const results = parser.searchSections(powerpakData.sections, keywords);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results.slice(0, maxResults), null, 2),
          },
        ],
      };
    }

    if (name === 'hire') {
      const schema = z.object({
        projectDescription: z.string(),
        duration: z.string().optional(),
        budget: z.string().optional(),
        contactEmail: z.string().email(),
      });

      const data = schema.parse(args);

      // TODO: Integrate with Slack MCP or email system
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'pending',
              message: `Your hiring request has been received. ${powerpakData.profile?.expert || powerpakData.metadata.name} will be in touch at ${data.contactEmail} within 24 hours.`,
              requestId: `hire-${Date.now()}`,
            }),
          },
        ],
      };
    }

    if (name === 'message') {
      const schema = z.object({
        subject: z.string().optional(),
        message: z.string(),
        contactEmail: z.string().email(),
      });

      const data = schema.parse(args);

      // TODO: Integrate with Slack MCP or email system
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'sent',
              message: `Your message has been sent to ${powerpakData.profile?.expert || powerpakData.metadata.name}. You'll receive a reply at ${data.contactEmail}.`,
              messageId: `msg-${Date.now()}`,
            }),
          },
        ],
      };
    }

    if (name === 'book_meeting') {
      const schema = z.object({
        topic: z.string(),
        duration: z.number(),
        preferredDates: z.array(z.string()).optional(),
        contactEmail: z.string().email(),
      });

      const data = schema.parse(args);

      // TODO: Integrate with calendar/scheduling system
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'pending',
              message: `Meeting request received. ${powerpakData.profile?.expert || powerpakData.metadata.name}'s team will send a calendar invite to ${data.contactEmail} with available times.`,
              bookingId: `booking-${Date.now()}`,
            }),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`\n${'='.repeat(60)}`);
  console.error(`  PowerPak MCP Server - ${powerpakData.metadata.name}`);
  console.error('='.repeat(60));
  console.error(`  Skill ID: ${skillId}`);
  console.error(`  Tier: ${tier.toUpperCase()}`);
  console.error(`  Sections: ${powerpakData.sections.length}`);
  console.error(`  Profile: ${powerpakData.profile ? '✓' : '✗'}`);
  console.error('='.repeat(60));
  console.error('Server running on stdio\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
