import locations from '../content/locations.json';
import objects from '../content/objects.json';
import responses from '../content/responses.json';
import { getMailboxMessage } from './scenarios';

import { createCommandParser } from './engine/CommandParser.js';
import { createObjectResolver } from './engine/ObjectResolver.js';
import { createStatePersistence } from './engine/StatePersistence.js';
import { createMapRenderer } from './engine/MapRenderer.js';
import { createGhostTriggers } from './engine/GhostTriggers.js';
import { createCommandExecutor } from './engine/CommandExecutor.js';

export function createGameEngine() {
  // Game state — single mutable object shared by all modules
  const state = {
    location: 'west_of_house',
    inventory: [],
    flags: {},
    score: 0,
    moves: 0,
    visited: new Set(['west_of_house']),
    unknownStreak: 0,
    enteredFrom: 'west',
  };

  let visitorProfile = null;
  let ghostTriggerCallback = null;
  let globalQuestionCount = 0;
  let globalMaxQuestions = 10;

  // --- Accessor helpers for modules ---
  const getEnteredFrom = () => state.enteredFrom;
  const getCurrentLocationId = () => state.location;
  const getCurrentLocation = () => locations[state.location];
  const getLocationObjects = () => getCurrentLocation().objects;
  const getInventory = () => state.inventory;
  const getFlags = () => state.flags;
  const getVisited = () => state.visited;
  const getVisitorProfile = () => visitorProfile;
  const getGhostTriggerCallback = () => ghostTriggerCallback;
  const getGlobalQuestionCount = () => globalQuestionCount;
  const getGlobalMaxQuestions = () => globalMaxQuestions;

  // --- Wire up modules ---
  const parser = createCommandParser(getEnteredFrom);

  const objectResolver = createObjectResolver(
    objects, getLocationObjects, getInventory, getFlags
  );

  const persistence = createStatePersistence(
    locations,
    objects,
    () => state,
    (newState) => {
      state.location = newState.location;
      state.inventory = newState.inventory;
      state.flags = newState.flags;
      state.score = newState.score;
      state.moves = newState.moves;
      state.visited = newState.visited;
      state.unknownStreak = newState.unknownStreak;
      state.enteredFrom = newState.enteredFrom;
    }
  );

  const mapRenderer = createMapRenderer(locations, getVisited, getCurrentLocationId, getFlags);

  const ghostTriggers = createGhostTriggers(
    locations,
    objects,
    getCurrentLocation,
    getCurrentLocationId,
    getGhostTriggerCallback,
    getGlobalQuestionCount,
    getGlobalMaxQuestions
  );

  const executor = createCommandExecutor(
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
  );

  // --- Public API (unchanged) ---

  function execute(input) {
    const cmd = parser.parseCommand(input);
    return executor.execute(cmd);
  }

  function getIntro() {
    const loc = getCurrentLocation();
    return `${loc.name}\n${loc.description}`;
  }

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

  return {
    execute,
    getIntro,
    getState,
    getCurrentLocation,
    setVisitorProfile,
    onGhostTrigger,
    setGlobalQuestionCount,
    saveState: persistence.saveState,
    loadState: persistence.loadState,
    clearSave: persistence.clearSave,
  };
}
