// このファイルの役目：寄り道の章を、その場所に入ったときに「読みますか？」と聞いて流すしくみ（js/data/sidestories.js）。
// 一度聞いたら（読んでも読まなくても）もう聞かない（フラグ side_offer_<id>）。読み終えるとフラグ side_read_<id>。
// 読まなかった章や、場所の決まっていない章は、タイトルの「思い出の帳」の「寄り道の章」から読める。
(function () {
  const G = window.GAME = window.GAME || {};

  function pending(mapId) {
    return (G.DATA.sidestories || []).find(s => s.offer && s.offer.map === mapId && G.DATA.events[s.id]
      && !G.flags.get('side_offer_' + s.id) && G.flags.check(s.offer));
  }

  G.sidestory = {
    pending,
    // 入ったマップに読める章があれば聞く。聞いたら true（そのコマはほかの処理をしない）
    offer(mapId) {
      const s = pending(mapId);
      if (!s || G.event.running) return false;
      G.flags.set('side_offer_' + s.id, true);
      G.ui.confirm(`（寄り道の章「${s.title}」を読みますか？　あとで思い出の帳からも読めます）`, () => {
        G.event.run(s.id, () => { G.flags.set('side_read_' + s.id, true); G.memories.mark(s.id); });
      });
      return true;
    },
  };
})();
