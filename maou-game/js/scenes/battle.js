// このファイルの役目：戦闘の画面。いちばん上に味方の体力、まん中に敵（6体まで・中央揃え）、下にコマンドを出す。
// 計算は js/systems/battle.js と js/systems/kotodama.js に任せ、ここは「選ばせる・見せる・待つ」だけを受け持つ。
// 流れ：現れた → 仲間ごとにコマンドを選ぶ → 素早い順に行動 → 勝ち・負け・逃げるまでくり返す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  // 1行出してから次へ進むまでのコマ数（設定「戦いの速さ」。balance.js の BATTLE_MSG_WAIT）
  const msgWait = () => G.DATA.balance.BATTLE_MSG_WAIT[G.settings.battleSpeed] || G.DATA.balance.BATTLE_MSG_WAIT.normal;
  const MSG_WAIT_FAST = 6;    // 決定キーやShiftで早送りしたとき
  const LOG_LINES = 4;
  const COMMANDS = [
    { label: 'こうげき', type: 'attack' },
    { label: 'ことだま', type: 'kotodama' },
    { label: 'どうぐ', type: 'item' },
    { label: 'ぼうぎょ', type: 'defend' },
    { label: 'にげる', type: 'escape' },
  ];
  const ENEMY_SCALE = 3;      // 敵の大きさ（16ドットの何倍か）
  const BOSS_SCALE = 4;       // ボスが1体だけのとき
  const ENEMY_BASE_Y = 152;   // 敵の足元の高さ
  const PANEL_W = 114;        // 上の味方の札の幅（4人で画面に収まる）
  const PANEL_GAP = 4;
  const CMD_Y = 196;          // コマンド窓の上端（ふつうの文字・5項目のとき）
  const CMD_BOTTOM = 312;     // コマンド窓の下端

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
  // opts.erase：倒した敵が「消える」（2章）
  // opts.training：手合わせ（負けてもゲームオーバーにならない）。hook で st.forceWin = true にすると、その場で勝ちになる。
  // opts.chant：詠唱ゲージのある戦い（12章の王戦）。{ enemy, max, perRound, threshold, reduce: { 言霊: 減る量 }, blockText, strikeText, loseText }
  G.scenes.battle = function (group, opts) {
    opts = opts || {};
    const st = G.battle.create(G.party.active(), group, { boss: opts.boss, showCalc: G.debugOpts.showCalc, erase: opts.erase });
    const CH = opts.chant || null;
    const prevBgm = G.sound.current();   // 戦いが終わったら、もとの曲へ戻す
    // 曲：12章の王戦＝final、手合わせ＝training、ボス（1体）＝boss、ふつう＝battle
    G.sound.bgm(CH ? 'final' : opts.training ? 'training' : opts.boss && group.length === 1 ? 'boss' : 'battle');
    if (CH) st.chant = 0;
    const watching = G.state.split === 'watch';   // ベルは画面の端で見守るだけ
    const party = st.party, enemies = st.enemies;
    G.kenbun.meet(enemies.map(e => e.id));   // 見聞録：出会った敵

    // play / command / sub（言霊・道具の一覧）/ target（敵を選ぶ）/ ally（味方を選ぶ）/ result / gameover
    let phase = 'play';
    const log = [];
    let queue = [], afterPlay = null, waitTimer = 0;
    let commands = [], cmdIndex = 0, menu = null, subMenu = null, subList = [];
    let targetIndex = 0, allyIndex = 0, pending = null;
    let flash = null, flashTimer = 0, shake = 0;
    const fading = {}, risen = {};   // risen：目を覚まして消える敵（沈まずに、のぼる）
    // 倒れた・目覚めたと文が出た敵（計算では先に体力が0になるので、文が出るまでは立っているように描く）
    const gone = {};
    // 演出：fx（数字・斬撃・言霊の光・回復の粒）、hurt（味方の札が赤く光る）、lunge（行動する者が前へ出る）
    let fx = [];
    const hurt = new Map(), lunge = new Map();
    let mode = null, crit = false;   // いまの行動が「打撃」か「言霊（色）」か／次の数字が会心か
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
        if (ev.type === 'actor') {   // 行動のはじまり（演出の区切り）
          mode = null; crit = false;
          if (ev.actor) lunge.set(ev.actor, 14);
          return;
        }
        if (ev.type === 'msg') {
          say(ev.text); waitTimer = msgWait();
          if (/を唱えた！$|を放った！$/.test(ev.text)) { G.sound.se('spell'); mode = { spell: spellColor(ev.text) }; }
          else if (/レベル\d+になった！$|を覚えた！$/.test(ev.text)) G.sound.se('levelup');
          else if (/の攻撃！/.test(ev.text)) mode = 'hit';
          else if (ev.text === '会心の一撃！') crit = true;
        }
        else if (ev.type === 'heal') {
          G.sound.se('heal');
          const c = centerOf(ev.target);
          if (c) { addFx('sparkle', c, { color: '#9f9' }); if (ev.amount > 0) addFx('num', c, { text: String(ev.amount), color: '#7f7' }); }
        }
        else if (ev.type === 'calc') { say(ev.text, '#9ab'); waitTimer = Math.ceil(msgWait() / 2); }
        else if (ev.type === 'talk') { G.message.show(ev.list); waitTimer = 2; }   // 物語の場面のセリフ（会話の窓で出す）
        else if (ev.type === 'damage') {
          flash = ev.target; flashTimer = 16;
          if (ev.amount > 0) G.sound.se(ev.target.side === 'party' ? 'damage' : 'hit');
          if (ev.target.side === 'party' && ev.amount > 0) { shake = 10; hurt.set(ev.target, 14); }
          const c = centerOf(ev.target);
          if (c) {
            if (mode === 'hit') addFx('slash', c, { color: crit ? '#ffe060' : '#fff' });
            else if (mode && mode.spell) addFx('burst', c, { color: mode.spell });
            const color = ev.amount <= 0 ? '#ccc' : crit ? '#ffe060' : ev.target.side === 'party' ? '#ff7070' : '#fff';
            addFx('num', c, { text: ev.amount > 0 ? String(ev.amount) : 'ミス', color, big: crit });
          }
          crit = false;
          waitTimer = 8;
        } else if (ev.type === 'ko' && ev.target.side === 'enemy') { fading[ev.target.key] = 24; gone[ev.target.key] = true; }
        else if (ev.type === 'awaken') {   // 目を覚ました敵：光の粒に包まれて、のぼるように消える
          fading[ev.target.key] = 24; risen[ev.target.key] = true; gone[ev.target.key] = true;
          const c = centerOf(ev.target);
          if (c) { addFx('burst', c, { color: '#fff4c0' }); addFx('sparkle', c, { color: '#fff4c0' }); }
          G.sound.se('heal');
          waitTimer = 12;
        }
        return;
      }
      if (afterPlay) { const f = afterPlay; afterPlay = null; f(); }
    }

    // ---- コマンド選び ----
    // 指示を出す相手：生きていて、「ぜんぶ指示する」で、眠り・縛り・混乱でない仲間
    const needsInput = p => p.hp > 0 && p.tactic === 'manual' &&
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
    // 前に選んだコマンド・言霊・道具にカーソルを置く（仲間ごと。ゲームを閉じるまで覚える）
    const memo = G.battleCursor = G.battleCursor || {};
    const memoOf = m => (G.settings.cursorMemory === false ? { cmd: 0, kotodama: 0, item: 0 } : (memo[m.id] = memo[m.id] || { cmd: 0, kotodama: 0, item: 0 }));
    function openMenu() {
      const m = party[cmdIndex];
      cmdList = G.DATA.characters[m.id].isBell
        ? [COMMANDS[0], { label: '本気', type: 'fullpower' }].concat(COMMANDS.slice(1))
        : COMMANDS;
      menu = new G.ui.Menu(cmdList.map(c => ({ label: c.label })), { x: 8, y: CMD_Y, w: 150, title: m.name, index: Math.min(memoOf(m).cmd, cmdList.length - 1) });
      menu.y = CMD_BOTTOM - menu.h;   // 下の端をそろえる（項目の数や文字の大きさで高さが変わる）
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
        }), { x: 162, y: CMD_Y, w: 310, rows: 5, title: '言霊（MP ' + m.mp + '）', index: Math.min(memoOf(m).kotodama, subList.length - 1) });
        subMenu.y = CMD_BOTTOM - subMenu.h;
      } else {
        subList = G.state.items.filter(s => { const d = G.DATA.items[s.id]; return d.type === 'use' && (d.use === 'both' || d.use === 'battle'); })
          .map(s => ({ id: s.id, d: G.DATA.items[s.id], count: s.count }));
        if (!subList.length) { flashNote('使える道具を持っていない。'); return; }
        subMenu = new G.ui.Menu(subList.map(s => ({ label: s.d.name, note: '×' + s.count })), { x: 162, y: CMD_Y, w: 310, rows: 5, title: '道具', index: Math.min(memoOf(m).item, subList.length - 1) });
        subMenu.y = CMD_BOTTOM - subMenu.h;
      }
      subMenu.kind = kind;
      phase = 'sub';
    }
    let note = '', noteTimer = 0;
    function flashNote(text) { note = text; noteTimer = 90; }

    // 心鎮めなど（awaken のある言霊）は、味方のほかに、揺らいでいる人の敵も選べる
    const allyTargets = () => {
      const k = pending && pending.type === 'kotodama' && G.DATA.kotodama[pending.id];
      return party.concat(k && k.awaken ? enemies.filter(G.battle.wavering) : []);
    };
    // 一覧で選んだ物の相手を決める
    function chooseTarget(kind, id, d) {
      pending = { type: kind, id };
      if (d.target === 'enemy') { targetIndex = 0; phase = 'target'; }
      else if (d.target === 'ally' || d.target === 'fallen') { allyIndex = cmdIndex; phase = 'ally'; }
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
    // クリア後：仲間が倒れても、ラウンドの終わりまで起こせれば続けられる（生き返し）
    const lateLose = () => !!(G.state && G.state.cleared);
    function runOrder(order) {
      let out = st.forceWin ? 'win' : G.battle.outcome(st);
      if (out === 'lose' && lateLose() && order.length) out = null;
      if (out) { finish(out); return; }
      const actor = order.shift();
      if (!actor) {
        // ラウンドの終わり：強化の残りを減らしてから、次のコマンドへ
        const extra = opts.roundHook ? (opts.roundHook(st) || []) : [];
        if (CH) {
          st.chant = Math.min(CH.max, st.chant + CH.perRound);
          extra.push({ type: 'msg', text: `王の詠唱が、満ちていく……（${Math.round(st.chant / CH.max * 100)}％）` });
          if (st.chant >= CH.max) { play(G.battle.endRound(st).concat(extra), () => { st.chantLost = true; finish('lose'); }); return; }
        }
        play([{ type: 'actor', actor: null }].concat(G.battle.endRound(st), extra), () => (st.forceWin ? finish('win') : beginInput()));
        return;
      }
      if (actor.hp <= 0) { runOrder(order); return; }
      let cmd = null;
      if (actor.side === 'party') cmd = actor.tactic !== 'manual' ? G.ai.decide(st, actor) : commands[party.indexOf(actor)];
      cmd = cmd || { type: 'attack' };
      // 詠唱の戦い：王への打撃は、詠唱が満ちる直前でなければ届かない。届けば決着
      if (CH && actor.side === 'party' && (cmd.type === 'attack' || cmd.type === 'fullpower') && cmd.target && cmd.target.id === CH.enemy) {
        if (st.chant >= CH.threshold) { st.forceWin = true; play([{ type: 'msg', text: CH.strikeText }], () => finish('win')); return; }
        play([{ type: 'msg', text: `${actor.name}の攻撃！` }, { type: 'msg', text: CH.blockText }], () => runOrder(order));
        return;
      }
      const ev = [{ type: 'actor', actor }].concat(G.battle.act(st, actor, cmd));
      if (CH && actor.side === 'party' && cmd.type === 'kotodama' && CH.reduce[cmd.id] && ev.some(e => e.type === 'msg' && e.text.endsWith('を唱えた！'))) {
        st.chant = Math.max(0, st.chant - CH.reduce[cmd.id]);
        ev.push({ type: 'msg', text: '守りの膜が、王の言霊を遮った。詠唱が乱れる。' });
      }
      play(ev, () => runOrder(order));
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
      G.flags.set('last_battle_won', out === 'win');
      G.kenbun.result(enemies);   // 見聞録：倒した数・目覚めさせた数
      if (out === 'lose' && opts.training) {
        // 手合わせ：負けてもやり直しにはならない（倒れた仲間は体力1で起き上がる）
        party.forEach(p => { if (p.hp <= 0) p.hp = 1; });
        play([{ type: 'msg', text: '（手合わせは、ここまで。もう一度、挑める）' }], () => { phase = 'result'; });
        return;
      }
      if (out === 'lose') { phase = 'gameover'; gameoverTimer = 0; G.sound.jingle('gameover'); return; }
      const r = G.battle.rewards(st);
      G.party.addCopper(r.copper);
      G.sound.jingle('victory');   // 勝ったときの短い曲（終わると、戦いのあとでもとの曲へ戻る）
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
      // 寄り道の依頼（倒した数）
      G.requests.onBattle(enemies).forEach(t => ev.push({ type: 'msg', text: `（依頼「${t}」の条件を満たした。ギルドの受付へ）` }));
      // 目覚めさせた人の数
      const woke = enemies.filter(e => e.awakened).length;
      if (woke) ev.push({ type: 'msg', text: `${woke}人が、目を覚ました。（これまでに${G.state.awakened}人）` });
      G.battle.awakenRewards().forEach(g => ev.push({ type: 'msg', text: `目を覚ました人が${g.n}人になった。${G.DATA.items[g.item].name}が届いた。` }));
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
      if (prevBgm) G.sound.bgm(prevBgm);
      if (lateLose()) party.forEach(p => { if (p.hp <= 0) p.hp = 1; });   // クリア後：倒れた仲間は、戦いのあと起き上がる
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
    // 四すくみを教わったあとは、敵の種族と弱点（どの系統の構えで攻めればよいか）を出す
    const tribeNote = n => {
      const d = Object.values(G.DATA.enemies).find(x => x.name === n), T = G.DATA.tribes;
      if (!d || !d.tribe || !G.affinity.known()) return '';
      const w = G.affinity.weakTo(d.tribe);
      return `　${T[d.tribe].name}・弱点：${G.DATA.kotodamaSystems[T[w].sys].short}（${T[w].short}）`;
    };
    const appear = Object.keys(names).map(n => names[n] > 1 ? `${n}が${names[n]}${counterOf(n)}` : `${n}が`).join('、');
    let firstStrike = G.battle.rollFirstStrike(st);
    const opening = [{ type: 'msg', text: `${appear}現れた！` }];
    if (firstStrike) opening.push({ type: 'msg', text: '先手を取った！' });
    play(opening, beginInput);

    // ---- 並び ----
    // 敵は画面の幅いっぱいを使って中央にそろえる。数が多いほど間をつめる。ボス1体だけなら大きく出す
    const scale = enemies.length === 1 && (opts.boss || CH) ? BOSS_SCALE : ENEMY_SCALE;
    const SIZE = 16 * scale;
    function enemyX(i) {
      const n = enemies.length, gap = n <= 3 ? 32 : n <= 5 ? 20 : 12;
      const total = n * SIZE + (n - 1) * gap;
      return Math.round((G.renderer.W - total) / 2 + i * (SIZE + gap));
    }
    const enemyTop = () => ENEMY_BASE_Y - SIZE;
    // 上の味方の札：人数に合わせて中央にそろえる
    const panelH = () => (G.renderer.large() ? 58 : 54);
    function panelX(i) {
      const n = party.length, w = Math.min(PANEL_W, Math.floor((G.renderer.W - 12 - (n - 1) * PANEL_GAP) / n));
      return { x: Math.round((G.renderer.W - (n * w + (n - 1) * PANEL_GAP)) / 2 + i * (w + PANEL_GAP)), w };
    }
    // 演出を出す場所（敵なら体のまん中、味方なら札のまん中）
    function centerOf(u) {
      if (u.side === 'enemy') { const i = enemies.indexOf(u); return i < 0 ? null : { x: enemyX(i) + SIZE / 2, y: enemyTop() + SIZE / 2, size: SIZE }; }
      const i = party.indexOf(u);
      if (i < 0) return null;
      const p = panelX(i);
      return { x: p.x + p.w / 2, y: 4 + panelH() / 2, size: 40 };
    }
    const FX_LIFE = { num: 40, slash: 14, burst: 30, sparkle: 26 };   // 演出の長さ（コマ数）
    function addFx(kind, c, o) { fx.push(Object.assign({ kind, x: c.x, y: c.y, size: c.size, t: 0, life: FX_LIFE[kind] }, o)); }
    // 唱えた言霊の系統の色（文の中の言霊の名前から探す）
    function spellColor(text) {
      const K = G.DATA.kotodama, S = G.DATA.kotodamaSystems;
      const id = Object.keys(K).filter(k => text.includes('は' + K[k].name + 'を')).sort((a, b) => K[b].name.length - K[a].name.length)[0];
      const sys = id && S[K[id].sys];
      return sys ? sys.color : '#fff';
    }
    function drawFx(ctx) {
      const r = G.renderer;
      fx.forEach(f => {
        const k = f.t / f.life;
        ctx.save();
        if (f.kind === 'num') {
          const y = f.y - 8 - Math.min(f.t, 12) * 1.2;
          ctx.globalAlpha = f.t > f.life - 10 ? (f.life - f.t) / 10 : 1;
          const size = f.big ? 18 : 15;
          r.text(f.text, f.x + 1, y + 1, '#000', 'center', size);
          r.text(f.text, f.x, y, f.color, 'center', size);
        } else if (f.kind === 'slash') {
          // ななめの3本の筋が、上から下へ走る
          const h = f.size * 0.9, p = Math.min(1, k * 2);
          ctx.globalAlpha = 1 - Math.max(0, k * 2 - 1);
          ctx.strokeStyle = f.color; ctx.lineWidth = 2;
          for (let j = -1; j <= 1; j++) {
            const ox = f.x + j * 8;
            ctx.beginPath();
            ctx.moveTo(ox + h / 2, f.y - h / 2);
            ctx.lineTo(ox + h / 2 - h * p, f.y - h / 2 + h * p);
            ctx.stroke();
          }
        } else if (f.kind === 'burst') {
          // 言霊：系統の色の輪が広がり、粒が飛び散る
          ctx.fillStyle = f.color;
          ctx.globalAlpha = 0.4 * (1 - k);
          ctx.beginPath(); ctx.arc(f.x, f.y, f.size * (0.3 + k * 0.3), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = f.color; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(f.x, f.y, 4 + k * f.size * 0.6, 0, Math.PI * 2); ctx.stroke();
          for (let j = 0; j < 8; j++) {
            const a = j * Math.PI / 4 + 0.3, d = k * f.size * 0.75;
            ctx.fillRect(Math.round(f.x + Math.cos(a) * d) - 2, Math.round(f.y + Math.sin(a) * d) - 2, 4, 4);
          }
        } else if (f.kind === 'sparkle') {
          // 回復：小さな光の粒がのぼっていく
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = f.color;
          for (let j = 0; j < 6; j++) {
            const ox = ((j * 37) % 30) - 15, oy = 10 - k * 26 - (j % 3) * 6;
            ctx.fillRect(Math.round(f.x + ox), Math.round(f.y + oy), 3, 3);
          }
        }
        ctx.restore();
      });
    }
    const visibleEnemies = () => enemies.filter(e => e.hp > 0);
    const aliveParty = () => party.filter(p => p.hp > 0);

    return {
      name: '戦闘',
      opaque: true,
      get phase() { return phase; },   // 自動チェック用：いまの段階
      layout: () => ({ xs: enemies.map((e, i) => enemyX(i)), size: SIZE, fx: fx.length }),   // 自動チェック用：敵の並び
      get st() { return st; },   // 自動チェック用：戦いの状態（敵の体力など）

      update() {
        if (flashTimer > 0) flashTimer--;
        if (shake > 0) shake--;
        if (noteTimer > 0) noteTimer--;
        Object.keys(fading).forEach(k => { if (fading[k] > 0) fading[k]--; });
        fx.forEach(f => { f.t++; });
        fx = fx.filter(f => f.t < f.life);
        [hurt, lunge].forEach(m => m.forEach((v, k) => { if (v > 1) m.set(k, v - 1); else m.delete(k); }));
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
          memoOf(party[cmdIndex]).cmd = c.type === 'escape' ? 0 : res.index;   // にげるは覚えない
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
          memoOf(party[cmdIndex])[subMenu.kind] = res.index;
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
          const list = allyTargets(), n = list.length;
          if (allyIndex >= n) allyIndex = 0;
          if (inp.repeat('up') || inp.repeat('left')) allyIndex = (allyIndex - 1 + n) % n;
          if (inp.repeat('down') || inp.repeat('right')) allyIndex = (allyIndex + 1) % n;
          if (inp.pressed('cancel')) { phase = 'sub'; return; }
          if (inp.pressed('ok')) setCommand(Object.assign({}, pending, { target: list[allyIndex] }));
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
        const top = enemyTop();
        enemies.forEach((e, i) => {
          const f = fading[e.key], x = enemyX(i), down = e.hp <= 0 && gone[e.key];
          if (!down || f > 0) {
            // 影
            ctx.globalAlpha = 0.25;
            r.rect(x + SIZE * 0.15, ENEMY_BASE_Y - SIZE / 8 - 2, SIZE * 0.7, 4, '#000');
            ctx.globalAlpha = 1;
          }
          if (down && !(f > 0)) return;
          if (flash === e && flashTimer > 0 && Math.floor(flashTimer / 2) % 2 === 0) return;
          // 倒れた敵：薄れながら沈む／行動する敵：前へ出る
          const l = lunge.get(e) || 0, dy = down ? (24 - f) * (risen[e.key] ? -0.6 : 0.8) : Math.round(Math.sin(l / 14 * Math.PI) * 6);
          ctx.globalAlpha = down ? f / 24 : 1;
          G.sprite.drawEnemy(ctx, e.id, x, top + dy, scale);
          ctx.globalAlpha = 1;
          const tg = e.hp > 0 ? G.status.tags(e) + (G.battle.wavering(e) ? '揺' : '') : '';
          if (tg) r.text(tg, x + SIZE / 2, top - 14, '#ff9', 'center');
        });
        if (phase === 'target' && list[targetIndex] && G.ui.blinkOn()) {
          const e = list[targetIndex], i = enemies.indexOf(e);
          r.text('▼', enemyX(i) + SIZE / 2, top - (G.status.tags(e) || G.battle.wavering(e) ? 28 : 14), '#fff', 'center');
        }
        // 心鎮めの相手に、揺らいでいる敵を選んでいるとき
        const at = phase === 'ally' && allyTargets()[allyIndex];
        if (at && at.side === 'enemy' && G.ui.blinkOn()) {
          const i = enemies.indexOf(at);
          r.text('▼', enemyX(i) + SIZE / 2, top - 28, '#ffd866', 'center');
        }
        ctx.restore();

        // 見守るベル（別行動の「見守り」：操作も戦闘もしない）
        if (watching) {
          ctx.save(); ctx.translate(10, 118); ctx.scale(2, 2);
          G.sprite.drawPerson(ctx, (G.party.member('bell') || {}).look || 'bell', 'right', 0, false, 0, 0);
          ctx.restore();
          r.text('見守っている', 8, 152, '#ddd');
        }
        // いちばん上：味方の札（名前・HP・MPと状態。人数に合わせて中央にそろえる）
        const big = r.large(), ph = panelH(), lh = big ? 16 : 14;
        party.forEach((p, i) => {
          const { x: px, w: pw } = panelX(i);
          const hit = hurt.get(p) || 0, act = lunge.get(p) || 0;
          const x = px + (hit ? (hit % 2 ? 2 : -2) : 0), y = 4 - Math.round(Math.sin(act / 14 * Math.PI) * 3);
          G.ui.drawWindow(x, y, pw, ph);
          if (hit) { ctx.save(); ctx.globalAlpha = hit / 28; r.rect(x + 3, y + 3, pw - 6, ph - 6, '#f33'); ctx.restore(); }
          const choosing = (phase === 'command' || phase === 'sub' || phase === 'target') && i === cmdIndex;
          if (choosing || (phase === 'ally' && i === allyIndex)) {
            ctx.save(); ctx.strokeStyle = '#ffd866'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, pw - 6, ph - 6); ctx.restore();
          }
          const color = p.hp <= 0 ? '#ff5050' : (p.hp < p.maxHp / 4 ? '#ffa040' : '#fff');
          let mark = '';
          if (choosing) mark = '▶';
          if (phase === 'ally' && i === allyIndex && G.ui.blinkOn()) mark = '▶';
          r.text(mark + p.name, x + 8, y + 5, color, 'left', null, pw - 16);
          r.text(`HP ${p.hp}/${p.maxHp}`, x + 8, y + 5 + lh, color, 'left', null, pw - 16);
          r.text(`MP ${p.mp}`, x + 8, y + 5 + lh * 2, color);
          const tags = G.status.tags(p) + (p.buffs && p.buffs.def ? '守↑' : '') + (p.buffs && p.buffs.atk ? '攻↑' : '') + (p.guard > 0 ? '岩' : '') + (p.reflect > 0 ? '鏡' : '') + (p.stance && G.affinity.known() ? '[' + G.DATA.tribes[p.stance].short + ']' : '');
          if (tags) r.text(tags, x + pw - 8, y + 5 + lh * 2, '#9cf', 'right', null, pw - 60);
          // HPの棒
          const bw = pw - 16, t = Math.max(0, p.hp / p.maxHp);
          r.rect(x + 8, y + ph - 7, bw, 3, '#333');
          r.rect(x + 8, y + ph - 7, Math.round(bw * t), 3, p.hp < p.maxHp / 4 ? '#f84' : '#6c6');
        });

        // 札の下の左：阻害ゲージ
        const gy = 4 + ph + 4;
        G.inhibit.drawGauge(8, gy);
        // 詠唱ゲージ（12章の王戦）：まん中の王にかからないよう、左に細く
        if (CH) {
          // 阻害ゲージが出ていなければ、その場所に（王の頭にかからないよう、上に寄せる）
          const shown = G.inhibit.on() && G.state.inhibitShown && G.party.member('bell');
          const t = st.chant / CH.max, w = 96, y = gy + (shown ? 26 : 0);
          G.ui.drawWindow(8, y, w + 84, 24);
          r.text('王の詠唱', 16, y + 6, '#f8a');
          r.rect(80, y + 10, w, 8, '#222');
          r.rect(80, y + 10, Math.round(w * t), 8, st.chant >= CH.threshold ? '#ff4060' : '#c070ff');
          r.rect(80 + Math.round(w * CH.threshold / CH.max), y + 8, 1, 12, '#fff');
        }

        // 演出（数字・斬撃・言霊の光）
        drawFx(ctx);

        // 下：コマンド／文章
        const choosing = phase === 'command' || phase === 'sub' || phase === 'target' || phase === 'ally';
        if (choosing) {
          menu.draw();
          if (phase === 'sub' || ((phase === 'target' || phase === 'ally') && pending.type !== 'attack' && pending.type !== 'fullpower')) {
            if (subMenu) subMenu.draw();
            // カーソルを合わせた言霊・道具の効き目を、一覧の上に出す
            const pick = phase === 'sub' && subMenu && subList[subMenu.index];
            if (pick && noteTimer <= 0) {
              const text = subMenu.kind === 'kotodama' ? G.kenbun.skillText(pick.d, true) : G.kenbun.itemText(pick.d);
              const lh = r.large() ? 18 : 16, ls = r.wrap(text, 290).slice(0, 2), h = ls.length * lh + 12;
              G.ui.drawWindow(162, subMenu.y - h - 2, 310, h);
              ls.forEach((l, i) => r.text(l, 172, subMenu.y - h + 4 + i * lh, '#cfe'));
            }
          } else {
            G.ui.drawWindow(162, 232, 310, 80);
            const groups = {};
            list.forEach(e => { const n = G.DATA.enemies[e.id].name; groups[n] = (groups[n] || 0) + 1; });
            Object.keys(groups).forEach((n, i) => r.text(`${n}　${groups[n]}${counterOf(n)}${tribeNote(n)}`, 176, 244 + i * 16, '#fff'));
          }
          if (phase === 'target' || phase === 'ally') {
            const tgt = allyTargets()[allyIndex];
            const who = phase === 'target' ? (list[targetIndex] && list[targetIndex].name) : (tgt ? tgt.name + (tgt.side === 'enemy' ? '（目を覚まさせる）' : '') : '');
            G.ui.drawWindow(162, 160, 310, 32);
            r.text(`${phase === 'target' ? 'どの敵に' : 'だれに'}：▶ ${who}`, 176, 170, '#ffd866');
          }
          if (noteTimer > 0) { G.ui.drawWindow(162, 160, 310, 32); r.text(note, 176, 170, '#fff'); }
        } else if (phase !== 'gameover') {
          G.ui.drawWindow(8, 232, 464, 80);
          // 設定「文字の大きさ：大きい」のときは、新しい3行を大きな字で出す
          if (G.settings.textSize === 'large') {
            const big = G.DATA.balance.TEXT_SIZE_LARGE;
            log.slice(-3).forEach((l, i) => r.text(l.text, 22, 242 + i * Math.round(big * 1.4), l.color, 'left', big));
          } else log.forEach((l, i) => r.text(l.text, 22, 244 + i * 16, l.color));
          if (phase === 'result' && G.ui.blinkOn()) r.text('▼', 240, 298, '#fff', 'center');
        }

        if (phase === 'gameover') {
          const a = Math.min(1, gameoverTimer / 40);
          r.rect(0, 0, r.W, r.H, `rgba(0,0,0,${a})`);
          if (gameoverTimer > 40) {
            const fallen = party.find(p => p.hp <= 0 && !G.DATA.characters[p.id].isBell);
            r.text(st.chantLost ? CH.loseText : `${fallen ? fallen.name : '仲間'}が倒れた……`, r.W / 2, 130, '#f88', 'center');
            r.text('直前の記録から、やり直します。', r.W / 2, 160, '#fff', 'center');
            if (gameoverTimer > 60 && G.ui.blinkOn()) r.text('▼', r.W / 2, 190, '#fff', 'center');
          }
        }
      },
    };
  };
})();
