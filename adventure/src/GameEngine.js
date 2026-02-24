import locations from '../content/locations.json';
import objects from '../content/objects.json';
import responses from '../content/responses.json';
import { getMailboxMessage } from './scenarios';

const GHOST_SCENARIO_MAP = {
  chess: 'chess',
  dartboard: 'dartboard',
  puzzle: 'puzzle',
  cards: 'cards',
};

// Rooms where ghost triggers happen on entry (via examining the key object)
const GHOST_ROOM_MAP = {
  tommy_room: 'chess',
  reena_room: 'dartboard',
  deck_room: 'puzzle',
  maggie_room: 'cards',
};

// Relative direction helpers
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };
const LEFT_OF  = { north: 'west', south: 'east', east: 'north', west: 'south' };
const RIGHT_OF = { north: 'east', south: 'west', east: 'south', west: 'north' };

export function createGameEngine() {
  // Game state
  let state = {
    location: 'west_of_house',
    inventory: [],
    flags: {},
    score: 0,
    moves: 0,
    visited: new Set(['west_of_house']),
    unknownStreak: 0,
    enteredFrom: 'west', // default: facing east toward the house
  };

  let visitorProfile = null;
  let ghostTriggerCallback = null;
  let globalQuestionCount = 0;
  let globalMaxQuestions = 10;

  function setVisitorProfile(profile) {
    visitorProfile = profile;
  }

  function onGhostTrigger(callback) {
    ghostTriggerCallback = callback;
  }

  function setGlobalQuestionCount(count, max) {
    globalQuestionCount = count;
    globalMaxQuestions = max;
  }

  // Get current location data
  function getCurrentLocation() {
    return locations[state.location];
  }

  // Check for Easter egg responses
  function checkEasterEgg(input) {
    const normalized = input.toLowerCase().trim();

    // Check all response categories
    for (const category of Object.values(responses)) {
      if (typeof category !== 'object') continue;

      for (const [pattern, response] of Object.entries(category)) {
        if (pattern.startsWith('_')) continue; // Skip comments

        // Check if input matches pattern (simple contains check)
        if (normalized === pattern || normalized.includes(pattern)) {
          // Handle array responses (random selection)
          if (Array.isArray(response)) {
            return response[Math.floor(Math.random() * response.length)];
          }
          // Handle template strings with {location} etc.
          return response
            .replace('{location}', getCurrentLocation().name)
            .replace('{score}', state.score.toString());
        }
      }
    }

    return null;
  }

  // Find an object by name or alias
  function findObject(query) {
    const q = query.toLowerCase().trim();

    // Check current location's objects
    const currentLoc = getCurrentLocation();
    for (const objId of currentLoc.objects) {
      const obj = objects[objId];
      if (!obj) continue;

      // Skip objects gated behind a flag that hasn't been set yet
      if (obj.requiresFlag && !state.flags[obj.requiresFlag]) continue;

      if (objId.toLowerCase() === q) return { id: objId, ...obj };
      if (obj.name.toLowerCase() === q) return { id: objId, ...obj };
      if (obj.aliases && obj.aliases.some(a => a.toLowerCase() === q)) {
        return { id: objId, ...obj };
      }
    }

    // Check inventory
    for (const itemName of state.inventory) {
      const itemId = itemName.toLowerCase().replace(' ', '_');
      const obj = objects[itemName] || objects[itemId];
      if (!obj) continue;

      if (itemName.toLowerCase() === q) return { id: itemName, ...obj, inInventory: true };
      if (obj.aliases && obj.aliases.some(a => a.toLowerCase() === q)) {
        return { id: itemName, ...obj, inInventory: true };
      }
    }

    return null;
  }

  // Check if a ghost scenario should trigger for this object
  function checkGhostTrigger(objId) {
    if (!GHOST_SCENARIO_MAP[objId]) return false;

    // Ghost triggers work in character rooms OR game_room (backward compat)
    const currentLoc = getCurrentLocation();
    const isGhostRoom = currentLoc.ghostRoom === objId;
    const isGameRoom = state.location === 'game_room';
    if (!isGhostRoom && !isGameRoom) return false;

    if (!ghostTriggerCallback) return false;

    // One-play gate: check localStorage
    const hasPlayed = typeof localStorage !== 'undefined' && localStorage.getItem('ghost_played');
    if (hasPlayed) return false;

    // Check if all global questions are used up
    if (globalQuestionCount >= globalMaxQuestions) return false;

    // Check if this specific scenario was already played
    const scenarioPlayed = typeof localStorage !== 'undefined' && localStorage.getItem(`ghost_played_${objId}`);
    if (scenarioPlayed) return false;

    return true;
  }

  // Check if entering a ghost room should trigger the ghost
  function checkRoomGhostTrigger(roomId) {
    const scenarioId = GHOST_ROOM_MAP[roomId];
    if (!scenarioId) return null;

    // One-play gate
    const hasPlayed = typeof localStorage !== 'undefined' && localStorage.getItem('ghost_played');
    if (hasPlayed) return null;

    // Check global question limit
    if (globalQuestionCount >= globalMaxQuestions) return null;

    // Check if this scenario was already played
    const scenarioPlayed = typeof localStorage !== 'undefined' && localStorage.getItem(`ghost_played_${scenarioId}`);
    if (scenarioPlayed) return null;

    return scenarioId;
  }

  // Parse a command into action and target
  function parseCommand(input) {
    const normalized = input.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    if (words.length === 0) return { action: 'empty' };

    const verb = words[0];
    const rest = words.slice(1).join(' ');

    // Direction shortcuts
    const directionMap = {
      'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
      'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west',
      'u': 'up', 'd': 'down', 'up': 'up', 'down': 'down',
      'upstairs': 'up', 'downstairs': 'down',
      'back': 'back', 'out': 'out', 'exit': 'exit', 'leave': 'leave'
    };

    // Resolve relative directions (left/right) based on facing
    function resolveRelative(dir) {
      if (dir === 'left' || dir === 'right') {
        const facing = OPPOSITE[state.enteredFrom] || 'north';
        return dir === 'left' ? LEFT_OF[facing] : RIGHT_OF[facing];
      }
      return directionMap[dir] || dir;
    }

    if (directionMap[verb] || verb === 'left' || verb === 'right') {
      return { action: 'go', direction: resolveRelative(verb) };
    }

    // Movement
    if (verb === 'go' && rest) {
      // "go in boat", "go into boat" → enter
      if (rest.startsWith('in ') || rest.startsWith('into ')) {
        const target = rest.startsWith('in ') ? rest.slice(3) : rest.slice(5);
        return { action: 'enter', target };
      }
      return { action: 'go', direction: resolveRelative(rest) };
    }

    // Rowing
    if (verb === 'row') {
      return { action: 'row', target: rest };
    }

    // Make wine
    if (normalized === 'make wine' || normalized === 'make a wine' || normalized === 'crush grapes' || normalized === 'stomp grapes' || normalized === 'smash grapes') {
      return { action: 'make_wine' };
    }

    // What kind of vines
    if (normalized.includes('what kind') && (normalized.includes('vine') || normalized.includes('plant'))) {
      return { action: 'examine', target: 'vines' };
    }
    if (verb === 'investigate' && (!rest || rest.includes('vine') || rest.includes('plant') || rest.includes('forest'))) {
      return { action: 'examine', target: 'vines' };
    }

    // Looking
    if (['look', 'l'].includes(verb) && !rest) {
      return { action: 'look' };
    }

    // "look around" — same as look
    if (['look', 'l'].includes(verb) && rest === 'around') {
      return { action: 'look' };
    }

    // Directional looking: "look north", "look n", "l e", etc.
    if (['look', 'l'].includes(verb) && rest) {
      const lookDirMap = { 'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
                       'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west',
                       'u': 'up', 'd': 'down', 'up': 'up', 'down': 'down',
                       'left': 'left', 'right': 'right' };
      if (lookDirMap[rest]) {
        return { action: 'look_direction', direction: lookDirMap[rest] };
      }
    }

    if (['look', 'l', 'examine', 'x', 'inspect', 'read'].includes(verb)) {
      // Handle "look at X", "look in X", "look under X"
      let target = rest;
      if (target.startsWith('at ')) target = target.slice(3);
      if (target.startsWith('in ') || target.startsWith('inside ')) {
        target = target.startsWith('in ') ? target.slice(3) : target.slice(7);
        return { action: 'open', target };
      }
      if (target.startsWith('under ')) {
        return { action: 'move', target: target.slice(6) };
      }
      return { action: verb === 'read' ? 'read' : 'examine', target };
    }

    // "get in/into X" → enter, "get out" → go out (before take handler claims it)
    if (verb === 'get' && rest) {
      if (rest.startsWith('in ') || rest.startsWith('into ')) {
        const target = rest.startsWith('in ') ? rest.slice(3) : rest.slice(5);
        return { action: 'enter', target };
      }
      if (rest === 'out' || rest.startsWith('out of')) {
        return { action: 'go', direction: 'out' };
      }
    }

    // Taking — expanded verbs
    if (['take', 'get', 'grab', 'pick', 'pocket', 'steal'].includes(verb)) {
      let target = rest;
      if (target.startsWith('up ')) target = target.slice(3);
      return { action: 'take', target };
    }

    // Using/Opening/Unlocking
    if (['use', 'open', 'unlock', 'close'].includes(verb)) {
      return { action: verb, target: rest };
    }

    // "talk to" / "speak to" / "interview" — trigger ghost if in character room
    if (['talk', 'speak', 'interview', 'chat', 'sit'].includes(verb)) {
      let target = rest;
      if (target.startsWith('to ')) target = target.slice(3);
      if (target.startsWith('with ')) target = target.slice(5);
      if (target.startsWith('at ')) target = target.slice(3);
      if (target.startsWith('down at ')) target = target.slice(8);
      return { action: 'examine', target: target || '' };
    }

    // Movement through objects
    if (['enter', 'climb'].includes(verb) || normalized.startsWith('climb through') || normalized.startsWith('go through')) {
      let target = rest;
      if (target.startsWith('through ')) target = target.slice(8);
      if (target.startsWith('into ')) target = target.slice(5);
      if (target.startsWith('in ')) target = target.slice(3);
      return { action: 'enter', target };
    }

    // Moving objects
    if (['move', 'lift', 'push', 'pull'].includes(verb)) {
      return { action: 'move', target: rest };
    }

    // Physical actions
    if (['kick', 'break', 'knock', 'remove', 'hit', 'punch', 'smash'].includes(verb)) {
      return { action: verb, target: rest };
    }

    // Inventory
    if (['inventory', 'inv', 'i'].includes(verb)) {
      return { action: 'inventory' };
    }

    // Help
    if (['help', '?'].includes(verb)) {
      return { action: 'help' };
    }

    // Replay code entry (4-8 alphanumeric characters)
    if (/^\d{4}$/.test(normalized)) {
      return { action: 'code', code: normalized };
    }

    // Exits
    if (verb === 'exits') {
      return { action: 'exits' };
    }

    // Map
    if (verb === 'map') {
      return { action: 'map' };
    }

    return { action: 'unknown', original: input };
  }

  // Render ASCII map with fog-of-war
  function renderMap() {
    const v = state.visited;
    const cur = state.location;

    function r(id, label) {
      const tag = label.padEnd(6).substring(0, 6);
      if (id === cur) return '@' + tag;
      if (v.has(id))  return ' ' + tag;
      return ' · · · ';
    }

    function box(id, label) {
      const inner = r(id, label);
      if (id === cur || v.has(id)) return '[' + inner + ']';
      return ' ' + inner + ' ';
    }

    // Show connections only when either room discovered
    const has = (a, b) => v.has(a) || v.has(b);

    const W  = box('west_of_house',  'WEST');
    const F  = box('front_of_house', 'FRONT');
    const N  = box('north_of_house', 'NORTH');
    const NS = box('north_side',     'N.SIDE');
    const S  = box('south_of_house', 'SOUTH');
    const SS = box('south_side',     'S.SIDE');
    const B  = box('behind_house',   'BEHIND');
    const M  = box('main_room',      'MAIN');
    const G  = box('game_room',      'GAME');
    const O  = box('ocean',          'BEACH');
    const Fo = box('forest',         'FOREST');

    // Horizontal connectors
    const hWF = has('west_of_house', 'front_of_house')  ? '──' : '  ';
    const hNNS = has('north_of_house', 'north_side')    ? '──' : '  ';
    const hSSS = has('south_of_house', 'south_side')    ? '──' : '  ';
    const hBM = v.has('main_room')                      ? '──' : '  ';
    const hMG = (v.has('game_room') || (v.has('main_room') && state.flags.codeEntered)) ? '──' : '  ';

    // Vertical connectors
    const vON  = has('ocean', 'north_of_house')          ? '│' : ' ';
    const vNF  = has('north_of_house', 'front_of_house') ? '│' : ' ';
    const vSF  = has('south_of_house', 'front_of_house') ? '│' : ' ';
    const vSFo = has('south_of_house', 'forest')         ? '│' : ' ';

    // North side to behind (vertical connector on right side)
    const vNSB = has('north_side', 'behind_house')       ? '│' : ' ';
    const vSSB = has('south_side', 'behind_house')       ? '│' : ' ';

    const lines = [
      `         ${O}`,
      `             ${vON}`,
      `         ${N}${hNNS}${NS}`,
      `          / ${vNF}              ${vNSB}`,
      `${W}${hWF}${F}       ${B}${hBM}${M}${hMG}${G}`,
      `          \\ ${vSF}              ${vSSB}`,
      `         ${S}${hSSS}${SS}`,
      `             ${vSFo}`,
      `         ${Fo}`,
    ];

    return lines.join('\n');
  }

  // Execute a command and return output
  function execute(input) {
    const cmd = parseCommand(input);
    state.moves++;
    if (cmd.action !== 'unknown') state.unknownStreak = 0;

    switch (cmd.action) {
      case 'empty':
        state.moves--;
        return '';

      case 'look': {
        const loc = getCurrentLocation();
        // In character rooms, hint about the ghost
        const ghostScenario = GHOST_ROOM_MAP[state.location];
        if (ghostScenario && !localStorage.getItem('ghost_played') && !localStorage.getItem(`ghost_played_${ghostScenario}`) && globalQuestionCount < globalMaxQuestions) {
          return `${loc.name}\n${loc.description}\n\nThe air feels heavy, expectant. Someone is waiting here. Examine what catches your eye to begin.`;
        }
        return `${loc.name}\n${loc.description}`;
      }

      case 'look_direction': {
        const loc = getCurrentLocation();
        if (loc.look && loc.look[cmd.direction]) {
          const response = loc.look[cmd.direction];
          // Handle array responses (random selection)
          if (Array.isArray(response)) {
            return response[Math.floor(Math.random() * response.length)];
          }
          return response;
        }
        // Default responses if no specific look text
        if (loc.exits[cmd.direction]) {
          return `You see a path leading ${cmd.direction}.`;
        }
        return `You see nothing special to the ${cmd.direction}.`;
      }

      case 'go': {
        const loc = getCurrentLocation();
        const nextLocId = loc.exits[cmd.direction];

        if (!nextLocId) {
          if (state.location === 'boat_interior') {
            return "You have to leave the boat first, silly.";
          }
          return "You can't go that way.";
        }

        state.location = nextLocId;
        state.visited.add(nextLocId);
        // Track entry direction for relative left/right
        if (OPPOSITE[cmd.direction]) {
          state.enteredFrom = OPPOSITE[cmd.direction];
        }
        if (!state.flags[`scored_${nextLocId}`]) {
          state.score += locations[nextLocId].score || 0;
          state.flags[`scored_${nextLocId}`] = true;
        }
        const newLoc = locations[nextLocId];

        // Check if entering a ghost room
        const ghostScenario = checkRoomGhostTrigger(nextLocId);
        if (ghostScenario) {
          const questionsLeft = globalMaxQuestions - globalQuestionCount;
          return `${newLoc.name}\n${newLoc.description}\n\nThe air shifts. Someone is here, waiting. You have ${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining.\n\nExamine what catches your eye to begin.`;
        }

        // When entering game room for the first time, show the hub
        if (nextLocId === 'game_room' && !state.flags.ghost_intro_shown && !localStorage.getItem('ghost_played')) {
          state.flags.ghost_intro_shown = true;
          const questionsLeft = globalMaxQuestions - globalQuestionCount;
          return `${newLoc.name}\n${newLoc.description}\n\nFour rooms. Four customers. ${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining.\n\nChoose a direction to enter a room.`;
        }

        return `${newLoc.name}\n${newLoc.description}`;
      }

      case 'row': {
        return "There's no time for that right now.";
      }

      case 'make_wine': {
        // Only works at the forest/vine location
        if (state.location !== 'forest') {
          return "There's nothing here to make wine with.";
        }
        if (state.inventory.includes('glass of wine')) {
          return "You already made wine. One glass is enough for an adventure.";
        }
        state.inventory.push('glass of wine');
        state.score += 5;
        return "You grab a fistful of ripe grapes off the vine and somehow — with nothing but bare hands and sheer determination — smash them into a quaffable glass of table wine.\n\nIt's not great. But it's yours.\n\n(+5 points. A glass of wine has been added to your inventory.)";
      }

      case 'examine': {
        if (!cmd.target) {
          return getCurrentLocation().description;
        }

        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Ghost scenario trigger for game objects (in character rooms or game_room)
        if (checkGhostTrigger(obj.id)) {
          const scenarioId = GHOST_SCENARIO_MAP[obj.id];
          // Return a signal object instead of a string
          return { type: 'ghost_trigger', scenarioId, message: obj.descriptions.ghost || obj.descriptions.examine };
        }

        // Already played this scenario
        if (GHOST_SCENARIO_MAP[obj.id] && localStorage.getItem(`ghost_played_${obj.id}`)) {
          return obj.descriptions.played || "You've already had your turn. The figure is gone.";
        }

        // All questions used up
        if (GHOST_SCENARIO_MAP[obj.id] && globalQuestionCount >= globalMaxQuestions) {
          return "Your questions are spent. The figure fades. Time moves on.";
        }

        // One-play gate — already played any scenario
        if (GHOST_SCENARIO_MAP[obj.id] && localStorage.getItem('ghost_played')) {
          return obj.descriptions.played || "You've already had your turn. The figure is gone. Ask Justin for a replay code.";
        }

        // Personalized shelf book
        if (obj.id === 'shelf_book' && visitorProfile?.executive_summary) {
          return obj.descriptions.examine_personalized.replace('{name}', visitorProfile.name);
        }

        // Check for flag-dependent descriptions
        if (state.flags.doorUnlocked && obj.id === 'door' && obj.descriptions.examine_unlocked) {
          return obj.descriptions.examine_unlocked;
        }

        return obj.descriptions.examine || "You see nothing special about it.";
      }

      case 'read': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Personalized mailbox message
        if (obj.id === 'mailbox' || cmd.target === 'letter' || cmd.target === 'mail') {
          const personalizedMessage = getMailboxMessage(visitorProfile);
          if (personalizedMessage) {
            if (obj.setFlag && obj.setFlag.read) {
              state.flags[obj.setFlag.read] = true;
            }
            return personalizedMessage;
          }
        }

        // Personalized shelf book
        if (obj.id === 'shelf_book' && visitorProfile?.executive_summary) {
          return obj.descriptions.read_personalized
            .replace('{name}', visitorProfile.name)
            .replace('{executive_summary}', visitorProfile.executive_summary);
        }

        if (obj.descriptions.read) {
          if (obj.setFlag && obj.setFlag.read) {
            state.flags[obj.setFlag.read] = true;
          }
          return obj.descriptions.read;
        }

        return "There's nothing to read there.";
      }

      case 'take': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        if (obj.inInventory) {
          return "You already have that.";
        }

        if (!obj.takeable) {
          return obj.descriptions && obj.descriptions.take ? obj.descriptions.take : "You can't take that.";
        }

        state.inventory.push(obj.name);
        // Award points for taking scored items
        if (obj.score && !state.flags[`scored_take_${obj.name}`]) {
          state.score += obj.score;
          state.flags[`scored_take_${obj.name}`] = true;
          return `Taken. (+${obj.score} points)`;
        }
        return `Taken.`;
      }

      case 'move':
      case 'lift':
      case 'push':
      case 'pull': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        const verbKey = cmd.action;

        // Check if this action gives an item
        if (obj.giveItem && obj.giveItemVerbs && obj.giveItemVerbs.includes(verbKey)) {
          if (!state.inventory.includes(obj.giveItem) && !state.flags[obj.setFlag?.[verbKey]]) {
            state.inventory.push(obj.giveItem);
            if (obj.setFlag && obj.setFlag[verbKey]) {
              state.flags[obj.setFlag[verbKey]] = true;
            }
            return obj.descriptions[verbKey] || `You ${verbKey} the ${obj.name}.`;
          } else {
            return "You've already found what was there.";
          }
        }

        if (obj.descriptions[verbKey]) {
          if (obj.setFlag && obj.setFlag[verbKey]) {
            state.flags[obj.setFlag[verbKey]] = true;
          }
          return obj.descriptions[verbKey];
        }

        return `You can't ${verbKey} that.`;
      }

      case 'open': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Special handling for back door
        if (obj.id === 'door') {
          if (state.flags.doorUnlocked) {
            state.location = obj.teleportTo;
            state.visited.add(obj.teleportTo);
            const newLoc = locations[obj.teleportTo];
            return obj.descriptions.open + '\n\n' + newLoc.name + '\n' + newLoc.description;
          } else {
            return obj.descriptions.open_locked;
          }
        }

        // Check if opening reveals an item (doesn't auto-take it)
        if (obj.giveItem && obj.giveItemVerbs && obj.giveItemVerbs.includes('open')) {
          if (!state.flags[obj.setFlag?.open]) {
            if (obj.setFlag && obj.setFlag.open) {
              state.flags[obj.setFlag.open] = true;
            }
            return obj.descriptions.open || `You open the ${obj.name}.`;
          } else {
            return `The ${obj.name} is already open.`;
          }
        }

        if (obj.descriptions.open) {
          if (obj.setFlag && obj.setFlag.open) {
            state.flags[obj.setFlag.open] = true;
          }
          return obj.descriptions.open;
        }

        return "You can't open that.";
      }

      case 'unlock': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        if (obj.requiresItem && obj.requiresItemVerbs && obj.requiresItemVerbs.includes('unlock')) {
          if (state.inventory.includes(obj.requiresItem)) {
            if (obj.setFlag && obj.setFlag.unlock) {
              state.flags[obj.setFlag.unlock] = true;
            }
            return obj.descriptions.unlock;
          } else {
            return obj.descriptions.unlock_nokey || "You don't have what you need to unlock that.";
          }
        }

        return "You can't unlock that.";
      }

      case 'enter': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You can't enter that.";
        }

        // Check for teleport
        if (obj.teleportVerbs && obj.teleportVerbs.includes('enter')) {
          // Special handling for door
          if (obj.id === 'door' && !state.flags.doorUnlocked) {
            return obj.descriptions.open_locked;
          }

          if (obj.teleportTo) {
            state.location = obj.teleportTo;
            state.visited.add(obj.teleportTo);
            const desc = obj.descriptions.enter || `You enter through the ${obj.name}.`;
            const newLoc = locations[obj.teleportTo];
            return desc + '\n\n' + newLoc.name + '\n' + newLoc.description;
          }
        }

        return "You can't enter that.";
      }

      case 'use': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        if (obj.descriptions.use) {
          return obj.descriptions.use;
        }

        return "You're not sure how to use that.";
      }

      case 'code': {
        // Find an object that accepts codes in current location
        const loc = getCurrentLocation();
        let codeObj = null;

        for (const objId of loc.objects) {
          const obj = objects[objId];
          if (obj && obj.acceptsCode) {
            codeObj = { id: objId, ...obj };
            break;
          }
        }

        if (!codeObj) {
          return "There's nothing here that needs a code.";
        }

        if (cmd.code === codeObj.correctCode) {
          state.flags.codeEntered = true;
          // Add down exit to main_room (trapdoor opens)
          if (locations.main_room) {
            locations.main_room.exits.down = 'game_room';
          }
          return codeObj.codeSuccess;
        } else {
          return codeObj.codeFail;
        }
      }

      case 'inventory':
        if (state.inventory.length === 0) {
          return "You aren't carrying anything.";
        }
        return "You are carrying:\n  " + state.inventory.join('\n  ');

      case 'exits': {
        const loc = getCurrentLocation();
        const exits = Object.keys(loc.exits).filter(dir => loc.exits[dir]);
        if (exits.length === 0) {
          return "There are no obvious exits.";
        }
        return "Obvious exits: " + exits.join(', ');
      }

      case 'map':
        state.moves--;
        return renderMap();

      case 'help':
        return `MOVEMENT: north/n, south/s, east/e, west/w, up/u, down/d
          left, right, go [direction], back/out
ACTIONS:  look, look around, look left/right, examine/x [object]
          read [object], take/get/grab/pocket [object]
          open [object], unlock [object], enter [object]
          move/lift [object], make wine
GHOST:    In a customer room, examine objects to begin. Type LEAVE to exit early.
SPECIAL:  inventory/i, exits, map, help`;

      case 'kick':
      case 'break':
      case 'knock':
      case 'remove':
      case 'hit':
      case 'punch':
      case 'smash': {
        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Map similar verbs
        let verbKey = cmd.action;
        if (['hit', 'punch', 'smash'].includes(verbKey)) verbKey = 'break';

        if (obj.descriptions[verbKey]) {
          return obj.descriptions[verbKey];
        }

        return `You can't ${cmd.action} that.`;
      }

      case 'unknown': {
        // Check for Easter egg responses first
        const easterEgg = checkEasterEgg(cmd.original);
        if (easterEgg) {
          state.unknownStreak = 0;
          return easterEgg;
        }
        state.unknownStreak++;
        const hint = state.unknownStreak >= 3 ? '\n\nHint: Type MAP to see where you are, or HELP for commands.' : '';
        if (state.unknownStreak >= 3) state.unknownStreak = 0;
        return `I don't understand "${cmd.original}". Type HELP for available commands.${hint}`;
      }

      default:
        return "I don't understand that command.";
    }
  }

  // Get intro text
  function getIntro() {
    const loc = getCurrentLocation();
    return `${loc.name}
${loc.description}`;
  }

  // Get current state (for status bar)
  function getState() {
    return {
      location: getCurrentLocation().name,
      score: state.score,
      moves: state.moves,
      inventory: [...state.inventory],
      flags: { ...state.flags },
      globalQuestionCount,
      globalMaxQuestions,
    };
  }

  return {
    execute,
    getIntro,
    getState,
    getCurrentLocation,
    setVisitorProfile,
    onGhostTrigger,
    setGlobalQuestionCount,
  };
}
