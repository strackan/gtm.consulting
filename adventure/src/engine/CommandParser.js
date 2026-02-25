// Relative direction helpers
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };
const LEFT_OF  = { north: 'west', south: 'east', east: 'north', west: 'south' };
const RIGHT_OF = { north: 'east', south: 'west', east: 'south', west: 'north' };

export { OPPOSITE };

export function createCommandParser(getEnteredFrom) {

  const directionMap = {
    'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
    'north': 'north', 'south': 'south', 'east': 'east', 'west': 'west',
    'u': 'up', 'd': 'down', 'up': 'up', 'down': 'down',
    'upstairs': 'up', 'downstairs': 'down',
    'up stairs': 'up', 'down stairs': 'down',
    'back': 'back', 'out': 'out', 'exit': 'exit', 'leave': 'leave'
  };

  function resolveRelative(dir) {
    if (dir === 'left' || dir === 'right') {
      const facing = OPPOSITE[getEnteredFrom()] || 'north';
      return dir === 'left' ? LEFT_OF[facing] : RIGHT_OF[facing];
    }
    return directionMap[dir] || dir;
  }

  function parseCommand(input) {
    const normalized = input.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    if (words.length === 0) return { action: 'empty' };

    const verb = words[0];
    const rest = words.slice(1).join(' ');

    if (directionMap[verb] || verb === 'left' || verb === 'right') {
      return { action: 'go', direction: resolveRelative(verb) };
    }

    // Movement
    if (verb === 'go' && rest) {
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

    if (['look', 'l'].includes(verb) && rest === 'around') {
      return { action: 'look' };
    }

    // Directional looking
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

    // "get in/into X" → enter, "get out" → go out
    if (verb === 'get' && rest) {
      if (rest.startsWith('in ') || rest.startsWith('into ')) {
        const target = rest.startsWith('in ') ? rest.slice(3) : rest.slice(5);
        return { action: 'enter', target };
      }
      if (rest === 'out' || rest.startsWith('out of')) {
        return { action: 'go', direction: 'out' };
      }
    }

    // Taking
    if (['take', 'get', 'grab', 'pick', 'pocket', 'steal'].includes(verb)) {
      let target = rest;
      if (target.startsWith('up ')) target = target.slice(3);
      return { action: 'take', target };
    }

    // Natural unlock phrases
    if (verb === 'open' && rest.includes(' with ')) {
      const target = rest.split(' with ')[0];
      return { action: 'unlock', target };
    }
    if (verb === 'use' && (rest.includes(' on ') || rest.includes(' with '))) {
      const sep = rest.includes(' on ') ? ' on ' : ' with ';
      const target = rest.split(sep)[1];
      return { action: 'unlock', target };
    }
    if (verb === 'put' && (rest.includes(' in ') || rest.includes(' into '))) {
      const sep = rest.includes(' into ') ? ' into ' : ' in ';
      const target = rest.split(sep)[1];
      if (target === 'lock' || target === 'keyhole') {
        return { action: 'unlock', target: 'door' };
      }
      return { action: 'unlock', target };
    }

    // Using/Opening/Unlocking
    if (['use', 'open', 'unlock', 'close'].includes(verb)) {
      return { action: verb, target: rest };
    }

    // Say — deliver a phone message
    if (verb === 'say') {
      return { action: 'say', message: rest };
    }

    // Talk/speak/interview — trigger ghost if in character room
    if (['talk', 'speak', 'interview', 'chat', 'sit'].includes(verb)) {
      let target = rest;
      if (target.startsWith('to ')) target = target.slice(3);
      if (target.startsWith('with ')) target = target.slice(5);
      if (target.startsWith('at ')) target = target.slice(3);
      if (target.startsWith('down at ')) target = target.slice(8);
      if (target === 'down') target = '';
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

    // Bare 4-digit code
    if (/^\d{4}$/.test(normalized)) {
      return { action: 'code', code: normalized };
    }

    // "enter 1111", "type 1111", etc.
    if (['enter', 'type', 'input', 'use', 'try'].includes(verb)) {
      const codeMatch = rest.match(/\b(\d{4})\b/);
      if (codeMatch) {
        return { action: 'code', code: codeMatch[1] };
      }
      const codeTargets = ['code', 'trapdoor', 'keypad', 'hatch', 'trap door', 'door'];
      if (codeTargets.some(t => rest.includes(t)) || !rest) {
        return { action: 'code_hint' };
      }
    }

    // "code on trapdoor", "code 1111", "code trapdoor"
    if (verb === 'code') {
      const codeMatch = rest.match(/\b(\d{4})\b/);
      if (codeMatch) {
        return { action: 'code', code: codeMatch[1] };
      }
      return { action: 'code_hint' };
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

  return { parseCommand };
}
