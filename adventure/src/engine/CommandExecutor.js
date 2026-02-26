import { OPPOSITE } from './CommandParser.js';

export function createCommandExecutor(
  locations,
  objects,
  responses,
  getMailboxMessage,
  state,
  ghostTriggers,
  objectResolver,
  mapRenderer,
  getVisitorProfile,
  getGlobalQuestionCount,
  getGlobalMaxQuestions,
) {

  function getCurrentLocation() {
    return locations[state.location];
  }

  // Resolve personalization for an object action from data
  // Returns the personalized string, or null if no personalization applies
  function resolvePersonalization(obj, action) {
    const spec = obj.personalization?.[action];
    if (!spec) return null;

    // Evaluate condition
    const conditionMet = evaluateCondition(spec.condition);
    if (!conditionMet) return null;

    // Named handler (complex logic that can't be expressed as template)
    if (spec.handler === 'mailbox_letter') {
      return getMailboxMessage(getVisitorProfile());
    }

    // Template-based personalization
    if (spec.template && obj.descriptions[spec.template]) {
      let text = obj.descriptions[spec.template];
      if (spec.replacements) {
        for (const [placeholder, path] of Object.entries(spec.replacements)) {
          text = text.replace(placeholder, resolveDataPath(path) || '');
        }
      }
      return text;
    }

    return null;
  }

  function evaluateCondition(condition) {
    if (!condition) return false;
    return !!resolveDataPath(condition);
  }

  function resolveDataPath(path) {
    const parts = path.split('.');
    let value;
    if (parts[0] === 'visitorProfile') {
      value = getVisitorProfile();
      parts.shift();
    } else if (parts[0] === 'flags') {
      value = state.flags;
      parts.shift();
    } else {
      return undefined;
    }
    for (const part of parts) {
      if (value == null) return undefined;
      value = value[part];
    }
    return value;
  }

  function personalizeLocationText(text) {
    const name = getVisitorProfile()?.name || 'your name';
    return text.replace(/\{visitor_name\}/g, name);
  }

  function checkEasterEgg(input) {
    const normalized = input.toLowerCase().trim();
    for (const category of Object.values(responses)) {
      if (typeof category !== 'object') continue;
      for (const [pattern, response] of Object.entries(category)) {
        if (pattern.startsWith('_')) continue;
        if (normalized === pattern || normalized.includes(pattern)) {
          if (Array.isArray(response)) {
            return response[Math.floor(Math.random() * response.length)];
          }
          return response
            .replace('{location}', getCurrentLocation().name)
            .replace('{score}', state.score.toString());
        }
      }
    }
    return null;
  }

  function execute(cmd) {
    state.moves++;
    if (cmd.action !== 'unknown') state.unknownStreak = 0;

    switch (cmd.action) {
      case 'empty':
        state.moves--;
        return '';

      case 'look': {
        const loc = getCurrentLocation();
        const desc = personalizeLocationText(loc.description);
        const ghostScenario = locations[state.location]?.ghostRoom;
        if (ghostScenario && !localStorage.getItem('ghost_played') && !localStorage.getItem(`ghost_played_${ghostScenario}`) && getGlobalQuestionCount() < getGlobalMaxQuestions()) {
          return `${loc.name}\n${desc}\n\nThe air feels heavy, expectant. Someone is waiting here. Examine what catches your eye to begin.`;
        }
        return `${loc.name}\n${desc}`;
      }

      case 'look_direction': {
        const loc = getCurrentLocation();
        if (loc.look && loc.look[cmd.direction]) {
          const response = loc.look[cmd.direction];
          if (Array.isArray(response)) {
            return response[Math.floor(Math.random() * response.length)];
          }
          return response;
        }
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
        if (OPPOSITE[cmd.direction]) {
          state.enteredFrom = OPPOSITE[cmd.direction];
        }
        if (!state.flags[`scored_${nextLocId}`]) {
          state.score += locations[nextLocId].score || 0;
          state.flags[`scored_${nextLocId}`] = true;
        }
        const newLoc = locations[nextLocId];
        const newDesc = personalizeLocationText(newLoc.description);

        const ghostScenario = ghostTriggers.checkRoomGhostTrigger(nextLocId);
        if (ghostScenario) {
          const questionsLeft = getGlobalMaxQuestions() - getGlobalQuestionCount();
          return `${newLoc.name}\n${newDesc}\n\nThe air shifts. Someone is here, waiting. You have ${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining.\n\nExamine what catches your eye to begin.`;
        }

        if (nextLocId === 'game_room' && !state.flags.ghost_intro_shown && !localStorage.getItem('ghost_played')) {
          state.flags.ghost_intro_shown = true;
          const questionsLeft = getGlobalMaxQuestions() - getGlobalQuestionCount();
          return `${newLoc.name}\n${newDesc}\n\nFour rooms. Four customers. ${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining.\n\nChoose a direction to enter a room.`;
        }

        return `${newLoc.name}\n${newDesc}`;
      }

      case 'row': {
        return "There's no time for that right now.";
      }

      case 'make_wine': {
        // Data-driven location action
        const loc = getCurrentLocation();
        const action = loc.locationActions?.make_wine;
        if (!action) {
          return action?.notHere || "There's nothing here to make wine with.";
        }
        if (action.alreadyDone && state.flags[action.alreadyDone.flag]) {
          return action.alreadyDone.message;
        }
        if (action.giveItem) state.inventory.push(action.giveItem);
        if (action.setFlag) state.flags[action.setFlag] = true;
        if (action.score) state.score += action.score;
        return action.success;
      }

      case 'examine': {
        // In a ghost room with no specific target (e.g. "sit down"), target the ghost object
        if (!cmd.target && locations[state.location]?.ghostRoom) {
          cmd.target = locations[state.location].ghostRoom;
        }
        if (!cmd.target) {
          return getCurrentLocation().description;
        }

        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Ghost scenario trigger
        if (ghostTriggers.checkGhostTrigger(obj.id)) {
          const scenarioId = ghostTriggers.getScenarioForObject(obj.id);
          return { type: 'ghost_trigger', scenarioId, message: obj.descriptions.ghost || obj.descriptions.examine };
        }

        if (ghostTriggers.isGhostObject(obj.id) && localStorage.getItem(`ghost_played_${obj.id}`)) {
          return obj.descriptions.played || "You've already had your turn. The figure is gone.";
        }

        if (ghostTriggers.isGhostObject(obj.id) && getGlobalQuestionCount() >= getGlobalMaxQuestions()) {
          return "Your questions are spent. The figure fades. Time moves on.";
        }

        if (ghostTriggers.isGhostObject(obj.id) && localStorage.getItem('ghost_played')) {
          return obj.descriptions.played || "You've already had your turn. The figure is gone. Ask Justin for a replay code.";
        }

        // Data-driven personalization
        const personalizedExamine = resolvePersonalization(obj, 'examine');
        if (personalizedExamine) return personalizedExamine;

        return obj.descriptions.examine || "You see nothing special about it.";
      }

      case 'read': {
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Data-driven personalization (mailbox_letter handler, shelf_book templates)
        const personalizedRead = resolvePersonalization(obj, 'read');
        if (personalizedRead) {
          if (obj.setFlag && obj.setFlag.read) {
            state.flags[obj.setFlag.read] = true;
          }
          // Letter from mailbox → inventory + points (once)
          if (obj.id === 'mailbox' && !state.flags.letterTaken) {
            state.flags.letterTaken = true;
            state.inventory.push('letter');
            state.score += 3;
            return personalizedRead + '\n\n(The letter has been added to your inventory. +3 points)';
          }
          return personalizedRead;
        }

        if (obj.descriptions.read) {
          if (obj.setFlag && obj.setFlag.read) {
            state.flags[obj.setFlag.read] = true;
          }
          if (obj.id === 'mailbox' && !state.flags.letterTaken) {
            state.flags.letterTaken = true;
            state.inventory.push('letter');
            state.score += 3;
            return obj.descriptions.read + '\n\n(The letter has been added to your inventory. +3 points)';
          }
          return obj.descriptions.read;
        }

        return "There's nothing to read there.";
      }

      case 'take': {
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // "pick up phone" / "take phone" → use the phone
        if (obj.id === 'phone') {
          return execute({ action: 'use', target: cmd.target });
        }

        if (obj.inInventory) {
          return "You already have that.";
        }

        if (!obj.takeable) {
          return obj.descriptions && obj.descriptions.take ? obj.descriptions.take : "You can't take that.";
        }

        state.inventory.push(obj.name);
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
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        const verbKey = cmd.action;

        if (obj.giveItem && obj.giveItemVerbs && obj.giveItemVerbs.includes(verbKey)) {
          if (!state.flags[obj.setFlag?.[verbKey]]) {
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
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

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
        const obj = objectResolver.findObject(cmd.target);
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
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You can't enter that.";
        }

        if (obj.teleportVerbs && obj.teleportVerbs.includes('enter')) {
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

      case 'close': {
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        // Hanging up the phone clears holdingPhone
        if (obj.id === 'phone' && state.flags.holdingPhone) {
          state.flags.holdingPhone = false;
          return obj.descriptions.close || "You put it down.";
        }

        if (obj.descriptions.close) {
          if (obj.setFlag && obj.setFlag.close) {
            state.flags[obj.setFlag.close] = true;
          }
          return obj.descriptions.close;
        }

        return "You can't close that.";
      }

      case 'use': {
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        if (obj.descriptions.use) {
          if (obj.setFlag && obj.setFlag.use) {
            state.flags[obj.setFlag.use] = true;
          }
          return obj.descriptions.use;
        }

        return "You're not sure how to use that.";
      }

      case 'say': {
        if (!state.flags.holdingPhone) {
          return "You speak into the empty room. No one's listening. Maybe try picking up a phone first.";
        }
        if (state.flags.phoneMsgSent) {
          return "The line's gone quiet. Your message was already sent.";
        }
        if (!cmd.message) {
          return "Say what? Type SAY followed by your message.";
        }
        return { type: 'phone_message', message: cmd.message, displayText: `You speak into the receiver: "${cmd.message}"` };
      }

      case 'code_hint': {
        return 'It seems to need a code. Try typing "enter code xxxx".';
      }

      case 'code': {
        const loc = getCurrentLocation();
        let codeObj = null;

        for (const objId of loc.objects) {
          const obj = objects[objId];
          if (!obj || !obj.acceptsCode) continue;
          if (obj.requiresFlag && !state.flags[obj.requiresFlag]) continue;
          codeObj = { id: objId, ...obj };
          break;
        }

        if (!codeObj) {
          return "There's nothing here that needs a code.";
        }

        if (cmd.code === codeObj.correctCode) {
          state.flags.codeEntered = true;
          // Data-driven exit unlock
          if (codeObj.codeUnlocksExit) {
            const { location: loc, direction: dir, target } = codeObj.codeUnlocksExit;
            if (locations[loc]) {
              locations[loc].exits[dir] = target;
            }
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
        return mapRenderer.renderMap();

      case 'help':
        return `MOVEMENT: north/n, south/s, east/e, west/w, up/u, down/d
          left, right, go [direction], back/out
ACTIONS:  look, look around, look left/right, examine/x [object]
          read [object], take/get/grab/pocket [object]
          open [object], unlock [object], enter [object]
          move/lift [object], make wine
          use [object], say [message] (after using phone)
GHOST:    In a customer room, examine objects to begin. Type LEAVE to exit early.
SPECIAL:  inventory/i, exits, map, help`;

      case 'kick':
      case 'break':
      case 'knock':
      case 'remove':
      case 'hit':
      case 'punch':
      case 'smash': {
        const obj = objectResolver.findObject(cmd.target);
        if (!obj) {
          return "You don't see that here.";
        }

        let verbKey = cmd.action;
        if (['hit', 'punch', 'smash'].includes(verbKey)) verbKey = 'break';

        if (obj.descriptions[verbKey]) {
          return obj.descriptions[verbKey];
        }

        return `You can't ${cmd.action} that.`;
      }

      case 'unknown': {
        // If the phone is active, treat any unrecognized input as speech
        if (state.flags.holdingPhone && !state.flags.phoneMsgSent) {
          return { type: 'phone_message', message: cmd.original, displayText: `You speak into the receiver: "${cmd.original}"` };
        }

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

  return { execute };
}
