// このファイルの役目：設定の画面（仕様書 第11章）。文字の速さ（3段階）、敵の出やすさ（ふつう／少なめ）、音（入／切）。
// タイトルとフィールドのメニューの両方から開く。選ぶたびに切り替わり、ブラウザに保存される。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const SPEEDS = [['slow', 'ゆっくり'], ['normal', 'ふつう'], ['fast', 'はやい']];
  const label = (list, v) => (list.find(o => o[0] === v) || list[1])[1];

  G.scenes.openSettings = function (x, y) {
    const S = G.settings;
    const build = () => [
      { label: '文字の速さ', note: label(SPEEDS, S.textSpeed) },
      { label: '敵の出やすさ', note: S.encounter === 'low' ? '少なめ' : 'ふつう' },
      { label: '音', note: S.sound ? '入' : '切' },
      { label: 'もどる' },
    ];
    G.ui.choose(build(), {
      x: x == null ? 120 : x, y: y == null ? 60 : y, w: 240, title: '設定', stay: true, refresh: build, name: '設定',
      extra: () => {
        G.ui.drawWindow(8, 256, 464, 40);
        G.renderer.text('決定キーで切り替え。設定はこのブラウザに残る。', 20, 268, '#ccc');
      },
    }, i => {
      if (i === 0) { const k = SPEEDS.findIndex(o => o[0] === S.textSpeed); S.textSpeed = SPEEDS[(k + 1) % SPEEDS.length][0]; }
      else if (i === 1) S.encounter = S.encounter === 'low' ? 'normal' : 'low';
      else if (i === 2) { S.sound = !S.sound; G.sound.refresh(); }
      else { G.scene.pop(); return; }
      G.save.saveSettings();
    });
  };
})();
