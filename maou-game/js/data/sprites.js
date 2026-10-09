// このファイルの役目：人物のドット絵（16×16）の「型紙」と「色」の一覧。
// 型紙の文字：K=輪郭 H=髪 S=肌 E=目 C=服 D=服の濃い所 B=靴 .=透明
// 新しい人物は LOOKS に色の組み合わせを1行足すだけで作れる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  // 体の上半分（向きごと）
  const BODY = {
    down: [
      '................',
      '.....KKKKKK.....',
      '....KHHHHHHK....',
      '...KHHHHHHHHK...',
      '...KHHHHHHHHK...',
      '...KHSSSSSSHK...',
      '...KSESSSSESK...',
      '...KSSSSSSSSK...',
      '....KKSSSSKK....',
      '...KCCCCCCCCK...',
      '..KSCCCDDCCCSK..',
      '..KSKCCDDCCKSK..',
      '...KKCCCCCCKK...',
    ],
    up: [
      '................',
      '.....KKKKKK.....',
      '....KHHHHHHK....',
      '...KHHHHHHHHK...',
      '...KHHHHHHHHK...',
      '...KHHHHHHHHK...',
      '...KHHHHHHHHK...',
      '...KKHHHHHHKK...',
      '....KKSSSSKK....',
      '...KCCCCCCCCK...',
      '..KSCCCCCCCCSK..',
      '..KSKCCCCCCKSK..',
      '...KKCCCCCCKK...',
    ],
    left: [
      '................',
      '.....KKKKK......',
      '....KHHHHHK.....',
      '...KHHHHHHHK....',
      '...KHHHHHHHK....',
      '...KSSHHHHHK....',
      '...KESSHHHHK....',
      '...KSSSSHHK.....',
      '....KKSSSKK.....',
      '....KCCCCCK.....',
      '....KCSSCCK.....',
      '....KCSSCCK.....',
      '....KCCCCCK.....',
    ],
  };

  // 足（向きごとに「立ち」「一歩目」の2枚。二歩目は一歩目の左右反転）
  const LEGS = {
    front: [
      ['....KDDKKDDK....', '....KBBKKBBK....', '.....KK..KK.....'],
      ['....KDDKKDDK....', '....KBBK.KDK....', '.....KK...KK....'],
    ],
    side: [
      ['.....KDDDK......', '.....KBBK.......', '.....KKK........'],
      ['....KDDKDDK.....', '...KBBK.KBBK....', '...KKK...KKK....'],
    ],
  };

  // 人物ごとの色
  const LOOKS = {
    // ベル：黒髪の青年、灰色の目、新しい旅の外套
    bell:     { K: '#120e16', H: '#2b2b3a', S: '#e8c4a0', E: '#9aa0a8', C: '#3e4a5e', D: '#2c3546', B: '#4a3626' },
    sailor:   { K: '#120e16', H: '#6b4a2e', S: '#d8a878', E: '#2a2a2a', C: '#e8e8f0', D: '#2a4a8a', B: '#3a2a1a' },
    child:    { K: '#120e16', H: '#c8783a', S: '#f0cca8', E: '#2a2a2a', C: '#d86a4a', D: '#a84a3a', B: '#5a3a1e' },
    guard:    { K: '#120e16', H: '#4a3a2a', S: '#d8b088', E: '#2a2a2a', C: '#8a8e98', D: '#5a5e68', B: '#3a3a3a' },
    clerk:    { K: '#120e16', H: '#8a3a2a', S: '#f0d0b0', E: '#2a2a2a', C: '#4a7a5a', D: '#e8e4da', B: '#4a3626' },
    elder:    { K: '#120e16', H: '#d8d8d8', S: '#d8b088', E: '#2a2a2a', C: '#7a5a8a', D: '#5a3a6a', B: '#3a2a1a' },
    merchant: { K: '#120e16', H: '#2a2a2a', S: '#e0b890', E: '#2a2a2a', C: '#b88a3a', D: '#7a5a2a', B: '#3a2a1a' },
  };

  G.DATA.sprites = { BODY, LEGS, LOOKS };
})();
