// このファイルの役目：戦闘の画面。上に敵、下にコマンド、右上に味方の体力を出す。
// 計算は js/systems/battle.js に任せ、ここは「選ばせる・見せる・待つ」だけを受け持つ。
// 流れ：現れた → 仲間ごとにコマンドを選ぶ → 素早い順に行動 → 勝ち・負け・逃げるまでくり返す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const MSG_WAIT = 40;        // 1行出してから次へ進むまでのコマ数
  const MSG_WAIT_FAST = 6;    // 決定キーやShiftで早送りしたとき
  const LOG_LINES = 4;
  const COMMANDS = [
    { label: 'こうげき', type: 'attack' },
    { label: 'ぼうぎょ', type: 'defend' },
    { label: 'にげる', type: 'escape' },
  ];
  const ENEMY_SCALE = 3;
  const ENEMY_BASE_Y = 178;   // 敵の足元の高さ

  G.debugOpts = G.debugOpts || { showCalc: false };

  // group：敵の id の配列。opts.boss：逃げられない戦い
  G.scenes.battle = function (group, opts) {
    opts = opts || {};
    const st = G.battle.create(G.state.party, group, { boss: opts.boss, showCalc: G.debugOpts.showCalc });
    const party = st.party, enemies = st.enemies;

    let phase = 'play';         // play / command / target / result / gameover
    const log = [];
    let queue = [], afterPlay = null, waitTimer = 0;
    let commands = [], cmdIndex = 0, menu = null, targetIndex = 0;
    let flash = null, flashTimer = 0, shake = 0;
    const fading = {};          // 倒れた敵が消えていく途中
    let gameoverTimer = 0;

    // ---- 文章と出来事を順に見せる ----
    function say(text, color) {
      log.push({ text, color: color || '#fff' });
      while (log.length > LOG_LINES) log.shift();
    }
    function play(events, then) {
      queue = queue.concat(events);
      afterPlay = then || null;
    }
    function playStep() {
      const inp = G.input;
      if (waitTimer > 0) {
        if (inp.pressed('ok') || inp.held('fast')) waitTimer = Math.min(waitTimer, inp.held('fast') ? MSG_WAIT_FAST : 1);
        waitTimer--;
        return true;
      }
      if (queue.length) {
        const ev = queue.shift();
        if (ev.type === 'msg') { say(ev.text); waitTimer = MSG_WAIT; }
        else if (ev.type === 'calc') { say(ev.text, '#9ab'); waitTimer = MSG_WAIT / 2; }
        else if (ev.type === 'damage') {
          flash = ev.target; flashTimer = 16;
          if (ev.target.side === 'party' && ev.amount > 0) shake = 10;
          waitTimer = 8;
        } else if (ev.type === 'ko' && ev.target.side === 'enemy') { fading[ev.target.key] = 20; }
        return true;
      }
      if (afterPlay) { const f = afterPlay; afterPlay = null; f(); return true; }
      return false;
    }

    // ---- コマンド選び ----
    const aliveParty = () => party.filter(p => p.hp > 0);
    function beginInput() {
      party.forEach(p => { p.defending = false; });
      commands = [];
      cmdIndex = party.findIndex(p => p.hp > 0);
      openMenu();
    }
    function openMenu() {
      const m = party[cmdIndex];
      menu = new G.ui.Menu(COMMANDS.map(c => ({ label: c.label })), { x: 8, y: 232, w: 150, title: m.name });
      phase = 'command';
    }
    function nextMember() {
      do { cmdIndex++; } while (cmdIndex < party.length && party[cmdIndex].hp <= 0);
      if (cmdIndex >= party.length) executeTurn();
      else openMenu();
    }
    function prevMember() {
      let i = cmdIndex;
      do { i--; } while (i >= 0 && party[i].hp <= 0);
      if (i < 0) return;
      cmdIndex = i;
      commands[cmdIndex] = undefined;
      openMenu();
    }

    // ---- 1ターン ----
    function executeTurn() {
      phase = 'play';
      log.length = 0;
      // ぼうぎょはターンの最初から効く
      party.forEach((p, i) => { p.defending = !!(commands[i] && commands[i].type === 'defend'); });
      runOrder(G.battle.turnOrder(party.concat(enemies)));
    }
    function runOrder(order) {
      const out = G.battle.outcome(st);
      if (out) { finish(out); return; }
      const actor = order.shift();
      if (!actor) { beginInput(); return; }
      if (actor.hp <= 0) { runOrder(order); return; }
      const cmd = actor.side === 'party' ? commands[party.indexOf(actor)] : null;
      play(G.battle.act(st, actor, cmd || { type: 'attack' }), () => runOrder(order));
    }
    function runEscape() {
      phase = 'play';
      log.length = 0;
      const r = G.battle.tryEscape(st);
      if (r.blocked) { play([{ type: 'msg', text: 'この戦いからは、逃げられない！' }], beginInput); return; }
      if (r.ok) { play([{ type: 'msg', text: 'うまく逃げきれた。' }], () => endBattle()); return; }
      // 失敗：このターンは敵だけが動く
      play([{ type: 'msg', text: '逃げられなかった！' }], () => runOrder(G.battle.turnOrder(enemies)));
    }

    // ---- 決着 ----
    function finish(out) {
      if (out === 'lose') { phase = 'gameover'; gameoverTimer = 0; return; }
      const r = G.battle.rewards(st);
      r.alive.forEach(p => { p.exp += r.each; });
      G.party.addCopper(r.copper);
      const ev = [{ type: 'msg', text: '敵を退けた！' }];
      ev.push({ type: 'msg', text: `それぞれ経験値を ${r.each} 手に入れた。` });
      if (r.copper) ev.push({ type: 'msg', text: `銅貨を ${r.copper}枚 手に入れた。` });
      if (r.drop) {
        G.party.addItem(r.drop);
        const item = G.DATA.items[r.drop];
        ev.push({ type: 'msg', text: `${st.lastKilled.name}は、${item ? item.name : r.drop}を落としていった。` });
      }
      play(ev, () => { phase = 'result'; });
    }
    function endBattle() {
      party.forEach(p => { delete p.side; delete p.defending; });
      G.scene.pop();
    }
    function gameOver() {
      party.forEach(p => { delete p.side; delete p.defending; });
      G.party.loadRecord();
      const s = G.state;
      G.scene.change(G.scenes.map(s.mapId, s.x, s.y, s.dir));
    }

    // 最初のひとこと
    const names = {};
    enemies.forEach(e => { const n = G.DATA.enemies[e.id].name; names[n] = (names[n] || 0) + 1; });
    const appear = Object.keys(names).map(n => names[n] > 1 ? `${n}が${names[n]}匹` : `${n}が`).join('、');
    play([{ type: 'msg', text: `${appear}現れた！` }], beginInput);

    // ---- 敵の並び ----
    function enemyX(i) {
      const n = enemies.length, w = 16 * ENEMY_SCALE, gap = 28;
      const total = n * w + (n - 1) * gap;
      return Math.round((G.renderer.W - total) / 2 + i * (w + gap));
    }
    const visibleEnemies = () => enemies.filter(e => e.hp > 0);

    return {
      name: '戦闘',
      opaque: true,

      update() {
        if (flashTimer > 0) flashTimer--;
        if (shake > 0) shake--;
        Object.keys(fading).forEach(k => { if (fading[k] > 0) fading[k]--; });
        const inp = G.input;

        if (phase === 'gameover') {
          gameoverTimer++;
          if (gameoverTimer > 60 && inp.pressed('ok')) gameOver();
          return;
        }
        if (phase === 'play') { playStep(); return; }
        if (phase === 'result') { if (inp.pressed('ok')) endBattle(); return; }

        if (phase === 'command') {
          const res = menu.update();
          if (!res) return;
          if (res.type === 'cancel') { prevMember(); return; }
          const c = COMMANDS[res.index];
          if (c.type === 'escape') { runEscape(); return; }
          if (c.type === 'defend') { commands[cmdIndex] = { type: 'defend' }; nextMember(); return; }
          targetIndex = 0;
          phase = 'target';
          return;
        }
        if (phase === 'target') {
          const list = visibleEnemies();
          if (inp.repeat('left') || inp.repeat('up')) targetIndex = (targetIndex - 1 + list.length) % list.length;
          if (inp.repeat('right') || inp.repeat('down')) targetIndex = (targetIndex + 1) % list.length;
          if (inp.pressed('cancel')) { phase = 'command'; return; }
          if (inp.pressed('ok')) {
            commands[cmdIndex] = { type: 'attack', target: list[targetIndex] };
            nextMember();
          }
        }
      },

      draw() {
        const r = G.renderer, ctx = r.ctx;
        ctx.save();
        if (shake > 0) ctx.translate((shake % 2 ? 1 : -1) * 3, 0);

        // 背景：空と野原
        for (let i = 0; i < 10; i++) {
          const t = i / 9;
          r.rect(0, i * 16, r.W, 16, `rgb(${Math.round(120 + 70 * t)}, ${Math.round(170 + 50 * t)}, ${Math.round(220 + 20 * t)})`);
        }
        r.rect(0, 120, r.W, 12, '#7a9a7a');
        r.rect(0, 132, r.W, 100, '#4f8a42');
        r.rect(0, 150, r.W, 82, '#478039');
        r.rect(0, 232, r.W, 88, '#000');

        // 敵
        const list = visibleEnemies();
        enemies.forEach((e, i) => {
          const f = fading[e.key];
          if (e.hp <= 0 && !(f > 0)) return;
          if (flash === e && flashTimer > 0 && Math.floor(flashTimer / 2) % 2 === 0) return;
          ctx.globalAlpha = e.hp <= 0 ? f / 20 : 1;
          G.sprite.drawEnemy(ctx, e.id, enemyX(i), ENEMY_BASE_Y - 16 * ENEMY_SCALE, ENEMY_SCALE);
          ctx.globalAlpha = 1;
        });
        if (phase === 'target' && list[targetIndex] && G.ui.blinkOn()) {
          const i = enemies.indexOf(list[targetIndex]);
          r.text('▼', enemyX(i) + 8 * ENEMY_SCALE, ENEMY_BASE_Y - 16 * ENEMY_SCALE - 4, '#fff', 'center');
        }
        ctx.restore();

        // 右上：味方の体力
        const sw = 150, sx = r.W - sw - 8;
        G.ui.drawWindow(sx, 8, sw, 14 + party.length * 34);
        party.forEach((p, i) => {
          const y = 15 + i * 34;
          const color = p.hp <= 0 ? '#ff5050' : (p.hp < p.maxHp / 4 ? '#ffa040' : '#fff');
          const mark = (phase === 'command' || phase === 'target') && i === cmdIndex ? '▶' : '';
          r.text(mark + p.name, sx + 10, y, color);
          r.text(`HP ${p.hp}/${p.maxHp}`, sx + 10, y + 16, color);
          r.text(`MP ${p.mp}`, sx + sw - 10, y + 16, color, 'right');
        });

        // 下：コマンド／文章
        if (phase === 'command' || phase === 'target') {
          menu.draw();
          G.ui.drawWindow(162, 232, 310, 80);
          if (phase === 'target') {
            r.text('だれを攻撃しますか', 176, 244, '#ffd866');
            if (list[targetIndex]) r.text('▶ ' + list[targetIndex].name, 176, 266, '#fff');
          } else {
            const groups = {};
            list.forEach(e => { const n = G.DATA.enemies[e.id].name; groups[n] = (groups[n] || 0) + 1; });
            Object.keys(groups).forEach((n, i) => r.text(`${n}　${groups[n]}匹`, 176, 244 + i * 16, '#fff'));
          }
        } else if (phase !== 'gameover') {
          G.ui.drawWindow(8, 232, 464, 80);
          log.forEach((l, i) => r.text(l.text, 22, 244 + i * 16, l.color));
          if (phase === 'result' && G.ui.blinkOn()) r.text('▼', 240, 298, '#fff', 'center');
        }

        if (phase === 'gameover') {
          const a = Math.min(1, gameoverTimer / 40);
          r.rect(0, 0, r.W, r.H, `rgba(0,0,0,${a})`);
          if (gameoverTimer > 40) {
            const fallen = party.find(p => p.hp <= 0 && !G.DATA.characters[p.id].isBell);
            r.text(`${fallen ? fallen.name : '仲間'}が倒れた……`, r.W / 2, 130, '#f88', 'center');
            r.text('最後の記録から、やり直します。', r.W / 2, 160, '#fff', 'center');
            if (gameoverTimer > 60 && G.ui.blinkOn()) r.text('▼', r.W / 2, 190, '#fff', 'center');
          }
        }
      },
    };
  };
})();
