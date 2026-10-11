// このファイルの役目：戦闘の画面。上に敵、下にコマンド、右上に味方の体力を出す。
// 計算は js/systems/battle.js と js/systems/kotodama.js に任せ、ここは「選ばせる・見せる・待つ」だけを受け持つ。
// 流れ：現れた → 仲間ごとにコマンドを選ぶ → 素早い順に行動 → 勝ち・負け・逃げるまでくり返す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const MSG_WAIT = 40;        // 1行出してから次へ進むまでのコマ数
  const MSG_WAIT_FAST = 6;    // 決定キーやShiftで早送りしたとき
  const LOG_LINES = 4;
  const COMMANDS = [
    { label: 'こうげき', type: 'attack' },
    { label: 'ことだま', type: 'kotodama' },
    { label: 'どうぐ', type: 'item' },
    { label: 'ぼうぎょ', type: 'defend' },
    { label: 'にげる', type: 'escape' },
  ];
  const ENEMY_SCALE = 3;
  const ENEMY_BASE_Y = 178;   // 敵の足元の高さ
  const CMD_Y = 196;          // コマンド窓の上端

  G.debugOpts = G.debugOpts || { showCalc: false };

  // 戦いの背景（空の上・下、地平、地面2色）。マップの battleBg や物語の場面の bg で選ぶ
  const BACKS = {
    field:  [[120, 170, 220], [190, 220, 240], '#7a9a7a', '#4f8a42', '#478039'],
    forest: [[60, 100, 70], [120, 160, 110], '#3a5a3a', '#2e5a2a', '#284e24'],
    mountain: [[150, 120, 110], [210, 180, 150], '#6a5a4e', '#5a4a3e', '#4e4034'],
    wild:   [[170, 140, 90], [230, 200, 140], '#9a8a5a', '#8a7a4a', '#7a6a3e'],
    night:  [[14, 18, 40], [40, 46, 80], '#2a3040', '#1e2a24', '#18221e'],
  };

  // group：敵の id の配列。opts.boss：逃げられない戦い／opts.bg：背景／opts.roundHook(st)：ラウンドの終わりに出来事を足す
  G.scenes.battle = function (group, opts) {
    opts = opts || {};
    const st = G.battle.create(G.party.active(), group, { boss: opts.boss, showCalc: G.debugOpts.showCalc });
    const watching = G.state.split === 'watch';   // ベルは画面の端で見守るだけ
    const party = st.party, enemies = st.enemies;

    // play / command / sub（言霊・道具の一覧）/ target（敵を選ぶ）/ ally（味方を選ぶ）/ result / gameover
    let phase = 'play';
    const log = [];
    let queue = [], afterPlay = null, waitTimer = 0;
    let commands = [], cmdIndex = 0, menu = null, subMenu = null, subList = [];
    let targetIndex = 0, allyIndex = 0, pending = null;
    let flash = null, flashTimer = 0, shake = 0;
    const fading = {};
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
        return;
      }
      if (queue.length) {
        const ev = queue.shift();
        if (ev.type === 'msg') { say(ev.text); waitTimer = MSG_WAIT; }
        else if (ev.type === 'calc') { say(ev.text, '#9ab'); waitTimer = MSG_WAIT / 2; }
        else if (ev.type === 'talk') { G.message.show(ev.list); waitTimer = 2; }   // 物語の場面のセリフ（会話の窓で出す）
        else if (ev.type === 'damage') {
          flash = ev.target; flashTimer = 16;
          if (ev.target.side === 'party' && ev.amount > 0) shake = 10;
          waitTimer = 8;
        } else if (ev.type === 'ko' && ev.target.side === 'enemy') { fading[ev.target.key] = 20; }
        return;
      }
      if (afterPlay) { const f = afterPlay; afterPlay = null; f(); }
    }

    // ---- コマンド選び ----
    // 指示を出す相手：生きていて、「ぜんぶ指示する」で、眠り・縛り・混乱でない仲間
    const needsInput = p => p.hp > 0 && p.tactic !== 'auto' &&
      !G.status.has(p, 'sleep') && !G.status.has(p, 'bind') && !G.status.has(p, 'confuse');
    function beginInput() {
      party.forEach(p => { p.defending = false; });
      commands = [];
      cmdIndex = party.findIndex(needsInput);
      if (cmdIndex < 0) { executeTurn(); return; }   // 全員「うまくやって」なら、そのまま進む
      openMenu();
    }
    // ベルだけ「本気」を選べる（阻害ゲージが大きく減る）
    let cmdList = COMMANDS;
    function openMenu() {
      const m = party[cmdIndex];
      cmdList = G.DATA.characters[m.id].isBell
        ? [COMMANDS[0], { label: '本気', type: 'fullpower' }].concat(COMMANDS.slice(1))
        : COMMANDS;
      menu = new G.ui.Menu(cmdList.map(c => ({ label: c.label })), { x: 8, y: CMD_Y - (cmdList.length - 5) * 16, w: 150, title: m.name });
      phase = 'command';
    }
    function setCommand(cmd) { commands[cmdIndex] = cmd; nextMember(); }
    function nextMember() {
      do { cmdIndex++; } while (cmdIndex < party.length && !needsInput(party[cmdIndex]));
      if (cmdIndex >= party.length) executeTurn();
      else openMenu();
    }
    function prevMember() {
      let i = cmdIndex;
      do { i--; } while (i >= 0 && !needsInput(party[i]));
      if (i < 0) return;
      cmdIndex = i;
      commands[cmdIndex] = undefined;
      openMenu();
    }

    // 言霊・道具の一覧を開く
    function openSub(kind) {
      const m = party[cmdIndex];
      if (kind === 'kotodama') {
        subList = (m.kotodama || []).map(id => ({ id, d: G.DATA.kotodama[id] }));
        if (!subList.length) { flashNote(`${m.name}は、言霊を覚えていない。`); return; }
        subMenu = new G.ui.Menu(subList.map(s => {
          const ok = G.kotodama.usableIn(s.d, 'battle');
          const sys = G.DATA.kotodamaSystems[s.d.sys];
          return {
            label: `${sys ? sys.short : '・'} ${s.d.name}`,
            note: ok ? `MP${s.d.mp}` : (s.d.phase ? `フェーズ${s.d.phase}` : '—'),
            disabled: !ok || m.mp < s.d.mp,
          };
        }), { x: 162, y: CMD_Y, w: 310, rows: 5, title: '言霊（MP ' + m.mp + '）' });
      } else {
        subList = G.state.items.filter(s => { const d = G.DATA.items[s.id]; return d.type === 'use' && (d.use === 'both' || d.use === 'battle'); })
          .map(s => ({ id: s.id, d: G.DATA.items[s.id], count: s.count }));
        if (!subList.length) { flashNote('使える道具を持っていない。'); return; }
        subMenu = new G.ui.Menu(subList.map(s => ({ label: s.d.name, note: '×' + s.count })), { x: 162, y: CMD_Y, w: 310, rows: 5, title: '道具' });
      }
      subMenu.kind = kind;
      phase = 'sub';
    }
    let note = '', noteTimer = 0;
    function flashNote(text) { note = text; noteTimer = 90; }

    // 一覧で選んだ物の相手を決める
    function chooseTarget(kind, id, d) {
      pending = { type: kind, id };
      if (d.target === 'enemy') { targetIndex = 0; phase = 'target'; }
      else if (d.target === 'ally') { allyIndex = cmdIndex; phase = 'ally'; }
      else setCommand(pending);
    }

    // ---- 1ターン ----
    function executeTurn() {
      phase = 'play';
      log.length = 0;
      // ぼうぎょはターンの最初から効く
      party.forEach((p, i) => { p.defending = !!(commands[i] && commands[i].type === 'defend'); });
      G.battle.planEnemies(st);
      if (firstStrike) {   // 先手：最初のラウンドは味方だけが動く
        firstStrike = false;
        runOrder(G.battle.turnOrder(party));
        return;
      }
      runOrder(G.battle.turnOrder(party.concat(enemies)));
    }
    function runOrder(order) {
      const out = G.battle.outcome(st);
      if (out) { finish(out); return; }
      const actor = order.shift();
      if (!actor) {
        // ラウンドの終わり：強化の残りを減らしてから、次のコマンドへ
        const extra = opts.roundHook ? (opts.roundHook(st) || []) : [];
        play(G.battle.endRound(st).concat(extra), beginInput);
        return;
      }
      if (actor.hp <= 0) { runOrder(order); return; }
      let cmd = null;
      if (actor.side === 'party') cmd = actor.tactic === 'auto' ? G.ai.decide(st, actor) : commands[party.indexOf(actor)];
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
      G.party.addCopper(r.copper);
      const ev = [{ type: 'msg', text: '敵を退けた！' }];
      r.alive.forEach(p => {
        p.exp += r.each;
        ev.push({ type: 'msg', text: `${p.name}は経験値を ${r.each} 手に入れた。` });
      });
      if (r.copper) ev.push({ type: 'msg', text: `銅貨を ${r.copper}枚 手に入れた。` });
      if (r.drop) {
        G.party.addItem(r.drop);
        const item = G.DATA.items[r.drop];
        ev.push({ type: 'msg', text: `${st.lastKilled.name}は、${item ? item.name : r.drop}を落としていった。` });
      }
      r.alive.forEach(p => {
        G.growth.checkLevelUp(p).forEach(u => {
          ev.push({ type: 'msg', text: `${p.name}はレベル${u.lv}になった！` });
          if (u.diffs.length) ev.push({ type: 'msg', text: u.diffs.join('　') });
        });
      });
      play(ev, () => { phase = 'result'; });
    }
    function cleanup() { party.forEach(p => G.kotodama.clearBattleState(p)); }
    function endBattle() {
      cleanup();
      // 戦いの中で阻害ゲージが尽きていたら、正体露見へ
      if (G.inhibit.exposed()) { G.scene.change(G.scenes.exposure()); return; }
      G.scene.pop();
    }
    function gameOver() {
      cleanup();
      G.party.loadRecord();
      G.story.enterSaved();
    }

    // 最初のひとこと
    const names = {};
    enemies.forEach(e => { const n = G.DATA.enemies[e.id].name; names[n] = (names[n] || 0) + 1; });
    // 数え方：敵データの counter（人なら「人」）。書かなければ「匹」
    const counterOf = n => (Object.values(G.DATA.enemies).find(d => d.name === n) || {}).counter || '匹';
    const appear = Object.keys(names).map(n => names[n] > 1 ? `${n}が${names[n]}${counterOf(n)}` : `${n}が`).join('、');
    let firstStrike = G.battle.rollFirstStrike(st);
    const opening = [{ type: 'msg', text: `${appear}現れた！` }];
    if (firstStrike) opening.push({ type: 'msg', text: '先手を取った！' });
    play(opening, beginInput);

    // ---- 敵の並び ----
    // 敵は、右上の体力の窓をよけた左側に並べる
    function enemyX(i) {
      const n = enemies.length, w = 16 * ENEMY_SCALE, gap = 24;
      const total = n * w + (n - 1) * gap;
      const area = G.renderer.W - 160;
      return Math.round((area - total) / 2 + i * (w + gap));
    }
    const visibleEnemies = () => enemies.filter(e => e.hp > 0);
    const aliveParty = () => party.filter(p => p.hp > 0);

    return {
      name: '戦闘',
      opaque: true,
      get phase() { return phase; },   // 自動チェック用：いまの段階

      update() {
        if (flashTimer > 0) flashTimer--;
        if (shake > 0) shake--;
        if (noteTimer > 0) noteTimer--;
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
          const c = cmdList[res.index];
          if (c.type === 'escape') { runEscape(); return; }
          if (c.type === 'defend') { setCommand({ type: 'defend' }); return; }
          if (c.type === 'kotodama' || c.type === 'item') { openSub(c.type); return; }
          pending = { type: c.type === 'fullpower' ? 'fullpower' : 'attack' };
          targetIndex = 0;
          phase = 'target';
          return;
        }
        if (phase === 'sub') {
          const res = subMenu.update();
          if (!res) return;
          if (res.type === 'cancel') { phase = 'command'; return; }
          if (res.item.disabled) {
            const s = subList[res.index];
            flashNote(G.kotodama.usableIn(s.d, 'battle') ? 'MPが足りない。' : 'この言霊は、まだ使えない。');
            return;
          }
          const s = subList[res.index];
          chooseTarget(subMenu.kind, s.id, s.d);
          return;
        }
        if (phase === 'target') {
          const list = visibleEnemies();
          if (inp.repeat('left') || inp.repeat('up')) targetIndex = (targetIndex - 1 + list.length) % list.length;
          if (inp.repeat('right') || inp.repeat('down')) targetIndex = (targetIndex + 1) % list.length;
          if (inp.pressed('cancel')) { phase = (pending.type === 'attack' || pending.type === 'fullpower') ? 'command' : 'sub'; return; }
          if (inp.pressed('ok')) setCommand(Object.assign({}, pending, { target: list[targetIndex] }));
          return;
        }
        if (phase === 'ally') {
          const n = party.length;
          if (inp.repeat('up') || inp.repeat('left')) allyIndex = (allyIndex - 1 + n) % n;
          if (inp.repeat('down') || inp.repeat('right')) allyIndex = (allyIndex + 1) % n;
          if (inp.pressed('cancel')) { phase = 'sub'; return; }
          if (inp.pressed('ok')) setCommand(Object.assign({}, pending, { target: party[allyIndex] }));
        }
      },

      draw() {
        const r = G.renderer, ctx = r.ctx;
        ctx.save();
        if (shake > 0) ctx.translate((shake % 2 ? 1 : -1) * 3, 0);

        // 背景：空と野原
        const bk = BACKS[opts.bg] || BACKS.field;
        for (let i = 0; i < 10; i++) {
          const t = i / 9, c = bk[0].map((v, k) => Math.round(v + (bk[1][k] - v) * t));
          r.rect(0, i * 16, r.W, 16, `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
        }
        r.rect(0, 120, r.W, 12, bk[2]);
        r.rect(0, 132, r.W, 100, bk[3]);
        r.rect(0, 150, r.W, 82, bk[4]);
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
          const tg = e.hp > 0 ? G.status.tags(e) : '';
          if (tg) r.text(tg, enemyX(i) + 8 * ENEMY_SCALE, ENEMY_BASE_Y + 2, '#ff9', 'center');
        });
        if (phase === 'target' && list[targetIndex] && G.ui.blinkOn()) {
          const i = enemies.indexOf(list[targetIndex]);
          r.text('▼', enemyX(i) + 8 * ENEMY_SCALE, ENEMY_BASE_Y - 16 * ENEMY_SCALE - 4, '#fff', 'center');
        }
        ctx.restore();

        // 見守るベル（別行動の「見守り」：操作も戦闘もしない）
        if (watching) {
          ctx.save(); ctx.translate(10, 136); ctx.scale(2, 2);
          G.sprite.drawPerson(ctx, 'bell', 'right', 0, false, 0, 0);
          ctx.restore();
          r.text('見守っている', 8, 172, '#ddd');
        }
        // 左上：阻害ゲージ
        G.inhibit.drawGauge(8, 8);

        // 右上：味方の体力（4人でも収まるよう、1人30ドット）
        const sw = 150, sx = r.W - sw - 8, rowH = party.length > 2 ? 30 : 34;
        G.ui.drawWindow(sx, 8, sw, 12 + party.length * rowH);
        party.forEach((p, i) => {
          const y = 14 + i * rowH;
          const color = p.hp <= 0 ? '#ff5050' : (p.hp < p.maxHp / 4 ? '#ffa040' : '#fff');
          let mark = '';
          if ((phase === 'command' || phase === 'sub' || phase === 'target') && i === cmdIndex) mark = '▶';
          if (phase === 'ally' && i === allyIndex && G.ui.blinkOn()) mark = '▶';
          r.text(mark + p.name, sx + 10, y, color);
          const tags = G.status.tags(p) + (p.buffs && p.buffs.def ? '守↑' : '') + (p.buffs && p.buffs.atk ? '攻↑' : '') + (p.guard > 0 ? '岩' : '') + (p.reflect > 0 ? '鏡' : '');
          if (tags) r.text(tags, sx + sw - 10, y, '#9cf', 'right');
          r.text(`HP ${p.hp}/${p.maxHp}`, sx + 10, y + 16, color);
          r.text(`MP ${p.mp}`, sx + sw - 10, y + 16, color, 'right');
        });

        // 下：コマンド／文章
        const choosing = phase === 'command' || phase === 'sub' || phase === 'target' || phase === 'ally';
        if (choosing) {
          menu.draw();
          if (phase === 'sub' || ((phase === 'target' || phase === 'ally') && pending.type !== 'attack' && pending.type !== 'fullpower')) {
            if (subMenu) subMenu.draw();
          } else {
            G.ui.drawWindow(162, 232, 310, 80);
            const groups = {};
            list.forEach(e => { const n = G.DATA.enemies[e.id].name; groups[n] = (groups[n] || 0) + 1; });
            Object.keys(groups).forEach((n, i) => r.text(`${n}　${groups[n]}${counterOf(n)}`, 176, 244 + i * 16, '#fff'));
          }
          if (phase === 'target' || phase === 'ally') {
            const who = phase === 'target' ? (list[targetIndex] && list[targetIndex].name) : party[allyIndex].name;
            G.ui.drawWindow(162, 160, 310, 32);
            r.text(`${phase === 'target' ? 'どの敵に' : 'だれに'}：▶ ${who}`, 176, 170, '#ffd866');
          }
          if (noteTimer > 0) { G.ui.drawWindow(162, 160, 310, 32); r.text(note, 176, 170, '#fff'); }
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
            r.text('直前の記録から、やり直します。', r.W / 2, 160, '#fff', 'center');
            if (gameoverTimer > 60 && G.ui.blinkOn()) r.text('▼', r.W / 2, 190, '#fff', 'center');
          }
        }
      },
    };
  };
})();
