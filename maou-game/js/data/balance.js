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

    // 歩く速さ（1コマで進むドット数。16で割り切れる数にする）
    WALK_SPEED: 2,   // ふつうに歩く
    DASH_SPEED: 4,   // Shiftを押しながら

    // 町の人がうろうろ歩く間隔（コマ数。60コマ＝1秒）
    NPC_WANDER_MIN: 60,
    NPC_WANDER_MAX: 180,
    NPC_WANDER_RANGE: 2,   // 最初の場所から何マスまで離れるか

    // はじめから遊ぶときの場所と所持金
    START: { map: 'minamo', x: 15, y: 12, dir: 'down', gold: 0 },
  };
})();
