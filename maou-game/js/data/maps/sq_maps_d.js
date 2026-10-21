// このファイルの役目：寄り道クエスト（グループD：番外編三〜六）のための新しいマップ。
// 北の山の村 kita_yamamura（番外編四。イワクラ城の北の山すそ）と、その家の中（ゴロウの家・ヤツカの家）。
// 人間界の地図への入口は js/data/sidequests/bangai4.js の G.sq.add で足す（フラグ kita_yamamura_open から入れる）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  // 北の山の村：いちばん高い梅の木（ゴロウの家のとなり）・干し大根の軒の家・山すその畑
  G.DATA.maps.kita_yamamura = {
    name: '北の山の村',
    outside: '#2a2a22',
    start: { x: 11, y: 14, dir: 'up' },
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmm',
      'mmmTTT......mmmmmmmmmmmm',
      'mmT...........TT.YYYYY.m',
      'mT..vvvv.........#W#D#.m',
      'mT..vvvv...........-...m',
      'mT.........---------...T',
      'mT..YYYYY..-..........TT',
      'mT..#W#D#T.-...vvvv...Tm',
      'mT.........-...vvvv...TT',
      'mT..F......-..........Tm',
      'mTT........-....F....TTm',
      'mmT........-........TTmm',
      'mmTT.......-.......TTmmm',
      'mmmTTTTTT..-..TTTTTmmmmm',
      'mmmmmmmmmT.-.Tmmmmmmmmmm',
      'mmmmmmmmmmT--Tmmmmmmmmmm',
    ],
    warps: [
      { x: 7, y: 7, to: 'kita_goro', tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 3, to: 'kita_yatsuka', tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 15, to: 'world_ningen', tx: 47, ty: 22, dir: 'down' },
      { x: 12, y: 15, to: 'world_ningen', tx: 47, ty: 22, dir: 'down' },
    ],
    // 住む人（クエストの人は js/data/sidequests/bangai4.js で足す。ここは、クエストを終えたあとの暮らし）
    npcs: [
      { id: 'kita_seki', look: 'soldier', x: 13, y: 12, dir: 'left', move: 'still', if: 'sq_done_bangai4',
        talk: ['（弓兵だった若者、セキだ。北の砦から戻って、頬に肉が戻っている。村の入口で、街道を見ている）'] },
      { id: 'kita_misaki', look: 'misaki', x: 10, y: 8, dir: 'up', move: 'still', if: 'sq_done_bangai4',
        talk: ['（ミサキが、梅の木の根もとで、父ちゃんの古い手紙を読み返している）'] },
      { id: 'kita_kid', look: 'child', x: 5, y: 9, dir: 'down', move: 'wander', talk: ['（村の子どもが、山の下の街道を指さしている）'] },
      { id: 'kita_farmer', look: 'villager', x: 16, y: 9, dir: 'up', move: 'still', talk: ['（畑の男が、干し大根を軒に吊るしている）'] },
    ],
    spots: [
      { x: 9, y: 7, text: '村でいちばん高い梅の木だ。枝の先に、白い花が、ぽつぽつと開いている。' },
    ],
    chests: [],
    signs: [],
  };

  // ゴロウの家（梅の木の下の家）：土間と板の間・囲炉裏・文机
  G.DATA.maps.kita_goro = {
    name: '北の山の村　ゴロウの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]**{***[[ ',
      ' ********** ',
      ' ****kk**** ',
      ' ********** ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kita_yamamura', tx: 7, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: 'kita_yamamura', tx: 7, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: 'kita_yone', look: 'yone', x: 7, y: 3, dir: 'down', move: 'still', if: 'sq_done_bangai4',
        talk: ['（ヨネが、囲炉裏の前で、ゴロウの古い手紙の束をほどいては、また結んでいる）'] },
    ],
    chests: [],
    signs: [],
  };

  // ヤツカの家：老将の住まい
  G.DATA.maps.kita_yatsuka = {
    name: '北の山の村　ヤツカの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ||]]**[[[] ',
      ' ********** ',
      ' ***{****** ',
      ' ********** ',
      ' ++++++++}+ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kita_yamamura', tx: 20, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'kita_yamamura', tx: 20, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'kita_yatsuka', look: 'yatsuka', x: 6, y: 4, dir: 'down', move: 'still', if: 'sq_done_bangai4',
        talk: ['（老将ヤツカが、梳かれた長いひげを撫でながら、炉の火を見ている）'] },
    ],
    chests: [],
    signs: [],
  };
})();
