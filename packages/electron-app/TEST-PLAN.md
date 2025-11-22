# PowerPak Desktop - Manual Test Plan

**Version**: 1.0
**Date**: November 22, 2025
**Tester**: _____________
**Environment**: Windows / macOS / Linux (circle one)

---

## Pre-Test Setup

Before running these tests, complete the following setup steps:

### 1. Install Better Chatbot Dependencies

```bash
cd C:\Users\strac\dev\MCP-World\packages\better-chatbot
pnpm install
```

**Expected**: Dependencies install successfully (may take 2-5 minutes)
**Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### 2. Configure API Key

Edit `C:\Users\strac\dev\MCP-World\packages\better-chatbot\.env` and add your API key:

```bash
# Add one of these (at minimum):
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
# OR
GOOGLE_GENERATIVE_AI_API_KEY=...
```

**Expected**: At least one API key configured
**Result**: ☐ PASS ☐ FAIL ☐ SKIP (no API key available)
**Notes**: _______________________________________________________________

### 3. Start Neo4j (Optional but Recommended)

```bash
cd C:\Users\strac\dev\MCP-World
docker-compose up -d
```

**Expected**: Neo4j starts on ports 7474 (HTTP) and 7687 (Bolt)
**Result**: ☐ PASS ☐ FAIL ☐ SKIP (Docker not available)
**Notes**: _______________________________________________________________

### 4. Load Knowledge Graph Data (Optional)

```bash
cd C:\Users\strac\dev\MCP-World\packages\knowledge-graph
npm run load
```

**Expected**: Graph entities loaded into Neo4j
**Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j not running)
**Notes**: _______________________________________________________________

---

## Test Suite 1: Application Launch

### Test 1.1: Electron App Starts

**Steps**:
1. Open terminal/command prompt
2. Navigate to: `cd C:\Users\strac\dev\MCP-World\packages\electron-app`
3. Run: `npm run dev`
4. Wait 30-60 seconds for Next.js server to start

**Expected Results**:
- ☐ Terminal shows "Starting Next.js server..."
- ☐ Terminal shows "[Next.js] Ready" or "started server"
- ☐ Electron window appears within 60 seconds
- ☐ Window title says "PowerPak Desktop"
- ☐ No error dialogs appear

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________
_______________________________________________________________

### Test 1.2: System Tray Icon Appears

**Steps**:
1. After app launches, look at system tray (Windows: taskbar notification area, macOS: menu bar)
2. Look for PowerPak tray icon

**Expected Results**:
- ☐ Tray icon is visible
- ☐ Hovering shows tooltip: "PowerPak Desktop"

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 1.3: Better Chatbot UI Loads

**Steps**:
1. Look at the Electron window content
2. Wait for UI to fully load

**Expected Results**:
- ☐ Better Chatbot UI appears (not blank white page)
- ☐ Chat input field is visible
- ☐ No "Connection Refused" or error messages
- ☐ UI is responsive (can click buttons)

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________
_______________________________________________________________

---

## Test Suite 2: System Tray Functionality

### Test 2.1: Tray Context Menu Opens

**Steps**:
1. Right-click the tray icon (Windows) or click the tray icon (macOS)

**Expected Results**:
- ☐ Context menu appears
- ☐ Menu shows "PowerPak Desktop" at the top (disabled/grayed out)
- ☐ Menu shows "Show Window" option
- ☐ Menu shows "PowerPak Profiles" submenu
- ☐ Menu shows "Knowledge Graph" checkbox
- ☐ Menu shows "Settings" submenu
- ☐ Menu shows "Neo4j Browser" option
- ☐ Menu shows "Quit PowerPak" option

**Actual Result**: ☐ PASS ☐ FAIL
**Screenshot**: ☐ Attached
**Notes**: _______________________________________________________________

### Test 2.2: PowerPak Profiles Submenu

**Steps**:
1. Open tray context menu
2. Hover over "PowerPak Profiles"

