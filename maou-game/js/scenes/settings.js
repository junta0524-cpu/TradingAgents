// このファイルの役目：設定の画面（仕様書 第11章）。文字の速さ（3段階）、敵の出やすさ（ふつう／少なめ）、音（入／切）、会話の文字の大きさ（ふつう／大きい）、
// 戦いの速さ（3段階）、いつも走る（入／切）、カーソルを覚える（入／切：メニューと戦いのコマンドで前に選んだところから）、行き先の光（入／切）。
// タイトルとフィールドのメニューの両方から開く。選ぶたびに切り替わり、ブラウザに保存される。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const SPEEDS = [['slow', 'ゆっくり'], ['normal', 'ふつう'], ['fast', 'はやい']];
  const BSPEEDS = [['normal', 'ふつう'], ['fast', 'はやい'], ['fastest', 'とてもはやい']];
  const label = (list, v) => (list.find(o => o[0] === v) || list[1])[1];

  G.scenes.openSettings = function (x, y) {
    const S = G.settings;
    const build = () => [
      { label: '文字の速さ', note: label(SPEEDS, S.textSpeed) },
      { label: '敵の出やすさ', note: S.encounter === 'low' ? '少なめ' : 'ふつう' },
      { label: '音', note: S.sound ? '入' : '切' },
      { label: '文字の大きさ', note: S.textSize === 'large' ? '大きい' : 'ふつう' },
      { label: '戦いの速さ', note: (BSPEEDS.find(o => o[0] === S.battleSpeed) || BSPEEDS[0])[1] },
      { label: 'いつも走る', note: S.autoRun ? '入' : '切' },
      { label: 'カーソルを覚える', note: S.cursorMemory === false ? '切' : '入' },
      { label: '行き先の光', note: S.guide === false ? '切' : '入' },
      { label: 'もどる' },
    ];
    // 窓が画面からはみ出さず、下の説明の窓にも重ならないように置く（項目が増えても、文字を大きくしても）
    const W = 240, lh = G.renderer.large() ? 18 : 16, H = 16 + build().length * lh + lh + 4;
    const wx = Math.max(8, Math.min(x == null ? 120 : x, G.renderer.W - W - 8));
    const wy = Math.max(8, Math.min(y == null ? 60 : y, 276 - H));
    G.ui.choose(build(), {
      x: wx, y: wy, w: W, title: '設定', stay: true, refresh: build, name: '設定',
      extra: menu => {
        menu.y = Math.max(8, Math.min(wy, 276 - menu.h));   // 文字の大きさを変えたときも、下の窓に重ならない
        G.ui.drawWindow(8, 280, 464, 32);
        G.renderer.text('決定キーで切り替え。設定はこのブラウザに残る。', 20, 290, '#ccc');
      },
    }, i => {
      if (i === 0) { const k = SPEEDS.findIndex(o => o[0] === S.textSpeed); S.textSpeed = SPEEDS[(k + 1) % SPEEDS.length][0]; }
      else if (i === 1) S.encounter = S.encounter === 'low' ? 'normal' : 'low';
      else if (i === 2) { S.sound = !S.sound; G.sound.refresh(); }
      else if (i === 3) { S.textSize = S.textSize === 'large' ? 'normal' : 'large'; G.message.show('この大きさで、会話の文字を出します。'); }
      else if (i === 4) { const k = BSPEEDS.findIndex(o => o[0] === S.battleSpeed); S.battleSpeed = BSPEEDS[(k + 1) % BSPEEDS.length][0]; }
      else if (i === 6) S.cursorMemory = S.cursorMemory === false;
      else if (i === 7) { S.guide = S.guide === false; G.message.show(S.guide === false ? '行き先を光らせない。' : 'いまの目的の行き先を光らせる。画面の外なら端に矢印。'); }
      else if (i === 5) { S.autoRun = !S.autoRun; G.message.show(S.autoRun ? 'Shiftを押さなくても走る。押しているあいだは歩く。' : 'Shiftを押しているあいだ走る。'); }
      else { G.scene.pop(); return; }
      G.save.saveSettings();
    });
  };
})();
