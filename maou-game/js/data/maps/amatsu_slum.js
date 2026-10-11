// このファイルの役目：マップ「天津京　貧民区」のデータ。夜だけ来られる、亜人の多くが押し込められた区（8章）。
// 入ると、コトシロの隠れ家で移送記録を見る場面と、ミオ・ヒナとの出会いの場面が流れる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.amatsu_slum = {
    name: '天津京　貧民区',
    outside: '#101018',
    start: { x: 24, y: 6, dir: 'left' },
    detection: 1,
    tint: 'rgba(10,16,50,0.5)',
    rows: [
      '11111111111111111111111111',
      '1eeeeeeeeeeeeeeeeeeeeeeee1',
      '1eYYYYeeYYYYeeYYYYeeYYYYe1',
      '1eYYYYeeYYYYeeYYYYeeYYYYe1',
      '1eXdXXeeXdXXeeXdXXeeXdXXe1',
      '1eeeeeeeeeeeeeeeeeeeeeeee1',
      '1eeeeeeeeeeeeeeeeeeeeeeeee',
      '1eeeeeeeeeeeeeeeeeeeeeeeee',
      '1eYYYYeeYYYYeeYYYYeeYYYYe1',
      '1eYYYYeeYYYYeeYYYYeeYYYYe1',
      '1eXdXXeeXdXXeeXdXXeeXdXXe1',
      '1eeeeeeeeeeeeeeeeeeeeeeee1',
      '1eeeeeeeeeeeeeeeeeeeeeeee1',
      '11111111111111111111111111',
    ],
    warps: [
      { x: 25, y: 6, to: 'amatsu', tx: 30, ty: 8, dir: 'left' },
      { x: 25, y: 7, to: 'amatsu', tx: 30, ty: 8, dir: 'left' },
    ],
    onEnter: [{ event: 'ch8_slum', chapter: 8, if: 'ch8_meet', unless: 'ch8_mio' }],
    npcs: [
      { id: 'kotoshiro', look: 'kotoshiro', x: 9, y: 5, dir: 'down', move: 'still', chapter: 8, talk: [{ name: 'コトシロ', text: '「表の者は、誰も来ません。来ないように、できているのです」' }] },
      { id: 'kid', look: 'kid_ear', x: 15, y: 5, dir: 'down', move: 'still', talk: ['扉の前に、獣の耳を持つ子どもが、座っていた。目が、虚ろだった。'] },
      { id: 'hina', look: 'kid_tail', x: 3, y: 11, dir: 'down', move: 'still', chapter: 8, if: 'ch8_mio', talk: [{ name: 'ヒナ', text: '「お父さんは、ね」' }, { name: 'ヒナ', text: '「ぜったい、帰ってくるの」' }] },
    ],
    chests: [{ id: 'alley', x: 23, y: 12, item: 'kizugusuri' }],
    signs: [],
  };
})();
