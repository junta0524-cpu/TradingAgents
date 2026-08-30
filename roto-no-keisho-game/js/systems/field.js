// フィールド移動 ― タイル単位の移動、遭遇判定、門/ボス床/NPCへの到達判定
var Game = window.Game || {};
Game.Field = (function () {
  var map = null;
  var px = 0, py = 0;
  var moveCooldown = 0;
  var MOVE_DELAY = 9; // フレーム数(約60fpsで0.15秒間隔)
  // 1マスを一瞬で飛ぶと「コマ落ち」に見える。動いている間の途中の位置を作り、
  // 描画にだけ小数のタイル座標を渡して、ドット単位で滑らせる。
  var moveFrom = null;   // 動き出す前の先頭の位置
  var moveSpan = 0;      // 補間にかけるフレーム数(門で足止めされたときは 0)
  var callbacks = {};

  // ---- 隊列 ----
  // trail は先頭が通ったマスの履歴。trail[0] に2人目、trail[1] に3人目…が立つ。
  // 先頭の足跡をそのまま辿るので、通れない場所に入り込むことがない。
  var trail = [];
  var facing = 'down';   // 先頭が向いている方向
  var steps = 0;         // 歩数。歩行アニメのコマ送りに使う
  var TRAIL_MAX = 5;

  // 0(動き出し)→1(到着)。止まっているときは 1。
  function progress() {
    if (!moveSpan || moveCooldown <= 0) return 1;
    var t = 1 - moveCooldown / moveSpan;
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // いま画面上のどこに居るか(小数のタイル座標)
  function visualPos() {
    var t = progress();
    if (!moveFrom || t >= 1) return { x: px, y: py };
    return { x: lerp(moveFrom.x, px, t), y: lerp(moveFrom.y, py, t) };
  }

  function resetTrail() {
    trail = [];
    for (var i = 0; i < TRAIL_MAX; i++) trail.push({ x: px, y: py });
    facing = 'down';
    steps = 0;
    // 場所を飛ばしたときは補間を切る。切らないと、前の立ち位置から
    // 新しい立ち位置まで画面を横切って滑ってしまう
    moveFrom = null;
    moveSpan = 0;
    moveCooldown = 0;
  }

  function load(mapId, cbs) {
    map = Game.Data.Maps[mapId];
    px = map.startX; py = map.startY;
    // 呼び出し側が省略したときは、直前のイベント一式をそのまま使う
    callbacks = cbs && Object.keys(cbs).length ? cbs : callbacks;
    resetTrail();
  }

  function currentMap() { return map; }
  function playerPos() { return { x: px, y: py }; }
  // 全滅から復帰した際など、現在のマップの入り口へ戻す
  function resetToStart() { if (map) { px = map.startX; py = map.startY; resetTrail(); } }

  // セーブから復帰したときに、記録されていた立ち位置へ戻す
  function setPosition(x, y) {
    if (!map) return;
    var def = Game.Data.TileDefs[tileAt(x, y)];
    if (def && def.walkable) { px = x; py = y; resetTrail(); }
  }

  // 仕掛けを点ける。タイルの文字を 'L' から 'l' へ書き換えるだけで、
  // 描画も歩ける判定も、ふつうのタイルとして扱われる
  function lightSwitch(x, y) {
    if (!map) return false;
    var row = map.tiles[y];
    if (!row || row[x] !== 'L') return false;
    map.tiles[y] = row.substring(0, x) + 'l' + row.substring(x + 1);
    return true;
  }

  function tileAt(x, y) {
    var row = map.tiles[y];
    if (!row) return null;
    return row[x];
  }

  // トヘロスの効き目。残り歩数のあいだ、弱い魔物は寄ってこない。
  var wardLeft = 0;
  function wardSteps(n) { wardLeft = Math.max(wardLeft, n || 0); }

  function tryEncounter(tileChar) {
    var def = Game.Data.TileDefs[tileChar];
    if (!def || def.encounter <= 0) return false;
    if (wardLeft > 0) {
      wardLeft -= 1;
      // 効いている間も、格上の魔物だけはまれに出る
      return Math.random() < def.encounter * 0.15 * Game.Moon.encounterScale();
    }
    // 闇が濃いほど魔物は出る。満月の下ではおとなしい
    return Math.random() < def.encounter * Game.Moon.encounterScale();
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

  // 一体だけでなく、群れで出てくることがある。
  // 弱い魔物ほど数を揃えやすく、強い個体は単独で現れる。
  function pickEncounterGroup() {
    var lead = pickEncounter();
    if (!lead) return [];
    var def = Game.Data.Monsters[lead];
    var count = 1 + Math.floor(Math.random() * Game.Data.groupLimitOf(def));
    var group = [lead];
    for (var i = 1; i < count; i++) {
      // ときどき違う魔物が混ざる
      group.push(Math.random() < 0.3 ? (pickEncounter() || lead) : lead);
    }
    return group;
  }

  // 毒に侵された仲間は歩くたびに削られる。一定歩数ごとに1ダメージ。
  // 歩いて死ぬのは理不尽なので、HPは1で止める。
  var stepsWalked = 0;
  function tickFieldPoison() {
    var poisoned = Game.Party.aliveList().filter(function (m) {
      var d = Game.Party.statusOf(m);
      return d && d.fieldStepDamage;
    });
    if (poisoned.length === 0) { stepsWalked = 0; return false; }

    stepsWalked += 1;
    var def = Game.Party.statusOf(poisoned[0]);
    if (stepsWalked < def.fieldStepInterval) return false;
    stepsWalked = 0;

    var names = [];
    poisoned.forEach(function (m) {
      var d = Game.Party.statusOf(m);
      m.hp = Math.max(1, m.hp - d.fieldStepDamage);
      names.push(m.name);
    });
    Game.Audio.play('poison');
    Game.Dialogue.show(names.join('と') + 'は どくで じわじわと 体力を うばわれている……');
    return true;
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
    // 月光の門は満月のあいだだけ開く。閉じているときは、いつ開くかを伝える
    if (def.moonGate && !Game.Moon.isFull()) {
      Game.Dialogue.show('月光の門は 固く閉じている。(満月まで あと ' +
        Game.Moon.stepsToFull() + '歩  いまは ' + Game.Moon.label() + ')');
      moveCooldown = MOVE_DELAY * 3;
      return;
    }

    // 先頭が動く前にいたマスを履歴の先頭へ。仲間はこれを順に辿る
    trail.unshift({ x: px, y: py });
    if (trail.length > TRAIL_MAX) trail.length = TRAIL_MAX;
    facing = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
    steps += 1;
    Game.Moon.step();   // 世界の時計。歩くほどに月が満ち欠けする
    moveFrom = { x: px, y: py };
    moveSpan = MOVE_DELAY;
    px = nx; py = ny;
    callbacks.onStep && callbacks.onStep();
    moveCooldown = MOVE_DELAY;
    // 毒の報せは出すが、踏んだマスの出来事はそのまま起こす。
    // ここで打ち切ってしまうと、毒を受けている間だけ 門・ボス床・宝箱・店・
    // 町の人 が反応しなくなり、その場に立ったまま先へ進めなくなる
    // (踏み直さないと二度と反応しないので、詰みになる)。
    var poisonTicked = tickFieldPoison();

    if (def.isGate) { callbacks.onGate && callbacks.onGate(); return; }
    if (def.isBoss) { callbacks.onBoss && callbacks.onBoss(map.bossId); return; }
    if (def.shop) { callbacks.onShop && callbacks.onShop(def.shop, map.id); return; }
    if (def.isChest) {
      var chestId = map.chestAt && map.chestAt[nx + ',' + ny];
      callbacks.onChest && callbacks.onChest(chestId, map.id, nx + ',' + ny);
      return;
    }
    if (def.isSwitch) {
      // まだ点いていない仕掛けだけが反応する。踏み直しても数は増えない
      if (!def.lit) callbacks.onSwitch && callbacks.onSwitch(nx, ny, map);
      return;
    }
    if (def.isNpc) {
      // 誰に話しかけたかは、立ち位置から引く
      var npcId = map.npcAt && map.npcAt[nx + ',' + ny];
      callbacks.onNpc && callbacks.onNpc(npcId, map);
      return;
    }
    // 毒で削られた直後に不意打ちまで重ねない。そのぶんは一歩見逃す
    if (!poisonTicked && tryEncounter(tile)) {
      var group = pickEncounterGroup();
      if (group.length) callbacks.onEncounter && callbacks.onEncounter(group);
    }
  }

  // 歩行アニメのコマ。立ち→右足→立ち→左足 の4拍で回す。
  // シートが3コマ(左足/立ち/右足)なので、その並びを指す。
  var FRAME_CYCLE = [1, 0, 1, 2];

  // 一人ぶんの描画情報を作る。歩行シートがあれば動き、無ければ立ち絵、
  // それも無ければ色の丸になる。
  function actorFor(member, x, y, dir) {
    var walk = Game.Assets.walkSheet(member.id, dir);
    if (walk) {
      // 歩いている間だけ足を出し、止まったら立ち姿(1コマ目)に戻す
      var moving = progress() < 1;
      return {
        x: x, y: y, img: walk.img, frames: walk.frames, flip: walk.flip,
        frame: moving ? FRAME_CYCLE[steps % FRAME_CYCLE.length] : 1,
      };
    }
    return {
      x: x, y: y, img: Game.Assets.sprite(member.id) || null,
      color: member.tokenColor || '#d4af5a',
    };
  }

  // 隊列。先頭は自分の位置、以降は足跡を順に辿る。
  // 向きは「一つ前の仲間がどちらにいるか」から決める。
  function partyActors() {
    var members = Game.Party.list();
    var out = [];
    var t = progress();
    var lead = visualPos();
    var aheadX = px, aheadY = py;
    members.forEach(function (m, i) {
      if (i === 0) { out.push(actorFor(m, lead.x, lead.y, facing)); return; }
      // 到着地点は trail[i-1]、出発地点は trail[i]。先頭と同じ拍で滑る
      var to = trail[i - 1] || { x: px, y: py };
      var from = trail[i] || to;
      var dx = aheadX - to.x, dy = aheadY - to.y;
      var dir = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : dx > 0 ? 'right' : facing;
      out.push(actorFor(m, lerp(from.x, to.x, t), lerp(from.y, to.y, t), dir));
      aheadX = to.x; aheadY = to.y;
    });
    return out;
  }

  function draw(ctx) {
    if (!map) return;
    var off = Game.Renderer.mapOffset(map, ctx.canvas.width, ctx.canvas.height, visualPos());
    Game.Renderer.drawMap(ctx, map, off);
    // 町の人と隊列をまとめて、手前の者ほど後に描く
    Game.Renderer.drawActors(ctx, Game.Renderer.npcActors(map).concat(partyActors()), off);
  }

  return {
    load: load, currentMap: currentMap, playerPos: playerPos, lightSwitch: lightSwitch,
    stepCount: function () { return steps; },
    resetToStart: resetToStart, setPosition: setPosition, wardSteps: wardSteps,
    __visual: visualPos,   // 検証用: 画面上のいまの位置(小数)
    update: update, draw: draw,
    // 検証用: いま使っているイベント一式
    __cbs: null,
    // 検証用: いま隊列がどのマスにいるか
    __actors: partyActors,
  };
})();
