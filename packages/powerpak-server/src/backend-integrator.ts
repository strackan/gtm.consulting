/**
 * Backend Integrator
 *
 * Coordinates PowerPak server with backend MCP services:
 * - Slack: Notifications for hire/message/booking requests
 * - Filesystem: Secure file operations and audit trail
 * - GitHub: PR-based skill update workflow
 */

import { MCPClient } from './mcp-client.js';
import fs from 'fs/promises';
import path from 'path';

interface BackendConfig {
  slack?: {
    enabled: boolean;
    notificationChannel: string;
    expertRequestsChannel: string;
  };
  github?: {
    enabled: boolean;
    repository: string;
    prLabels: string[];
  };
  filesystem?: {
    enabled: boolean;
    auditLogPath: string;
  };
}

interface HireRequest {
  expertName: string;
  projectDescription: string;
  duration?: string;
  budget?: string;
  contactEmail: string;
  requestId: string;
}

interface MessageRequest {
  expertName: string;
  subject?: string;
  message: string;
  contactEmail: string;
  messageId: string;
}

interface BookingRequest {
  expertName: string;
  topic: string;
  duration: number;
  preferredDates?: string[];
  contactEmail: string;
  bookingId: string;
}

export class BackendIntegrator {
  private slackClient?: MCPClient;
  private githubClient?: MCPClient;
  private filesystemClient?: MCPClient;
  private config: BackendConfig;

  constructor(config: BackendConfig = {}) {
    this.config = {
      slack: {
        enabled: false,
        notificationChannel: 'powerpak-notifications',
        expertRequestsChannel: 'expert-requests',
        ...config.slack,
      },
      github: {
        enabled: false,
        repository: 'strackan/MCP-World',
        prLabels: ['skill-update'],
        ...config.github,
      },
      filesystem: {
        enabled: false,
        auditLogPath: './.audit',
        ...config.filesystem,
      },
    };
  }

  /**
   * Initialize backend connections
   */
  async initialize(): Promise<void> {
    const { SLACK_BOT_TOKEN, GITHUB_PERSONAL_ACCESS_TOKEN } = process.env;

    // Initialize Slack MCP (if token available)
    if (SLACK_BOT_TOKEN && this.config.slack?.enabled) {
      try {
        this.slackClient = new MCPClient(
          {
            command: 'npx',
            args: ['-y', '@zencoderai/slack-mcp-server'],
            env: {
              SLACK_BOT_TOKEN,
              SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '',
              SLACK_CHANNEL_IDS: [
                this.config.slack.notificationChannel,
                this.config.slack.expertRequestsChannel,
              ].join(','),
            },
          },
          'slack'
        );
        await this.slackClient.connect();
        console.error('✓ Slack MCP connected');
      } catch (error) {
        console.error('✗ Slack MCP failed to connect:', error);
        this.slackClient = undefined;
      }
    }

    // Initialize GitHub MCP (if token available)
    if (GITHUB_PERSONAL_ACCESS_TOKEN && this.config.github?.enabled) {
      try {
        this.githubClient = new MCPClient(
          {
            command: 'docker',
            args: [
              'run',
              '-i',
              '--rm',
              '-e',
              'GITHUB_PERSONAL_ACCESS_TOKEN',
              'ghcr.io/github/github-mcp-server',
            ],
            env: {
              GITHUB_PERSONAL_ACCESS_TOKEN,
              GITHUB_TOOLSETS: 'repos,pull_requests,issues',
            },
          },
          'github'
        );
        await this.githubClient.connect();
        console.error('✓ GitHub MCP connected');
      } catch (error) {
        console.error('✗ GitHub MCP failed to connect:', error);
        this.githubClient = undefined;
      }
    }

    // Filesystem MCP is always available (local operations)
    if (this.config.filesystem?.enabled) {
      try {
        this.filesystemClient = new MCPClient(
          {
            command: 'npx',
            args: [
              '-y',
              '@modelcontextprotocol/server-filesystem',
              process.cwd(),
            ],
          },
          'filesystem'
        );
        await this.filesystemClient.connect();
        console.error('✓ Filesystem MCP connected');
      } catch (error) {
        console.error('✗ Filesystem MCP failed to connect:', error);
        this.filesystemClient = undefined;
      }
    }
  }

