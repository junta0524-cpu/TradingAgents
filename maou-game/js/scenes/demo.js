// このファイルの役目：フェーズ0の動作確認用の画面。
// 黒い画面にウィンドウを出し、文章を1文字ずつ流す。終わったらタイトルへ戻る。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  G.scenes.demo = function () {
    return {
      name: '確認用',
      opaque: true,
      enter() {
        G.message.show(G.DATA.story.demo, () => G.scene.change(G.scenes.title()));
      },
      draw() {
        const r = G.renderer;
        r.clear('#000');
        G.ui.drawWindow(8, 8, 200, 40);
        r.text('土台の確認', 20, 22, '#fff');
      },
    };
  };
})();
