// このファイルの役目：寄り道の拠点で町の人から直接頼まれる「頼みごと」の、頼まれる・進み具合・届ける・調べる・知らせる（ごほうび）のしくみ。一覧は js/data/quests.js。
// 状態は G.state.quests（{ id: { s: 'active'|'claimed', n: 倒した数, got: 届けた／調べた } }）に入り、記録に残る。
// 話しかけたとき（js/scenes/map.js）に talk／receive、調べたときに look、戦いに勝ったとき（js/scenes/battle.js）に onBattle を呼ぶ。メニューの「いらい」にも並ぶ。
(function () {
  const G = window.GAME = window.GAME || {};

  const all = () => G.DATA.quests || [];
  const byId = id => all().find(q => q.id === id);
  const store = () => (G.state.quests = G.state.quests || {});
  const itemCount = id => { const s = G.state.items.find(x => x.id === id); return s ? s.count : 0; };
  const chapterOk = q => ((G.state && G.state.chapter) || 1) >= q.from;

  function progress(q) {
    const s = store()[q.id];
    switch (q.kind) {
      case 'slay': { const n = s ? s.n || 0 : 0; return { n: Math.min(n, q.count), need: q.count, done: n >= q.count }; }
      case 'bring': { const n = itemCount(q.item); return { n: Math.min(n, q.count), need: q.count, done: n >= q.count }; }
      default: { const on = !!(s && s.got); return { n: on ? 1 : 0, need: 1, done: on }; }   // deliver・look
    }
  }
  // 'open'（まだ頼まれていない）／'active'／'ready'（済んだ。頼んだ人へ）／'claimed'（知らせた）
  function status(q) {
    const s = store()[q.id];
    if (!s) return 'open';
    if (s.s === 'claimed') return 'claimed';
    return progress(q).done ? 'ready' : 'active';
  }
  function rewardText(q) {
    const w = q.reward || {}, parts = [];
    if (w.copper) parts.push(`銅貨${w.copper}枚`);
    if (w.item) parts.push(G.DATA.items[w.item].name + ((w.count || 1) > 1 ? '×' + w.count : ''));
    return parts.join('・');
  }
  function claim(q) {
    if (q.kind === 'bring') G.party.removeItem(q.item, q.count);
    const w = q.reward || {};
    if (w.copper) G.party.addCopper(w.copper);
    if (w.item) G.party.addItem(w.item, w.count || 1);
    store()[q.id].s = 'claimed';
    if (G.sound) G.sound.se('chest');
  }
  const READY = { slay: '（頼まれた数を退治した。頼んだ人に知らせよう）', bring: '', deliver: '（届けた。頼んだ人に知らせよう）', look: '（頼んだ人に知らせよう）' };

  G.quests = {
    progress, status, rewardText, byId,
    readyText: q => READY[q.kind] || '',
    // 頼まれている（まだ知らせていない）頼みごと
    taken() { return all().filter(q => { const st = status(q); return st === 'active' || st === 'ready'; }); },
    accept(id) {
      const q = byId(id);
      if (!q || store()[id]) return false;
      store()[id] = { s: 'active', n: 0 };
      if (q.kind === 'deliver') G.party.addItem(q.letter, 1);
      return true;
    },
    // 頼む人に話しかけた：扱ったら true（まだ頼む章でなければ false で、ふつうの会話）
    talk(id) {
      const q = byId(id);
      if (!q || !chapterOk(q)) return false;
      const st = status(q);
      if (st === 'open') {
        G.message.show(q.offer, () => G.ui.confirm(`頼み「${q.title}」を引き受けますか？`, () => {
          G.quests.accept(q.id); G.sound.se('ok');
          const got = q.kind === 'deliver' ? `\n${G.DATA.items[q.letter].name}を預かった。` : '';
          G.message.show(`（頼み「${q.title}」を引き受けた）${got}`);
        }, () => G.message.show('（今は、やめておこう）')));
      } else if (st === 'active') {
        const p = progress(q);
        G.message.show(q.wait.concat(q.kind === 'slay' || q.kind === 'bring' ? [`（${p.n}／${p.need}）`] : []));
      } else if (st === 'ready') {
        claim(q);
        G.message.show(q.done.concat([`（頼み「${q.title}」を果たした）\n${rewardText(q)}を受け取った。`]));
      } else G.message.show(q.after);
      return true;
    },
    // 届け先の人に話しかけた：預かった物を渡す。扱ったら true
    receive(mapId, npcId) {
      const q = all().find(x => x.kind === 'deliver' && x.to.map === mapId && x.to.npc === npcId && status(x) === 'active');
      if (!q || !itemCount(q.letter)) return false;
      G.party.removeItem(q.letter, 1);
      store()[q.id].got = true;
      G.message.show([`${G.DATA.items[q.letter].name}を渡した。`].concat(q.toLines, [READY.deliver]));
      return true;
    },
    // 調べた：頼まれている「調べる」の場所なら true
    look(mapId, x, y) {
      const q = all().find(o => o.kind === 'look' && o.look.map === mapId && o.look.x === x && o.look.y === y && status(o) === 'active');
      if (!q) return false;
      store()[q.id].got = true;
      if (G.sound) G.sound.se('learn');
      G.message.show([q.look.text, READY.look]);
      return true;
    },
    // 戦いに勝った：退治の頼みごとに数える。条件を満たした頼みの名前を返す
    onBattle(enemies) {
      const newly = [];
      all().forEach(q => {
        const s = store()[q.id];
        if (q.kind !== 'slay' || !s || s.s !== 'active') return;
        const before = progress(q).done;
        s.n = (s.n || 0) + enemies.filter(e => e.id === q.enemy && e.hp <= 0 && !e.awakened && !e.fled).length;
        if (!before && progress(q).done) newly.push(q.title);
      });
      return newly;
    },
  };
})();
