// このファイルの役目：マップを歩く画面。歩く・走る・壁で止まる・人に話す・宝箱・立て札・出入口を扱う。
// マップの中身（地形・人・宝箱）は js/data/maps/ にあり、ここは「動かし方」だけを書く。
// 決定キー＝目の前を調べる／話す、Xキー＝メニュー、Shift＝走る。
// 仲間はベルの後ろを一列についてくる（ぶつからない）。毒の仲間は、歩くたびに少しずつ体力が減る。
// 物語のしかけ：人の event（話すと場面が流れる）・if/unless/chapter（出る条件）、マップの onEnter（入ったとき）・
// triggers（踏んだとき）、出入口の requires（フラグが立つまで通れない）、tint（画面の色味）。
// places（フィールドマップで、立った場所の名前を左上に出す。note があれば下の行に由来）。
// ダンジョンのしかけ（gimmicks：岩・レバー・言霊で開く道・滑る床など）は js/systems/gimmick.js。
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
    let map, mapId, npcs, player, followers = [], rows = [];
    let poisonFlash = 0;
    let fade = 0, fadeDir = 0, pendingWarp = null, nameTimer = 0;
    let battleFlash = 0, pendingBattle = null;
    let sleeping = null;   // 宿屋で眠るとき、真っ暗になった瞬間に呼ぶ処理
    let enterCheck = false; // 入ったときの場面を、まだ確かめていない
    let script = null;      // 物語の場面で歩かされているとき { dir, left }
    let gst = null;         // しかけの状態（js/systems/gimmick.js）
    let forced = null;      // 滑る床・流れる床で、勝手に進む向き
    let hurtFlash = 0;
    let toast = '', toastTimer = 0;   // 上の小さな知らせ（名の欠片を拾ったとき）
    const BATTLE_FLASH_FRAMES = 30;

    function randWait() { return G.rng.int(B.NPC_WANDER_MIN, B.NPC_WANDER_MAX); }

    function load(id, x, y, dir) {
      mapId = id;
      map = G.DATA.maps[id];
      if (!map) throw new Error('マップが見つかりません：' + id);
      gst = G.gimmick.init(id, map);
      forced = null;
      npcs = (map.npcs || []).filter(n => G.flags.check(n)).concat(G.names.owners(mapId)).map(makeNpc);   // 名の欠片の持ち主も
      buildRows();
      player = makeEntity(x, y, dir || 'down', leaderLook());
      buildFollowers();
      Object.assign(G.state, { mapId: id, x, y, dir: player.dir });
      G.encounter.reset(map);
      // 敵の出ない場所（町・建物）に入ったら、自動で記録する（物語の場面の途中は記録しない）
      if (!map.encounter && !G.event.running && !G.state.resume) G.party.saveRecord();
      nameTimer = 120;
      enterCheck = !G.event.running;
      playBgm();
    }
    // 地形の文字。flagTiles（条件で変わるマス。隠し通路など）を上書きしてから使う
    function buildRows() {
      rows = map.rows.slice();
      (map.flagTiles || []).filter(o => G.flags.check(o)).forEach(o => {
        rows[o.y] = rows[o.y].slice(0, o.x) + o.ch + rows[o.y].slice(o.x + 1);
      });
      rows = G.gimmick.overlay(mapId, map, rows);
    }
    // 曲：マップの bgm、なければ js/data/music.js の割り当て。物語の場面が曲を決めているあいだは変えない
    function playBgm() {
      if (!G.sound || (G.event.running && G.event.musicLock > 0)) return;
      G.sound.bgm(G.musicForMap(mapId, map));
    }
    function makeNpc(n) { return Object.assign(makeEntity(n.x, n.y, n.dir || 'down', n.look), { data: n, wait: randWait() }); }
    // 場面が終わったあと、出る人を条件で入れ替える（いる人はその場に残す）
    function refreshNpcs() {
      // 名の欠片の持ち主（js/systems/names.js）も、このマップの人に加える
      const want = (map.npcs || []).filter(n => G.flags.check(n)).concat(G.names.owners(mapId));
      npcs = want.map(n => npcs.find(e => e.data === n) || makeNpc(n));
    }
    // 場面を流す（条件つきの一覧から、合う最初のもの）
    function runFirst(list) {
      const hit = (list || []).find(o => G.flags.check(o));
      if (!hit || G.event.running) return false;
      player.walk = 0; followers.forEach(f => { f.walk = 0; });
      G.event.run(hit.event);
      return true;
    }

    // ---- ついてくる仲間 ----
    // 先頭は、いま一緒に動いている仲間の1人目（ふつうはベル、別行動中はオオナムチ）
    function leaderLook() { const l = G.party.leader(); return l.look || (G.DATA.characters[l.id] || {}).look || 'bell'; }
    function followerIds() { return G.party.active().slice(1).map(m => m.id); }
    function buildFollowers() {
      followers = followerIds().map(id => makeEntity(player.x, player.y, player.dir, G.party.member(id).look || (G.DATA.characters[id] || {}).look || id));
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
      if (y < 0 || y >= rows.length || x < 0 || x >= rows[y].length) return null;
      return G.DATA.tiles[rows[y][x]] || G.DATA.tiles[' '];
    }
    const at = (list, x, y) => (list || []).find(o => o.x === x && o.y === y);
    // 出入口：同じマスに複数あるときは、when（条件）に合う最初のもの
    const warpAt = (x, y) => (map.warps || []).find(w => w.x === x && w.y === y && G.flags.check(w.when || null));
    function entityAt(x, y, except) {
      return npcs.concat([player]).find(e => e !== except && ((e.x === x && e.y === y) || (e.tx === x && e.ty === y)));
    }
    function blocked(x, y, self) {
      const t = tileAt(x, y);
      if (!t || t.solid) return true;
      if (at(map.chests, x, y) || at(map.signs, x, y)) return true;
      if (G.gimmick.blocks(gst, x, y)) return true;
      return !!entityAt(x, y, self);
    }

    // ---- 動き ----
    function tryMove(e, dir) {
      e.dir = dir;
      const [dx, dy] = DIRS[dir];
      const nx = e.x + dx, ny = e.y + dy;
      // 岩を押す（先頭だけ）
      if (e === player && !forced) G.gimmick.push(gimmickApi, dir, nx, ny);
      if (blocked(nx, ny, e)) return false;
      // まだ通れない出入口
      const w = e === player && warpAt(nx, ny);
      if (w && w.requires && !G.flags.check(w.requires)) { G.message.show(w.blockedText || 'まだ、ここから先へは行けない。'); return false; }
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
        // 見回り：patrol の点を順に歩く（9章の見張り）
        if (n.data.patrol) {
          if (--n.wait > 0) return;
          n.wait = n.data.patrolWait || 24;
          const pts = n.data.patrol;
          n.pi = n.pi || 0;
          let [tx, ty] = pts[n.pi];
          if (n.x === tx && n.y === ty) { n.pi = (n.pi + 1) % pts.length; [tx, ty] = pts[n.pi]; }
          const dir = tx > n.x ? 'right' : tx < n.x ? 'left' : ty > n.y ? 'down' : ty < n.y ? 'up' : n.dir;
          tryMove(n, dir);
          return;
        }
        if (n.data.move !== 'wander' || --n.wait > 0) return;
        n.wait = randWait();
        const dir = ['up', 'down', 'left', 'right'][G.rng.int(0, 3)];
        const [dx, dy] = DIRS[dir];
        const R = B.NPC_WANDER_RANGE;
        if (Math.abs(n.x + dx - n.data.x) > R || Math.abs(n.y + dy - n.data.y) > R) return;
        tryMove(n, dir);
      });
    }

    // 見張りの目：向いている方向の sight マス以内に先頭が入ると、caught の場面が流れる（壁の向こうは見えない）
    function spotted() {
      if (G.event.running) return false;
      for (const n of npcs) {
        const d = n.data;
        if (!d.sight || !G.flags.check(d.watchIf || null)) continue;
        const [dx, dy] = DIRS[n.dir];
        for (let k = 1; k <= d.sight; k++) {
          const x = n.x + dx * k, y = n.y + dy * k;
          const t = tileAt(x, y);
          if (!t || t.solid) break;
          if ((player.x === x && player.y === y) || (player.tx === x && player.ty === y)) {
            player.walk = 0;
            G.event.run(d.caught);
            return true;
          }
        }
      }
      return false;
    }

    // しかけ（js/systems/gimmick.js）から使う、この画面の道具
    const gimmickApi = {
      get st() { return gst; }, get map() { return map; }, get player() { return player; },
      tileAt,
      occupied: (x, y) => !!(at(map.chests, x, y) || at(map.signs, x, y) || G.gimmick.blocks(gst, x, y) || entityAt(x, y)),
      rebuild: () => { buildRows(); refreshNpcs(); },
    };

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
        // 名の欠片の持ち主：拾った欠片があれば返す
        if (d.nameOwner) {
          const lines = G.names.talk(d.nameOwner);
          if (lines.length > 2 && G.sound) G.sound.se('learn');
          G.message.show(lines);
          return;
        }
        // 寄り道の頼みごと（js/systems/quests.js）：届け先の人なら預かった物を渡す／頼む人なら頼みごとの話
        if (G.quests.receive(mapId, d.id)) return;
        if (d.quest && G.quests.talk(d.quest)) return;
        // 話すと場面が流れる人（doneFlag が立ったあとは、ふつうの会話）
        if (d.event && !(d.doneFlag && G.flags.get(d.doneFlag))) { G.event.run(d.event); return; }
        // クリア後（13章）は、支配が解けたあとのひと言（talkAfter）があればそちら
        const said = (G.state.chapter === 13 && d.talkAfter) || d.talk;
        G.message.show(said || ['……。'], () => {
          // ギルドの受付：済んだ依頼をまとめて報告する（js/systems/requests.js）
          const reported = d.requestDesk && G.state.requests ? G.requests.report() : [];
          if (reported.length) { G.sound.se('chest'); G.message.show(reported); return; }
          if (d.shop) G.shop.open(d.shop);
          else if (d.inn) G.shop.inn(done => { sleeping = done; fadeDir = 1; });
        });
        return;
      }
      if (G.gimmick.interact(gimmickApi, fx, fy)) return;
      if (G.quests.look(mapId, fx, fy)) return;   // 頼まれて調べる場所
      const chest = at(map.chests, fx, fy);
      if (chest) { openChest(chest); return; }
      const sign = at(map.signs, fx, fy);
      if (sign) { G.message.show(sign.text); return; }
      // 調べると場面が流れる場所
      const spot = (map.spots || []).find(o => o.x === fx && o.y === fy && G.flags.check(o));
      if (spot) { if (spot.board) G.scenes.openRequestBoard(); else if (spot.event) G.event.run(spot.event); else G.message.show(spot.text); return; }
      if (tile && tile.check) G.message.show(tile.check);
    }

    function openChest(chest) {
      const key = G.flags.chestKey(mapId, chest.id);
      if (G.flags.get(key)) { G.message.show('宝箱は、空っぽだ。'); return; }
      G.flags.set(key);
      if (G.sound) G.sound.se('chest');
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
      const w = warpAt(player.x, player.y);
      if (!w) return false;
      pendingWarp = w;
      fadeDir = 1;
      if (G.sound) G.sound.se('door');
      return true;
    }
    function updateFade() {
      fade += fadeDir / FADE_FRAMES;
      if (fadeDir > 0 && fade >= 1 && sleeping) {
        fade = 1;
        const f = sleeping;
        sleeping = null;
        fadeDir = -1;
        if (G.sound) G.sound.jingle('rest', G.musicForMap(mapId, map));   // 宿屋：一晩休んだ短い曲のあと、場所の曲へ
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
      const mw = rows[0].length * T, mh = rows.length * T;
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
      get rows() { return rows; },          // いまの地形（隠し通路・しかけを重ねたもの。テスト用）
      get gimmickState() { return gst; },
      resume() { refreshNpcs(); buildRows(); if (G.scene.top() === this) playBgm(); },
      // 物語の場面から歩かせる（js/systems/event.js の walk）
      scriptMove(dir, n) { script = { dir, left: n }; if (!n) player.dir = dir; },
      // 1コマ進める。まだ歩いていれば true
      tickScript() {
        if (player.moving) {
          followers.forEach(f => advance(f, B.WALK_SPEED));
          if (advance(player, B.WALK_SPEED)) Object.assign(G.state, { x: player.x, y: player.y, dir: player.dir });
          return true;
        }
        if (script && script.left > 0) {
          script.left--;
          const fx = player.x, fy = player.y;
          if (tryMove(player, script.dir)) { followStep(fx, fy); return true; }
        }
        script = null; player.walk = 0;
        return false;
      },

      update() {
        if (nameTimer > 0) nameTimer--;
        if (fadeDir) { updateFade(); return; }
        if (enterCheck) { enterCheck = false; if (runFirst(map.onEnter)) return; }
        // 敵に出会った：画面を点滅させてから戦闘へ
        if (battleFlash > 0) {
          if (--battleFlash === 0) G.scene.push(G.scenes.battle(pendingBattle, { bg: map.battleBg }));
          return;
        }
        const inp = G.input;

        // 仲間が入れ替わったら、ついてくる列を作り直す
        if (followers.map(f => f.id).join() !== followerIds().join() || player.look !== leaderLook()) {
          player.look = leaderLook();
          buildFollowers();
        }
        if (poisonFlash > 0) poisonFlash--;
        if (player.moving) {
          // 設定「いつも走る」が入なら、Shiftを押しているあいだだけ歩く
          const speed = inp.held('fast') !== !!G.settings.autoRun ? B.DASH_SPEED : B.WALK_SPEED;
          followers.forEach(f => advance(f, speed));
          if (advance(player, speed)) {
            Object.assign(G.state, { x: player.x, y: player.y, dir: player.dir });
            if (G.status.fieldStep().length) poisonFlash = 8;
            // 探知網の濃い場所では、歩くたびに阻害ゲージが減る。尽きたら正体露見
            if (G.inhibit.step(map)) { G.scene.change(G.scenes.exposure()); return; }
            if (checkWarp()) return;
            if (runFirst((map.triggers || []).filter(o => o.x === player.x && o.y === player.y))) return;
            // 名の欠片を踏んだら拾う（止まらずに、上に小さく知らせる）
            const frag = G.names.pickAt(mapId, player.x, player.y);
            if (frag) { toast = `名の欠片を拾った――「${frag.name}」（${frag.who}の名）`; toastTimer = 150; if (G.sound) G.sound.se('chest'); }
            // しかけ：熱い床・落とし穴・滑る床・流れる床
            const gs = G.gimmick.afterStep(gimmickApi, player.dir);
            if (gs.hurt) hurtFlash = 8;
            if (gs.fall) {
              const f = gs.fall;
              player.walk = 0;
              G.message.show(f.text || '足もとが崩れた！', () => { pendingWarp = { to: f.map, tx: f.x, ty: f.y, dir: f.dir || 'down' }; fadeDir = 1; });
              return;
            }
            forced = gs.slide || null;
            if (forced) return;
            const group = G.encounter.step(map, tileAt(player.x, player.y));
            if (group) { pendingBattle = group; battleFlash = BATTLE_FLASH_FRAMES; player.walk = 0; if (G.sound) G.sound.se('encounter'); return; }
          }
        }
        // 滑る床・流れる床：止まるまで勝手に進む
        if (!player.moving && forced) {
          const fx = player.x, fy = player.y, dir = forced;
          forced = null;
          if (tryMove(player, dir)) { followStep(fx, fy); forced = dir; }
          if (forced) { updateNpcs(); return; }
          // 止まったマスで、出会いを確かめる
          const group = G.encounter.step(map, tileAt(player.x, player.y));
          if (group) { pendingBattle = group; battleFlash = BATTLE_FLASH_FRAMES; player.walk = 0; if (G.sound) G.sound.se('encounter'); return; }
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
        if (spotted()) return;
      },

      draw() {
        const r = G.renderer, ctx = r.ctx;
        const cam = camera();
        r.clear(map.outside || '#000');
        const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
        const x1 = Math.min(rows[0].length - 1, Math.floor((cam.x + r.W) / T));
        const y1 = Math.min(rows.length - 1, Math.floor((cam.y + r.H) / T));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const t = G.DATA.tiles[rows[y][x]] || G.DATA.tiles[' '];
          G.tileset.draw(ctx, t.look, x * T - cam.x, y * T - cam.y);
        }
        // 小物と人物（下にいるものほど手前）
        const things = [];
        (map.chests || []).forEach(c => things.push({ y: c.y * T, draw: () =>
          G.sprite.drawObject(ctx, G.flags.get(G.flags.chestKey(mapId, c.id)) ? 'chestOpen' : 'chest', c.x * T - cam.x, c.y * T - cam.y) }));
        (map.signs || []).forEach(s => things.push({ y: s.y * T, draw: () =>
          G.sprite.drawObject(ctx, 'sign', s.x * T - cam.x, s.y * T - cam.y) }));
        // 仲間は列の後ろから描き、ベルがいちばん手前になるようにする
        // 阻害ゲージが少ないと、ベルの輪郭が揺れる
        const jitter = e => (e.look === 'bell' && G.inhibit.warning() && G.frame % 6 < 2 ? (G.frame % 4 < 2 ? 1 : -1) : 0);
        // 偽名の間、オオナムチと一緒にいないベルは、印象が薄れて見える（仕様書 7-1）
        const partyLooks = G.party.active().map(m => ({ look: G.DATA.characters[m.id] ? m.id : m.look }));
        const fadeOf = e => (e === player ? G.inhibit.impression(e.look, partyLooks) : 1);
        followers.slice().reverse().forEach((e, k) => things.push({ y: e.py - 0.01 * (k + 1), draw: () => {
          ctx.globalAlpha = fadeOf(e); G.sprite.drawPerson(ctx, e.look, e.dir, e.walk, e.moving, e.px - cam.x + jitter(e), e.py - cam.y); ctx.globalAlpha = 1; } }));
        npcs.concat([player]).forEach(e => things.push({ y: e.py, draw: () => {
          ctx.globalAlpha = fadeOf(e); G.sprite.drawPerson(ctx, e.look, e.dir, e.walk, e.moving, e.px - cam.x + jitter(e), e.py - cam.y); ctx.globalAlpha = 1; } }));
        G.gimmick.things(gst, ctx, cam, T).forEach(t => things.push(t));
        things.push({ y: -1, draw: () => G.names.draw(ctx, mapId, cam, T) });   // 名の欠片の光（人より下に）
        things.sort((a, b) => a.y - b.y).forEach(t => t.draw());
        const tint = typeof map.tint === 'function' ? map.tint() : map.tint;
        if (tint) r.rect(0, 0, r.W, r.H, tint);
        G.gimmick.drawDark(r, gst, player, cam, T);
        if (hurtFlash > 0) { hurtFlash--; r.rect(0, 0, r.W, r.H, 'rgba(220,60,30,0.25)'); }
        // 上の小さな知らせ（名の欠片を拾った など）
        if (toastTimer > 0) {
          toastTimer--;
          const w = Math.min(464, Math.ceil(r.measure(toast)) + 24);
          ctx.save(); ctx.globalAlpha = Math.min(1, toastTimer / 20);
          G.ui.drawWindow((r.W - w) / 2, 40, w, 26); r.text(toast, r.W / 2, 47, '#fff4c0', 'center', null, w - 16);
          ctx.restore();
        }

        if (nameTimer > 0 && !fadeDir && G.scene.top() === this) {
          const w = Math.ceil(r.measure(map.name)) + 24;
          G.ui.drawWindow(8, 8, w, 26);
          r.text(map.name, 20, 15, '#fff');
        }
        // フィールドマップ：町や土地の上に立つと、その名前を出す（places）
        const place = (map.places || []).find(p => p.x === player.x && p.y === player.y);
        if (place && nameTimer <= 0 && !fadeDir && G.scene.top() === this) {
          const w = Math.ceil(Math.max(r.measure(place.name), place.note ? r.measure(place.note) : 0)) + 24;
          G.ui.drawWindow(8, 8, Math.min(w, r.W - 140), place.note ? 44 : 26);
          r.text(place.name, 20, 15, '#ffd866');
          if (place.note) r.text(place.note, 20, 32, '#ccc');
        }
        if (G.scene.top() === this && !fadeDir) G.inhibit.drawGauge(r.W - 124, 8);
        if (poisonFlash > 0) r.rect(0, 0, r.W, r.H, 'rgba(80,200,60,0.25)');
        if (fade > 0) r.rect(0, 0, r.W, r.H, `rgba(0,0,0,${Math.min(1, fade)})`);
        if (battleFlash > 0 && Math.floor(battleFlash / 4) % 2 === 0) r.rect(0, 0, r.W, r.H, 'rgba(255,255,255,0.7)');
      },
    };
  };
})();
