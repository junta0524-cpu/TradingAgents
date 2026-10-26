// このファイルの役目：寄り道クエスト（寄り道の章を遊べるようにしたもの。docs/寄り道クエスト/）の土台。
// クエストの始まりで、いまの仲間・持ち物・銅貨・場所・章の状態を預け、終わりに戻す（場面の sq 命令）。
// クエストの人・調べる所・踏む所・入ったときの場面は、マップのファイルを書き換えずに G.sq.add で足す。
(function () {
  const G = window.GAME = window.GAME || {};
  const clone = o => JSON.parse(JSON.stringify(o));
  // 預けて、終わりに戻すもの
  const KEEP = ['party', 'items', 'copper', 'mapId', 'x', 'y', 'dir', 'chapter', 'disguised', 'inhibit', 'inhibitShown', 'split', 'noEnc', 'barrier'];

  G.sq = {
    // マップに、クエストの人（npcs）・調べる所（spots）・踏む所（triggers）・出入口（warps）・フラグで変わるマス（flagTiles）・宝箱（chests）・立て札（signs）・
    // 入ったときの場面（onEnter）を足す。
    // どれも if／unless／chapter などの条件を書いて、そのクエストのあいだだけ出す。onEnter は前に足す（先に調べる）。
    add(mapId, parts) {
      const m = G.DATA.maps[mapId];
      if (!m) throw new Error('寄り道クエスト：マップが見つかりません：' + mapId);
      // 場面の流れる人・調べる所・踏む所には印（sqMark）を付ける：クエストのあいだ、マップで光らせて行き先を分かりやすくする（下の draw）
      ['npcs', 'spots', 'triggers'].forEach(k => (parts[k] || []).forEach(o => { if (o.event) o.sqMark = true; }));
      ['npcs', 'spots', 'triggers', 'warps', 'flagTiles', 'chests', 'signs'].forEach(k => { if (parts[k]) m[k] = (m[k] || []).concat(parts[k]); });
      if (parts.onEnter) m.onEnter = parts.onEnter.concat(m.onEnter || []);
    },
    // いま遊んでいるクエストの id（なければ null）
    active() { return (G.state && G.state.sq) || null; },
    // 始まり：いまの状態を預ける（このあと場面の party／rename／state で、操る人などを決める）
    start(id) {
      const st = G.state, saved = {};
      KEEP.forEach(k => { saved[k] = st[k] === undefined ? null : clone(st[k]); });
      st.sqSaved = saved;
      st.sq = id;
    },
    // 終わり：預けたものを戻し、済んだ印を立てる（思い出の帳の「寄り道の章」にも入る）
    end(id) {
      const st = G.state, saved = st.sqSaved;
      if (saved) KEEP.forEach(k => { if (saved[k] === null) delete st[k]; else st[k] = saved[k]; });
      delete st.sqSaved; delete st.sq;
      st.party.forEach(m => G.party.recalc(m));
      G.flags.set('sq_done_' + id, true);
      G.flags.set('side_read_side_' + id, true);
      if (G.memories) G.memories.mark('side_' + id);
      return saved;
    },
    done: id => G.flags.get('sq_done_' + id),

    // クエストのあいだ、いま行くべき所を光らせる（マップの描画から。js/scenes/map.js）
    // 調べる所は1マスずつ、踏む所は同じ場面のマスの真ん中あたりに1つ、人は頭の上に「！」
    marks(mapId) {
      const m = G.DATA.maps[mapId];
      if (!m || !G.sq.active()) return [];
      const on = o => o.sqMark && G.flags.check(o);
      const out = (m.spots || []).filter(on).map(o => ({ x: o.x, y: o.y }));
      const groups = {};
      (m.triggers || []).filter(on).forEach(o => (groups[o.event] = groups[o.event] || []).push(o));
      Object.values(groups).forEach(g => {
        const cx = g.reduce((a, o) => a + o.x, 0) / g.length, cy = g.reduce((a, o) => a + o.y, 0) / g.length;
        const best = g.reduce((a, o) => (Math.hypot(o.x - cx, o.y - cy) < Math.hypot(a.x - cx, a.y - cy) ? o : a));
        out.push({ x: best.x, y: best.y });
      });
      return out;
    },
    draw(ctx, mapId, cam, T, npcs) {
      if (!G.sq.active()) return;
      const tw = (Math.sin(G.frame / 9) + 1) / 2;
      G.sq.marks(mapId).forEach(p => {
        const x = p.x * T - cam.x + T / 2, y = p.y * T - cam.y + T / 2;
        ctx.save();
        ctx.fillStyle = '#ffe070';
        ctx.globalAlpha = 0.22 + tw * 0.2;    // 光の輪
        ctx.beginPath(); ctx.arc(x, y, 8 + tw * 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.7 + tw * 0.3;     // きらめきの十字
        ctx.fillRect(Math.round(x) - 8, Math.round(y), 17, 1); ctx.fillRect(Math.round(x), Math.round(y) - 8, 1, 17);
        ctx.beginPath(); ctx.arc(x, y, 2 + tw * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      // 光る所が画面の外なら、いちばん近い所の向きに、画面の端へ矢印を出す
      const W = G.renderer.W, H = G.renderer.H, ms = G.sq.marks(mapId).map(p => ({ x: p.x * T - cam.x + T / 2, y: p.y * T - cam.y + T / 2 }));
      if (ms.length && !ms.some(p => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H)) {
        const cx = W / 2, cy = H / 2;
        const p = ms.reduce((a, q) => (Math.hypot(q.x - cx, q.y - cy) < Math.hypot(a.x - cx, a.y - cy) ? q : a));
        const ang = Math.atan2(p.y - cy, p.x - cx), m = 20;
        const k = Math.min((W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - m) / Math.abs(Math.sin(ang) || 1e-6));
        const ax = cx + Math.cos(ang) * k, ay = cy + Math.sin(ang) * k;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.globalAlpha = 0.6 + tw * 0.4;
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -9); ctx.lineTo(-7, 9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 話すと場面の流れる人：頭の上に「！」
      (npcs || []).filter(e => e.data && e.data.sqMark).forEach(e => {
        const x = e.px - cam.x + T / 2, y = e.py - cam.y - 10 - Math.round(tw * 2);
        ctx.save();
        ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x) - 4, Math.round(y) - 1, 9, 13);
        ctx.fillStyle = '#ffe070'; ctx.fillRect(Math.round(x) - 3, Math.round(y), 7, 11);
        ctx.fillStyle = '#7a3a00'; ctx.fillRect(Math.round(x) - 1, Math.round(y) + 1, 3, 6); ctx.fillRect(Math.round(x) - 1, Math.round(y) + 8, 3, 2);
        ctx.restore();
      });
    },

    // 戦いの hook（ラウンドの終わりに呼ばれる）の決まった形
    hooks: {
      // rounds ラウンド耐えれば勝ち
      holdOut: (rounds, text) => st => {
        st.hookRound = (st.hookRound || 0) + 1;
        if (st.hookRound >= rounds) { st.forceWin = true; return [{ type: 'msg', text: text || '（耐えきった！）' }]; }
        return [{ type: 'msg', text: `（あと ${rounds - st.hookRound} ラウンド、耐えろ）` }];
      },
      // その言霊が（だれかに）唱えられたら勝ち。who を書けばその仲間だけ
      castWins: (kotodama, who, text) => st => {
        st.hookRound = (st.hookRound || 0) + 1;
        if ((st.casts || []).some(c => c.id === kotodama && (!who || c.who === who))) { st.forceWin = true; return text ? [{ type: 'msg', text }] : []; }
        return [];
      },
    },
  };
})();
