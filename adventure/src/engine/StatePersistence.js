export function createStatePersistence(locations, objects, getState, setState) {

  function saveState() {
    const state = getState();
    const save = {
      location: state.location,
      inventory: [...state.inventory],
      flags: { ...state.flags },
      score: state.score,
      moves: state.moves,
      visited: [...state.visited],
      unknownStreak: state.unknownStreak,
      enteredFrom: state.enteredFrom,
    };
    try {
      localStorage.setItem('adventure_save', JSON.stringify(save));
    } catch {
      // localStorage full or unavailable
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('adventure_save');
      if (!raw) return false;
      const save = JSON.parse(raw);
      setState({
        location: save.location,
        inventory: save.inventory || [],
        flags: save.flags || {},
        score: save.score || 0,
        moves: save.moves || 0,
        visited: new Set(save.visited || ['west_of_house']),
        unknownStreak: save.unknownStreak || 0,
        enteredFrom: save.enteredFrom || 'west',
      });
      // Re-apply location mutations based on flags (data-driven)
      const state = getState();
      if (state.flags.codeEntered) {
        for (const obj of Object.values(objects)) {
          if (obj.codeUnlocksExit) {
            const { location: loc, direction: dir, target } = obj.codeUnlocksExit;
            if (locations[loc]) {
              locations[loc].exits[dir] = target;
            }
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  function clearSave() {
    localStorage.removeItem('adventure_save');
  }

  return { saveState, loadState, clearSave };
}
