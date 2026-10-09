// このファイルの役目：ゲームの「数字」をここに集める。
// 遭遇率・成長・値段などは、フェーズが進むごとにここへ足していく。
// 数字を書き換えて保存し、ブラウザを再読込（F5）すれば試せる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.balance = {
    // 文字の表示速度（1文字あたりのミリ秒。小さいほど速い）
    TEXT_SPEED_MS: {
      slow: 50,    // ゆっくり
      normal: 30,  // ふつう
      fast: 12,    // はやい
    },
  };
})();
