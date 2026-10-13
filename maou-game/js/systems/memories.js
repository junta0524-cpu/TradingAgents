// このファイルの役目：「思い出の帳」の覚え書き（どの場面を見たか）と、場面を見返すしくみ。
// 見た場面は記録とは別に、この機械（ブラウザ）に覚える（localStorage の maou_memories）。どの記録で遊んでも数が増える。
// 見返すときは、場面の文・背景・曲だけを流し、仲間・フラグ・場所・記録は変えない（js/systems/event.js の見返しの形）。
(function () {
  const G = window.GAME = window.GAME || {};
  const KEY = 'maou_memories';

  function load() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function store(set) {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) { /* 覚えられなくても遊べる */ }
  }
  const M = () => G.DATA.memories;
  const entry = id => M().list.find(m => m.id === id);

  // 記録の中身（state と flags）から、もう通った場面を見たことにする
  function fromRecord(set, data) {
    if (!data || !data.state) return;
    const ch = data.state.chapter || 1, flags = data.flags || {};
    M().list.forEach(m => {
      const passed = (m.group <= 12 && ch > m.group) || (m.group === 13 && data.state.cleared);
      if (passed || flags[m.flag || m.id]) set.add(m.id);
    });
  }

  G.memories = {
    isListed: id => !!entry(id),
    // 場面を流したとき（js/systems/event.js から呼ぶ）
    mark(id) {
      if (!entry(id)) return;
      const set = load();
      if (set.has(id)) return;
      set.add(id); store(set);
    },
    // 記録の枠ぜんぶ（自動・1〜3）といまの状態から、見た場面をそろえる
    sync() {
      const set = load(), before = set.size;
      G.save.SLOTS.forEach(s => fromRecord(set, G.save.read(s)));
      if (G.state) fromRecord(set, { state: G.state, flags: G.flags.data });
      if (set.size !== before) store(set);
      return set;
    },
    seen: id => load().has(id),
    count() { const set = G.memories.sync(); return { seen: M().list.filter(m => set.has(m.id)).length, all: M().list.length }; },
    // 場面を見返す（終わったら onDone）
    replay(id, onDone) {
      const m = entry(id);
      G.event.run(id, onDone, { replay: true, place: m ? m.title : '' });
    },
  };
})();
