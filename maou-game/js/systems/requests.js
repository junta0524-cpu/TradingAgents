// このファイルの役目：ギルドの「寄り道の依頼」の受ける・進み具合・報告（ごほうび）のしくみ。依頼の一覧は js/data/requests.js。
// 受けた依頼は G.state.requests（{ id: { s: 'active'|'claimed', n: 倒した数, base: 受けたときの目覚めさせた人数 } }）に入り、記録に残る。
// 倒した数は戦いに勝ったとき（js/scenes/battle.js から onBattle）に数える。画面は js/scenes/requestboard.js。
(function () {
  const G = window.GAME = window.GAME || {};

  const all = () => G.DATA.requests;
  const byId = id => all().find(r => r.id === id);
  const store = () => (G.state.requests = G.state.requests || {});
  const itemCount = id => { const s = G.state.items.find(x => x.id === id); return s ? s.count : 0; };

  // 進み具合：{ n: いまの数, need: 要る数, done: 済んだか }
  function progress(r) {
    const s = store()[r.id];
    switch (r.kind) {
      case 'slay': { const n = s ? s.n || 0 : 0; return { n: Math.min(n, r.count), need: r.count, done: n >= r.count }; }
      case 'awaken': { const n = s ? (G.state.awakened || 0) - (s.base || 0) : 0; return { n: Math.min(n, r.count), need: r.count, done: n >= r.count }; }
      case 'bring': { const n = itemCount(r.item); return { n: Math.min(n, r.count), need: r.count, done: n >= r.count }; }
      case 'flag': { const on = G.flags.get(r.flag); return { n: on ? 1 : 0, need: 1, done: on }; }
      default: return { n: 0, need: 1, done: false };
    }
  }

  // いまの状態：'open'（受けられる）／'active'（受けている）／'ready'（済んだ。受付へ）／'claimed'（報告した）
  function status(r) {
    const s = store()[r.id];
    if (!s) return 'open';
    if (s.s === 'claimed') return 'claimed';
    return progress(r).done ? 'ready' : 'active';
  }

  // ごほうびの文（「銅貨60枚・傷薬×3」）
  function rewardText(r) {
    const w = r.reward || {}, parts = [];
    if (w.copper) parts.push(`銅貨${w.copper}枚`);
    if (w.item) parts.push(G.DATA.items[w.item].name + ((w.count || 1) > 1 ? '×' + w.count : ''));
    return parts.join('・');
  }

  G.requests = {
    progress, status, rewardText, byId,
    // 掲示板に貼られている依頼（いまの章で貼られるもの）
    board() { const ch = G.state.chapter || 1; return all().filter(r => ch >= r.from); },
    // 受けている（まだ報告していない）依頼
    taken() { return all().filter(r => { const st = status(r); return st === 'active' || st === 'ready'; }); },
    accept(id) {
      const r = byId(id);
      if (!r || store()[id]) return false;
      store()[id] = { s: 'active', n: 0, base: G.state.awakened || 0 };
      return true;
    },
    // 戦いに勝ったとき：倒した敵（目覚めさせた敵は数えない）を、受けている退治の依頼に数える。済んだ依頼の名前を返す
    onBattle(enemies) {
      const newly = [];
      all().forEach(r => {
        const s = store()[r.id];
        if (r.kind !== 'slay' || !s || s.s !== 'active') return;
        const before = progress(r).done;
        s.n = (s.n || 0) + enemies.filter(e => e.id === r.enemy && e.hp <= 0 && !e.awakened).length;
        if (!before && progress(r).done) newly.push(r.title);
      });
      return newly;
    },
    // 受付で報告：済んだ依頼をまとめて報告し、ごほうびを受け取る。出す文の配列を返す
    report() {
      const lines = [];
      all().forEach(r => {
        if (status(r) !== 'ready') return;
        if (r.kind === 'bring') for (let i = 0; i < r.count; i++) G.party.removeItem(r.item);
        const w = r.reward || {};
        if (w.copper) G.party.addCopper(w.copper);
        if (w.item) G.party.addItem(w.item, w.count || 1);
        store()[r.id].s = 'claimed';
        lines.push(`依頼「${r.title}」を報告した。\n${rewardText(r)}を受け取った。`);
      });
      return lines;
    },
  };
})();