**Expected Results**:
- ☐ Submenu opens
- ☐ Shows "Justin Strackany" with checkbox (checked by default)
- ☐ Shows "Scott Leese" with checkbox (checked by default)

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 2.3: Toggle PowerPak Profile

**Steps**:
1. Open tray menu > PowerPak Profiles
2. Click "Justin Strackany" to uncheck it
3. Close menu and reopen
4. Check if Justin Strackany is still unchecked

**Expected Results**:
- ☐ Checkbox toggles when clicked
- ☐ Setting persists when menu is reopened
- ☐ No errors appear

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 2.4: Settings Submenu

**Steps**:
1. Open tray menu
2. Hover over "Settings"

**Expected Results**:
- ☐ Submenu opens
- ☐ Shows "Minimize to Tray" (checked by default)
- ☐ Shows "Start Minimized" (unchecked by default)
- ☐ Shows "Launch at Startup" (unchecked by default)

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 2.5: Neo4j Browser Launcher

**Steps**:
1. Open tray menu
2. Click "Neo4j Browser"

**Expected Results**:
- ☐ Default browser opens
- ☐ Navigates to http://localhost:7474
- ☐ Neo4j Browser UI loads (if Neo4j is running)
  OR ☐ Connection error (if Neo4j not running - this is OK)

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j not running)
**Notes**: _______________________________________________________________

### Test 2.6: Quit from Tray

**Steps**:
1. Open tray menu
2. Click "Quit PowerPak"

**Expected Results**:
- ☐ Application exits completely
- ☐ Tray icon disappears
- ☐ Electron window closes
- ☐ Terminal shows cleanup messages
- ☐ Next.js server stops

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

**Action**: Re-launch the app with `npm run dev` before continuing

---

## Test Suite 3: Window Management

### Test 3.1: Minimize to Tray

**Steps**:
1. Ensure "Minimize to Tray" is enabled in Settings
2. Click the window close button (X)

**Expected Results**:
- ☐ Window disappears (hides)
- ☐ App does NOT quit (tray icon still visible)
- ☐ Notification appears: "PowerPak is still running in the background..."
  (only on first time)

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 3.2: Restore from Tray

**Steps**:
1. After minimizing to tray, click tray icon (macOS) or
2. Right-click tray icon > "Show Window" (Windows)

**Expected Results**:
- ☐ Window reappears
- ☐ Window is in same state (chat history preserved)
- ☐ Window comes to foreground

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 3.3: Window Bounds Persistence

**Steps**:
1. Resize the PowerPak window (make it smaller/larger)
2. Move the window to a different position on screen
3. Note the size and position
4. Quit the app completely (tray > Quit)
5. Restart the app: `npm run dev`
6. Wait for window to appear

**Expected Results**:
- ☐ Window appears at same position as before quit
- ☐ Window has same size as before quit
- ☐ Settings are remembered

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 3.4: Disable Minimize to Tray

**Steps**:
1. Open tray menu > Settings
2. Uncheck "Minimize to Tray"
3. Click window close button (X)

