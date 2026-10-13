// このファイルの役目：タイトル画面。
// はじめから／つづきから（記録を選ぶ）／設定（js/scenes/settings.js）／記録の書き出し・読み込み（文字で持ち運ぶ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  function startMap() { G.story.enterSaved(); }

  // 記録の一覧（onlyFilled：記録のある枠だけ選べる）
  function slotList(onlyFilled) {
    return G.save.SLOTS.map(s => ({
      label: G.save.slotName(s), note: G.save.summary(s), disabled: onlyFilled && !G.save.read(s),
    }));
  }

  function continueMenu() {
    G.ui.choose(slotList(true), { x: 8, y: 176, w: 464, title: 'どの記録から始めますか', name: 'つづきから' }, i => {
      G.save.apply(G.save.read(G.save.SLOTS[i]));
      startMap();
    });
  }

  // 書き出し：記録を文字にして、コピーできる窓に出す
  function exportMenu() {
    G.ui.choose(slotList(true), { x: 8, y: 176, w: 464, title: 'どの記録を書き出しますか', name: '書き出し' }, i => {
      const str = G.save.exportString(G.save.SLOTS[i]);
      window.prompt('この文字を全部コピーして、メモ帳などに保存してください。', str);
    });
  }

  // 読み込み：文字を貼り付けて、どの枠に入れるか選ぶ
  function importMenu() {
    const str = window.prompt('書き出した記録の文字を、ここに貼り付けてください。', '');
    if (!str) return;
    const data = G.save.importString(str);
    if (!data) { G.message.show('読み込めませんでした。文字が欠けていないか確かめてください。'); return; }
    const slots = ['1', '2', '3'];
    G.ui.choose(slots.map(s => ({ label: G.save.slotName(s), note: G.save.summary(s) })),
      { x: 8, y: 176, w: 464, title: 'どの枠に入れますか', name: '読み込み' }, i => {
        G.save.writeData(slots[i], data);
        G.message.show(`${G.save.slotName(slots[i])}に読み込みました。「つづきから」で遊べます。`);
      });
  }

  G.scenes.title = function () {
    const makeItems = () => [
      { label: 'はじめから' },
      { label: 'つづきから', disabled: !G.save.any() },
      { label: '設定' },
      { label: '記録の書き出し', disabled: !G.save.any() },
      { label: '記録の読み込み' },
      { label: '遊び方' },
    ];
    const menu = new G.ui.Menu(makeItems(), { x: 152, y: 176, w: 176, cancelable: false });
    G.sound.bgm('title');

    return {
      name: 'タイトル',
      opaque: true,
      resume() { menu.items = makeItems(); },
      update() {
        const res = menu.update();
        if (!res || res.type !== 'select' || res.item.disabled) return;
        if (res.index === 0) G.story.newGame();
        else if (res.index === 1) continueMenu();
        else if (res.index === 2) G.scenes.openSettings(300, 120);
        else if (res.index === 3) exportMenu();
        else if (res.index === 4) importMenu();
        else G.message.show(G.DATA.howToPlay);
      },
      draw() {
        const r = G.renderer;
        // 背景：魔界を思わせる赤みがかった夜空（上から下へ少しずつ色を変える）
        for (let i = 0; i < 20; i++) {
          const t = i / 19;
          r.rect(0, i * 16, r.W, 16, `rgb(${Math.round(40 - 30 * t)}, ${Math.round(6 + 2 * t)}, ${Math.round(14 + 10 * t)})`);
        }
        r.text('魔王が', r.W / 2, 56, '#c9b8ff', 'center');
        r.text('仲間になりたそうな顔で', r.W / 2, 78, '#fff', 'center');
        r.text('こちらを見ている', r.W / 2, 100, '#fff', 'center');
        r.rect(140, 124, 200, 1, '#a33');
        r.text('〔フェーズ10：仕上げ〕', r.W / 2, 136, '#888', 'center');
        if (G.save.SLOTS.some(s => { const d = G.save.read(s); return d && d.state.cleared; })) r.text('★ クリア後の扉が、開いている', r.W / 2, 154, '#f0e8a0', 'center');
        menu.draw();
        r.text('F1：デバッグメニュー', r.W - 8, r.H - 18, '#666', 'right');
      },
    };
  };
})();
