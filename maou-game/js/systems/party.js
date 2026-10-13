// このファイルの役目：プレイヤー側の「いまの状態」（いる場所・仲間・持ち物・銅貨）を持つ。
// 仲間の強さ＝成長表の「素の強さ」＋装備の分。装備やレベルが変わったら recalc で計算し直す。
// 「直前の記録」は自動保存の枠（js/core/save.js）。ゲームオーバーでは一番新しい記録へ戻る。
(function () {
  const G = window.GAME = window.GAME || {};

  const clone = o => JSON.parse(JSON.stringify(o));
  const SLOTS = ['weapon', 'armor', 'accessory'];

  // 仲間1人ぶんの、最初の状態
  function makeMember(id) {
    const B = G.DATA.balance, c = G.DATA.characters[id];
    const base = c.isBell ? clone(B.BELL_TRUE) : c.temp ? clone(B.TEMP_PARTY[id]) : G.growth.baseAt(id, 1);
    const m = {
      id, name: c.name, lv: c.fixed ? null : 1, exp: 0,
      base,
      equip: clone(c.equip || {}),
      kotodama: c.kotodama === 'all' ? Object.keys(G.DATA.kotodama) : (c.kotodama || []).slice(),
      tactic: c.tactic || 'manual',
    };
    recalc(m);
    m.hp = m.maxHp; m.mp = m.maxMp;
    return m;
  }

  // ベルの素の強さ：魔王の姿はカンスト。偽名の冒険者ベルは「章の推奨レベル＋BELL_OVER」のオオナムチと同じ（MPだけ BELL.mp）
  function bellBase() {
    const B = G.DATA.balance, st = G.state || {};
    if (!st.disguised) return clone(B.BELL_TRUE);
    const rec = B.REC_LV[st.chapter];
    if (!rec) return clone(B.BELL);
    const lv = Math.min(rec + B.BELL_OVER, B.GROWTH.oonamuchi.length - 1);
    return Object.assign(G.growth.baseAt('oonamuchi', lv), { mp: B.BELL.mp });
  }

  // 素の強さ＋装備 → 実際の強さ
  function recalc(m) {
    // ベルは、偽名で力を抑えている間（4〜9章）だけ弱い。それ以外はカンスト
    const c = G.DATA.characters[m.id] || {};
    if (c.isBell) m.base = bellBase();
    // 賢さを足す前の記録：成長表（臨時の仲間は TEMP_PARTY）から賢さだけ補う
    if (m.base.wis == null) m.base.wis = c.temp ? G.DATA.balance.TEMP_PARTY[m.id].wis : m.lv != null ? G.growth.baseAt(m.id, m.lv).wis : m.base.atk;
    // 装備の特別な効き目：resist（状態異常の効きやすさ）・crit（会心）・perks（先手・経験値・銅貨）
    const t = { maxHp: m.base.hp, maxMp: m.base.mp, atk: m.base.atk, def: m.base.def, agi: m.base.agi, wis: m.base.wis, resist: {}, crit: 0, perks: [] };
    SLOTS.forEach(s => {
      const it = G.DATA.items[m.equip[s]];
      if (!it) return;
      t.atk += it.atk || 0; t.def += it.def || 0; t.agi += it.agi || 0; t.wis += it.wis || 0;
      t.maxHp += it.hp || 0; t.maxMp += it.mp || 0;
      t.crit += it.crit || 0;
      Object.entries(it.resist || {}).forEach(([k, v]) => { t.resist[k] = Math.min(t.resist[k] == null ? 1 : t.resist[k], v); });
      if (it.perk) t.perks.push(it.perk);
    });
    // 上限（カンスト）：体力・MPは999、ほかは255（装備を足しても超えない）
    t.maxHp = Math.min(t.maxHp, 999); t.maxMp = Math.min(t.maxMp, 999);
    ['atk', 'def', 'agi', 'wis'].forEach(k => { t[k] = Math.min(t[k], 255); });
    Object.assign(m, t);
    if (m.hp != null) m.hp = Math.min(m.hp, m.maxHp);
    if (m.mp != null) m.mp = Math.min(m.mp, m.maxMp);
  }

  G.party = {
    SLOTS,
    SLOT_NAMES: { weapon: '武器', armor: '防具', accessory: '装飾' },
    recalc,

    newGame() {
      const B = G.DATA.balance, start = B.START;
      G.state = {
        mapId: start.map,
        x: start.x, y: start.y, dir: start.dir,
        copper: start.copper,
        items: [],        // [{ id, count }]
        party: ['bell', 'oonamuchi'].map(makeMember),
        encounterSteps: null,
        inhibit: B.INHIBIT.MAX,     // 阻害ゲージ
        inhibitShown: false,        // 画面に出すか（章の始まりの場面で切り替える）
        split: null,                // 別行動：null／'away'（ベルがいない）／'watch'（ベルは見守るだけ）
        chapter: 1,                 // いまの章
        disguised: false,           // 偽名「ベル」で人間界にいるか（4〜9章）。このときだけ阻害ゲージが動く
        resume: G.DATA.chapters ? G.DATA.chapters[1].start : null,   // つづきから遊ぶとき、最初に流す場面
        vars: {},
        playFrames: 0,              // 遊んだ時間（1秒に60ずつ増える。タイトル画面では数えない）
      };
      G.flags.reset();
    },
    // 自動戦闘などで使う、満タンの仲間
    freshMembers() {
      return G.party.active().map(m => Object.assign(clone(m), { hp: m.maxHp, mp: m.maxMp }));
    },
    member(id) { return G.state.party.find(m => m.id === id); },
    // いま一緒に動いている仲間（別行動中はベルを除く）
    active() {
      return G.state.split ? G.state.party.filter(m => !G.DATA.characters[m.id].isBell) : G.state.party;
    },
    leader() { return G.party.active()[0]; },

    // ---- 仲間の出入り（臨時の仲間は、その土地の間だけ）----
    // 加わる（4人まで）。加われたら true
    join(id) {
      if (G.party.member(id) || G.state.party.length >= G.DATA.balance.PARTY_MAX) return false;
      G.state.party.push(makeMember(id));
      return true;
    },
    leave(id) {
      const m = G.party.member(id);
      if (!m || G.DATA.characters[id].isBell) return false;
      G.state.party.splice(G.state.party.indexOf(m), 1);
      return true;
    },
    // 仲間をこの顔ぶれ・この順に入れ替える（いる人はそのまま、いない人は新しく加わる）
    setMembers(ids) {
      G.state.party = ids.map(id => G.party.member(id) || makeMember(id));
    },
    // 臨時の仲間を全員別れさせてから、指定の仲間を加える（章の切り替え用）
    setTemps(ids) {
      G.state.party.filter(m => G.DATA.characters[m.id].temp).forEach(m => G.party.leave(m.id));
      (ids || []).forEach(id => G.party.join(id));
    },

    // ---- 持ち物 ----
    count(id) { const s = G.state.items.find(x => x.id === id); return s ? s.count : 0; },
    addItem(id, count) {
      count = count || 1;
      const slot = G.state.items.find(s => s.id === id);
      if (slot) slot.count += count;
      else G.state.items.push({ id, count });
    },
    removeItem(id, count) {
      count = count || 1;
      const slot = G.state.items.find(s => s.id === id);
      if (!slot) return false;
      slot.count -= count;
      if (slot.count <= 0) G.state.items.splice(G.state.items.indexOf(slot), 1);
      return true;
    },
    addCopper(n) { G.state.copper += n; },
    healAll() {
      G.state.party.forEach(m => { m.hp = m.maxHp; m.mp = m.maxMp; });
    },

    // ---- 装備 ----
    canEquip(m, itemId) {
      const it = G.DATA.items[itemId];
      return !!it && SLOTS.includes(it.type) && (!it.who || it.who.includes(m.id));
    },
    // itemId を null にすると外す。外した物は持ち物に戻る
    equip(m, slot, itemId) {
      const old = m.equip[slot];
      if (itemId && !G.party.removeItem(itemId)) return false;
      if (old) G.party.addItem(old);
      if (itemId) m.equip[slot] = itemId; else delete m.equip[slot];
      recalc(m);
      return true;
    },

    // ---- 直前の記録（自動保存の枠を使う）----
    saveRecord() { G.save.write('auto'); },
    hasRecord() { return !!G.save.latest(); },
    // 一番新しい記録まで戻る。記録がなければ最初から
    loadRecord() {
      const data = G.save.latest();
      if (data) G.save.apply(data);
      else G.party.newGame();
    },
  };
})();