**Expected Results**:
- ☐ Application quits completely (doesn't hide to tray)
- ☐ Tray icon disappears
- ☐ Process terminates

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

**Action**: Re-launch the app before continuing

---

## Test Suite 4: MCP Server Integration

**Note**: This suite requires an API key configured in .env

### Test 4.1: Check MCP Servers in UI

**Steps**:
1. In Better Chatbot UI, look for MCP server indicators
2. Check settings/configuration panel (if available in UI)
3. OR type `@` in the chat input to see available tools/MCPs

**Expected Results**:
- ☐ MCP servers are loaded (look for justin-strackany, scott-leese, memento-powerpak)
- ☐ OR typing `@` shows MCP tools/suggestions
- ☐ No error messages about MCP connection failures

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Notes**: _______________________________________________________________
_______________________________________________________________

### Test 4.2: Query Justin Strackany Expert

**Steps**:
1. In chat input, type: "Ask @justin-strackany about customer onboarding best practices"
2. Send the message
3. Wait for response

**Expected Results**:
- ☐ System recognizes @justin-strackany mention
- ☐ Calls ask_expert tool on justin-strackany MCP server
- ☐ Response includes Justin's expertise on customer onboarding
- ☐ Response references frameworks/templates from SKILL.md
- ☐ No errors about tool failures

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Response Summary**: _______________________________________________________________
_______________________________________________________________
_______________________________________________________________

### Test 4.3: Query Scott Leese Expert

**Steps**:
1. In chat input, type: "Ask @scott-leese how to build a high-performing sales team"
2. Send the message
3. Wait for response

**Expected Results**:
- ☐ System recognizes @scott-leese mention
- ☐ Calls ask_expert tool on scott-leese MCP server
- ☐ Response includes Scott's expertise on sales leadership
- ☐ Response references his experience and frameworks
- ☐ No errors about tool failures

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Response Summary**: _______________________________________________________________
_______________________________________________________________
_______________________________________________________________

### Test 4.4: Multi-Expert Query

**Steps**:
1. Type: "I need advice from both @justin-strackany and @scott-leese on launching a new product"
2. Send the message
3. Wait for response

**Expected Results**:
- ☐ System recognizes both expert mentions
- ☐ Queries both MCP servers
- ☐ Response combines insights from both experts
- ☐ Response coherently integrates sales and customer success perspectives

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Response Summary**: _______________________________________________________________
_______________________________________________________________
_______________________________________________________________

### Test 4.5: Toggle MCP Server Off and On

**Steps**:
1. Open tray menu > PowerPak Profiles
2. Uncheck "Justin Strackany"
3. In chat, try querying: "Ask @justin-strackany about revenue operations"
4. Observe the response
5. Re-enable "Justin Strackany" in tray menu
6. Try the same query again

**Expected Results**:
- ☐ When disabled: Query fails or says expert unavailable
- ☐ When re-enabled: Query works again
- ☐ No need to restart app for toggle to take effect

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Notes**: _______________________________________________________________

---

## Test Suite 5: Knowledge Graph Integration

**Note**: Requires Neo4j running and graph data loaded

### Test 5.1: Neo4j Browser Access

**Steps**:
1. Open tray menu > "Neo4j Browser"
2. In Neo4j Browser (browser window), connect with:
   - Connect URL: bolt://localhost:7687
   - Username: neo4j
   - Password: powerpak_password

**Expected Results**:
- ☐ Neo4j Browser UI loads
- ☐ Connection succeeds
- ☐ Database is accessible

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j not running)
**Notes**: _______________________________________________________________

### Test 5.2: Query Knowledge Graph

**Steps**:
1. In chat, type: "Search the knowledge graph for frameworks taught by Justin Strackany"
2. Send message
3. Wait for response

**Expected Results**:
- ☐ Memento MCP server is called (check for @memento-powerpak in response)
- ☐ Response includes frameworks from the graph
- ☐ Results reference actual content from SKILL.md
- ☐ Confidence scores or relevance mentioned

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j/API key not configured)
**Response Summary**: _______________________________________________________________
_______________________________________________________________

### Test 5.3: Semantic Search

**Steps**:
1. In chat, type: "What does the knowledge graph know about customer retention?"
2. Send message
3. Wait for response

**Expected Results**:
- ☐ Semantic search executed against knowledge graph
- ☐ Results include related entities (Experts, Frameworks, Concepts)
- ☐ Relationships shown (e.g., "Justin teaches X, which requires Y")

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j/API key not configured)
**Response Summary**: _______________________________________________________________
_______________________________________________________________

### Test 5.4: Visualize Graph in Neo4j Browser

**Steps**:
1. In Neo4j Browser, run Cypher query:
   ```cypher
   MATCH (e:Expert)-[r]->(n)
   WHERE e.name = 'Justin Strackany'
   RETURN e, r, n
   LIMIT 25
   ```

**Expected Results**:
- ☐ Query executes successfully
- ☐ Graph visualization appears
- ☐ Shows Expert node connected to Skills, Frameworks, Concepts
- ☐ Relationships labeled (HAS_EXPERTISE, TEACHES, etc.)

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (Neo4j not running)
**Screenshot**: ☐ Attached
**Notes**: _______________________________________________________________

