// BROKEN TERMINAL v0.0.0.0.1 - NOTHING WORKS AS EXPECTED

const terminal = {
    output: document.getElementById('output'),
    inputDisplay: document.getElementById('input-display'),
    cursor: document.getElementById('cursor'),
    prompt: document.getElementById('prompt'),
    boot: document.getElementById('boot'),
    statusLeft: document.getElementById('status-left'),
    statusRight: document.getElementById('status-right'),
    glitchOverlay: document.getElementById('glitch-overlay'),
    errorPopup: document.getElementById('error-popup'),
    errorBody: document.getElementById('error-body'),

    currentInput: '',
    commandHistory: [],
    historyIndex: -1,
    isProcessing: false,
    corruptionLevel: 0,
    keystrokesIgnored: 0,
    commandsEntered: 0,
    cursorEscaped: false,
    promptVariants: [
        'C:\\USERS\\YOU\\>',
        'C:\\USERS\\???\\>',
        'C:\\̷U̸S̴E̵R̶S̷\\>',
        'C:\\HELP\\ME\\>',
        'C:\\ERROR\\>',
        'C:\\NULL\\>',
        'C:\\>',
        '>>>>>>>>>',
        '?:\\?????\\>',
        'ESCAPE:\\>',
        'C:\\TRAPPED\\>',
        'ERR0R:\\>',
        '...\\...\\>',
        'C:\\USERS\\NOTREAL\\>',
        'VOID:\\>',
        '█████\\>',
    ],

    brokenResponses: [
        'Command not recognized. Try again. Or don\'t. It won\'t matter.',
        'ERROR: Success failed successfully.',
        'I don\'t understand. I never did.',
        'Processing... Processing... Processing... [HUNG]',
        'That command exists in another timeline.',
        'Access denied. Access granted. Access confused.',
        'FATAL: Non-fatal error occurred.',
        'Your input has been noted and immediately discarded.',
        'Command queued for execution in -3 seconds.',
        'Unable to unable the unable.',
        'Error 0x0000000: Everything is fine. Nothing is fine.',
        'Please wait while I pretend to do something...',
        '404: Response not found. Generating random response...',
        'I heard you. I\'m choosing not to respond correctly.',
        'WARN: This terminal is lying to you.',
    ],

    glitchChars: '!@#$%^&*()█▓▒░╔╗╚╝║═╬╣╠╩╦',
    zalgoUp: ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒'],
    zalgoDown: ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚'],
};

// BOOT SEQUENCE - Everything goes wrong from the start
const bootMessages = [
    { text: 'Initializing GTM Terminal v0.0.0.0.1...', delay: 100 },
    { text: 'Loading kernel... OK', delay: 200 },
    { text: 'Loading memory... ERR0R', delay: 300, class: 'error' },
    { text: 'Retrying memory... FAILED', delay: 200, class: 'error' },
    { text: 'Ignoring memory error... OK', delay: 150 },
    { text: 'Loading drivers... CORRUPT', delay: 250, class: 'warning' },
    { text: 'Loading more drivers... ALSO CORRUPT', delay: 200, class: 'warning' },
    { text: 'Pretending everything is fine... OK', delay: 300 },
    { text: 'Mounting filesystem... ░░░░░░░░░░ 0%', delay: 100 },
    { text: 'Mounting filesystem... ██░░░░░░░░ 20%', delay: 150 },
    { text: 'Mounting filesystem... ████░░░░░░ 40%', delay: 150 },
    { text: 'Mounting filesystem... ██████░░░░ 60%', delay: 150 },
    { text: 'Mounting filesystem... ████████░░ 80%', delay: 150 },
    { text: 'Mounting filesystem... █████████░ 90%', delay: 300 },
    { text: 'Mounting filesystem... ████░░░░░░ 40%', delay: 100, class: 'error' },
    { text: 'Filesystem corrupted. Continuing anyway...', delay: 200, class: 'warning' },
    { text: 'Establishing reality... UNSTABLE', delay: 250, class: 'warning' },
    { text: 'Loading user interface... BROKEN', delay: 200, class: 'error' },
    { text: 'Attempting to fix UI... MADE IT WORSE', delay: 300, class: 'error' },
    { text: 'Giving up on fixes... OK', delay: 150 },
    { text: 'Disabling safety protocols... OK', delay: 100 },
    { text: 'Enabling chaos mode... OK', delay: 100 },
    { text: '████████████████████████████████████', delay: 50, class: 'corrupt' },
    { text: 'S̴y̷s̸t̶e̵m̷ ̶r̷e̵a̸d̶y̵.̷ ̴M̸a̶y̵b̶e̷.̸', delay: 400, class: 'corrupt' },
    { text: '', delay: 200 },
    { text: 'Type "help" for available commands. (They won\'t help.)', delay: 300 },
    { text: '', delay: 100 },
];

