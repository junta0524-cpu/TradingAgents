// このファイルの役目：F1キーで開く「デバッグメニュー」（作る人の確認用の裏メニュー）。
// 項目は下の ITEMS に並べる。phase は「そのフェーズから使える」という意味。
// まだ作っていない項目は灰色で表示し、選ぶと「フェーズ○で使えるようになります」と出る。
(function () {
  const G = window.GAME = window.GAME || {};

  const ITEMS = [
    { label: '章・マップへ移動',       phase: 1 },
    { label: '全回復',                 phase: 2 },
    { label: 'レベル＋1',              phase: 3 },
    { label: '言霊を全習得',           phase: 3 },
    { label: '阻害ゲージの増減',       phase: 5 },
    { label: 'フラグ一覧と切り替え',   phase: 1 },
    { label: 'エンカウント ON/OFF',    phase: 2 },
    { label: '戦闘計算の中身を表示',   phase: 2 },
    { label: '自動で100回戦闘',        phase: 2 },
    {
      label: '乱数の固定', phase: 0,
      note: () => (G.rng.fixed ? 'ON' : 'OFF'),
      run: () => {
        G.rng.setFixed(!G.rng.fixed);
        G.message.show(G.rng.fixed
          ? '乱数を固定しました。毎回同じ順番の数が出ます。'
          : '乱数の固定をやめました。');
      },
    },
    { label: '蹂躙戦闘の即時開始',     phase: 5 },
  ];

  // いま作っているフェーズ（これより後の項目は灰色）
  const CURRENT_PHASE = 0;

  function buildMenuItems() {
    return ITEMS.map(it => {
      const ready = it.phase <= CURRENT_PHASE && it.run;
      return {
        label: it.label,
        disabled: !ready,
        note: ready ? (it.note ? it.note() : '') : `フェーズ${it.phase}〜`,
      };
    });
  }

  function createDebugScene() {
    let fps = 60, lastTime = performance.now(), frames = 0;
    const menu = new G.ui.Menu(buildMenuItems(), { x: 64, y: 12, w: 352, title: 'デバッグメニュー（F1／Xで閉じる）' });
    return {
      name: 'デバッグ',
      opaque: true,
      resume() { menu.items = buildMenuItems(); },
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        const it = ITEMS[res.index];
        if (it.phase <= CURRENT_PHASE && it.run) it.run();
        else G.message.show(`「${it.label}」は、フェーズ${it.phase}で使えるようになります。`);
      },
      draw() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) { fps = frames; frames = 0; lastTime = now; }
        G.renderer.clear('#000');  // 後ろの画面は隠して読みやすく
        menu.draw();
        const y = menu.y + menu.h + 4;
        G.ui.drawWindow(menu.x, y, menu.w, 24);
        G.renderer.text(`場面：${G.scene.names().join(' > ')}　　${fps}コマ/秒`, menu.x + 10, y + 6, '#aaa');
      },
    };
  }

  G.debug = {
    toggle() {
      const top = G.scene.top();
      if (top && top.name === 'デバッグ') G.scene.pop();
      else if (!G.scene.names().includes('デバッグ')) G.scene.push(createDebugScene());
    },
  };
})();
