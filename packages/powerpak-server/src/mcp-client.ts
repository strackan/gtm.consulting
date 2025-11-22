/**
 * MCP Client - Call tools on other MCP servers
 *
 * This client enables PowerPak server to communicate with backend MCP servers
 * (Slack, Filesystem, GitHub) for notifications and workflow automation.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number | string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private buffer = '';

  constructor(
    private config: MCPServerConfig,
    private serverName: string
  ) {
    super();
  }

  /**
   * Start the MCP server process
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        ...this.config.env,
      };

      this.process = spawn(this.config.command, this.config.args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!this.process.stdout || !this.process.stdin) {
        reject(new Error('Failed to create stdio streams'));
        return;
      }

      // Handle stdout data
      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      // Handle stderr (logs)
      this.process.stderr?.on('data', (data) => {
        console.error(`[${this.serverName}] ${data.toString()}`);
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        console.error(`[${this.serverName}] Process exited with code ${code}`);
        this.emit('disconnect');
      });

      // Handle errors
      this.process.on('error', (error) => {
        console.error(`[${this.serverName}] Error:`, error);
        reject(error);
      });

      // Send initialize request
      this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
        clientInfo: {
          name: 'powerpak-server',
          version: '1.0.0',
        },
      })
        .then(() => {
          console.error(`[${this.serverName}] Connected successfully`);
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * Process buffered responses
   */
  private processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response = JSON.parse(line) as MCPResponse;
        this.handleResponse(response);
      } catch (error) {
        console.error(`[${this.serverName}] Failed to parse response:`, line);
      }
    }
  }

  /**
   * Handle MCP response
   */
  private handleResponse(response: MCPResponse) {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Send MCP request
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process?.stdin) {
      throw new Error('MCP server not connected');
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const requestLine = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(requestLine);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName: string, args: any = {}): Promise<any> {
    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any[]> {
    const result = await this.sendRequest('tools/list', {});
    return result.tools || [];
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.pendingRequests.clear();
  }
}
