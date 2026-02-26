// Build ghost maps from data at init time
function buildGhostMaps(objects, locations) {
  // Object ID → scenario ID (from objects.json ghostScenario field)
  const scenarioMap = {};
  for (const [objId, obj] of Object.entries(objects)) {
    if (obj.ghostScenario) {
      scenarioMap[objId] = obj.ghostScenario;
    }
  }

  // Room ID → scenario ID (from locations.json ghostRoom field)
  const roomMap = {};
  for (const [locId, loc] of Object.entries(locations)) {
    if (loc.ghostRoom) {
      roomMap[locId] = loc.ghostRoom;
    }
  }

  return { scenarioMap, roomMap };
}

export function createGhostTriggers(locations, objects, getCurrentLocation, getCurrentLocationId, _getGhostTriggerCallback, getGlobalQuestionCount, getGlobalMaxQuestions) {

  const { scenarioMap, roomMap } = buildGhostMaps(objects, locations);

  function checkGhostTrigger(objId) {
    if (!scenarioMap[objId]) return false;

    const currentLoc = getCurrentLocation();
    const isGhostRoom = currentLoc.ghostRoom === objId;
    const isGameRoom = getCurrentLocationId() === 'game_room';
    if (!isGhostRoom && !isGameRoom) return false;

    if (getGlobalQuestionCount() >= getGlobalMaxQuestions()) return false;

    const scenarioPlayed = typeof localStorage !== 'undefined' && localStorage.getItem(`ghost_played_${objId}`);
    if (scenarioPlayed) return false;

    return true;
  }

  function checkRoomGhostTrigger(roomId) {
    const scenarioId = roomMap[roomId];
    if (!scenarioId) return null;

    if (getGlobalQuestionCount() >= getGlobalMaxQuestions()) return null;

    const scenarioPlayed = typeof localStorage !== 'undefined' && localStorage.getItem(`ghost_played_${scenarioId}`);
    if (scenarioPlayed) return null;

    return scenarioId;
  }

  function getScenarioForObject(objId) {
    return scenarioMap[objId] || null;
  }

  function isGhostObject(objId) {
    return !!scenarioMap[objId];
  }

  return { checkGhostTrigger, checkRoomGhostTrigger, getScenarioForObject, isGhostObject };
}
