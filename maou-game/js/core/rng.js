// このファイルの役目：乱数（サイコロ）を作る。
// デバッグで「乱数の固定」をONにすると、毎回同じ順番の数が出るので、戦闘の確認がしやすい。
(function () {
  const G = window.GAME = window.GAME || {};

  let state = 0;
  const FIXED_SEED = 12345;

  const rng = {
    fixed: false,
    seed(n) { state = n >>> 0; },
    // 0以上1未満の数
    random() {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    // min以上max以下の整数
    int(min, max) { return min + Math.floor(rng.random() * (max - min + 1)); },
    // min以上max未満の小数
    range(min, max) { return min + rng.random() * (max - min); },
    // 確率 p（0〜1）で true
    chance(p) { return rng.random() < p; },
    setFixed(on) {
      rng.fixed = on;
      rng.seed(on ? FIXED_SEED : Date.now());
    },
  };
  rng.seed(Date.now());
  G.rng = rng;
})();