---

## Test Suite 6: Notifications

### Test 6.1: Welcome Notification

**Steps**:
1. Quit the app completely
2. Restart: `npm run dev`
3. Watch for notification when app starts

**Expected Results**:
- ☐ Notification appears: "PowerPak Desktop Started"
- ☐ Body text: "Your AI-powered knowledge assistant is ready!"
- ☐ Notification is native OS notification (not in-app)

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

### Test 6.2: Minimize to Tray Notification

**Steps**:
1. Quit the app and restart (to reset "hasMinimizedBefore" flag)
2. Close the window (minimize to tray)
3. Watch for notification

**Expected Results**:
- ☐ Notification appears: "PowerPak Desktop"
- ☐ Body text: "PowerPak is still running in the background..."
- ☐ Notification only shows ONCE (first time minimizing)
- ☐ Subsequent minimizes don't show notification

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

---

## Test Suite 7: Settings Persistence

### Test 7.1: Settings Survive Restart

**Steps**:
1. Configure custom settings:
   - Tray menu > Settings > Uncheck "Minimize to Tray"
   - Tray menu > PowerPak Profiles > Uncheck "Scott Leese"
   - Resize window to a specific size
2. Quit the app completely
3. Restart the app
4. Check if settings are remembered

**Expected Results**:
- ☐ "Minimize to Tray" is still unchecked
- ☐ "Scott Leese" is still unchecked
- ☐ Window size is preserved
- ☐ All settings persist across restarts

**Actual Result**: ☐ PASS ☐ FAIL
**Notes**: _______________________________________________________________

---

## Test Suite 8: Error Handling

### Test 8.1: Handle Missing Neo4j

**Steps**:
1. Stop Neo4j: `docker-compose down` (if running)
2. In chat, try to query the knowledge graph
3. Observe behavior

**Expected Results**:
- ☐ App doesn't crash
- ☐ Error message is user-friendly (not raw stack trace)
- ☐ Other features still work (expert queries)

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP
**Error Message**: _______________________________________________________________

### Test 8.2: Handle Missing API Key

**Steps**:
1. Remove API key from .env (comment it out)
2. Restart the app
3. Try to send a chat message

**Expected Results**:
- ☐ App doesn't crash
- ☐ Error message indicates API key is missing
- ☐ Error is shown in chat UI (not native error dialog)

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP
**Error Message**: _______________________________________________________________

### Test 8.3: Handle Better Chatbot Server Failure

**Steps**:
1. While app is running, stop the Next.js server (Ctrl+C in separate terminal if running separately)
2. Try to interact with the window

**Expected Results**:
- ☐ Window shows connection error
- ☐ App doesn't crash completely
- ☐ Tray menu still works

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP
**Notes**: _______________________________________________________________

---

## Test Suite 9: Performance

### Test 9.1: Startup Time

**Steps**:
1. Quit the app
2. Start a timer
3. Run: `npm run dev`
4. Stop timer when window is fully loaded and interactive

**Expected Results**:
- ☐ App starts in under 90 seconds
- ☐ No hangs or freezes during startup

**Actual Result**: ☐ PASS ☐ FAIL
**Startup Time**: ________ seconds
**Notes**: _______________________________________________________________

### Test 9.2: Response Time

**Steps**:
1. Send a simple query: "Ask @justin-strackany to introduce himself"
2. Measure time from send to first response token

**Expected Results**:
- ☐ First token arrives in under 5 seconds
- ☐ Full response completes in under 30 seconds
- ☐ UI remains responsive during generation

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP (API key not configured)
**Time to First Token**: ________ seconds
**Total Time**: ________ seconds

### Test 9.3: Memory Usage

**Steps**:
1. Open Task Manager (Windows) or Activity Monitor (macOS)
2. Find "PowerPak Desktop" or "electron" process
3. Note memory usage after 5 minutes of idle

