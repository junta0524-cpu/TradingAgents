// このファイルの役目：マップを歩く画面。歩く・走る・壁で止まる・人に話す・宝箱・立て札・出入口を扱う。
// マップの中身（地形・人・宝箱）は js/data/maps/ にあり、ここは「動かし方」だけを書く。
// 決定キー＝目の前を調べる／話す、Xキー＝メニュー、Shift＝走る。
// 仲間はベルの後ろを一列についてくる（ぶつからない）。毒の仲間は、歩くたびに少しずつ体力が減る。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const T = 16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const FADE_FRAMES = 12;

  function makeEntity(x, y, dir, look) {
    return { x, y, tx: x, ty: y, px: x * T, py: y * T, dir, look, moving: false, walk: 0 };
  }

  G.scenes.map = function (startMap, startX, startY, startDir) {
    const B = G.DATA.balance;
    let map, mapId, npcs, player, followers = [];
    let poisonFlash = 0;
    let fade = 0, fadeDir = 0, pendingWarp = null, nameTimer = 0;
    let battleFlash = 0, pendingBattle = null;
    let sleeping = null;   // 宿屋で眠るとき、真っ暗になった瞬間に呼ぶ処理
    const BATTLE_FLASH_FRAMES = 30;

    function randWait() { return G.rng.int(B.NPC_WANDER_MIN, B.NPC_WANDER_MAX); }

    function load(id, x, y, dir) {
      mapId = id;
      map = G.DATA.maps[id];
      if (!map) throw new Error('マップが見つかりません：' + id);
      npcs = (map.npcs || []).map(n => Object.assign(makeEntity(n.x, n.y, n.dir || 'down', n.look), { data: n, wait: randWait() }));
      player = makeEntity(x, y, dir || 'down', 'bell');
      buildFollowers();
      Object.assign(G.state, { mapId: id, x, y, dir: player.dir });
      G.encounter.reset(map);
      // 敵の出ない場所（町・建物）に入ったら、自動で記録する
      if (!map.encounter) G.party.saveRecord();
      nameTimer = 120;
    }

    // ---- ついてくる仲間 ----
    function followerIds() { return G.state.party.filter(m => m.id !== 'bell').map(m => m.id); }
    function buildFollowers() {
      followers = followerIds().map(id => makeEntity(player.x, player.y, player.dir, (G.DATA.characters[id] || {}).look || id));
      followers.forEach((f, i) => { f.id = followerIds()[i]; });
    }
    // ベルが1歩動き出したら、前の人がいた場所へ1歩ずつ詰める
    function followStep(fromX, fromY) {
      let px = fromX, py = fromY;
      followers.forEach(f => {
        const ox = f.x, oy = f.y;
        if (ox !== px || oy !== py) {
          f.dir = px > ox ? 'right' : px < ox ? 'left' : py > oy ? 'down' : 'up';
          f.tx = px; f.ty = py; f.moving = true;
        }
        px = ox; py = oy;
      });
    }

    // ---- 地形と当たり判定 ----
    function tileAt(x, y) {
      if (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[y].length) return null;
      return G.DATA.tiles[map.rows[y][x]] || G.DATA.tiles[' '];
    }
    const at = (list, x, y) => (list || []).find(o => o.x === x && o.y === y);
    function entityAt(x, y, except) {
      return npcs.concat([player]).find(e => e !== except && ((e.x === x && e.y === y) || (e.tx === x && e.ty === y)));
    }
    function blocked(x, y, self) {
      const t = tileAt(x, y);
      if (!t || t.solid) return true;
      if (at(map.chests, x, y) || at(map.signs, x, y)) return true;
      return !!entityAt(x, y, self);
    }

    // ---- 動き ----
    function tryMove(e, dir) {
      e.dir = dir;
      const [dx, dy] = DIRS[dir];
      const nx = e.x + dx, ny = e.y + dy;
      if (blocked(nx, ny, e)) return false;
      e.tx = nx; e.ty = ny; e.moving = true;
      return true;
    }
    // 1コマ分進める。目的のマスに着いたら true
    function advance(e, speed) {
      if (!e.moving) return false;
      const gx = e.tx * T, gy = e.ty * T;
      const step = v => Math.sign(v) * Math.min(Math.abs(v), speed);
      e.px += step(gx - e.px);
      e.py += step(gy - e.py);
      e.walk += speed;
      if (e.px === gx && e.py === gy) {
        e.x = e.tx; e.y = e.ty; e.moving = false;
        return true;
      }
      return false;
    }

    function heldDir() {
      const inp = G.input;
      if (inp.held(player.dir)) return player.dir;   // 今の向きを優先（斜め押しでカクカクしない）
      return ['up', 'down', 'left', 'right'].find(d => inp.held(d)) || null;
    }

    function updateNpcs() {
      npcs.forEach(n => {
        if (n.moving) { advance(n, 1); return; }
        if (n.data.move !== 'wander' || --n.wait > 0) return;
        n.wait = randWait();
        const dir = ['up', 'down', 'left', 'right'][G.rng.int(0, 3)];
        const [dx, dy] = DIRS[dir];
        const R = B.NPC_WANDER_RANGE;
        if (Math.abs(n.x + dx - n.data.x) > R || Math.abs(n.y + dy - n.data.y) > R) return;
        tryMove(n, dir);
      });
    }

    // ---- 調べる・話す ----
    function interact() {
      const [dx, dy] = DIRS[player.dir];
      let fx = player.x + dx, fy = player.y + dy;
      let tile = tileAt(fx, fy);
      // 台（カウンター）越しに話しかける
      if (tile && tile.counter) { fx += dx; fy += dy; }

      const npc = entityAt(fx, fy, player);
      if (npc && npc.data) {
        npc.dir = OPP[player.dir];
        const d = npc.data;
        G.message.show(d.talk || ['……。'], () => {
          if (d.shop) G.shop.open(d.shop);
          else if (d.inn) G.shop.inn(done => { sleeping = done; fadeDir = 1; });
        });
        return;
      }
      const chest = at(map.chests, fx, fy);
      if (chest) { openChest(chest); return; }
      const sign = at(map.signs, fx, fy);
      if (sign) { G.message.show(sign.text); return; }
      if (tile && tile.check) G.message.show(tile.check);
    }

    function openChest(chest) {
      const key = G.flags.chestKey(mapId, chest.id);
      if (G.flags.get(key)) { G.message.show('宝箱は、空っぽだ。'); return; }
      G.flags.set(key);
      let got;
      if (chest.copper) {
        G.party.addCopper(chest.copper);
        got = `銅貨${chest.copper}枚を手に入れた。`;
      } else {
        G.party.addItem(chest.item, chest.count || 1);
        const item = G.DATA.items[chest.item];
        got = `${item ? item.name : chest.item}を手に入れた。`;
      }
      G.message.show(['宝箱を開けた！\n' + got]);
    }

    // ---- 出入口 ----
    function checkWarp() {
      const w = at(map.warps, player.x, player.y);
      if (!w) return false;
      pendingWarp = w;
      fadeDir = 1;
      return true;
    }
    function updateFade() {
      fade += fadeDir / FADE_FRAMES;
      if (fadeDir > 0 && fade >= 1 && sleeping) {
        fade = 1;
        const f = sleeping;
        sleeping = null;
        fadeDir = -1;
        f();
        return;
      }
      if (fadeDir > 0 && fade >= 1) {
        fade = 1;
        const w = pendingWarp;
        pendingWarp = null;
        load(w.to, w.tx, w.ty, w.dir || player.dir);
        fadeDir = -1;
      } else if (fadeDir < 0 && fade <= 0) {
        fade = 0;
        fadeDir = 0;
      }
    }

    // ---- 画面に映す範囲 ----
    function camera() {
      const r = G.renderer;
      const mw = map.rows[0].length * T, mh = map.rows.length * T;
      const fit = (pos, size, view) => size <= view
        ? -Math.floor((view - size) / 2)
        : Math.max(0, Math.min(size - view, pos + T / 2 - view / 2));
      return { x: Math.round(fit(player.px, mw, r.W)), y: Math.round(fit(player.py, mh, r.H)) };
    }

    load(startMap, startX, startY, startDir);

    return {
      name: 'マップ',
      opaque: true,
      // デバッグなどから見えるように
      get mapId() { return mapId; },
      get player() { return player; },

      update() {
        if (nameTimer > 0) nameTimer--;
        if (fadeDir) { updateFade(); return; }
        // 敵に出会った：画面を点滅させてから戦闘へ
        if (battleFlash > 0) {
          if (--battleFlash === 0) G.scene.push(G.scenes.battle(pendingBattle));
          return;
        }
        const inp = G.input;

        // 仲間が入れ替わったら、ついてくる列を作り直す
        if (followers.map(f => f.id).join() !== followerIds().join()) buildFollowers();
        if (poisonFlash > 0) poisonFlash--;
        if (player.moving) {
          const speed = inp.held('fast') ? B.DASH_SPEED : B.WALK_SPEED;
          followers.forEach(f => advance(f, speed));
          if (advance(player, speed)) {
            Object.assign(G.state, { x: player.x, y: player.y, dir: player.dir });
            if (G.status.fieldStep().length) poisonFlash = 8;
            if (checkWarp()) return;
            const group = G.encounter.step(map, tileAt(player.x, player.y));
            if (group) { pendingBattle = group; battleFlash = BATTLE_FLASH_FRAMES; player.walk = 0; return; }
          }
        }
        if (!player.moving) {
          if (inp.pressed('cancel')) { G.scene.push(G.scenes.fieldMenu()); return; }
          if (inp.pressed('ok')) { interact(); return; }
          const dir = heldDir();
          const fx = player.x, fy = player.y;
          if (dir) { if (tryMove(player, dir)) followStep(fx, fy); }
          else { player.walk = 0; followers.forEach(f => { f.walk = 0; }); }
        }
        updateNpcs();
      },

      draw() {
        const r = G.renderer, ctx = r.ctx;
        const cam = camera();
        r.clear(map.outside || '#000');
        const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
        const x1 = Math.min(map.rows[0].length - 1, Math.floor((cam.x + r.W) / T));
        const y1 = Math.min(map.rows.length - 1, Math.floor((cam.y + r.H) / T));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const t = G.DATA.tiles[map.rows[y][x]] || G.DATA.tiles[' '];
          G.tileset.draw(ctx, t.look, x * T - cam.x, y * T - cam.y);
        }
        // 小物と人物（下にいるものほど手前）
        const things = [];
        (map.chests || []).forEach(c => things.push({ y: c.y * T, draw: () =>
          G.sprite.drawObject(ctx, G.flags.get(G.flags.chestKey(mapId, c.id)) ? 'chestOpen' : 'chest', c.x * T - cam.x, c.y * T - cam.y) }));
        (map.signs || []).forEach(s => things.push({ y: s.y * T, draw: () =>
          G.sprite.drawObject(ctx, 'sign', s.x * T - cam.x, s.y * T - cam.y) }));
        // 仲間は列の後ろから描き、ベルがいちばん手前になるようにする
        followers.slice().reverse().forEach((e, k) => things.push({ y: e.py - 0.01 * (k + 1), draw: () =>
          G.sprite.drawPerson(ctx, e.look, e.dir, e.walk, e.moving, e.px - cam.x, e.py - cam.y) }));
        npcs.concat([player]).forEach(e => things.push({ y: e.py, draw: () =>
          G.sprite.drawPerson(ctx, e.look, e.dir, e.walk, e.moving, e.px - cam.x, e.py - cam.y) }));
        things.sort((a, b) => a.y - b.y).forEach(t => t.draw());

        if (nameTimer > 0 && !fadeDir && G.scene.top() === this) {
          const w = Math.ceil(r.measure(map.name)) + 24;
          G.ui.drawWindow(8, 8, w, 26);
          r.text(map.name, 20, 15, '#fff');
        }
        if (poisonFlash > 0) r.rect(0, 0, r.W, r.H, 'rgba(80,200,60,0.25)');
        if (fade > 0) r.rect(0, 0, r.W, r.H, `rgba(0,0,0,${Math.min(1, fade)})`);
        if (battleFlash > 0 && Math.floor(battleFlash / 4) % 2 === 0) r.rect(0, 0, r.W, r.H, 'rgba(255,255,255,0.7)');
      },
    };
  };
})();
