// このファイルの役目：「思い出の帳」の画面（タイトルから開く）。左に章、右にその章の場面。見た場面を選ぶと見返せる。
// 見ていない場面は「？？？」で選べない。上に集めた数（見た場面／全部）を出す。場面の一覧は js/data/memories.js。
// 見返しは記録を変えない（js/systems/memories.js の replay）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  G.scenes.memories = function () {
    const M = G.DATA.memories;
    let seen = G.memories.sync();
    let focus = 'left';   // left＝章を選ぶ／right＝場面を選ぶ
    const scenesOf = g => M.list.filter(m => m.group === g);
    const leftItems = () => M.groups.map(g => {
      const list = scenesOf(g.group), n = list.filter(m => seen.has(m.id)).length;
      return { label: g.label, note: `${n}/${list.length}` };
    });
    const left = new G.ui.Menu(leftItems(), { x: 8, y: 44, w: 132, rows: 14 });
    const right = new G.ui.Menu([], { x: 148, y: 44, w: 324, rows: 12 });
    function fillRight() {
      const g = M.groups[left.index];
      right.title = g.label;
      right.items = scenesOf(g.group).map(m => seen.has(m.id) ? { label: m.title, id: m.id } : { label: '？？？', id: m.id, disabled: true });
      right.index = Math.min(right.index, right.items.length - 1);
      if (right.index < 0) right.index = 0;
      right.top = 0;
    }
    fillRight();
    G.sound.bgm('memory');

    return {
      name: '思い出の帳',
      opaque: true,
      update() {
        const inp = G.input;
        if (focus === 'left') {
          const before = left.index;
          const res = left.update();
          if (left.index !== before) { right.index = 0; fillRight(); }
          if (res && res.type === 'cancel') { G.scene.pop(); G.sound.bgm('title'); return; }
          if ((res && res.type === 'select') || inp.pressed('right')) {
            if (right.items.some(it => !it.disabled)) { focus = 'right'; right.index = Math.max(0, right.items.findIndex(it => !it.disabled)); }
            else G.sound.se('cancel');
          }
          return;
        }
        const res = right.update();
        if ((res && res.type === 'cancel') || inp.pressed('left')) { focus = 'left'; return; }
        if (!res || res.type !== 'select') return;
        if (res.item.disabled) return;
        // 見返す。終わったら、この帳へ戻る
        G.memories.replay(res.item.id, () => { G.sound.bgm('memory'); seen = G.memories.sync(); left.items = leftItems(); fillRight(); });
      },
      draw() {
        const r = G.renderer;
        for (let i = 0; i < 20; i++) {
          const t = i / 19;
          r.rect(0, i * 16, r.W, 16, `rgb(${Math.round(36 - 20 * t)}, ${Math.round(22 - 8 * t)}, ${Math.round(18 + 6 * t)})`);
        }
        const c = { seen: M.list.filter(m => seen.has(m.id)).length, all: M.list.length };
        G.ui.drawWindow(8, 8, 464, 30);
        r.text('思い出の帳', 22, 16, '#e8e0c8');
        r.text(`集めた場面　${c.seen}／${c.all}`, 458, 16, c.seen === c.all ? '#f0e8a0' : '#ccc', 'right');
        // 選んでいない方の窓は、▶を出さない
        const keepL = left.index, keepR = right.index;
        if (focus === 'right') left.index = -1; else right.index = -1;
        left.draw(); right.draw();
        left.index = keepL; right.index = keepR;
        // 選んでいる章を明るく
        const ly = left.y + left.pad + (keepL - left.top) * left.lineH;
        if (focus === 'right' && keepL >= left.top && keepL < left.top + left.visible) r.text('▷', left.x + left.pad, ly + 1, '#ffd866');
        const hint = focus === 'left' ? '↑↓：章を選ぶ　決定：場面へ　Ｘ：もどる' : '↑↓：場面を選ぶ　決定：見返す　←：章へ';
        r.text(hint, r.W - 12, r.H - 18, '#aaa', 'right');
      },
    };
  };
})();
