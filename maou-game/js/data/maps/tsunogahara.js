// このファイルの役目：マップ「角ヶ原の演武場」のデータ。11章、ミカヅチとの手合わせ（受けきる稽古）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.tsunogahara = {
    name: '角ヶ原の演武場',
    outside: '#2a1014',
    start: { x: 8, y: 10, dir: 'up' },
    tint: 'rgba(120,0,0,0.12)',
    rows: [
      'mmmmmmmmmmmmmmmmmm',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'muuuuuuuuuuuuuuuum',
      'mmmmmmmmuummmmmmmm',
    ],
    warps: [
      { x: 8, y: 11, to: 'yomi_hani', tx: 1, ty: 9, dir: 'right' },
      { x: 9, y: 11, to: 'yomi_hani', tx: 1, ty: 10, dir: 'right' },
    ],
    npcs: [
      { id: 'mika13', look: 'mikazuchi', x: 8, y: 4, dir: 'down', move: 'still', chapter: 13, event: 'post_mika' },
      { id: 'mika', look: 'mikazuchi', x: 8, y: 4, dir: 'down', move: 'still', chapter: 11, event: 'ch11_mika', doneFlag: 'train_mika',
        talk: [{ name: 'ミカヅチ', text: '「鬼族は、立ち上がる者には、何度でも付き合う」' }] },
    ],
    chests: [],
    signs: [],
  };
})();
