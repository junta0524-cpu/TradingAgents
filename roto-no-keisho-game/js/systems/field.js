// フィールド移動 ― タイル単位の移動、遭遇判定、門/ボス床/NPCへの到達判定
var Game = window.Game || {};
Game.Field = (function () {
  var map = null;
  var px = 0, py = 0;
  var moveCooldown = 0;
  var MOVE_DELAY = 9; // フレーム数(約60fpsで0.15秒間隔)
  var callbacks = {};

  function load(mapId, cbs) {
    map = Game.Data.Maps[mapId];
    px = map.startX; py = map.startY;
    callbacks = cbs || {};
  }

  function currentMap() { return map; }
  function playerPos() { return { x: px, y: py }; }
  // 全滅から復帰した際など、現在のマップの入り口へ戻す
  function resetToStart() { if (map) { px = map.startX; py = map.startY; } }

  // セーブから復帰したときに、記録されていた立ち位置へ戻す
  function setPosition(x, y) {
    if (!map) return;
    var def = Game.Data.TileDefs[tileAt(x, y)];
    if (def && def.walkable) { px = x; py = y; }
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
    var table = Game.Data.EncounterTables[map.encounterTable];
    if (!table || table.length === 0) return null;
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

    if (def.isGate) { callbacks.onGate && callbacks.onGate(); return; }
    if (def.isBoss) { callbacks.onBoss && callbacks.onBoss(map.bossId); return; }
    if (def.shop) { callbacks.onShop && callbacks.onShop(def.shop, map.id); return; }
    if (def.isNpc) { callbacks.onNpc && callbacks.onNpc(map); return; }
    if (tryEncounter(tile)) {
      var mid = pickEncounter();
      if (mid) callbacks.onEncounter && callbacks.onEncounter(mid);
    }
  }

  function draw(ctx) {
    if (!map) return;
    var off = Game.Renderer.mapOffset(map, ctx.canvas.width);
    Game.Renderer.drawMap(ctx, map, off);
    Game.Renderer.drawToken(ctx, px, py, '#d4af5a', off);
  }

  return {
    load: load, currentMap: currentMap, playerPos: playerPos,
    resetToStart: resetToStart, setPosition: setPosition,
    update: update, draw: draw,
  };
})();