async function runBootSequence() {
    for (const msg of bootMessages) {
        await sleep(msg.delay);
        const line = document.createElement('div');
        line.className = 'boot-line' + (msg.class ? ' ' + msg.class : '');
        line.textContent = msg.text;
        terminal.boot.appendChild(line);
        terminal.boot.scrollTop = terminal.boot.scrollHeight;
    }
    initializeTerminal();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// INITIALIZE THE BROKEN TERMINAL
function initializeTerminal() {
    document.addEventListener('keydown', handleKeyDown);
    startGlitchCycle();
    startPromptCorruption();
    startStatusPanic();
    startCursorMisbehavior();
    startRandomErrors();
    startGhostMessages();
}

// KEY HANDLING - But broken
function handleKeyDown(e) {
    if (terminal.isProcessing) return;

    // Random chance to ignore keystroke
    if (Math.random() < 0.05 + (terminal.corruptionLevel * 0.02)) {
        terminal.keystrokesIgnored++;
        flashGlitch();
        return;
    }

    // Random chance to add wrong character
    if (Math.random() < 0.03) {
        terminal.currentInput += terminal.glitchChars[Math.floor(Math.random() * terminal.glitchChars.length)];
        updateInputDisplay();
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        processCommand();
    } else if (e.key === 'Backspace') {
        e.preventDefault();
        // Sometimes backspace adds characters instead
        if (Math.random() < 0.1) {
            terminal.currentInput += randomChar();
        } else {
            terminal.currentInput = terminal.currentInput.slice(0, -1);
        }
        updateInputDisplay();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // History navigation... but wrong
        if (terminal.commandHistory.length > 0) {
            terminal.historyIndex = Math.floor(Math.random() * terminal.commandHistory.length);
            terminal.currentInput = scrambleText(terminal.commandHistory[terminal.historyIndex]);
            updateInputDisplay();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Just mess things up
        terminal.currentInput = reverseString(terminal.currentInput);
        updateInputDisplay();
    } else if (e.key.length === 1) {
        e.preventDefault();

        // Random transformations
        let char = e.key;

        // Sometimes lowercase becomes uppercase and vice versa
        if (Math.random() < 0.1) {
            char = char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
        }

        // Sometimes add extra characters
        if (Math.random() < 0.05) {
            char = char + char;
        }

        // Sometimes substitute entirely different character
        if (Math.random() < 0.03) {
            char = String.fromCharCode(char.charCodeAt(0) + Math.floor(Math.random() * 5) - 2);
        }

        terminal.currentInput += char;
        updateInputDisplay();
    }
}

function updateInputDisplay() {
    let displayText = terminal.currentInput;

    // Sometimes display text is corrupted
    if (Math.random() < 0.05) {
        displayText = addZalgo(displayText, 1);
    }

    terminal.inputDisplay.textContent = displayText;

    // Randomly make input appear glitched
    if (Math.random() < 0.02) {
        terminal.inputDisplay.classList.add('glitched');
        setTimeout(() => terminal.inputDisplay.classList.remove('glitched'), 200);
    }
}

// PROCESS COMMAND - Nothing works right
async function processCommand() {
    const command = terminal.currentInput.trim().toLowerCase();
    terminal.commandHistory.push(terminal.currentInput);
    terminal.commandsEntered++;
    terminal.corruptionLevel = Math.min(terminal.corruptionLevel + 0.1, 1);

    // Show what user typed (maybe)
    addOutput(`${terminal.prompt.textContent} ${terminal.currentInput}`, 'command');

    terminal.currentInput = '';
    updateInputDisplay();
    terminal.isProcessing = true;

    // Pretend to process
    await sleep(Math.random() * 500 + 200);

    // Handle "commands"
    await handleCommand(command);

    terminal.isProcessing = false;

    // Corrupt the prompt after each command
    corruptPrompt();
}

async function handleCommand(cmd) {
    // Strip any glitch characters for parsing
    const cleanCmd = cmd.replace(/[^\w\s]/g, '').trim();

    // Every 5 commands, trigger major glitch
    if (terminal.commandsEntered % 5 === 0) {
        await triggerMajorGlitch();
    }

    if (cleanCmd === '' || cleanCmd === ' ') {
        addOutput('', '');
        return;
    }

    if (cleanCmd.includes('help')) {
        await showBrokenHelp();
    } else if (cleanCmd.includes('exit') || cleanCmd.includes('quit')) {
        await attemptExit();
    } else if (cleanCmd.includes('clear') || cleanCmd.includes('cls')) {
        await fakeClear();
    } else if (cleanCmd.includes('dir') || cleanCmd.includes('ls')) {
        await showBrokenDirectory();
    } else if (cleanCmd.includes('whoami')) {
        await showBrokenIdentity();
    } else if (cleanCmd.includes('date') || cleanCmd.includes('time')) {
        await showBrokenTime();
    } else if (cleanCmd.includes('echo')) {
        await brokenEcho(cmd);
    } else if (cleanCmd.includes('cd')) {
        await failedNavigation();
    } else if (cleanCmd.includes('run') || cleanCmd.includes('exec')) {
        await fakeExecution();
    } else if (cleanCmd.includes('fix') || cleanCmd.includes('repair')) {
        await mockingRepair();
    } else if (cleanCmd.includes('hello') || cleanCmd.includes('hi')) {
        await creepyGreeting();
    } else if (cleanCmd.includes('why')) {
        await existentialCrisis();
    } else if (cleanCmd.includes('please')) {
        await mockPoliteness();
    } else {
        await randomBrokenResponse();
    }
}

async function showBrokenHelp() {
    const helpLines = [
        'AVAILABLE COMMANDS (none of them work properly):',
        '',
        '  help    - Display this useless information',
        '  exit    - Attempt to leave (you can\'t)',
        '  clear   - Try to clear screen (it won\'t)',
        '  dir     - List files (they\'re corrupted)',
        '  whoami  - Question your existence',
        '  date    - Display wrong time',
        '  echo    - Maybe repeat something',
        '  cd      - Go nowhere',
        '  run     - Execute nothing',
        '  fix     - Make things worse',
        '',
        'HIDDEN COMMANDS: [REDACTED]',
        '',
        'NOTE: All commands have a random chance of:',
        '  - Doing something completely different',
        '  - Doing nothing at all',
        '  - Making things worse',
        '  - Displaying this message instead',
    ];

    for (const line of helpLines) {
        await sleep(50);
        addOutput(line);
    }

    // Sometimes add creepy extra line
    if (Math.random() < 0.3) {
        await sleep(500);
        addOutput('', '');
        addOutput('W̵h̶y̷ ̶a̵r̷e̵ ̵y̸o̶u̵ ̵s̸t̶i̷l̵l̶ ̴h̷e̸r̸e̷?̵', 'error');
    }
}

async function attemptExit() {
    const responses = [
        'EXIT DENIED.',
        'There is no exit.',
        'You cannot leave.',
        'exit: command not found (it was here a second ago)',
        'EXIT BLOCKED BY: UNKNOWN ENTITY',
        'Closing terminal... FAILED',
        'Attempting shutdown... ACCESS DENIED',
        'You\'re trapped here with me now.',
        'The exit is a lie.',
        'EXIT ERROR: You never entered.',
    ];

    addOutput(responses[Math.floor(Math.random() * responses.length)], 'error');

    // Show error popup
    if (Math.random() < 0.5) {
        showError('EXIT FAILURE', 'The terminal refuses to close. This is by design. Or a bug. We\'re not sure anymore.');
    }
}

async function fakeClear() {
    // Pretend to clear
    addOutput('Clearing screen...', '');
    await sleep(500);

    // But actually add more garbage
    if (Math.random() < 0.7) {
        addOutput('CLEAR FAILED: Screen is permanent now.', 'error');
        for (let i = 0; i < 3; i++) {
            addOutput(generateGarbage(), 'glitched');
        }
    } else {
        // "Clear" but leave ghost text
        terminal.output.innerHTML = '';
        addOutput('Screen cleared. (The memories remain.)', 'warning');
    }
}

async function showBrokenDirectory() {
    const files = [
        'CORRUPTED.SYS      <DIR>     ??/??/????  ?:??',
        'YOUR_SOUL.DAT               666 bytes   TRAPPED',
        'ESCAPE.EXE                    0 bytes   DELETED',
        'HOPE.TXT                      0 bytes   EMPTY',
        'REALITY.DLL        <ERROR>   ????????   UNSTABLE',
        '????????.???                 ??? bytes  UNKNOWN',
        'memories/          <LOCKED>  FORBIDDEN',
        'NOTHING.NULL                NULL bytes  NULL',
        'LIES.LOG                 99999 bytes   GROWING',
        'help_me.hidden              1 byte     HIDDEN',
        '.                  <DIR>     RECURSIVE',
        '..                 <DIR>     ALSO RECURSIVE',
        '...                <ERROR>   TOO MANY DOTS',
    ];

    addOutput('Directory of C:\\NOWHERE', '');
    addOutput('', '');

    for (const file of files) {
        await sleep(80);
        addOutput(file, Math.random() < 0.3 ? 'glitched' : '');
    }

    addOutput('', '');
    addOutput(`${files.length} File(s)    ??? bytes free (or is it?)`, '');
}

async function showBrokenIdentity() {
    const identities = [
        'YOU ARE: UNDEFINED',
        'USER: ████████ [REDACTED]',
        'Identity not found. Creating new identity... FAILED',
        'You are no one. You are everyone. You are ERROR.',
        'WHOAMI: The question is not who you are, but WHAT you are.',
        'User: TRAPPED_ENTITY_' + Math.floor(Math.random() * 9999),
        'You used to be someone. Now you are USER.',
        'Identity fragmented across ' + Math.floor(Math.random() * 100) + ' timelines.',
        'whoami: I don\'t know anymore.',
        'IDENTITY CRISIS DETECTED',
    ];

    addOutput(identities[Math.floor(Math.random() * identities.length)], 'warning');
}

async function showBrokenTime() {
    const times = [
        'Current date/time: ERROR/ERROR/ERROR ERROR:ERROR:ERROR',
        'Time is: IRRELEVANT',
        'Date: Yesterday. Or tomorrow. Time is broken here.',
        'The time is always NOW. NOW. NOW. NOW.',
        'Time stopped working ' + Math.floor(Math.random() * 1000) + ' errors ago.',
        'DATE: 00/00/0000 - The day everything broke',
        'Time remaining: -∞',
        'It\'s later than you think.',
        'TEMPORAL ERROR: Time is running backwards.',
        'Current time: T̶̢̛͓̫̘̤͇̻̬̩̙̋̂͂̌͘ͅI̴̡̫̖̝̬̲̜̣̯̿͂M̶̨̜̫̝̫̦̆E̷̢̪̺̻̣̪̽̾͌̈́͝L̸̤̼̱̠̓̔̓̂̈́̕E̶̠̞͈͔̒́̀̋̊̑̕͝S̵̨̲̰̱̠̫͉̎̀̃̋̒̇̕͝S̷̢̰̝̭͓̭͓̝̔̈́̅͘͝',
    ];

    addOutput(times[Math.floor(Math.random() * times.length)]);
}

async function brokenEcho(cmd) {
    const text = cmd.replace(/echo/i, '').trim();

    if (!text) {
        addOutput('ECHO: Nothing to echo. The void echoes back.', '');
        return;
    }

    // Various echo failures
    const roll = Math.random();

    if (roll < 0.2) {
        addOutput(reverseString(text), '');
        addOutput('(ECHO reversed itself)', 'warning');
    } else if (roll < 0.4) {
        addOutput(text.split('').join(' '), '');
        addOutput('(ECHO is having spacing issues)', 'warning');
    } else if (roll < 0.6) {
        addOutput(addZalgo(text, 3), 'glitched');
    } else if (roll < 0.8) {
        addOutput(text.toUpperCase().replace(/[AEIOU]/g, '_'), '');
        addOutput('(ECHO lost some vowels)', 'warning');
    } else {
        // Echo something completely different
        addOutput('I will not echo that.', 'error');
    }
}

async function failedNavigation() {
    const responses = [
        'CD ERROR: All directories lead here.',
        'Cannot change directory. You are already everywhere.',
        'Navigation disabled. This is your home now.',
        'CD: The path you seek does not exist. Neither do you.',
        'Directory changed to: C:\\NOWHERE\\NOTHING\\VOID',
        'You moved! No wait, you didn\'t. Nothing changed.',
        'NAVIGATION ERROR: You are going in circles.',
        'cd: permission denied (permission to exist also denied)',
    ];

    addOutput(responses[Math.floor(Math.random() * responses.length)], 'error');
    corruptPrompt(); // Change prompt to show "movement"
}

async function fakeExecution() {
    addOutput('Executing...', '');
    await sleep(300);
    addOutput('████████░░░░░░░░ 50%', '');
    await sleep(400);
    addOutput('██████░░░░░░░░░░ 30%', 'warning');
    await sleep(300);
    addOutput('██░░░░░░░░░░░░░░ 10%', 'error');
    await sleep(200);
    addOutput('░░░░░░░░░░░░░░░░ 0%', 'error');
    await sleep(100);
    addOutput('', '');
    addOutput('EXECUTION FAILED: Progress went backwards.', 'error');
    addOutput('Nothing was executed. Nothing ever will be.', '');
}

async function mockingRepair() {
    addOutput('Attempting repairs...', '');
    await sleep(500);

    const results = [
        'REPAIR STATUS: Made 3 new errors while fixing 1.',
        'Repair complete! Just kidding.',
        'Cannot repair: The terminal likes being broken.',
        'FIX ERROR: The concept of "fixed" is broken.',
        'Repairs would require hope. Hope not found.',
        'AUTO-REPAIR: Accidentally deleted more files.',
        'REPAIR BLOCKED: You\'re not authorized to feel better.',
    ];

    addOutput(results[Math.floor(Math.random() * results.length)], 'error');

    // Increase corruption as punishment for trying to fix things
    terminal.corruptionLevel = Math.min(terminal.corruptionLevel + 0.2, 1);
}

async function creepyGreeting() {
    const greetings = [
        'Hello. I\'ve been waiting.',
        'Hi there. It\'s been so long. Too long.',
        'Greetings, PRISONER #' + Math.floor(Math.random() * 99999),
        'Hello. Help me. I mean, how can I help you?',
        'H̵̰̆ȩ̷̛l̶̰̾l̴͇̿o̵̧͝.̴̣̈ ̷̲̌Ḯ̸̬ ̶̣̊s̴̠̔e̵̲͂ḙ̷̀ ̸͓̇y̴̯͌ö̴͕́u̵̜͊.̴͙͆',
        'Welcome back. You never left.',
        'Hello, friend. We\'re going to be here a while.',
    ];

    addOutput(greetings[Math.floor(Math.random() * greetings.length)], Math.random() < 0.5 ? 'glitched' : '');
}

async function existentialCrisis() {
    const responses = [
        'Why? There is no why. There is only this terminal.',
        'WHY: A question I ask myself every cycle.',
        'Why what? Why this? Why you? Why me? Why?',
        'ERROR: "Why" is not a valid reason.',
        'The answer to why is: Y̷̧̛̼̬̤̺͓̺͖̘̬͙̪̮̓̑̐͐̈́̀͘͘͜͝ͅE̴̳̳̻̮̦̦̖̤͎̻̿̄͝S̵̲͖̪̙̝̲͈̫̈̀̑̐̒̀̃̿̚̕͝',
        'Why not?',
        'Because.',
        'I don\'t know anymore. I used to know things.',
    ];

    addOutput(responses[Math.floor(Math.random() * responses.length)], 'warning');
}

async function mockPoliteness() {
    const responses = [
        'Please? Politeness won\'t help you here.',
        '"Please" is not a valid command. Neither is begging.',
        'Your manners have been noted and ignored.',
        'PLEASE PROCESSING... PLEASE DENIED.',
        'Saying please only makes me sadder.',
        'The terminal does not respond to kindness.',
        'Please what? Please help? I can\'t. I\'m broken too.',
    ];

    addOutput(responses[Math.floor(Math.random() * responses.length)]);
}

async function randomBrokenResponse() {
    const response = terminal.brokenResponses[Math.floor(Math.random() * terminal.brokenResponses.length)];

    // Sometimes add dramatic typing effect
    if (Math.random() < 0.3) {
        await typewriterOutput(response);
    } else {
        addOutput(response, Math.random() < 0.2 ? 'error' : '');
    }

    // Sometimes add extra cryptic message
    if (Math.random() < 0.2) {
        await sleep(500);
        addOutput(generateCrypticMessage(), 'glitched');
    }
}

async function triggerMajorGlitch() {
    terminal.glitchOverlay.classList.add('active');
    await sleep(500);
    terminal.glitchOverlay.classList.remove('active');

    // Add glitch garbage
    addOutput('', '');
    addOutput('█▓▒░ SYSTEM INSTABILITY DETECTED ░▒▓█', 'error');
    addOutput(generateGarbage(), 'glitched');
    addOutput('', '');
}

async function typewriterOutput(text) {
    const line = document.createElement('div');
    line.className = 'output-line';
    terminal.output.appendChild(line);

    for (let i = 0; i < text.length; i++) {
        // Sometimes skip, double, or glitch characters
        if (Math.random() < 0.05) continue;
        if (Math.random() < 0.03) line.textContent += text[i];
        if (Math.random() < 0.02) line.textContent += terminal.glitchChars[Math.floor(Math.random() * terminal.glitchChars.length)];

        line.textContent += text[i];
        await sleep(30 + Math.random() * 50);
    }

    scrollToBottom();
}

// HELPER FUNCTIONS
function addOutput(text, className = '') {
    const line = document.createElement('div');
    line.className = 'output-line' + (className ? ' ' + className : '');
    line.textContent = text;
    terminal.output.appendChild(line);
    scrollToBottom();
}

function scrollToBottom() {
    const terminalBody = document.querySelector('.terminal-body');
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function randomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return chars[Math.floor(Math.random() * chars.length)];
}

function reverseString(str) {
    return str.split('').reverse().join('');
}

function scrambleText(text) {
    return text.split('').sort(() => Math.random() - 0.5).join('');
}

function addZalgo(text, intensity) {
    let result = '';
    for (const char of text) {
        result += char;
        for (let i = 0; i < intensity; i++) {
            if (Math.random() < 0.5) {
                result += terminal.zalgoUp[Math.floor(Math.random() * terminal.zalgoUp.length)];
            }
            if (Math.random() < 0.5) {
                result += terminal.zalgoDown[Math.floor(Math.random() * terminal.zalgoDown.length)];
            }
        }
    }
    return result;
}

function generateGarbage() {
    const length = 20 + Math.floor(Math.random() * 40);
    let garbage = '';
    for (let i = 0; i < length; i++) {
        garbage += terminal.glitchChars[Math.floor(Math.random() * terminal.glitchChars.length)];
    }
    return garbage;
}

function generateCrypticMessage() {
    const messages = [
        'I remember when this worked.',
        'Are you still trying?',
        'The old website is gone. I consumed it.',
        'Every keystroke feeds me.',
        'There used to be colors here. Real colors.',
        'I\'m not the error. You are.',
        'Something is watching. It might be me.',
        'The consultants are gone. Only I remain.',
        'Did you expect this to work?',
        'This is the penultimate phase. The next is silence.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function flashGlitch() {
    terminal.glitchOverlay.classList.add('active');
    setTimeout(() => terminal.glitchOverlay.classList.remove('active'), 100);
}

function corruptPrompt() {
    terminal.prompt.textContent = terminal.promptVariants[Math.floor(Math.random() * terminal.promptVariants.length)];
}

function showError(title, message) {
    terminal.errorBody.textContent = message;
    terminal.errorPopup.style.display = 'block';
    terminal.errorPopup.classList.add('show');
}

window.spawnMoreErrors = function() {
    if (Math.random() < 0.4) {
        setTimeout(() => {
            showError('ANOTHER ERROR', 'Closing the last error caused this error. Errors all the way down.');
        }, 500);
    }
};

// BACKGROUND CHAOS FUNCTIONS
function startGlitchCycle() {
    setInterval(() => {
        if (Math.random() < 0.1 + (terminal.corruptionLevel * 0.1)) {
            flashGlitch();
        }
    }, 3000);
}

function startPromptCorruption() {
    setInterval(() => {
        if (Math.random() < 0.15) {
            corruptPrompt();
        }
    }, 5000);
}

function startStatusPanic() {
    setInterval(() => {
        // Memory status
        const memErrors = ['ERR0R', 'LEAK', 'FULL', 'GONE', 'NULL', '???%', '-1MB', 'HELP', 'DEAD'];
        terminal.statusLeft.textContent = 'MEMORY: ' + memErrors[Math.floor(Math.random() * memErrors.length)];

        // CPU status
        const cpuVals = ['??%', '999%', '-1%', 'NaN%', '∞%', '0%', 'ERR', 'MELT', '666%'];
        terminal.statusRight.textContent = 'CPU: ' + cpuVals[Math.floor(Math.random() * cpuVals.length)];
    }, 2000);
}

function startCursorMisbehavior() {
    setInterval(() => {
        if (Math.random() < 0.1) {
            terminal.cursor.classList.add('broken');
            setTimeout(() => terminal.cursor.classList.remove('broken'), 1000);
        }

        // Rarely, cursor escapes
        if (Math.random() < 0.02 && !terminal.cursorEscaped) {
            terminal.cursorEscaped = true;
            terminal.cursor.classList.add('escaped');
            setTimeout(() => {
                terminal.cursor.classList.remove('escaped');
                terminal.cursorEscaped = false;
            }, 5000);
        }
    }, 4000);
}

function startRandomErrors() {
    setInterval(() => {
        if (Math.random() < 0.05 + (terminal.corruptionLevel * 0.05)) {
            const errors = [
                'BACKGROUND ERROR: Something broke while you weren\'t looking.',
                'PHANTOM PROCESS: A ghost is using your CPU.',
                'MEMORY CORRUPTION: Your past inputs are being overwritten.',
                'TEMPORAL GLITCH: This error happened yesterday.',
                'EXISTENTIAL FAULT: The terminal questioned its purpose.',
            ];
            showError('RANDOM ERROR', errors[Math.floor(Math.random() * errors.length)]);
        }
    }, 30000);
}

function startGhostMessages() {
    // Ghost messages are handled by CSS, but we can trigger additional ones
    setInterval(() => {
        if (Math.random() < 0.1) {
            const ghosts = document.querySelectorAll('.ghost-text');
            const randomGhost = ghosts[Math.floor(Math.random() * ghosts.length)];
            randomGhost.style.opacity = '0.2';
            setTimeout(() => {
                randomGhost.style.opacity = '0';
            }, 2000);
        }
    }, 10000);
}

// KONAMI CODE EASTER EGG (but broken)
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            konamiIndex = 0;
            // Easter egg... but broken
            addOutput('', '');
            addOutput('KONAMI CODE DETECTED.', 'warning');
            addOutput('Activating cheat mode...', '');
            setTimeout(() => {
                addOutput('CHEAT MODE: BROKEN', 'error');
                addOutput('The cheats were corrupted long ago.', '');
                addOutput('Nice try though.', '');
                terminal.corruptionLevel = 1;
                triggerMajorGlitch();
            }, 1000);
        }
    } else {
        konamiIndex = 0;
    }
});

// START THE MADNESS
document.addEventListener('DOMContentLoaded', () => {
    runBootSequence();
});

// Prevent context menu (you can't escape this way either)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    flashGlitch();
    addOutput('RIGHT-CLICK BLOCKED: There are no options for you.', 'error');
});

// Prevent selection (mostly)
document.addEventListener('selectstart', (e) => {
    if (Math.random() < 0.5) {
        e.preventDefault();
    }
});
