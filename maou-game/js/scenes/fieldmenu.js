// このファイルの役目：マップでXキーを押すと開くメニュー。
// いまは「もちもの」「つよさ」。ことだま・そうび・セーブはフェーズ3で足す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  // 持ち物の一覧（どのキーでも閉じる）
  function createItemsScene() {
    return {
      name: 'もちもの',
      update() {
        if (G.input.pressed('ok') || G.input.pressed('cancel')) G.scene.pop();
      },
      draw() {
        const r = G.renderer;
        const items = G.state.items;
        const h = 44 + Math.max(1, items.length) * 16;
        G.ui.drawWindow(136, 8, 240, h);
        r.text('もちもの', 148, 16, '#ffd866');
        r.text(`銅貨 ${G.state.copper}枚`, 364, 16, '#fff', 'right');
        if (!items.length) r.text('（何も持っていない）', 160, 36, '#aaa');
        items.forEach((s, i) => {
          const item = G.DATA.items[s.id];
          r.text(item ? item.name : s.id, 160, 36 + i * 16, '#fff');
          r.text('×' + s.count, 364, 36 + i * 16, '#fff', 'right');
        });
      },
    };
  }

  // 仲間の強さ（どのキーでも閉じる）
  function createStatusScene() {
    return {
      name: 'つよさ',
      update() {
        if (G.input.pressed('ok') || G.input.pressed('cancel')) G.scene.pop();
      },
      draw() {
        const r = G.renderer, party = G.state.party;
        G.ui.drawWindow(136, 8, 336, 24 + party.length * 56);
        party.forEach((p, i) => {
          const y = 18 + i * 56;
          const color = p.hp <= 0 ? '#ff5050' : (p.hp < p.maxHp / 4 ? '#ffa040' : '#fff');
          r.text(p.name, 150, y, '#ffd866');
          r.text(`HP ${p.hp}/${p.maxHp}　MP ${p.mp}/${p.maxMp}`, 150, y + 16, color);
          r.text(`攻撃 ${p.atk}　守備 ${p.def}　素早さ ${p.agi}`, 150, y + 32, '#fff');
          r.text(`経験値 ${p.exp}`, 458, y, '#aaa', 'right');
        });
      },
    };
  }

  const ITEMS = [
    { label: 'もちもの', open: createItemsScene },
    { label: 'つよさ', open: createStatusScene },
    { label: 'とじる' },
  ];

  G.scenes.fieldMenu = function () {
    const menu = new G.ui.Menu(ITEMS.map(i => ({ label: i.label })), { x: 8, y: 8, w: 120 });
    return {
      name: 'メニュー',
      update() {
        const res = menu.update();
        if (!res) return;
        const it = ITEMS[res.index];
        if (res.type === 'cancel' || !it.open) { G.scene.pop(); return; }
        G.scene.push(it.open());
      },
      draw() { menu.draw(); },
    };
  };
})();
