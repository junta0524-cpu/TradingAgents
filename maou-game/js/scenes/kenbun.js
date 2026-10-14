// このファイルの役目：「見聞録」の画面（メニューから開く）。上の見出しで「敵・言霊・品」を左右キーで切り替え、
// 左の一覧で選ぶと右に中身を出す（敵は絵・強さ・種族・出る場所・倒した数、言霊は系統・効き目、品は強さ・由来）。
// まだ知らないものは「？？？」。覚え書きとしくみは js/systems/kenbun.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const TABS = [{ key: 'e', label: '敵' }, { key: 'k', label: '言霊' }, { key: 'i', label: '品' }];
  const TYPE = { weapon: '武器', armor: '防具', accessory: '装飾', use: '道具' };
  const USE = { battle: '戦いの中', both: '戦いと移動中', field: '移動中' };

  G.scenes.kenbun = function () {
    let d = G.kenbun.sync(), tab = 0;
    const idsOf = t => (t === 'e' ? G.kenbun.enemyIds() : t === 'k' ? G.kenbun.kotodamaIds() : G.kenbun.itemIds());
    const nameOf = (t, id) => (t === 'e' ? G.DATA.enemies[id].name : t === 'k' ? G.DATA.kotodama[id].name : G.DATA.items[id].name);
    const known = (t, id) => !!d[t][id];
    const menu = new G.ui.Menu([], { x: 8, y: 44, w: 170, rows: 13 });
    let ids = [];
    function fill() {
      const t = TABS[tab].key;
      ids = idsOf(t);
      menu.items = ids.map((id, n) => ({ label: known(t, id) ? nameOf(t, id) : '？？？', note: String(n + 1) }));
      menu.index = 0; menu.top = 0;
    }
    fill();

    // 右の窓：文を折り返して並べる
    function lines(list, x, y, w) {
      const r = G.renderer, lh = r.large() ? 18 : 16;
      list.forEach(([text, color]) => {
        r.wrap(text, w).forEach(l => { if (y < 300) r.text(l, x, y, color || '#fff'); y += lh; });
      });
      return y;
    }

    function drawEnemy(id, x, y, w) {
      const e = G.DATA.enemies[id], rec = d.e[id] || [0, 0, 0], r = G.renderer;
      const ctx = r.ctx;
      G.sprite.drawEnemy(ctx, id, x, y, 3);
      r.text(e.name, x + 58, y + 6, '#ffd866', 'left', null, w - 60);
      const T = e.tribe && G.DATA.tribes[e.tribe];
      const sub = [T ? T.name : '', e.awaken ? '操られている人' : ''].filter(Boolean).join('・');
      if (sub) r.text(sub, x + 58, y + 26, '#ccc', 'left', null, w - 60);
      const L = [];
      if (rec[1] + rec[2] > 0) {
        L.push([`体力 ${e.hp}　攻撃 ${e.atk}　守り ${e.def}`], [`素早さ ${e.agi}　賢さ ${e.wis != null ? e.wis : e.atk}`], [`経験値 ${e.exp}　銅貨 ${e.copper}`, '#ccc']);
        if (e.drop) L.push([`落とす物：${G.DATA.items[e.drop.item] ? G.DATA.items[e.drop.item].name : e.drop.item}`, '#ccc']);
      } else L.push(['（倒すか目を覚まさせると、強さが分かる）', '#aaa']);
      if (T && G.affinity.known()) { const wk = G.affinity.weakTo(e.tribe); L.push([`弱点：${G.DATA.kotodamaSystems[G.DATA.tribes[wk].sys].short}（${G.DATA.tribes[wk].short}）の構え`, '#9cf']); }
      if (e.awaken) L.push(['弱らせて心鎮め（名呼び）を唱えると、目を覚ます', '#fff4c0']);
      const pl = G.kenbun.placesOf(id);
      L.push([`出る場所：${pl.length ? pl.join('・') : '物語の戦い'}`, '#ccc']);
      L.push([`倒した ${rec[1]}　目覚めさせた ${rec[2]}`, '#f0e8a0']);
      lines(L, x, y + 56, w);
    }

    function drawKotodama(id, x, y, w) {
      const k = G.DATA.kotodama[id], S = G.DATA.kotodamaSystems[k.sys] || {}, r = G.renderer;
      r.text(k.name, x, y, S.color || '#fff');
      r.text(`${S.name || ''}（${S.short || ''}）`, x + w, y, S.color || '#ccc', 'right');
      const L = [
        [`MP ${k.mp}　相手：${G.kenbun.TARGET[k.target] || k.target}`],
        [`使える所：${USE[k.use] || k.use}`, '#ccc'],
        [G.kenbun.effectText(k.effect) || '（物語の中で使う）'],
      ];
      if (k.awaken) L.push(['揺らいでいる人の敵に唱えると、目を覚まさせる', '#fff4c0']);
      if (S.desc) L.push([`系統の働き：${S.desc}`, '#aaa']);
      lines(L, x, y + 24, w);
    }

    function drawItem(id, x, y, w) {
      const it = G.DATA.items[id], r = G.renderer, price = G.DATA.balance.PRICES[id];
      r.text(it.name, x, y, '#ffd866', 'left', null, w - 80);
      r.text(TYPE[it.type] || '', x + w, y, '#ccc', 'right');
      const st = [['atk', '攻撃'], ['def', '守り'], ['agi', '素早さ'], ['wis', '賢さ'], ['hp', '最大HP'], ['mp', '最大MP']].filter(([k]) => it[k]).map(([k, n]) => `${n}+${it[k]}`).join('　');
      const L = [];
      if (st) L.push([st]);
      const ef = it.type === 'use' ? G.kenbun.effectText(it.effect) + (it.target ? `（${G.kenbun.TARGET[it.target] || ''}）` : '') : G.equipEffects(it);
      if (ef) L.push([ef, '#9cf']);
      if (it.desc) L.push([it.desc, '#ddd']);
      if (price) L.push([`値段の目安：銅貨${price}枚`, '#aaa']);
      lines(L, x, y + 24, w);
    }

    return {
      name: '見聞録',
      opaque: true,
      update() {
        const inp = G.input;
        if (inp.pressed('left') || inp.pressed('right')) {
          tab = (tab + (inp.pressed('right') ? 1 : TABS.length - 1)) % TABS.length;
          G.sound.se('cursor'); fill(); return;
        }
        const res = menu.update();
        if (res && res.type === 'cancel') G.scene.pop();
      },
      draw() {
        const r = G.renderer;
        r.clear('#0c0a10');
        for (let i = 0; i < 20; i++) r.rect(0, i * 16, r.W, 16, `rgb(${20 + i}, ${16 + i}, ${24 + i})`);
        // 見出し：見聞録　敵 n/N　言霊 n/N　品 n/N（選んでいるものを明るく）
        G.ui.drawWindow(8, 8, 464, 32);
        r.text('見聞録', 20, 17, '#e8e0c8');
        let x = 110;
        TABS.forEach((t, n) => {
          const all = idsOf(t.key), got = all.filter(id => known(t.key, id)).length;
          const s = `${n === tab ? '◀' : ''}${t.label} ${got}/${all.length}${n === tab ? '▶' : ''}`;
          r.text(s, x, 17, n === tab ? '#ffd866' : '#888');
          x += r.measure(s) + 18;
        });
        menu.draw();
        G.ui.drawWindow(182, 44, 290, 268);
        const t = TABS[tab].key, id = ids[menu.index];
        if (!id || !known(t, id)) { r.text('まだ知らない。', 196, 56, '#888'); return; }
        if (t === 'e') drawEnemy(id, 196, 54, 262);
        else if (t === 'k') drawKotodama(id, 196, 56, 262);
        else drawItem(id, 196, 56, 262);
      },
    };
  };
})();
