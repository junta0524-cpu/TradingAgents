// このファイルの役目：タイトル画面。題名を表示し、「はじめから」「文字の速さ」を選べる。
// 「はじめから」で港町ミナモから歩き始める。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const SPEEDS = [
    { key: 'slow', label: 'ゆっくり' },
    { key: 'normal', label: 'ふつう' },
    { key: 'fast', label: 'はやい' },
  ];
  const speedLabel = () => SPEEDS.find(s => s.key === G.settings.textSpeed).label;

  // 文字の速さを選ぶ小さなメニュー
  function createSpeedScene() {
    const menu = new G.ui.Menu(SPEEDS.map(s => ({ label: s.label })), {
      x: 288, y: 190, w: 120, title: '文字の速さ',
      index: SPEEDS.findIndex(s => s.key === G.settings.textSpeed),
    });
    return {
      name: '文字の速さ',
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'select') G.settings.textSpeed = SPEEDS[res.index].key;
        G.scene.pop();
      },
      draw() { menu.draw(); },
    };
  }

  G.scenes.title = function () {
    const makeItems = () => [
      { label: 'はじめから' },
      { label: '文字の速さ', note: speedLabel() },
    ];
    const menu = new G.ui.Menu(makeItems(), { x: 168, y: 190, w: 144, cancelable: false });

    return {
      name: 'タイトル',
      opaque: true,
      resume() { menu.items = makeItems(); },
      update() {
        const res = menu.update();
        if (!res || res.type !== 'select') return;
        if (res.index === 0) {
          G.party.newGame();
          const st = G.state;
          G.scene.change(G.scenes.map(st.mapId, st.x, st.y, st.dir));
        }
        else G.scene.push(createSpeedScene());
      },
      draw() {
        const r = G.renderer;
        // 背景：魔界を思わせる赤みがかった夜空（上から下へ少しずつ色を変える）
        for (let i = 0; i < 20; i++) {
          const t = i / 19;
          r.rect(0, i * 16, r.W, 16, `rgb(${Math.round(40 - 30 * t)}, ${Math.round(6 + 2 * t)}, ${Math.round(14 + 10 * t)})`);
        }
        r.text('魔王が', r.W / 2, 64, '#c9b8ff', 'center');
        r.text('仲間になりたそうな顔で', r.W / 2, 86, '#fff', 'center');
        r.text('こちらを見ている', r.W / 2, 108, '#fff', 'center');
        r.rect(140, 132, 200, 1, '#a33');
        r.text('〔フェーズ1：マップと会話〕', r.W / 2, 144, '#888', 'center');
        menu.draw();
        r.text('F1：デバッグメニュー', r.W - 8, r.H - 18, '#666', 'right');
      },
    };
  };
})();
