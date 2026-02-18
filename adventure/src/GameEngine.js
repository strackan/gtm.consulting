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

export function createGameEngine() {
  // Game state
  let state = {
    location: 'west_of_house',
    inventory: [],
    flags: {},
    score: 0,
    moves: 0,
    visited: new Set(['west_of_house']),
    unknownStreak: 0
  };

  let visitorProfile = null;
  let ghostTriggerCallback = null;

  function setVisitorProfile(profile) {
    visitorProfile = profile;
  }

  function onGhostTrigger(callback) {
    ghostTriggerCallback = callback;
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
    if (state.location !== 'game_room') return false;
    if (!ghostTriggerCallback) return false;

    // One-play gate: check localStorage
    const hasPlayed = typeof localStorage !== 'undefined' && localStorage.getItem('ghost_played');
    if (hasPlayed) return false;

    return true;
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
      'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west'
    };

    if (directionMap[verb]) {
      return { action: 'go', direction: directionMap[verb] };
    }

    // Movement
    if (verb === 'go' && rest) {
      const dir = directionMap[rest] || rest;
      return { action: 'go', direction: dir };
    }

    // Looking
    if (['look', 'l'].includes(verb) && !rest) {
      return { action: 'look' };
    }

    // Directional looking: "look north", "look n", "l e", etc.
    if (['look', 'l'].includes(verb) && rest) {
      const dirMap = { 'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
                       'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west' };
      if (dirMap[rest]) {
        return { action: 'look_direction', direction: dirMap[rest] };
      }
    }

    if (['look', 'l', 'examine', 'x', 'inspect', 'read'].includes(verb)) {
      // Handle "look at X" or "look under X"
      let target = rest;
      if (target.startsWith('at ')) target = target.slice(3);
      if (target.startsWith('under ')) {
        return { action: 'move', target: target.slice(6) };
      }
      return { action: verb === 'read' ? 'read' : 'examine', target };
    }

    // Taking
    if (['take', 'get', 'grab', 'pick'].includes(verb)) {
      let target = rest;
      if (target.startsWith('up ')) target = target.slice(3);
      return { action: 'take', target };
    }

    // Using/Opening/Unlocking
    if (['use', 'open', 'unlock', 'close'].includes(verb)) {
      return { action: verb, target: rest };
    }

    // "talk to" / "speak to" / "interview" — trigger ghost if in game room
    if (['talk', 'speak', 'interview', 'chat', 'sit'].includes(verb)) {
      let target = rest;
      if (target.startsWith('to ')) target = target.slice(3);
      if (target.startsWith('with ')) target = target.slice(5);
      if (target.startsWith('at ')) target = target.slice(3);
      if (target.startsWith('down at ')) target = target.slice(8);
      return { action: 'examine', target: target || '' };
    }

    // Movement through objects
    if (['enter', 'climb', 'go through'].includes(verb) || normalized.startsWith('climb through')) {
      let target = rest;
      if (target.startsWith('through ')) target = target.slice(8);
      if (target.startsWith('into ')) target = target.slice(5);
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
    const S  = box('south_of_house', 'SOUTH');
    const B  = box('behind_house',   'BEHIND');
    const M  = box('main_room',      'MAIN');
    const G  = box('game_room',      'GAME');
    const O  = box('ocean',          'BEACH');
    const Fo = box('forest',         'FOREST');

    const hWF = has('west_of_house', 'front_of_house') ? '──' : '  ';
    const hNB = has('north_of_house', 'behind_house')  ? '──' : '  ';
    const hMG = (v.has('game_room') || (v.has('main_room') && state.flags.codeEntered)) ? '──' : '  ';
    const vON = has('ocean', 'north_of_house')         ? '│' : ' ';
    const vNF = has('north_of_house', 'front_of_house') ? '│' : ' ';
    const vSF = has('south_of_house', 'front_of_house') ? '│' : ' ';
    const vBM = has('behind_house', 'main_room')       ? '│' : ' ';
    const vSFo = has('south_of_house', 'forest')       ? '│' : ' ';
    const hSB = has('south_of_house', 'behind_house')  ? '──────────┘' : '           ';

    const lines = [
      `         ${O}`,
      `             ${vON}`,
      `         ${N}${hNB}${B}`,
      `          / ${vNF}        ${vBM}`,
      `${W}${hWF}${F}  ${M}${hMG}${G}`,
      `          \\ ${vSF}        ${vBM}`,
      `         ${S}${hSB}`,
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
        // In game room, add ghost scenario hints
        if (state.location === 'game_room' && !localStorage.getItem('ghost_played')) {
          return `${loc.name}\n${loc.description}\n\nThe objects in this room feel different — charged. As if someone were waiting behind each one.`;
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
          return "You can't go that way.";
        }

        state.location = nextLocId;
        state.visited.add(nextLocId);
        if (!state.flags[`scored_${nextLocId}`]) {
          state.score += locations[nextLocId].score || 0;
          state.flags[`scored_${nextLocId}`] = true;
        }
        const newLoc = locations[nextLocId];

        // When entering game room for the first time, hint at ghost scenarios
        if (nextLocId === 'game_room' && !state.flags.ghost_intro_shown && !localStorage.getItem('ghost_played')) {
          state.flags.ghost_intro_shown = true;
          return `${newLoc.name}\n${newLoc.description}\n\nSomething feels different here. The air is heavy, expectant. Each game piece seems to pulse with a faint light, as if someone is waiting on the other side.\n\nExamine one to begin.`;
        }

        return `${newLoc.name}\n${newLoc.description}`;
      }

      case 'examine': {
        if (!cmd.target) {
          return getCurrentLocation().description;
        }

        const obj = findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Ghost scenario trigger for game room objects
        if (checkGhostTrigger(obj.id)) {
          const scenarioId = GHOST_SCENARIO_MAP[obj.id];
          // Return a signal object instead of a string
          return { type: 'ghost_trigger', scenarioId, message: obj.descriptions.ghost || obj.descriptions.examine };
        }

        // One-play gate — already played
        if (GHOST_SCENARIO_MAP[obj.id] && state.location === 'game_room' && localStorage.getItem('ghost_played')) {
          return obj.descriptions.played || "You've already had your turn. The figure is gone. Ask Justin for a replay code.";
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
          return "You can't take that.";
        }

        state.inventory.push(obj.name);
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

        // Special handling for door
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
          // Add east exit to main_room
          if (locations.main_room) {
            locations.main_room.exits.east = 'game_room';
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
        return `MOVEMENT: north/n, south/s, east/e, west/w, go [direction]
ACTIONS:  look, examine/x [object], read [object]
          take/get [object], open [object], unlock [object]
          move/lift [object], enter [object]
SPECIAL:  inventory/i, exits, map, help

You can also just type naturally -- the game will try to understand.`;

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
      flags: { ...state.flags }
    };
  }

  return {
    execute,
    getIntro,
    getState,
    getCurrentLocation,
    setVisitorProfile,
    onGhostTrigger,
  };
}
