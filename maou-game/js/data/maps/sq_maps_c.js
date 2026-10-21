// このファイルの役目：寄り道クエスト（グループC：八・五／十二・五／番外編一／番外編二）のための新しいマップ。
// 軍務局の書庫（八・五）、大穴の扉の向こうの名の部屋（番外編一）、北の古い砦と物見台の下の石室（番外編二）。
// ほかのマップと同じ書き方（rows・npcs・warps など）。クエストの人・踏む所・入ったときの場面は js/data/sidequests/ の各ファイルが G.sq.add で足す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  // ---- 八・五：天津京の軍務局の書庫（場面の goto だけで入る。クエストのあとは天津京の宿の前へ出る）----
  G.DATA.maps.amatsu_shoko = {
    name: '天津京　軍務局の書庫',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' |||||||||| ',
      ' __________ ',
      ' ||||__|||| ',
      ' __________ ',
      ' __________ ',
      ' ______kk__ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 4, ty: 7, dir: 'down', when: { unless: 'sq_c85_active' } },
      { x: 6, y: 8, to: 'amatsu', tx: 4, ty: 7, dir: 'down', when: { unless: 'sq_c85_active' } },
    ],
    npcs: [
      { id: 'shoko_clerk', look: 'clerk', x: 9, y: 7, dir: 'left', move: 'still', talk: ['（入口の机で、書庫番が、居眠りをしている）'] },
    ],
    chests: [],
    signs: [],
  };

  // ---- 番外編一：大穴の最深部の扉の向こう。壁一面に、歴代の番人の名 ----
  G.DATA.maps.oana_namae = {
    name: '大穴の最深部　名の部屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    tint: 'rgba(40,0,60,0.2)',
    rows: [
      ' GGGGGGGGGG ',
      ' GGGGGGGGGG ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'oana_soko', tx: 12, ty: 3, dir: 'down' },
      { x: 6, y: 8, to: 'oana_soko', tx: 13, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'namae_kunado', look: 'kunado', x: 3, y: 4, dir: 'up', move: 'still', talk: [{ name: 'クナド', text: '「歴代の、番人の名でございます」' }] },
    ],
    spots: [
      // 壁の名（いちばん新しい列の端の、すり減った跡は js/data/sidequests/bangai1.js が足す）
      ...[2, 3, 4, 5, 6, 7, 8, 10].map(x => ({ x, y: 1, text: '名前だった。古い字。新しい字。人の字。魔族の字。岐人の、見たことのない字。数えきれないほどの名が、壁を、埋め尽くしていた。' })),
    ],
    chests: [],
    signs: [],
  };

  // ---- 番外編二：北の古い砦（灰色の岩山の肩。南に麓の林、まん中に雪原、北に石の門と城壁、門の内に中庭、東に厩、北西の隅に物見台）----
  // 人間界の地図の (50,16)（イワクラ城の北の山のとなり）から入る。敵は出ない。
  G.DATA.maps.kita_toride = {
    name: '北の古い砦',
    outside: '#5a5e68',
    start: { x: 12, y: 18, dir: 'up' },
    tint: 'rgba(210,225,255,0.22)',   // 雪の色
    battleBg: 'mountain',
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mmmVVVVVVVVVVVVVVVVVVVVmmm',
      'mmmV^^^::::::::::YYYY:Vmmm',
      'mmmV#D#::::::::::####:Vmmm',
      'mmmV::::::::::::::::::Vmmm',
      'mmmV::::::::::::::::::Vmmm',
      'mmmV::::::::::::::::::Vmmm',
      'mmmVVVVVVVVVHHVVVVVVVVVmmm',
      'mm......................mm',
      'mm...R..............R...mm',
      'mm......................mm',
      'mm..........R...........mm',
      'mm......................mm',
      'mm......................mm',
      'mm..R................R..mm',
      'TTTTT..TTT..--..TTT..TTTTT',
      'TTTTTT.TTTT.--.TTTT.TTTTTT',
      'TTTTTTTTTTT.--.TTTTTTTTTTT',
      'TTTTTTTTTTT.--.TTTTTTTTTTT',
      'TTTTTTTTTTTT--TTTTTTTTTTTT',
    ],
    warps: [
      { x: 12, y: 19, to: 'world_ningen', tx: 50, ty: 17, dir: 'down' },
      { x: 13, y: 19, to: 'world_ningen', tx: 50, ty: 17, dir: 'down' },
      // 物見台の下の石室（ヤツカとの一騎討ちのあと）
      { x: 5, y: 3, to: 'kita_ishimuro', tx: 5, ty: 7, dir: 'up', requires: { if: 'sq_b2_yatsuka' }, blockedText: '（物見台の下の戸だ。固く閉ざされている）' },
    ],
    // 石の門：雪原の兵が目を覚ますまでは閉ざされている
    flagTiles: [
      { x: 12, y: 7, ch: '門', unless: 'sq_b2_snow' },
      { x: 13, y: 7, ch: '門', unless: 'sq_b2_snow' },
    ],
    npcs: [],
    spots: [
      { x: 18, y: 3, text: '騎兵の厩だ。' },
      { x: 19, y: 3, text: '騎兵の厩だ。' },
    ],
    chests: [],
    signs: [],
  };

  // ---- 番外編二：物見台の下の石室（まん中に、中継の石の黒い台座）----
  G.DATA.maps.kita_ishimuro = {
    name: '北の古い砦　物見台の下の石室',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    tint: 'rgba(20,20,50,0.25)',
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ffffffffff ',
      ' ffff88ffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      ' ffffffffff ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kita_toride', tx: 5, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'kita_toride', tx: 5, ty: 4, dir: 'down' },
    ],
    npcs: [],
    spots: [
      { x: 5, y: 3, text: '砕けた黒い石の欠片が、床に散らばっている。銀の線は、力を失って、垂れていた。', if: 'sq_b2_stone' },
      { x: 6, y: 3, text: '砕けた黒い石の欠片が、床に散らばっている。銀の線は、力を失って、垂れていた。', if: 'sq_b2_stone' },
    ],
    chests: [],
    signs: [],
  };
})();
