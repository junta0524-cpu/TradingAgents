// このファイルの役目：マップ「土蜘蛛族の畑」（魔界・埴の里）のデータ。1章の始まりと終わりの場所。
// ハニヤスに話すと会談の話になり、東の市場へ行けるようになる。夕方（ch1_evening）は色味が変わる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色（仕様書 第11章）

  G.DATA.maps.yomi_hani = {
    name: '土蜘蛛族の畑',
    outside: '#2a1014',
    start: { x: 7, y: 13, dir: 'up' },
    tint: () => (G.flags.get('ch1_evening') && (G.state.chapter || 1) === 1 ? 'rgba(220,100,20,0.22)' : RED),
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mtgggggggggggggggggggggggggggm',
      'mgrrrrrrhrrrrrrhrrrrrrhrrrrrgm',
      'mgrrrrrrhrrrrrrhrrrrrrhrrrrrgm',
      'mghhhhhhhhhhhhhhhhhhhhhhhhhhgm',
      'mgrrrrrrhrrrrrrhrrrrrrhrrrrrgm',
      'mgrrrrrrhrrrrrrhrrrrrrhrrrrrgm',
      'mghhhhhhhhhhhhhhhhhhhhhhhhhhgm',
      'mggggggguggggggggggggggggggtgm',
      'uguuuuuuuuuuuuuuuuuuuuuuuuuuuu',
      'uguuuuuuuuuuuuuuuuuuuuuuuuuuuu',
      'mggggggugggggggggggggggggggggm',
      'mgrrrrrsgggggggLLLLLLLggKKggtm',
      'mgrrrrhhgggggggggggggggggggggm',
      'mgrrrrhhgggggggLLLLLLLggKggggm',
      'mgrrrrhhggggggggggggggggggggtm',
      'mtggggggggggggggggggggggggggOm',
      'mmmmmmmmmmmmmmuummmmmmmmmmmmmm',
    ],
    warps: [
      // 東の縦穴：大穴の上層（クリア後の寄り道。js/data/maps/oana_jou.js）
      { x: 28, y: 16, to: 'oana_jou', tx: 11, ty: 16, dir: 'up', requires: { chapter: 13 }, blockedText: '大穴へ下りる、細い縦穴だ。今は、下りる時ではない。' },
      // 南の端：魔界のフィールドへ（11章とクリア後だけ）,
      { x: 14, y: 17, to: 'world_makai', tx: 16, ty: 17, dir: 'right', requires: { chapter: [11, 13] }, blockedText: '（畑の外へは、今は出ない）' },
      { x: 15, y: 17, to: 'world_makai', tx: 16, ty: 17, dir: 'right', requires: { chapter: [11, 13] }, blockedText: '（畑の外へは、今は出ない）' },
      // 11章：西の端は角ヶ原の演武場へ
      { x: 0, y: 9,  to: 'tsunogahara', tx: 8, ty: 10, dir: 'up', when: { chapter: [11, 13] } },
      { x: 0, y: 10, to: 'tsunogahara', tx: 9, ty: 10, dir: 'up', when: { chapter: [11, 13] } },
      { x: 29, y: 9,  to: 'yomi_market', tx: 1, ty: 9,  dir: 'right', requires: { if: 'ch1_hani' }, blockedText: '（まずは、ハニヤスに声をかけよう）' },
      { x: 29, y: 10, to: 'yomi_market', tx: 1, ty: 10, dir: 'right', requires: { if: 'ch1_hani' }, blockedText: '（まずは、ハニヤスに声をかけよう）' },
    ],
    onEnter: [{ event: 'post_intro', chapter: 13, unless: 'post_intro' }, { event: 'ch11_fest', chapter: 11, all: ['train_mika', 'train_naki', 'train_susa'], unless: 'ch11_fest' }],
    npcs: [
      // クリア後
      { id: 'kunado13', look: 'kunado', x: 9, y: 11, dir: 'down', move: 'still', chapter: 13, event: 'post_kunado' },
      { id: 'haniyasu13', look: 'haniyasu', x: 6, y: 14, dir: 'up', move: 'still', chapter: 13, event: 'post_hani' },
      { id: 'haniyasu11', look: 'haniyasu', x: 6, y: 14, dir: 'up', move: 'still', chapter: 11,
        talk: [{ name: 'ハニヤス', text: '「荒らしに来たのではない、と」' }] },
      { id: 'haniyasu', look: 'haniyasu', x: 6, y: 14, dir: 'up', move: 'still', chapter: 1, unless: 'ch1_evening',
        event: 'ch1_hani', doneFlag: 'ch1_hani',
        talk: [{ name: 'ハニヤス', text: '「気づく前に足元を見ろ。土は黙っているが、忘れはせん」' }] },
      { id: 'haniyasu_eve', look: 'haniyasu', x: 8, y: 13, dir: 'left', move: 'still', chapter: 1, if: 'ch1_evening' },
      { id: 'wolfkid', look: 'wolfkid', x: 12, y: 13, dir: 'down', move: 'wander', chapter: 1,
        event: 'ch1_child', doneFlag: 'ch1_child',
        talk: [{ name: '嵐狼の子ども', text: '「じゃあ、ぼくもつける」' }] },
      { id: 'tsuchi', look: 'tsuchi', x: 18, y: 13, dir: 'up', move: 'still', chapter: 1, unless: 'ch1_evening',
        talk: ['ベルイザナは袖をまくり、土蜘蛛の若衆と並んで長い卓を運んだ。収穫祭は三日後だ。'] },
      { id: 'oni_sake', look: 'oni', x: 25, y: 13, dir: 'up', move: 'still', chapter: 1, unless: 'ch1_evening',
        talk: ['鬼族の祭り酒の樽が荷車で次々に着き、嵐狼の子どもたちが、樽の周りをはしゃいで走り回っている。'] },
    ],
    chests: [],
    signs: [],
  };
})();
