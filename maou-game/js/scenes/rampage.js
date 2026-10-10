// このファイルの役目：蹂躙戦闘の画面（ベル一人で、万の軍勢と向き合う）。仕様書 7-3。
// ベルの体力は減らず、ゲームオーバーもない。プレイヤーが選ぶのは「どの部隊から、どう消す（止める）か」だけ。
// 演出：詠唱も派手な光もなし。赤く暗い画面で、兵が手前から静かに薄れていく（止める場合は、槍が止まる）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  // key：js/data/rampage.js の場面（ch2 / ch10 / free）。opts.onEnd(結果) で終わったあとの処理
  G.scenes.rampage = function (key, opts) {
    opts = opts || {};
    const cfg = G.DATA.rampage[key];
    const RB = G.DATA.balance.RAMPAGE;
    const N = RB.SOLDIERS_PER_UNIT;
    // 部隊：0 がいちばん手前
    const units = [];
    for (let i = 0; i < cfg.units; i++) {
      units.push({ name: G.DATA.rampage.UNIT_NAMES[i], state: 'stand', how: null, t: 0, faces: 0 });
    }
    const result = { erased: 0, stopped: 0, harmed: 0, kotodama: 0 };

    let phase = 'intro';      // intro / choose / how / act / after / letter / end
    let cursor = 0, howMenu = null, active = null, timer = 0;
    const log = [];
    function say(t) { log.push(t); while (log.length > 3) log.shift(); }
    const remaining = () => units.filter(u => u.state === 'stand');
    function firstStanding(from) {
      for (let i = from; i < units.length; i++) if (units[i].state === 'stand') return i;
      for (let i = 0; i < units.length; i++) if (units[i].state === 'stand') return i;
      return -1;
    }

    cfg.intro.forEach(say);
    timer = 60;

    function start(u, how) {
      active = u; u.how = how; u.t = 0;
      phase = 'act';
    }
    function finishUnit(u) {
      if (u.how === 'erase') { u.state = 'gone'; result.erased++; say(`${u.name}が、消えた。`); }
      else if (u.how === 'harm') { u.state = 'gone'; result.harmed++; say(`${u.name}を打ち払った。`); }
      else if (u.how === 'kotodama') { u.state = 'gone'; result.kotodama++; say(`${u.name}を、言霊が薙いだ。`); }
      else { u.state = 'stopped'; result.stopped++; say(`${u.name}の槍の穂先が、すべて止まった。`); }
      active = null;
      if (!remaining().length) {
        phase = 'after'; timer = 90;
        log.length = 0;
        if (opts.noAfter) { phase = 'end'; timer = 60; return; }   // 終わりの文は、物語の場面のほうで流す
        if (cfg.mode === 'stop' || result.stopped) say('兵たちが、ひとりずつ顔を上げた。');
        cfg.after.forEach(say);
        if (cfg.mercyTitle && result.stopped === units.length) say(`称号「${cfg.mercyTitle}」`);
      } else {
        cursor = firstStanding(0);
        phase = 'choose';
      }
    }
    function end() {
      // 10章の「止める／傷つける」の数は、脱出の助けの強さに使う（物語はフェーズ8）
      if (G.state) { G.state.vars = G.state.vars || {}; G.state.vars['rampage_' + key] = result; }
      if (opts.onEnd) opts.onEnd(result);
      else G.scene.pop();
    }

    // ---- 絵の位置 ----
    const rowY = i => 214 - i * (cfg.units > 5 ? 17 : 26);
    const soldierX = j => 196 + j * 22;

    return {
      name: '蹂躙戦闘',
      opaque: true,
      get phase() { return phase; },
      get result() { return result; },

      update() {
        const inp = G.input;
        if (timer > 0) { timer--; if (!(inp.pressed('ok') && timer < 50)) return; timer = 0; }
        if (phase === 'intro') { cursor = firstStanding(0); phase = 'choose'; return; }
        if (phase === 'end') { end(); return; }

        if (phase === 'choose') {
          const n = units.length;
          if (inp.repeat('up')) { let i = cursor; do { i = (i + 1) % n; } while (units[i].state !== 'stand'); cursor = i; }
          if (inp.repeat('down')) { let i = cursor; do { i = (i - 1 + n) % n; } while (units[i].state !== 'stand'); cursor = i; }
          if (inp.pressed('ok')) {
            const u = units[cursor];
            if (cfg.mode === 'erase') { start(u, 'erase'); return; }
            const items = cfg.mode === 'stop'
              ? [{ label: '止める' }, { label: '打ち払う' }]
              : [{ label: '止める' }, { label: '言霊で薙ぐ' }];
            howMenu = new G.ui.Menu(items, { x: 8, y: 196, w: 140, title: u.name });
            phase = 'how';
          }
          return;
        }
        if (phase === 'how') {
          const res = howMenu.update();
          if (!res) return;
          if (res.type === 'cancel') { phase = 'choose'; return; }
          const how = res.index === 0 ? 'stop' : (cfg.mode === 'stop' ? 'harm' : 'kotodama');
          start(units[cursor], how);
          return;
        }
        if (phase === 'act') {
          active.t++;
          if (active.t >= N * RB.FADE_FRAMES + 20) finishUnit(active);
          return;
        }
        if (phase === 'after') {
          if (inp.pressed('ok')) {
            if (cfg.letter) { phase = 'letter'; timer = 30; } else end();
          }
          return;
        }
        if (phase === 'letter') { if (inp.pressed('ok')) end(); }
      },

      draw() {
        const r = G.renderer, ctx = r.ctx;
        // 赤みがかった暗い空と、焼けた大地
        for (let i = 0; i < 20; i++) {
          const t = i / 19;
          r.rect(0, i * 16, r.W, 16, `rgb(${Math.round(70 - 40 * t)}, ${Math.round(14 + 6 * t)}, ${Math.round(16 + 4 * t)})`);
        }
        r.rect(0, 120, r.W, 200, 'rgba(20,10,8,0.55)');

        // 部隊
        units.forEach((u, i) => {
          const y = rowY(i);
          const isActive = active === u;
          for (let j = 0; j < N; j++) {
            const x = soldierX(j);
            let alpha = 1, look = 'soldier';
            const p = isActive ? Math.max(0, Math.min(1, (u.t - j * RB.FADE_FRAMES) / RB.FADE_FRAMES)) : 0;
            if (u.state === 'gone') continue;
            if (isActive && u.how !== 'stop') alpha = 1 - p;
            const stopped = u.state === 'stopped' || (isActive && u.how === 'stop' && p >= 1);
            ctx.globalAlpha = alpha;
            G.sprite.drawPerson(ctx, look, stopped ? 'up' : 'down', 0, false, x, y);
            // 槍：構えている間は小さく揺れ、止まると静かに下を向く
            ctx.fillStyle = stopped ? '#777' : '#ccc';
            const wob = stopped ? 0 : (Math.floor((G.frame + j * 7 + i * 3) / 10) % 2);
            if (stopped) ctx.fillRect(x + 13, y + 9, 1, 7);
            else ctx.fillRect(x + 13, y - 4 + wob, 1, 12);
            ctx.globalAlpha = 1;
          }
          if (u.state !== 'gone') {
            const color = u.state === 'stopped' ? '#888' : '#ddd';
            r.text(u.name, 184, y + 2, color, 'right');
            if ((phase === 'choose' || phase === 'how') && i === cursor && G.ui.blinkOn()) r.text('▶', 120, y + 2, '#fff');
          }
        });

        // ベル（ただ立っている。手を上げもしない）
        ctx.save(); ctx.translate(r.W / 2 + 40, 262); ctx.scale(2, 2);
        G.sprite.drawPerson(ctx, cfg.look, 'up', 0, false, -8, -8);
        ctx.restore();

        // 文
        G.ui.drawWindow(156, 278, 316, 38);
        log.slice(-2).forEach((l, i) => r.text(l, 168, 284 + i * 14, '#eee'));
        if (phase === 'choose') { G.ui.drawWindow(8, 278, 144, 38); r.text('部隊を選ぶ', 18, 284, '#ffd866'); r.text('上下・決定', 18, 298, '#aaa'); }
        if (phase === 'how') howMenu.draw();
        if (phase === 'after' && G.ui.blinkOn()) r.text('▼', 462, 300, '#fff', 'center');

        // 地面に落ちた小さな紙（2章）
        if (cfg.letter && (phase === 'after' || phase === 'letter')) {
          r.rect(300, 236, 10, 7, '#e8e0c8'); r.rect(301, 238, 7, 1, '#9a8a6a'); r.rect(301, 240, 5, 1, '#9a8a6a');
        }
        if (phase === 'letter') {
          r.rect(0, 0, r.W, r.H, 'rgba(0,0,0,0.6)');
          G.ui.drawWindow(40, 100, 400, 90);
          cfg.letter.forEach((l, i) => r.text(l, 60, 120 + i * 24, i === 0 ? '#e8e0c8' : '#ccc'));
          if (timer <= 0 && G.ui.blinkOn()) r.text('▼', 420, 172, '#fff', 'center');
        }
      },
    };
  };
})();
