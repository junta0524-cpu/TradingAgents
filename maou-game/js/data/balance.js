// このファイルの役目：ゲームの「数字」をここに集める。
// 遭遇率・強さ・ダメージの式の数字・逃げやすさなどを、ここで変えられる。
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

    // はじめから遊ぶときの場所と所持金（銅貨）
    START: { map: 'minamo', x: 15, y: 12, dir: 'down', copper: 0 },

    // ---- 仲間の強さ（フェーズ3でレベルと成長表に置きかえる）----
    // ベルは本来カンストだが、4〜9章は力を抑えている（仕様書 7-2）。ここは「抑えた強さ」
    PARTY: [
      { id: 'bell',      hp: 60, mp: 0, atk: 14, def: 12, agi: 10 },
      { id: 'oonamuchi', hp: 18, mp: 6, atk: 9,  def: 5,  agi: 6 },
    ],

    // ---- 戦闘の式（仕様書 第6章）----
    BATTLE: {
      CRIT_RATE: 1 / 64,             // 会心の確率
      ORDER_RAND_MIN: 0.5,           // 行動順＝素早さ×乱数(0.5〜1.0)
      ORDER_RAND_MAX: 1.0,
      DEFEND_RATE: 0.5,              // ぼうぎょ中の被ダメージ倍率
      ESCAPE_CHANCE: [1 / 2, 1 / 2, 3 / 4, 7 / 8],  // 1回目・2回目・3回目・4回目以降
      TARGET_WEIGHTS: [40, 30, 20, 10],             // 狙われ率（前列から）
      EXP_SPLIT: true,               // true：経験値を生きている仲間で分ける
      DROP_RATE: { S: 1 / 128, A: 1 / 32, B: 1 / 16, C: 1 / 8 },  // 落とし物の確率ランク
    },

    // ---- 遭遇（エンカウント）----
    ENCOUNTER_LOW_MULT: 2,           // 設定「少なめ」のとき、遭遇までの歩数を何倍にするか
    TALL_GRASS_STEPS: 2,             // 草むらでは1歩で何歩ぶん数えるか
  };
})();
