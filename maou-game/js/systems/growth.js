// このファイルの役目：レベルと成長。経験値がたまるとレベルが上がり、成長表（balance.js の GROWTH）どおりに強くなる。
// ベル（fixed）はレベルが上がらない。
(function () {
  const G = window.GAME = window.GAME || {};
  const B = () => G.DATA.balance;

  function baseAt(id, lv) {
    if (!B().GROWTH[id]) G.roster.buildGrowth(id);   // 育てられる仲間の成長表は、はじめて使うときに作る
    const row = B().GROWTH[id][lv];
    return { hp: row[0], mp: row[1], atk: row[2], def: row[3], agi: row[4], wis: row[5] };
  }

  const LABELS = { hp: '最大HP', mp: '最大MP', atk: '攻撃', def: '守備', agi: '素早さ', wis: '賢さ' };

  // 経験値に見合うまでレベルを上げる。上がった分の記録を返す [{ lv, diffs: ['最大HP +4', ...] }]
  function checkLevelUp(m) {
    const ups = [];
    if (m.lv == null) return ups;   // ベルと臨時の仲間はレベルがない（育てられる仲間は lv がある）
    while (m.lv < B().MAX_LEVEL && m.exp >= B().EXP_TABLE[m.lv + 1]) {
      const before = m.base, after = baseAt(m.id, m.lv + 1);
      m.lv++;
      m.base = after;
      const hpGain = after.hp - before.hp, mpGain = after.mp - before.mp;
      G.party.recalc(m);
      // 上がった分だけ、今の体力も増やす
      m.hp = Math.min(m.maxHp, m.hp + hpGain);
      m.mp = Math.min(m.maxMp, m.mp + mpGain);
      const diffs = Object.keys(LABELS)
        .filter(k => after[k] !== before[k])
        .map(k => `${LABELS[k]} +${after[k] - before[k]}`);
      // 育てられる仲間は、そのレベルで言霊も覚える
      G.roster.learnUpTo(m, m.lv, m.lv - 1).forEach(k => diffs.push(`言霊「${(G.DATA.kotodama[k] || {}).name || k}」を覚えた`));
      ups.push({ lv: m.lv, diffs });
    }
    return ups;
  }

  // 次のレベルまでの経験値（レベルが上がらないなら null）
  function toNext(m) {
    if (m.lv == null || m.lv >= B().MAX_LEVEL) return null;
    return B().EXP_TABLE[m.lv + 1] - m.exp;
  }

  // デバッグ用：レベルを1つ上げる
  function forceLevelUp(m) {
    if (m.lv == null || m.lv >= B().MAX_LEVEL) return [];
    m.exp = Math.max(m.exp, B().EXP_TABLE[m.lv + 1]);
    return checkLevelUp(m);
  }

  G.growth = { baseAt, checkLevelUp, toNext, forceLevelUp };
})();
