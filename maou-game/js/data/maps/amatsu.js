// このファイルの役目：マップ「王都　天津京」のデータ。白い都。円議堂の前の広場、タケルの像、宿、鐘楼。8・9章の舞台。
// 宿の主人に話すと、昼と夜を切り替えられる（8章）。夜だけ、鐘楼の裏の路地から貧民区へ行ける。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const DAY = { move: 'still', chapter: 8, unless: 'amatsu_night' };
  G.DATA.maps.amatsu = {
    name: '王都　天津京',
    outside: '#d8d8d0',
    start: { x: 15, y: 18, dir: 'up' },
    detection: 2,   // 8〜9章：探知網が濃い（仕様書 7-1）
    tint: () => (G.flags.get('amatsu_night') ? 'rgba(10,16,50,0.5)' : null),
    rows: [
      '11111111111111111111111111111111',
      '13333333322222222222222333333331',
      '13333333322222222222222333333331',
      '13222222322222222222222335553331',
      '13222222311111111111111335553331',
      '131111113111111DD111111335553331',
      '1311D111333333333333333335553331',
      '133333333333kkkkkkkk333333331111',
      '13333333333333333333333333333333',
      '13333333333333333333333333331111',
      '13333333333333333333333333333331',
      '13333333333333334333333333333331',
      '13222222333333333333333322222231',
      '13222222333333333333333322222231',
      '13111111333333333333333311111131',
      '1311D111333333333333333311D11131',
      '13333333333333333333333333333331',
      '13333333333333333333333333333331',
      '13333333333333333333333333333331',
      '11111111111111133111111111111111',
    ],
    // 8章：着いたときの場面／9章：祝賀の夜のコトシロの場面から、やすらぎの院へ
    onEnter: [{ event: 'ch8_arrive', chapter: 8, unless: 'ch8_arrive' }, { event: 'ch9_festival', chapter: 9, unless: 'ch9_in' }],
    warps: [
      // 建物の中（js/data/maps/rooms_amatsu.js）
      { x: 15, y: 5, to: 'amatsu_hall', tx: 5, ty: 7, dir: 'up' },
      { x: 16, y: 5, to: 'amatsu_hall', tx: 6, ty: 7, dir: 'up' },
      { x: 4, y: 6, to: 'amatsu_inn', tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 15, to: 'amatsu_r1', tx: 5, ty: 7, dir: 'up' },
      { x: 26, y: 15, to: 'amatsu_r2', tx: 5, ty: 7, dir: 'up' },
      { x: 31, y: 8, to: 'amatsu_slum', tx: 24, ty: 6, dir: 'left', requires: { if: 'amatsu_night', chapter: 8 }, blockedText: '鐘楼の裏の路地。表通りの白い街灯が、ここまでは届かない。' },
      { x: 15, y: 19, to: 'world_ningen', tx: 26, ty: 12, dir: 'down', requires: { chapterTo: 9, chapterAlso: 13 }, blockedText: '（いまは、王都を離れない）' },
      { x: 16, y: 19, to: 'world_ningen', tx: 26, ty: 12, dir: 'down', requires: { chapterTo: 9, chapterAlso: 13 }, blockedText: '（いまは、王都を離れない）' },
    ],
    triggers: [12, 13, 14, 15, 16, 17, 18, 19].map(x => ({ x, y: 8, event: 'ch8_debate', chapter: 8, if: 'ch8_arrive', unless: 'ch8_debate' })),
    spots: [
      { x: 16, y: 11, text: '剣を掲げた青年の像だった。台座には、彫り込まれた文字がある。\n『正義は我らにあり』' },
      { x: 14, y: 5, text: '円議堂だ。街のどこからでも目に入る位置に建っている。' },
      { x: 17, y: 5, text: '円議堂だ。街のどこからでも目に入る位置に建っている。' },
    ],
    npcs: [
      Object.assign({ id: 'giin1', look: 'kanri', x: 14, y: 6, dir: 'down', talk: ['「皆さんのご意見を、お聞かせください」'] }, DAY),
      Object.assign({ id: 'giin2', look: 'kanri', x: 17, y: 6, dir: 'down', talk: ['「ご不安ですね。大切な声です」'] }, DAY),
      Object.assign({ id: 'crowd0', look: 'villager', x: 12, y: 9, dir: 'up', talk: ['「俺は、魔族が怖い。家族を守りたいから、軍を増やすべきだと思う」'] }, DAY),
      Object.assign({ id: 'crowd1', look: 'oldwoman', x: 14, y: 10, dir: 'up', talk: ['「念のため」'] }, DAY),
      Object.assign({ id: 'crowd2', look: 'beastwoman', x: 19, y: 9, dir: 'up', talk: ['「念のため」'] }, DAY),
      Object.assign({ id: 'crowd3', look: 'dwarf2', x: 17, y: 10, dir: 'up', talk: ['「悪気はないんだ。ただ、念のため」'] }, DAY),
      Object.assign({ id: 'crowd4', look: 'child', x: 13, y: 13, dir: 'up', talk: ['子は頷き、胸に手を当てて、短く礼をした。'] }, DAY),
      Object.assign({ id: 'crowd5', look: 'merchant', x: 20, y: 14, dir: 'up', talk: ['人は多い。ただ、誰も大声を出さない。'] }, DAY),
      { id: 'kotoshiro', look: 'kotoshiro', x: 24, y: 9, dir: 'left', move: 'still', chapter: 8, if: 'ch8_debate', unless: 'ch8_meet', event: 'ch8_meet' },
    ],
    chests: [],
    signs: [],
  };
})();