  /**
   * Handle hire request
   */
  async handleHireRequest(request: HireRequest): Promise<{
    status: string;
    message: string;
    notificationSent: boolean;
    issuecreated: boolean;
  }> {
    const { expertName, projectDescription, duration, budget, contactEmail, requestId } = request;

    // Log to audit trail
    await this.logAuditEvent('hire', request);

    // Send Slack notification
    let notificationSent = false;
    if (this.slackClient) {
      try {
        const message = `🎯 **New Hire Request for ${expertName}**

**Project:** ${projectDescription}
${duration ? `**Duration:** ${duration}` : ''}
${budget ? `**Budget:** ${budget}` : ''}
**Contact:** ${contactEmail}
**Request ID:** ${requestId}

cc: <@${expertName.toLowerCase().replace(/\s+/g, '')}>`;

        await this.slackClient.callTool('slack_post_message', {
          channel: this.config.slack!.expertRequestsChannel,
          text: message,
        });

        notificationSent = true;
        console.error(`✓ Slack notification sent for hire request ${requestId}`);
      } catch (error) {
        console.error('✗ Failed to send Slack notification:', error);
      }
    }

    // Create GitHub issue for tracking
    let issueCreated = false;
    if (this.githubClient) {
      try {
        await this.githubClient.callTool('create_issue', {
          owner: this.config.github!.repository.split('/')[0],
          repo: this.config.github!.repository.split('/')[1],
          title: `Hire Request: ${expertName} - ${projectDescription.substring(0, 50)}`,
          body: `**Expert:** ${expertName}
**Project:** ${projectDescription}
**Duration:** ${duration || 'Not specified'}
**Budget:** ${budget || 'Not specified'}
**Contact:** ${contactEmail}
**Request ID:** ${requestId}

---
_Auto-generated from PowerPak hire request_`,
          labels: ['hire-request', 'needs-review'],
        });

        issueCreated = true;
        console.error(`✓ GitHub issue created for hire request ${requestId}`);
      } catch (error) {
        console.error('✗ Failed to create GitHub issue:', error);
      }
    }

    return {
      status: 'received',
      message: `Your hiring request has been received. ${expertName} will be in touch at ${contactEmail} within 24 hours.`,
      notificationSent,
      issuecreated: issueCreated,
    };
  }

  /**
   * Handle message request
   */
  async handleMessageRequest(request: MessageRequest): Promise<{
    status: string;
    message: string;
    notificationSent: boolean;
  }> {
    const { expertName, subject, message, contactEmail, messageId } = request;

    // Log to audit trail
    await this.logAuditEvent('message', request);

    // Send Slack notification
    let notificationSent = false;
    if (this.slackClient) {
      try {
        const slackMessage = `💬 **New Message for ${expertName}**

${subject ? `**Subject:** ${subject}\n` : ''}**From:** ${contactEmail}
**Message:**
${message}

**Message ID:** ${messageId}`;

        await this.slackClient.callTool('slack_post_message', {
          channel: this.config.slack!.expertRequestsChannel,
          text: slackMessage,
        });

        notificationSent = true;
        console.error(`✓ Slack notification sent for message ${messageId}`);
      } catch (error) {
        console.error('✗ Failed to send Slack notification:', error);
      }
    }

    return {
      status: 'sent',
      message: `Your message has been sent to ${expertName}. You'll receive a reply at ${contactEmail}.`,
      notificationSent,
    };
  }

  /**
   * Handle booking request
   */
  async handleBookingRequest(request: BookingRequest): Promise<{
    status: string;
    message: string;
    notificationSent: boolean;
  }> {
    const { expertName, topic, duration, preferredDates, contactEmail, bookingId } = request;

    // Log to audit trail
    await this.logAuditEvent('booking', request);

    // Send Slack notification
    let notificationSent = false;
    if (this.slackClient) {
      try {
        const slackMessage = `📅 **New Meeting Request for ${expertName}**

**Topic:** ${topic}
**Duration:** ${duration} minutes
${preferredDates ? `**Preferred Dates:**\n${preferredDates.map((d) => `  • ${d}`).join('\n')}` : ''}
**Contact:** ${contactEmail}
**Booking ID:** ${bookingId}`;

        await this.slackClient.callTool('slack_post_message', {
          channel: this.config.slack!.expertRequestsChannel,
          text: slackMessage,
        });

        notificationSent = true;
        console.error(`✓ Slack notification sent for booking ${bookingId}`);
      } catch (error) {
        console.error('✗ Failed to send Slack notification:', error);
      }
    }

    return {
      status: 'pending',
      message: `Meeting request received. ${expertName}'s team will send a calendar invite to ${contactEmail} with available times.`,
      notificationSent,
    };
  }

  /**
   * Log audit event to filesystem
   */
  private async logAuditEvent(eventType: string, data: any): Promise<void> {
    if (!this.config.filesystem?.enabled) return;

    try {
      const auditLogPath = path.join(
        this.config.filesystem.auditLogPath,
        `${eventType}-${new Date().toISOString().split('T')[0]}.jsonl`
      );

      // Ensure audit directory exists
      await fs.mkdir(path.dirname(auditLogPath), { recursive: true });

      // Append audit log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        data,
      };

      await fs.appendFile(auditLogPath, JSON.stringify(logEntry) + '\n', 'utf-8');
      console.error(`✓ Audit log entry written: ${eventType}`);
    } catch (error) {
      console.error('✗ Failed to write audit log:', error);
    }
  }

  /**
   * Cleanup connections
   */
  async cleanup(): Promise<void> {
    if (this.slackClient) {
      await this.slackClient.disconnect();
    }
    if (this.githubClient) {
      await this.githubClient.disconnect();
    }
    if (this.filesystemClient) {
      await this.filesystemClient.disconnect();
    }
  }
}
