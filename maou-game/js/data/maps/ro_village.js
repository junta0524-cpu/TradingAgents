// このファイルの役目：マップ「炉ヶ岳　鉱山の里」のデータ。岩肌に張りつく石造りの工房と炉。6章の舞台。
// イシコリドメ・カナメ・炉番・検品官コトシロが出てくる。広場の机に納品の武具が並ぶ。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const OFFICIAL = { move: 'still', chapter: 6, if: 'ch6_order', unless: 'ch6_report' };
  G.DATA.maps.ro_village = {
    name: '炉ヶ岳　鉱山の里',
    outside: '#2a2420',
    start: { x: 12, y: 14, dir: 'up' },
    detection: 1,
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mmXXXXXmmmmmmmmmmmXXXXXXmm',
      'mmXZXXXmXXXmmmmmmmXXXXXXmm',
      'mmXXDXX.XDX::::....XXDXXmm',
      'mm.........::::.........mm',
      'mm...XXXX..::::..XXXX...mm',
      'mm...XXDX..::::..XDXX...mm',
      'mm.........::::.........mm',
      'mm..::::::::::::::::::..mm',
      'mm..::::::::kk::::::::..mm',
      'mm.........::::.........mm',
      'mm..XXXX...::::...XXXX..mm',
      'mm..XDXX...::::...XXDX..mm',
      'mm.........::::.........mm',
      'mmmmmmmmmmm::::mmmmmmmmmmm',
      'mmmmmmmmmmm::::mmmmmmmmmmm',
    ],
    warps: [
      { x: 9, y: 3, to: 'ro_dougu', tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋を分けた店（js/data/maps/rooms_shops2.js）
      // 建物の中（js/data/maps/rooms_ro.js）
      { x: 4, y: 3, to: 'ro_r1', tx: 5, ty: 7, dir: 'up' },
      { x: 21, y: 3, to: 'ro_r2', tx: 5, ty: 7, dir: 'up' },
      { x: 7, y: 6, to: 'ro_r3', tx: 5, ty: 7, dir: 'up' },
      { x: 18, y: 6, to: 'ro_r4', tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 12, to: 'ro_inn', tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 12, to: 'ro_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 15, to: 'ro_path', tx: 12, ty: 1, dir: 'down' },
      { x: 12, y: 15, to: 'ro_path', tx: 12, ty: 1, dir: 'down' },
      { x: 13, y: 15, to: 'ro_path', tx: 13, ty: 1, dir: 'down' },
      { x: 14, y: 15, to: 'ro_path', tx: 13, ty: 1, dir: 'down' },
    ],
    onEnter: [{ event: 'ch6_arrive', chapter: 6, unless: 'ch6_arrive' }],
    spots: [
      { x: 12, y: 9, event: 'ch6_blade', chapter: 6, if: 'ch6_order', unless: 'ch6_blade' },
      { x: 13, y: 9, event: 'ch6_blade', chapter: 6, if: 'ch6_order', unless: 'ch6_blade' },
      { x: 12, y: 9, text: '百本の剣。三十領の鎧。期限は今日の昼で、一本も欠けてはならない。', chapter: 6, if: 'ch6_order', unless: 'ch6_report' },
      { x: 13, y: 9, text: '百本の剣。三十領の鎧。期限は今日の昼で、一本も欠けてはならない。', chapter: 6, if: 'ch6_order', unless: 'ch6_report' },
    ],
    npcs: [
      { id: 'kaname', look: 'kaname', x: 5, y: 4, dir: 'down', move: 'still', chapter: 6, unless: 'ch6_fire',
        talk: [{ name: 'カナメ', text: '「人間の冒険者か。悪いが、今日は愛想よくしてやる余裕がない。降ろしたら、さっさと帰りな」' }] },
      { id: 'kaname_gate', look: 'kaname', x: 12, y: 13, dir: 'up', move: 'still', chapter: 6, if: 'ch6_fire', unless: 'ch6_descend', event: 'ch6_gate' },
      { id: 'ishi', look: 'ishikoridome', x: 7, y: 4, dir: 'down', move: 'still', chapter: 6,
        event: 'ch6_order', doneFlag: 'ch6_order',
        talk: [{ name: 'イシコリドメ', text: '「誰にも見られない品でも、仕事は仕事だ」' }] },
      { id: 'roban', look: 'dwarf', x: 3, y: 4, dir: 'up', move: 'still', chapter: 6, if: 'ch6_report', unless: 'ch6_fire', event: 'ch6_fire' },
      Object.assign({ id: 'kanri', look: 'kanri', x: 14, y: 7, dir: 'down', talk: ['……。'] }, OFFICIAL),
      Object.assign({ id: 'kotoshiro', look: 'kotoshiro', x: 15, y: 10, dir: 'left', talk: ['……。'] }, OFFICIAL),
      Object.assign({ id: 'jutsushi', look: 'jutsushi', x: 10, y: 10, dir: 'right', talk: ['広場の隅で、官吏の連れた術師らしい男たちが、納品された剣に、手をかざしていた。唇が、小さく動いている。'] }, OFFICIAL),
      { id: 'smith1', look: 'dwarf', x: 19, y: 4, dir: 'down', move: 'still', chapter: 6,
        talk: ['槌を振る職人たちの腕は力強いのに、目の下に、深い隈がある。誰も笑っていない。'] },
      { id: 'smith2', look: 'dwarf2', x: 8, y: 7, dir: 'right', move: 'wander', chapter: 6,
        talk: ['背の低いがっしりした体格のドワーフたちが、口を結んで、黙々と鉄を打っている。'] },
    ],
    chests: [{ id: 'scrap', x: 23, y: 4, item: 'hoshiii' }],
    signs: [],
  };
})();
