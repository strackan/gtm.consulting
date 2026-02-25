export function createObjectResolver(objects, getLocationObjects, getInventory, getFlags) {

  function findObject(query) {
    const q = query.toLowerCase().trim();

    // Check current location's objects
    for (const objId of getLocationObjects()) {
      const obj = objects[objId];
      if (!obj) continue;

      // Skip objects gated behind a flag that hasn't been set yet
      if (obj.requiresFlag && !getFlags()[obj.requiresFlag]) continue;

      if (objId.toLowerCase() === q) return { id: objId, ...obj };
      if (obj.name.toLowerCase() === q) return { id: objId, ...obj };
      if (obj.aliases && obj.aliases.some(a => a.toLowerCase() === q)) {
        return { id: objId, ...obj };
      }
    }

    // Check inventory
    for (const itemName of getInventory()) {
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

  return { findObject };
}
