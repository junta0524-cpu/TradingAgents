// このファイルの役目：マップ「魔界の市場」のデータ。1章で、ベルイザナが頭巾をかぶって団子を買う場所。
// 鴉族の店主に台越しに話すと場面が流れ、北の門から宮へ戻れるようになる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色（仕様書 第11章）

  G.DATA.maps.yomi_market = {
    name: '魔界の市場',
    outside: '#2a1014',
    start: { x: 1, y: 9, dir: 'right' },
    tint: RED,
    rows: [
      'GGGGGGGGGGGHHGGGGGGGGGGG',
      'GaaaaGggggguugggggGaaaaG',
      'GffffGggggguugggggGffffG',
      'GCCCCGggggguugggggGCCCCG',
      'GuuuuuuuuuuuuuuuuuuuuuuG',
      'GuuuuuuuuuuuuuuuuuuuuuuG',
      'GaaaauuuuuuuuuuuuuuaaaaG',
      'GffffuuuuuuuuuuuuuuffffG',
      'GCCCCuuuuuuuuuuuuuuCCCCG',
      'uuuuuuuuuuuuuuuuuuuuuuuu',
      'uuuuuuuuuuuuuuuuuuuuuuuu',
      'GggKgguuuuuuuuuuuggKgggG',
      'GGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    warps: [
      { x: 0, y: 9,  to: 'yomi_hani', tx: 28, ty: 9,  dir: 'left' },
      // 11章：東の端は嵐ヶ峰の演武場へ
      { x: 23, y: 9,  to: 'arashigamine', tx: 8, ty: 10, dir: 'up', when: { chapter: 11 } },
      { x: 23, y: 10, to: 'arashigamine', tx: 9, ty: 10, dir: 'up', when: { chapter: 11 } },
      { x: 0, y: 10, to: 'yomi_hani', tx: 28, ty: 10, dir: 'left' },
      { x: 11, y: 0, to: 'yomi_palace', tx: 9,  ty: 11, dir: 'up', requires: { if: 'ch1_market' }, blockedText: '（宮へ戻る前に、市場の屋台をのぞいていこう）' },
      { x: 12, y: 0, to: 'yomi_palace', tx: 10, ty: 11, dir: 'up', requires: { if: 'ch1_market' }, blockedText: '（宮へ戻る前に、市場の屋台をのぞいていこう）' },
    ],
    npcs: [
      { id: 'crow', look: 'crow', x: 2, y: 2, dir: 'down', move: 'still', chapter: 1,
        event: 'ch1_market', doneFlag: 'ch1_market',
        talk: ['鴉族の屋台は、料理に噂話を一つ添えるのが決まりだ。'] },
      { id: 'oldwoman', look: 'oldwoman', x: 4, y: 4, dir: 'left', move: 'still', chapter: 1,
        talk: [{ name: '老婆', text: '「王様が望むなら、できるんじゃないかね。あの子は嘘をつかないから」' }] },
      { id: 'deafkid', look: 'wolfkid', x: 1, y: 5, dir: 'up', move: 'still', chapter: 1, if: 'ch1_market',
        talk: [{ name: '子ども', text: '(王様。顔に泥がついてる)' }] },
    ],
    // 台の奥を調べたときの文
    spots: [
      { x: 20, y: 2, text: '魔界の市場は、昼になると種族の匂いが混ざる。' },
      { x: 2,  y: 7, text: '鬼族の祭り酒、土蜘蛛族の新米の蒸し団子、嵐狼の干し肉、鴉族の屋台から立ち上る甘い煙。' },
      { x: 20, y: 7, text: '鴉族の屋台は、料理に噂話を一つ添えるのが決まりだ。' },
    ],
    chests: [],
    signs: [],
  };
})();
