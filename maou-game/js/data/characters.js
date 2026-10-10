// このファイルの役目：仲間になる人物の一覧（名前・見た目・最初の装備と言霊）。
// 強さの数字（成長表）は js/data/balance.js にある。
// isBell：ベルは倒れない（HPは1で止まる）。ベル以外が倒れるとゲームオーバー。
// fixed：レベルが上がらない（ベルは力を抑えた強さのまま）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.characters = {
    bell: {
      name: 'ベル', look: 'bell', isBell: true, fixed: true,
      equip: {}, kotodama: [],
    },
    oonamuchi: {
      name: 'オオナムチ', look: 'oonamuchi',
      equip: { weapon: 'old_dagger', armor: 'patched_cloak' },
      // 小説では4章の野犬戦で覚える。物語の場面ができるまで（フェーズ7）は最初から使える
      kotodama: ['katame', 'iyashi'],
    },
  };
})();
