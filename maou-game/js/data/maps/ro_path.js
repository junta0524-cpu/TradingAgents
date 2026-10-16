// このファイルの役目：マップ「炉ヶ岳の山道」のデータ。6章で登り下りする山道（敵が出る）。上は鉱山の里。
// 里を出たあとは、下の端で炉ヶ岳の仲間と別れ、7章へ進む。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.ro_path = {
    name: '炉ヶ岳の山道',
    outside: '#2a2420',
    start: { x: 12, y: 19, dir: 'up' },
    battleBg: 'mountain',
    tint: () => (G.flags.get('ch6_descend') && G.state.chapter === 6 ? 'rgba(220,220,230,0.25)' : null),   // 里を出る朝の霧
    encounter: {
      steps: [12, 22],
      groups: [['iwatokage'], ['hinezumi', 'hinezumi'], ['yamagarasu'], ['yamagarasu', 'hinezumi'], ['iwatokage', 'hinezumi'], ['yamagarasu', 'yamagarasu']],
    },
    rows: [
      'mmmmmmmmmmmm--mmmmmmmmmmm',
      'mmmmmmmmmmmm--mmmmmmmmmmm',
      'mm.........---.........mm',
      'mm.mmmmmmm.-mm.mmmmmmm.mm',
      'mm.mm...........RR...m.mm',
      'mm....RR..mmmm.......m.mm',
      'mmmm..RR..mmmm..mmm....mm',
      'mm...........------....mm',
      'mm..mmm..-----mm..m...mmm',
      'mm..mmm..-mmmmmm...熱熱mmmm',
      'mm.......-.......RR熱熱熱.mm',
      'mmm..RR..-.mmmm..RR熱熱m熱mm',
      'mm.......-.mmmm......m熱mm',
      'mm..mmmm.------------..mm',
      'mm..mmmm...........-...mm',
      'mm.........RR..mmm.-...mm',
      'mmmm.......RR..mmm.-.mmmm',
      'mO.....mmm.........-...mm',
      'mm.....mmm..-------....mm',
      'mm..........-..........mm',
      'mmmmmmmmmmmm-mmmmmmmmmmmm',
    ],
    warps: [
      // 西の岩陰：古い坑道（寄り道。js/data/maps/ro_mine.js）
      { x: 1, y: 17, to: 'ro_mine', tx: 12, ty: 16, dir: 'up' },
      // 南の端：人間界のフィールドへ,
      { x: 12, y: 20, to: 'world_ningen', tx: 8, ty: 6, dir: 'down', when: { chapterFrom: 7 } },
      // 6章：ミナモから歩いて来るので、里の用が済むまでは地図へ戻れる。用が済んだら山を下りる場面（ch6_end）が先
      { x: 12, y: 20, to: 'world_ningen', tx: 8, ty: 6, dir: 'down', when: { chapter: 6, unless: 'ch6_descend' } },
      { x: 12, y: 0, to: 'ro_village', tx: 12, ty: 14, dir: 'up' },
      { x: 13, y: 0, to: 'ro_village', tx: 13, ty: 14, dir: 'up' },
    ],
    triggers: [{ x: 12, y: 20, event: 'ch6_end', chapter: 6, if: 'ch6_descend' }],
    npcs: [],
    chests: [
      { id: 'ledge', x: 3, y: 4, item: 'kizugusuri' },
      { id: 'crag', x: 22, y: 10, copper: 80 },
      { id: 'cave', x: 3, y: 17, item: 'mezamashi' },
    ],
    signs: [{ x: 13, y: 19, text: '北　鉱山の里' }],
  };
})();