**Expected Results**:
- ☐ Memory usage under 500MB when idle
- ☐ No continuous memory growth (memory leaks)

**Actual Result**: ☐ PASS ☐ FAIL
**Memory Usage**: ________ MB
**Notes**: _______________________________________________________________

---

## Test Suite 10: Cross-Feature Integration

### Test 10.1: End-to-End Workflow

**Steps**:
1. Start app from system tray
2. Query Justin about customer success: "What are Justin's top 3 customer success frameworks?"
3. Minimize to tray
4. Wait 10 seconds
5. Restore from tray
6. Verify chat history is preserved
7. Query knowledge graph: "Show me all frameworks in the knowledge graph"
8. Open Neo4j Browser from tray
9. Verify graph data matches chat response

**Expected Results**:
- ☐ All steps work without errors
- ☐ Chat history persists when minimized
- ☐ Knowledge graph results match Neo4j data
- ☐ Seamless integration between all features

**Actual Result**: ☐ PASS ☐ FAIL ☐ SKIP
**Notes**: _______________________________________________________________
_______________________________________________________________
_______________________________________________________________

---

## Summary

### Test Results

| Test Suite | Passed | Failed | Skipped | Notes |
|-----------|--------|--------|---------|-------|
| 1. Application Launch | __/3 | __/3 | __/3 | |
| 2. System Tray | __/6 | __/6 | __/6 | |
| 3. Window Management | __/4 | __/4 | __/4 | |
| 4. MCP Integration | __/5 | __/5 | __/5 | |
| 5. Knowledge Graph | __/4 | __/4 | __/4 | |
| 6. Notifications | __/2 | __/2 | __/2 | |
| 7. Settings | __/1 | __/1 | __/1 | |
| 8. Error Handling | __/3 | __/3 | __/3 | |
| 9. Performance | __/3 | __/3 | __/3 | |
| 10. Integration | __/1 | __/1 | __/1 | |
| **TOTAL** | **__/32** | **__/32** | **__/32** | |

### Critical Issues Found

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Non-Critical Issues

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Recommendations

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Overall Assessment

☐ **READY FOR DEMO** - All critical features working
☐ **NEEDS MINOR FIXES** - Minor issues, demo possible with workarounds
☐ **NEEDS MAJOR FIXES** - Critical features broken, not ready for demo
☐ **BLOCKED** - Cannot test due to environment issues

### Tester Signature

**Name**: _____________________________
**Date**: _____________________________
**Time Spent**: ________ hours

---

## Appendix: Quick Reference

### Useful Commands

```bash
# Start Electron app
cd C:\Users\strac\dev\MCP-World\packages\electron-app
npm run dev

# Start Neo4j
cd C:\Users\strac\dev\MCP-World
docker-compose up -d

# Load knowledge graph
cd C:\Users\strac\dev\MCP-World\packages\knowledge-graph
npm run load

# Run automated tests
cd C:\Users\strac\dev\MCP-World\packages\electron-app
node test-automated.js

# Check Neo4j status
docker ps | grep neo4j
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "ERR_CONNECTION_REFUSED" | Better Chatbot not started - wait 60s or check terminal |
| No tray icon | Check system tray settings (might be hidden) |
| MCP servers not loading | Verify .mcp-config.json and PowerPak servers are built |
| Neo4j connection failed | Run `docker-compose up -d` from project root |
| No response from experts | Check API key in .env file |
| Window won't restore | Click tray icon or right-click > Show Window |

### File Locations

- **Electron App**: `C:\Users\strac\dev\MCP-World\packages\electron-app`
- **Better Chatbot**: `C:\Users\strac\dev\MCP-World\packages\better-chatbot`
- **Configuration**: `C:\Users\strac\dev\MCP-World\packages\better-chatbot\.env`
- **MCP Config**: `C:\Users\strac\dev\MCP-World\packages\better-chatbot\.mcp-config.json`
- **Settings Storage**: `C:\Users\strac\AppData\Roaming\electron-app` (Windows)

---

**End of Test Plan**
