// このファイルの役目：章の進み方（いまが何章か・章の始まりの場面・記録から再開したときの続き）を受け持つ。
// 章ごとの中身（場面）は js/data/story/ にある。ここは「章をまたぐ」ことだけを書く。
// 記録には「再開する場面」（G.state.resume）を入れておき、つづきから遊ぶときにその場面から流す。
(function () {
  const G = window.GAME = window.GAME || {};

  G.story = {
    // n章の始まりの場面の名前
    startScript(n) {
      const ch = G.DATA.chapters[n];
      if (!ch) throw new Error('章が見つかりません：' + n);
      return ch.start;
    },
    chapter() { return (G.state && G.state.chapter) || 1; },

    // 記録の状態で、歩くマップに入る（再開する場面があれば、そこから流す）
    enterSaved() {
      const s = G.state;
      G.scene.change(G.scenes.map(s.mapId, s.x, s.y, s.dir));
      if (s.resume) G.event.run(s.resume);
    },

    // はじめから
    newGame() {
      G.party.newGame();
      G.story.enterSaved();
    },

    // デバッグ：n章の始まりへ飛ぶ（その章までに通るはずの状態にそろえる）
    jump(n) {
      if (!G.state) G.party.newGame();
      const ch = G.DATA.chapters[n];
      G.flags.reset();
      (ch.flags || []).forEach(f => G.flags.set(f));
      // 4章より後へ飛ぶときは、オオナムチをその章までに育っているはずの強さにそろえる
      if (n >= 4) {
        G.party.setMembers(['bell', 'oonamuchi']);
        const o = G.party.member('oonamuchi'), p = ch.prep || {};
        while (p.lv && o.lv < p.lv && G.growth.forceLevelUp(o).length) { /* レベルを上げる */ }
        (p.kotodama || []).forEach(id => { if (!o.kotodama.includes(id)) o.kotodama.push(id); });
        if (p.copper != null) G.state.copper = Math.max(G.state.copper, p.copper);
        G.party.healAll();
      }
      G.event.running = 0;
      G.scene.change({ name: '黒', opaque: true, update() {}, draw() { G.renderer.clear('#000'); } });
      G.event.run(ch.start);
    },

    // 言伝（ことだま）を唱えたとき：いまの場所に用意された場面があれば流す
    kotozute() {
      const list = G.DATA.kotozute || [];
      const hit = list.find(k => k.map === G.state.mapId && G.flags.check(k));
      return hit ? hit.event : null;
    },
  };
})();
