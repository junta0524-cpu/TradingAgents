// このファイルの役目：仲間になる人物の一覧（名前・見た目・特別な性質）。
// 強さの数字は js/data/balance.js の PARTY にある。
// isBell：ベルは倒れない（HPは1で止まる）。ベル以外が倒れるとゲームオーバー。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.characters = {
    bell:      { name: 'ベル',       look: 'bell',      isBell: true },
    oonamuchi: { name: 'オオナムチ', look: 'oonamuchi' },
  };
})();
