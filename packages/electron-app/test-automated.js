/**
 * PowerPak Desktop - Automated Test Suite
 *
 * Tests infrastructure, configuration, and build process
 * Run with: node test-automated.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  test(name, fn, optional = false) {
    this.tests.push({ name, fn, optional });
  }

  async run() {
    this.log('\n═══════════════════════════════════════════════════════', 'cyan');
    this.log('  PowerPak Desktop - Automated Test Suite', 'cyan');
    this.log('═══════════════════════════════════════════════════════\n', 'cyan');

    for (const { name, fn, optional } of this.tests) {
      try {
        this.log(`\n▶ ${name}`, 'blue');
        await fn();
        this.log(`  ✓ PASS`, 'green');
        this.passed++;
      } catch (error) {
        if (optional) {
          this.log(`  ⚠ WARN: ${error.message}`, 'yellow');
          this.warnings++;
        } else {
          this.log(`  ✗ FAIL: ${error.message}`, 'red');
          this.failed++;
        }
      }
    }

    this.printSummary();
  }

  printSummary() {
    this.log('\n═══════════════════════════════════════════════════════', 'cyan');
    this.log('  Test Summary', 'cyan');
    this.log('═══════════════════════════════════════════════════════\n', 'cyan');

    this.log(`  Passed:   ${this.passed}`, 'green');
    if (this.warnings > 0) this.log(`  Warnings: ${this.warnings}`, 'yellow');
    if (this.failed > 0) this.log(`  Failed:   ${this.failed}`, 'red');

    this.log(`\n  Total:    ${this.tests.length} tests\n`);

    if (this.failed === 0) {
      this.log('✓ All critical tests passed!', 'green');
      if (this.warnings > 0) {
        this.log('⚠ Some optional features have warnings (non-critical)\n', 'yellow');
      }
      process.exit(0);
    } else {
      this.log('✗ Some tests failed - see details above\n', 'red');
      process.exit(1);
    }
  }

  fileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  dirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
  }

  jsonValid(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
  }

  exec(command, options = {}) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        ...options
      });
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }
}

// Create test runner
const runner = new TestRunner();

// ============================================================================
// File Structure Tests
// ============================================================================

runner.test('Electron app package.json exists', () => {
  runner.fileExists(path.join(__dirname, 'package.json'));
  runner.jsonValid(path.join(__dirname, 'package.json'));
});

runner.test('Electron app tsconfig.json exists', () => {
  runner.fileExists(path.join(__dirname, 'tsconfig.json'));
  runner.jsonValid(path.join(__dirname, 'tsconfig.json'));
});

runner.test('Main process TypeScript file exists', () => {
  runner.fileExists(path.join(__dirname, 'src', 'main.ts'));
});

runner.test('Preload script TypeScript file exists', () => {
  runner.fileExists(path.join(__dirname, 'src', 'preload.ts'));
});

runner.test('IPC handlers TypeScript file exists', () => {
  runner.fileExists(path.join(__dirname, 'src', 'ipc-handlers.ts'));
});

runner.test('README documentation exists', () => {
  runner.fileExists(path.join(__dirname, 'README.md'));
});

runner.test('Assets directory exists', () => {
  runner.dirExists(path.join(__dirname, 'assets'));
});

// ============================================================================
// Better Chatbot Tests
// ============================================================================

runner.test('Better Chatbot submodule exists', () => {
  const bcPath = path.join(__dirname, '..', 'better-chatbot');
  runner.dirExists(bcPath);
});

runner.test('Better Chatbot package.json exists', () => {
  const pkgPath = path.join(__dirname, '..', 'better-chatbot', 'package.json');
  runner.fileExists(pkgPath);
  runner.jsonValid(pkgPath);
});

runner.test('Better Chatbot .env file exists', () => {
  const envPath = path.join(__dirname, '..', 'better-chatbot', '.env');
  runner.fileExists(envPath);
});

runner.test('Better Chatbot .mcp-config.json exists', () => {
  const mcpConfigPath = path.join(__dirname, '..', 'better-chatbot', '.mcp-config.json');
  runner.fileExists(mcpConfigPath);
  runner.jsonValid(mcpConfigPath);
});

runner.test('MCP config includes PowerPak servers', () => {
  const mcpConfigPath = path.join(__dirname, '..', 'better-chatbot', '.mcp-config.json');
  const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

  if (!config['justin-strackany']) {
    throw new Error('justin-strackany MCP server not configured');
  }
  if (!config['scott-leese']) {
    throw new Error('scott-leese MCP server not configured');
  }
  if (!config['memento-powerpak']) {
    throw new Error('memento-powerpak MCP server not configured');
  }
});

runner.test('Better Chatbot .env has FILE_BASED_MCP_CONFIG=true', () => {
  const envPath = path.join(__dirname, '..', 'better-chatbot', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  if (!envContent.includes('FILE_BASED_MCP_CONFIG=true')) {
    throw new Error('FILE_BASED_MCP_CONFIG not set to true in .env');
  }
});

// ============================================================================
// PowerPak Server Tests
// ============================================================================

runner.test('PowerPak server package exists', () => {
  const serverPath = path.join(__dirname, '..', 'powerpak-server');
  runner.dirExists(serverPath);
});

runner.test('PowerPak server is built', () => {
  const distPath = path.join(__dirname, '..', 'powerpak-server', 'dist');
  runner.dirExists(distPath);

  const indexPath = path.join(distPath, 'index.js');
  runner.fileExists(indexPath);
});

runner.test('Justin Strackany SKILL.md exists', () => {
  const skillPath = path.join(__dirname, '..', '..', 'skills', 'platinum', 'justin-strackany', 'SKILL.md');
  runner.fileExists(skillPath);
});

runner.test('Scott Leese SKILL.md exists', () => {
  const skillPath = path.join(__dirname, '..', '..', 'skills', 'platinum', 'scott-leese', 'SKILL.md');
  runner.fileExists(skillPath);
});

// ============================================================================
// Dependency Tests
// ============================================================================

runner.test('node_modules exists (workspace or local)', () => {
  // Check local node_modules or workspace root
  const localNm = path.join(__dirname, 'node_modules');
  const rootNm = path.join(__dirname, '..', '..', 'node_modules');

  if (!fs.existsSync(localNm) && !fs.existsSync(rootNm)) {
    throw new Error('No node_modules found (local or workspace root)');
  }
});

runner.test('electron dependency installed', () => {
  // Check both local and workspace root
  const localPath = path.join(__dirname, 'node_modules', 'electron');
  const rootPath = path.join(__dirname, '..', '..', 'node_modules', 'electron');

  if (!fs.existsSync(localPath) && !fs.existsSync(rootPath)) {
    throw new Error('electron not found in node_modules (local or workspace root)');
  }
});

runner.test('electron-store dependency installed', () => {
  const localPath = path.join(__dirname, 'node_modules', 'electron-store');
  const rootPath = path.join(__dirname, '..', '..', 'node_modules', 'electron-store');

  if (!fs.existsSync(localPath) && !fs.existsSync(rootPath)) {
    throw new Error('electron-store not found in node_modules (local or workspace root)');
  }
});

runner.test('neo4j-driver dependency installed', () => {
  const localPath = path.join(__dirname, 'node_modules', 'neo4j-driver');
  const rootPath = path.join(__dirname, '..', '..', 'node_modules', 'neo4j-driver');

  if (!fs.existsSync(localPath) && !fs.existsSync(rootPath)) {
    throw new Error('neo4j-driver not found in node_modules (local or workspace root)');
  }
});

runner.test('TypeScript dependency installed', () => {
  const localPath = path.join(__dirname, 'node_modules', 'typescript');
  const rootPath = path.join(__dirname, '..', '..', 'node_modules', 'typescript');

  if (!fs.existsSync(localPath) && !fs.existsSync(rootPath)) {
    throw new Error('typescript not found in node_modules (local or workspace root)');
  }
});

// ============================================================================
// Build Tests
// ============================================================================

runner.test('TypeScript compiles successfully', () => {
  const output = runner.exec('npm run build', { cwd: __dirname });
  // If we get here, build succeeded
});

runner.test('Compiled JavaScript files exist', () => {
  const distPath = path.join(__dirname, 'dist');
  runner.dirExists(distPath);

  runner.fileExists(path.join(distPath, 'main.js'));
  runner.fileExists(path.join(distPath, 'preload.js'));
  runner.fileExists(path.join(distPath, 'ipc-handlers.js'));
});

// ============================================================================
// Configuration Validation Tests
// ============================================================================

runner.test('package.json has correct main entry', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  if (pkg.main !== './dist/main.js') {
    throw new Error(`Incorrect main entry: ${pkg.main} (expected ./dist/main.js)`);
  }
});

runner.test('package.json has required scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  const requiredScripts = ['build', 'dev', 'start'];
  for (const script of requiredScripts) {
    if (!pkg.scripts[script]) {
      throw new Error(`Missing required script: ${script}`);
    }
  }
});

runner.test('tsconfig.json has correct output directory', () => {
  const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8'));

  if (tsconfig.compilerOptions.outDir !== './dist') {
    throw new Error(`Incorrect outDir: ${tsconfig.compilerOptions.outDir}`);
  }
});

// ============================================================================
// Optional Tests (Warnings Only)
// ============================================================================

runner.test('Better Chatbot node_modules exists', () => {
  const nmPath = path.join(__dirname, '..', 'better-chatbot', 'node_modules');
  runner.dirExists(nmPath);
}, true);

runner.test('API key configured in .env', () => {
  const envPath = path.join(__dirname, '..', 'better-chatbot', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const hasAnthropicKey = envContent.match(/ANTHROPIC_API_KEY=.+/) && !envContent.includes('ANTHROPIC_API_KEY=#');
  const hasOpenAIKey = envContent.match(/OPENAI_API_KEY=.+/) && !envContent.includes('OPENAI_API_KEY=#');
  const hasGoogleKey = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=.+/) && !envContent.includes('GOOGLE_GENERATIVE_AI_API_KEY=#');

  if (!hasAnthropicKey && !hasOpenAIKey && !hasGoogleKey) {
    throw new Error('No LLM provider API key found in .env (required for chat functionality)');
  }
}, true);

runner.test('Neo4j is running', () => {
  try {
    // Try to connect to Neo4j HTTP interface
    const https = require('http');
    const options = {
      hostname: 'localhost',
      port: 7474,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    // This is a synchronous check, we'll just try to see if the port is open
    const { execSync } = require('child_process');
    const result = execSync('netstat -an | findstr ":7474"', { encoding: 'utf8' }).trim();

    if (!result) {
      throw new Error('Neo4j not running on port 7474 (start with: docker-compose up -d)');
    }
  } catch (error) {
    throw new Error('Neo4j not running on port 7474 (start with: docker-compose up -d)');
  }
}, true);

runner.test('Icon assets exist', () => {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png');

  if (!fs.existsSync(iconPath)) {
    throw new Error('icon.png not found (see assets/README.md for requirements)');
  }

  if (!fs.existsSync(trayIconPath)) {
    throw new Error('tray-icon.png not found (see assets/README.md for requirements)');
  }
}, true);

// ============================================================================
// Run Tests
// ============================================================================

runner.run().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
