// このファイルの役目：魔界の四種族と相性（四すくみ）。鬼族→嵐狼族→土蜘蛛族→鴉族→鬼族（左が右に強い。仕様書 第2章・小説 第十一章）。
// オオナムチは最後に唱えた言霊の系統で「構え」が決まり、その種族として攻める（系統と種族の結びつきは、その系統を教える師の種族）。
// 倍率の数字は js/data/balance.js の AFFINITY。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.tribes = {
    oni:        { name: '鬼族',   short: '鬼', beats: 'arashi',     sys: 'hono' },    // ミカヅチ（火・攻）
    arashi:     { name: '嵐狼族', short: '狼', beats: 'tsuchigumo', sys: 'tsuku' },   // スサノ（月・先読み）
    tsuchigumo: { name: '土蜘蛛族', short: '蜘', beats: 'karasu',   sys: 'yama' },    // ハニヤス（山・守）
    karasu:     { name: '鴉族',   short: '鴉', beats: 'oni',        sys: 'iza' },     // ナキメ（生・再生）
  };
})();
