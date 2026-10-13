// このファイルの役目：セーブ（記録）。ブラウザの中（localStorage）に、3枠＋自動保存1枠で記録する。
// 記録を「文字」にして書き出す・読み込む機能もある（別のパソコンへ持っていくときなど）。
// 記録には version（形式の番号）を入れる。形式を変えたら VERSION を上げて、古い記録の直し方を足す。
(function () {
  const G = window.GAME = window.GAME || {};

  const VERSION = 2;   // 2：章（chapter）と再開する場面（resume）を足した
  const PREFIX = 'maou_save_';
  const SETTINGS_KEY = 'maou_settings';
  const SLOTS = ['auto', '1', '2', '3'];
  const memory = {};   // ブラウザが保存を許さないときの、一時的な置き場所

  const clone = o => JSON.parse(JSON.stringify(o));

  function store(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function load(key) {
    try { const v = localStorage.getItem(key); if (v != null) return v; } catch (e) { /* 使えない */ }
    return memory[key] != null ? memory[key] : null;
  }

  function snapshot() {
    return { version: VERSION, savedAt: Date.now(), state: clone(G.state), flags: clone(G.flags.data) };
  }
  function valid(data) {
    return data && data.version >= 1 && data.version <= VERSION && data.state && data.state.party;
  }

  // 文字にする（日本語も崩れないように）
  function encode(data) { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
  function decode(str) { return JSON.parse(decodeURIComponent(escape(atob(str.trim())))); }

  G.save = {
    VERSION, SLOTS,
    slotName(slot) { return slot === 'auto' ? '自動' : `記録${slot}`; },

    write(slot) {
      return store(PREFIX + slot, JSON.stringify(snapshot()));
    },
    read(slot) {
      const raw = load(PREFIX + slot);
      if (!raw) return null;
      try { const d = JSON.parse(raw); return valid(d) ? d : null; } catch (e) { return null; }
    },
    // 記録を、いまのゲームに戻す
    apply(data) {
      G.state = clone(data.state);
      G.flags.data = clone(data.flags || {});
      if (G.state.inhibit == null) { G.state.inhibit = G.DATA.balance.INHIBIT.MAX; G.state.inhibitShown = true; }
      // フェーズ5までの記録は、4章（ミナモ）の途中として読む
      if (G.state.chapter == null) Object.assign(G.state, { chapter: 4, disguised: true, resume: null });
      if (!G.state.vars) G.state.vars = {};
      G.state.party.forEach(m => {
        // 古い記録には作戦がないので、最初の作戦を入れる
        if (!m.tactic) m.tactic = (G.DATA.characters[m.id] || {}).tactic || 'manual';
        if (G.DATA.characters[m.id].isBell && m.kotodama.length === 0) {   // フェーズ4までの記録のベル
          m.kotodama = Object.keys(G.DATA.kotodama); m.base.mp = G.DATA.balance.BELL.mp;
        }
        G.party.recalc(m);
      });
    },
    // 一番新しい記録
    latest() {
      return SLOTS.map(s => G.save.read(s)).filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0] || null;
    },
    any() { return SLOTS.some(s => G.save.read(s)); },
    // 一覧に出す説明（例：港町ミナモ　オオナムチ Lv3　10/09 21:05）
    summary(slot) {
      const d = G.save.read(slot);
      if (!d) return '（なし）';
      const map = G.DATA.maps[d.state.mapId];
      const hero = d.state.party.find(m => m.lv != null);
      const t = new Date(d.savedAt);
      const pad = n => String(n).padStart(2, '0');
      const ch = d.state.chapter >= 13 ? 'クリア後' : (d.state.chapter || 1) + '章';
      return `${d.state.cleared ? '★' : ''}${ch} ${map ? map.name : '?'} ${hero ? 'Lv' + hero.lv : ''} ${G.save.playTime(d.state.playFrames)} ${pad(t.getMonth() + 1)}/${pad(t.getDate())}`;
    },
    // 遊んだ時間を「12:34」（時間:分）の形にする
    playTime(frames) {
      const min = Math.floor((frames || 0) / 3600);
      return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
    },

    // ---- 文字での書き出し・読み込み ----
    exportString(slot) {
      const raw = load(PREFIX + slot);
      return raw ? encode(JSON.parse(raw)) : null;
    },
    // 読み込めたら記録のデータ、だめなら null
    importString(str) {
      try { const d = decode(str); return valid(d) ? d : null; } catch (e) { return null; }
    },
    writeData(slot, data) { return store(PREFIX + slot, JSON.stringify(data)); },

    // ---- 設定（文字の速さなど）----
    saveSettings() { store(SETTINGS_KEY, JSON.stringify(G.settings)); },
    loadSettings() {
      const raw = load(SETTINGS_KEY);
      if (!raw) return;
      try { Object.assign(G.settings, JSON.parse(raw)); } catch (e) { /* 壊れていたら無視 */ }
    },
  };
})();
