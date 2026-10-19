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
    // 魔王の姿のベル：深い色の髪、紅い目、黒い外套（小説 第十章）
    bell_true:{ K: '#0a0608', H: '#140a1c', S: '#e0c0a8', E: '#d02030', C: '#1a141e', D: '#0e0a12', B: '#1a1418' },
    // 蹂躙戦闘の兵（人族の軍。白い陣羽織）
    soldier:  { K: '#120e16', H: '#5a5e68', S: '#d8b088', E: '#2a2a2a', C: '#d8d8e0', D: '#8a8e98', B: '#3a3a3a' },
    // オオナムチ：継ぎの当たった茶色の外套、素朴な顔
    oonamuchi:{ K: '#120e16', H: '#5a3a24', S: '#e0b48a', E: '#2a2a2a', C: '#7a6a4e', D: '#5a4a34', B: '#3a2a1a' },
    // 臨時の仲間（小説の見た目に合わせた色）
    sukuna:   { K: '#120e16', H: '#a8d8c0', S: '#d8b088', E: '#2a2a2a', C: '#6a7a5a', D: '#4a5a3a', B: '#3a2a1a' },  // 淡い緑の髪の老薬師（顔グラに合わせた）
    konoha:   { K: '#120e16', H: '#c8a860', S: '#f0d0b0', E: '#2a6a3a', C: '#3a6a4a', D: '#2a4a32', B: '#4a3626' },  // 混血エルフ
    kaname:   { K: '#120e16', H: '#a8502a', S: '#e0b088', E: '#2a2a2a', C: '#5a4a3a', D: '#2a2420', B: '#3a2a1a' },  // 赤茶の髪、煤の前掛け
    kotoshiro:{ K: '#120e16', H: '#3a3a3a', S: '#e0b890', E: '#2a2a2a', C: '#e8e4da', D: '#6a7a9a', B: '#2a2a2a' },  // 役人の制服
    uzume:    { K: '#120e16', H: '#8a5a32', S: '#f0c8a0', E: '#2a2a2a', C: '#c87a3a', D: '#8a4a22', B: '#4a3626' },  // 栗色の耳と尻尾
    hieda:    { K: '#120e16', H: '#d8d8d8', S: '#d8b088', E: '#2a2a2a', C: '#2a3a6a', D: '#1a2448', B: '#3a2a1a' },  // 藍色の古い外套
    sailor:   { K: '#120e16', H: '#6b4a2e', S: '#d8a878', E: '#2a2a2a', C: '#e8e8f0', D: '#2a4a8a', B: '#3a2a1a' },
    child:    { K: '#120e16', H: '#c8783a', S: '#f0cca8', E: '#2a2a2a', C: '#d86a4a', D: '#a84a3a', B: '#5a3a1e' },
    guard:    { K: '#120e16', H: '#4a3a2a', S: '#d8b088', E: '#2a2a2a', C: '#8a8e98', D: '#5a5e68', B: '#3a3a3a' },
    clerk:    { K: '#120e16', H: '#8a3a2a', S: '#f0d0b0', E: '#2a2a2a', C: '#4a7a5a', D: '#e8e4da', B: '#4a3626' },
    elder:    { K: '#120e16', H: '#d8d8d8', S: '#d8b088', E: '#2a2a2a', C: '#7a5a8a', D: '#5a3a6a', B: '#3a2a1a' },
    merchant: { K: '#120e16', H: '#2a2a2a', S: '#e0b890', E: '#2a2a2a', C: '#b88a3a', D: '#7a5a2a', B: '#3a2a1a' },
    // ---- 第二部の人々 ----
    hal:      { K: '#120e16', H: '#6a4a2a', S: '#f0cca8', E: '#2a2a2a', C: '#8a7a5a', D: '#6a5a3e', B: '#5a3a1e' },  // ハル（耳の先が尖った少年）
    kid_ear:  { K: '#120e16', H: '#a87a4a', S: '#f0cca8', E: '#2a2a2a', C: '#6a8a5a', D: '#4a6a3e', B: '#5a3a1e' },
    kid_tail: { K: '#120e16', H: '#5a5a6a', S: '#e8c4a0', E: '#2a2a2a', C: '#a86a4a', D: '#7a4a32', B: '#5a3a1e' },
    villager: { K: '#120e16', H: '#4a3a2a', S: '#e0b890', E: '#2a2a2a', C: '#8a6a5a', D: '#6a4a3e', B: '#3a2a1a' },
    beastwoman: { K: '#120e16', H: '#b8783a', S: '#f0c8a0', E: '#2a2a2a', C: '#7a5a8a', D: '#5a3a6a', B: '#3a2a1a' },  // 獣の耳を持つ女
    elf:      { K: '#120e16', H: '#e8d890', S: '#f4dcc0', E: '#3a7a4a', C: '#4a7a5a', D: '#2e5a3e', B: '#3a2a1a' },
    elf2:     { K: '#120e16', H: '#c8c0a0', S: '#f0d8c0', E: '#3a6a8a', C: '#6a7a4a', D: '#4a5a32', B: '#3a2a1a' },
    kushinada:{ K: '#120e16', H: '#3aa860', S: '#f8e4d0', E: '#3a7a5a', C: '#f4f4f0', D: '#d8d0c0', B: '#a89a7a' },  // 聖の森の女王（緑の髪。顔グラに合わせた）
    minato:   { K: '#120e16', H: '#6a5a4a', S: '#e8c8a8', E: '#4a4a4a', C: '#d8d4c8', D: '#a8a090', B: '#5a4a3a' },  // アマツ王の使者
    kunado:   { K: '#120e16', H: '#1a1a2a', S: '#d8c0a8', E: '#2a2a4a', C: '#2a2a3a', D: '#1a1a26', B: '#141420' },  // 岐人（大穴の番人）
    ishikoridome: { K: '#120e16', H: '#c0482a', S: '#d8a878', E: '#2a2a2a', C: '#5a4a3a', D: '#3a2e24', B: '#2a2014' },  // 赤い髭の老鍛冶（顔グラに合わせた）
    dwarf:    { K: '#120e16', H: '#7a4a2a', S: '#d8a878', E: '#2a2a2a', C: '#6a5a4a', D: '#2a2420', B: '#2a2014' },
    dwarf2:   { K: '#120e16', H: '#3a3a3a', S: '#d0a070', E: '#2a2a2a', C: '#7a5a3a', D: '#2a2420', B: '#2a2014' },
    kanri:    { K: '#120e16', H: '#2a2a2a', S: '#e8c8a8', E: '#2a2a2a', C: '#f4f4f4', D: '#b8b8c0', B: '#3a3a3a' },  // 白い官服の官吏
    jutsushi: { K: '#120e16', H: '#4a4a5a', S: '#d8c0a8', E: '#2a2a2a', C: '#4a4a6a', D: '#2e2e48', B: '#2a2a2a' },  // 術師
    yuu:      { K: '#120e16', H: '#a86a3a', S: '#f0cca8', E: '#2a2a2a', C: '#e8e8e8', D: '#8a8a94', B: '#3a3a3a' },  // ユウ（栗色の髪、白い腕章）
    sarutahiko: { K: '#120e16', H: '#d8a830', S: '#d8a878', E: '#2a2a2a', C: '#7a5a3a', D: '#5a3e24', B: '#3a2a1a' },  // 獣ノ原の王（金色のたてがみ）
    kazumi:   { K: '#120e16', H: '#4a3a2a', S: '#e0c4a8', E: '#2a2a2a', C: '#d8d8d0', D: '#a8a8a0', B: '#6a6a6a' },  // ヒナの父（寝間着）
    mio:      { K: '#120e16', H: '#3a2a20', S: '#e8c8a8', E: '#2a2a2a', C: '#7a6a8a', D: '#5a4a6a', B: '#3a2a1a' },
    // ---- 魔界の人々（第一部）----
    haniyasu: { K: '#120e16', H: '#3a3020', S: '#c8a070', E: '#c08020', C: '#4a4030', D: '#2e281c', B: '#2a2014' },  // 土蜘蛛族の長。硬い甲殻
    mikazuchi:{ K: '#120e16', H: '#1a1a1a', S: '#c8705a', E: '#e8c040', C: '#6a2a2a', D: '#4a1a1a', B: '#2a1a14' },  // 鬼族の頭領
    nakime:   { K: '#120e16', H: '#101018', S: '#e8d0c0', E: '#c0a020', C: '#22222e', D: '#14141c', B: '#1a1a1a' },  // 鴉族の長
    susano:   { K: '#120e16', H: '#8a8a9a', S: '#d0b090', E: '#d0c040', C: '#4a4a5a', D: '#32323e', B: '#2a2a2a' },  // 嵐狼族の長
    omoika:   { K: '#120e16', H: '#4a3a6a', S: '#e0c4a8', E: '#c0c0ff', C: '#5a4a7a', D: '#3a2e52', B: '#2a2034' },  // 参謀
    amatsu:   { K: '#120e16', H: '#e8e0c0', S: '#f0d8c0', E: '#4a4a4a', C: '#f4f4f4', D: '#c8c0a0', B: '#a89a7a' },  // 人の王。白い礼装
    takeru:   { K: '#120e16', H: '#6a4a2a', S: '#e0b890', E: '#3a5a8a', C: '#c8ccd8', D: '#8a90a0', B: '#5a5e68' },  // 勇者。白銀の鎧
    oni:      { K: '#120e16', H: '#2a2a2a', S: '#b86a50', E: '#e8c040', C: '#5a4a3a', D: '#3a2e24', B: '#2a1a14' },  // 鬼族（書記・看守）
    crow:     { K: '#120e16', H: '#101018', S: '#d8c0a8', E: '#c0a020', C: '#3a3a4a', D: '#e0d0b0', B: '#1a1a1a' },  // 鴉族（屋台の店主・荷運び）
    wolfkid:  { K: '#120e16', H: '#9a9aaa', S: '#e0c0a0', E: '#2a2a2a', C: '#7a6a5a', D: '#5a4a3a', B: '#3a2a1a' },  // 嵐狼の子ども
    tsuchi:   { K: '#120e16', H: '#3a3020', S: '#d0a878', E: '#2a2a2a', C: '#6a5a3a', D: '#4a3e28', B: '#2a2014' },  // 土蜘蛛の若衆
    oldwoman: { K: '#120e16', H: '#c8c8c8', S: '#d8b088', E: '#2a2a2a', C: '#6a5a4a', D: '#4a3e32', B: '#3a2a1a' },  // 市場の老婆
  };

  G.DATA.sprites = { BODY, LEGS, LOOKS };
})();
