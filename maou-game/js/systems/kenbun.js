// このファイルの役目：「見聞録」（出会った敵・知った言霊・手にした品の図鑑）の覚え書きと、説明の文を作るしくみ。
// 覚え書きは記録とは別に、この機械に覚える（localStorage の maou_kenbun）。どの記録で遊んでも埋まっていく。
// 敵：戦いで出会う（倒した数・目覚めさせた数も数える）。言霊：オオナムチや臨時の仲間が覚える、または戦いで誰かが唱える。品：手に入れる。画面は js/scenes/kenbun.js。
(function () {
  const G = window.GAME = window.GAME || {};
  const KEY = 'maou_kenbun';

  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); return { e: d.e || {}, k: d.k || {}, i: d.i || {} }; } catch (e) { return { e: {}, k: {}, i: {} }; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 覚えられなくても遊べる */ } }

  // 見聞録に載せるもの（言霊は物語だけの特別なもの・言伝を除く。品は大事なもの（鍵や手紙）を除く）
  const enemyIds = () => Object.keys(G.DATA.enemies);
  const kotodamaIds = () => Object.keys(G.DATA.kotodama).filter(id => { const k = G.DATA.kotodama[id]; return !k.special && !(k.effect && k.effect.kind === 'story'); });
  const itemIds = () => Object.keys(G.DATA.items).filter(id => G.DATA.items[id].type !== 'key');

  // いまの記録から、もう知っているもの（ベルは全部の言霊を知っているので数えない）
  function sync() {
    const d = load();
    if (G.state) {
      (G.state.party || []).forEach(p => {
        if (!(G.DATA.characters[p.id] || {}).isBell && Array.isArray(p.kotodama)) p.kotodama.forEach(id => { d.k[id] = 1; });
        Object.values(p.equip || {}).forEach(id => { if (id) d.i[id] = 1; });
      });
      (G.state.items || []).forEach(s => { d.i[s.id] = 1; });
    }
    save(d);
    return d;
  }

  // 敵の出る場所（マップの名前）
  function placesOf(id) {
    const out = [];
    Object.entries(G.DATA.maps).forEach(([mid, m]) => {
      const enc = m.encounter;
      let groups = [];
      if (enc) {
        groups = groups.concat(enc.groups || []);
        Object.values(enc.byChapter || {}).forEach(v => { groups = groups.concat(Array.isArray(v) ? v : []); (v.byLevel || []).forEach(t => { groups = groups.concat(t.groups); }); });
      }
      ((G.DATA.encounterMore || {})[mid] || []).forEach(o => { groups = groups.concat(o.groups); });   // あとから増やした敵
      (G.DATA.rares || []).filter(o => o.maps.includes(mid)).forEach(o => { groups = groups.concat(o.groups); });
      if (groups.some(g => g.includes(id))) out.push(m.name || mid);
      (m.gimmicks || []).forEach(g => { if (g.type === 'guardian' && (g.enemies || []).includes(id)) out.push((m.name || mid) + 'の奥'); });
    });
    return [...new Set(out)];
  }

  // 効き目の説明（言霊と、使う道具で同じ）
  const TARGET = { self: '自分', ally: '味方1人', allies: '味方全員', enemy: '敵1体', enemies: '敵全員', fallen: '倒れた1人', fallen_all: '倒れた全員' };
  const STAT = { atk: '攻撃', def: '守り', both: '攻撃と守り' };
  const stName = s => (G.DATA.status[s] || {}).name || s;
  function effectText(e) {
    if (!e) return '';
    switch (e.kind) {
      case 'heal': return e.full ? '体力をすべて戻す' : `体力を戻す（${e.power[0]}〜${e.power[1]}＋賢さ）`;
      case 'damage': return `傷を与える（${e.power[0]}〜${e.power[1]}＋賢さ）`;
      case 'buff': return `${STAT[e.stat] || e.stat}を${e.mult}倍に（${e.turns}ターン）`;
      case 'guard': return `${e.turns}ターン、傷を受けない`;
      case 'scan': return '敵の強さを見る';
      case 'foresee': return '敵が次に何をするか見る';
      case 'status': return `${stName(e.status)}にする（${Math.round(e.chance * 100)}％）`;
      case 'cure': return `${e.statuses.map(stName).join('・')}を治す`;
      case 'mind': return `${e.turns}ターン、心を守る（混乱を払う）`;
      case 'reflect': return `${e.turns}ターン、言霊を跳ね返す`;
      case 'cover': return `${e.turns}ターン、仲間の身代わりになる`;
      case 'barrier': return 'しばらく獣が寄りつかない';
      case 'revive': return `倒れた仲間を起こす（体力の${Math.round(e.ratio * 100)}％）`;
      case 'awaken': return '揺らいでいる人の敵の目を覚まさせる';
      default: return '';
    }
  }

  // カーソルを合わせたときに出す説明（言霊：効き目・相手・使える所／品：効き目か強さ・説明）
  const USE = { battle: '戦いの中で', both: '戦いでも移動中でも', field: '移動中に' };
  // inBattle：戦いの中で出すとき（短く。「どこで使えるか」は出さない）
  function skillText(k, inBattle) {
    if (!k) return '';
    const ef = k.effect && k.effect.kind === 'story' ? '声を風に乗せて届ける（物語の場所で）' : (effectText(k.effect) || '物語の中で使う');
    return `${ef}（${TARGET[k.target] || '—'}）。` + (inBattle ? '' : `${USE[k.use] || ''}使う。`) + (k.awaken ? '揺らいだ人の敵に唱えると、目を覚まさせる。' : '');
  }
  function itemText(it) {
    if (!it) return '';
    if (it.type === 'use') return (it.effect ? `${effectText(it.effect)}（${TARGET[it.target] || ''}）。` : '') + (it.desc || '');
    const st = [['atk', '攻撃'], ['def', '守り'], ['agi', '素早さ'], ['wis', '賢さ'], ['hp', '最大HP'], ['mp', '最大MP']].filter(([k]) => it[k]).map(([k, n]) => `${n}+${it[k]}`).join(' ');
    return [st, G.equipEffects(it), it.desc].filter(Boolean).join('。');
  }

  G.kenbun = {
    enemyIds, kotodamaIds, itemIds, placesOf, effectText, TARGET, sync, skillText, itemText,
    load,
    // 戦いで出会った
    meet(ids) { const d = load(); ids.forEach(id => { d.e[id] = d.e[id] || [1, 0, 0]; }); save(d); },
    // 戦いが終わった：倒した数・目覚めさせた数
    result(enemies) {
      const d = load();
      enemies.forEach(e => {
        const r = d.e[e.id] = d.e[e.id] || [1, 0, 0];
        if (e.awakened) r[2]++; else if (e.hp <= 0 && !e.fled) r[1]++;
      });
      save(d);
    },
    castSeen(id) { if (!G.DATA.kotodama[id]) return; const d = load(); if (!d.k[id]) { d.k[id] = 1; save(d); } },
    gotItem(id) { const d = load(); if (!d.i[id]) { d.i[id] = 1; save(d); } },
    // 集めた数 { e: [知った, 全部], k: [...], i: [...] }
    count() {
      const d = sync();
      const c = (ids, map) => [ids.filter(id => map[id]).length, ids.length];
      return { e: c(enemyIds(), d.e), k: c(kotodamaIds(), d.k), i: c(itemIds(), d.i) };
    },
  };
})();
