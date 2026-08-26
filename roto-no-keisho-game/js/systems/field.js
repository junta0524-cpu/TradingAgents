// フィールド移動 ― タイル単位の移動、遭遇判定、街の門への到達判定
var Game = window.Game || {};
Game.Field = (function () {
  var map = null;
  var px = 0, py = 0;
  var moveCooldown = 0;
  var MOVE_DELAY = 9; // フレーム数(約60fpsで0.15秒間隔)
  var onEncounter = null;
  var onGate = null;

  function load(mapId, callbacks) {
    map = Game.Data.Maps[mapId];
    px = map.startX; py = map.startY;
    onEncounter = callbacks.onEncounter;
    onGate = callbacks.onGate;
  }

  function tileAt(x, y) {
    var row = map.tiles[y];
    if (!row) return null;
    return row[x];
  }

  function tryEncounter(tileChar) {
    var def = Game.Data.TileDefs[tileChar];
    if (!def || def.encounter <= 0) return false;
    return Math.random() < def.encounter;
  }

  function pickEncounter() {
    var table = Game.Data.EncounterTable;
    var total = table.reduce(function (s, e) { return s + e.weight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < table.length; i++) {
      r -= table[i].weight;
      if (r <= 0) return table[i].id;
    }
    return table[0].id;
  }

  function update() {
    if (!map) return;
    if (moveCooldown > 0) { moveCooldown--; return; }

    var dx = 0, dy = 0;
    if (Game.Input.isDown('up')) dy = -1;
    else if (Game.Input.isDown('down')) dy = 1;
    else if (Game.Input.isDown('left')) dx = -1;
    else if (Game.Input.isDown('right')) dx = 1;
    if (dx === 0 && dy === 0) return;

    var nx = px + dx, ny = py + dy;
    var tile = tileAt(nx, ny);
    var def = tile && Game.Data.TileDefs[tile];
    if (!def || !def.walkable) return;

    px = nx; py = ny;
    moveCooldown = MOVE_DELAY;

    if (def.isGate) { onGate && onGate(); return; }
    if (tryEncounter(tile)) { onEncounter && onEncounter(pickEncounter()); }
  }

  function draw(ctx) {
    if (!map) return;
    Game.Renderer.drawMap(ctx, map);
    Game.Renderer.drawToken(ctx, px, py, '#d4af5a');
  }

  return { load: load, update: update, draw: draw };
})();
