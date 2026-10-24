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
