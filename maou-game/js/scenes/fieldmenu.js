// このファイルの役目：マップでXキーを押すと開くメニュー。
// いまは「もちもの」だけ。つよさ・ことだま・そうび・セーブはフェーズ2〜3で足す。
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
        r.text(`${G.state.gold} ゴールド`, 364, 16, '#fff', 'right');
        if (!items.length) r.text('（何も持っていない）', 160, 36, '#aaa');
        items.forEach((s, i) => {
          const item = G.DATA.items[s.id];
          r.text(item ? item.name : s.id, 160, 36 + i * 16, '#fff');
          r.text('×' + s.count, 364, 36 + i * 16, '#fff', 'right');
        });
      },
    };
  }

  G.scenes.fieldMenu = function () {
    const menu = new G.ui.Menu([{ label: 'もちもの' }, { label: 'とじる' }], { x: 8, y: 8, w: 120 });
    return {
      name: 'メニュー',
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel' || res.index === 1) { G.scene.pop(); return; }
        G.scene.push(createItemsScene());
      },
      draw() { menu.draw(); },
    };
  };
})();
