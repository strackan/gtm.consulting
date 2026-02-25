export function createMapRenderer(locations, getVisited, getCurrentLocationId, getFlags) {

  function renderMap() {
    const v = getVisited();
    const cur = getCurrentLocationId();

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

    if (locations[cur]?.indoor) {
      return renderIndoorMap(box, v);
    }
    return renderOutdoorMap(box, v);
  }

  function renderOutdoorMap(box, v) {
    const has = (a, b) => v.has(a) || v.has(b);

    const B  = box('behind_house',   'BEHIND');
    const W  = box('west_of_house',  'WEST');
    const F  = box('front_of_house', 'FRONT');
    const N  = box('north_of_house', 'NORTH');
    const NS = box('north_side',     'N.SIDE');
    const S  = box('south_of_house', 'SOUTH');
    const SS = box('south_side',     'S.SIDE');
    const O  = box('ocean',          'BEACH');
    const Fo = box('forest',         'FOREST');

    const hWF  = has('west_of_house', 'front_of_house')  ? '──' : '  ';
    const hNNS = has('north_of_house', 'north_side')     ? '──' : '  ';
    const hSSS = has('south_of_house', 'south_side')     ? '──' : '  ';

    const vON  = has('ocean', 'north_of_house')          ? '│' : ' ';
    const vNF  = has('north_of_house', 'front_of_house') ? '│' : ' ';
    const vSF  = has('south_of_house', 'front_of_house') ? '│' : ' ';
    const vSFo = has('south_of_house', 'forest')         ? '│' : ' ';
    const vNSB = has('north_side', 'behind_house')       ? '│' : ' ';
    const vSSB = has('south_side', 'behind_house')       ? '│' : ' ';

    const lines = [
      `                    ${O}`,
      `                        ${vON}`,
      `                    ${N}${hNNS}${NS}`,
      `                     / ${vNF}              ${vNSB}`,
      `${W}${hWF}${F}              ${B}`,
      `                     \\ ${vSF}              ${vSSB}`,
      `                    ${S}${hSSS}${SS}`,
      `                        ${vSFo}`,
      `                    ${Fo}`,
    ];

    return lines.join('\n');
  }

  function renderIndoorMap(box, v) {
    const has = (a, b) => v.has(a) || v.has(b);

    const M  = box('main_room',   'MAIN');
    const G  = box('game_room',   'GAME');
    const T  = box('tommy_room',  'TOMMY');
    const R  = box('reena_room',  'REENA');
    const D  = box('deck_room',   'DECK');
    const Mg = box('maggie_room', 'MAGGIE');

    const cellarFound = v.has('game_room') || getFlags().codeEntered;
    const vMG = cellarFound ? '│' : ' ';
    const divider = cellarFound ? '  ═══════╤════════' : '';
    const vGT = has('game_room', 'tommy_room')  ? '│' : ' ';
    const vGR = has('game_room', 'reena_room')  ? '│' : ' ';
    const hGD = has('game_room', 'deck_room')   ? '──' : '  ';
    const hMgG = has('game_room', 'maggie_room') ? '──' : '  ';

    const lines = [
      `— Ground Floor —`,
      ``,
      `          ${M}`,
    ];

    if (cellarFound) {
      lines.push(divider);
      lines.push(`              ${vMG}`);
      lines.push(`— Below —`);
      lines.push(``);
      lines.push(`          ${T}`);
      lines.push(`              ${vGT}`);
      lines.push(`${Mg}${hMgG}${G}${hGD}${D}`);
      lines.push(`              ${vGR}`);
      lines.push(`          ${R}`);
    }

    return lines.join('\n');
  }

  return { renderMap };
}
