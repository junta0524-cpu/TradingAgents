// このファイルの役目：「言の葉の石碑」（ばらばらの文字を正しい順に並べて言葉を作る謎解き）の一覧。
// map・x・y：石碑の置き場所（調べると謎が開く。解くまで、そこは通れない）。word：答え（ひらがな）。hint：石碑に刻まれた手がかり。
// decoy：答えに使わない、まぎれこませる文字。reward：解いたときの品（item・count）か銅貨（copper）。from：その章から現れる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.kotobaStones = [
    // ---- 言霊の名（やさしい）----
    { id: 'katame', map: 'field_minamo', x: 19, y: 23, from: 4, word: 'かため', hint: '守りを、固くする言霊', decoy: 'し', reward: { item: 'kizugusuri', count: 3 } },
    { id: 'iyashi', map: 'hinatano', x: 18, y: 11, from: 4, word: 'いやし', hint: '傷を、なおす言霊', decoy: 'か', reward: { item: 'dokukeshi', count: 2 } },
    { id: 'hidane', map: 'hijiri_path', x: 12, y: 11, from: 5, word: 'ひだね', hint: '小さな火を、灯す言霊', decoy: 'も', reward: { copper: 120 } },
    { id: 'kokoro', map: 'hijiri_deep', x: 11, y: 13, from: 5, word: 'こころしずめ', hint: '乱れた心を、静める言霊', decoy: 'すな', reward: { item: 'mezame_suzu', count: 1 } },
    { id: 'miyaburi', map: 'ro_path', x: 19, y: 17, from: 6, word: 'みやぶり', hint: '隠れたものを、見抜く言霊', decoy: 'か', reward: { copper: 200 } },
    // ---- 古事記の神と言葉（むずかしい）----
    { id: 'kagutsuchi', map: 'ro_mine', x: 14, y: 14, from: 6, word: 'かぐつち', hint: '古事記：生まれたとき、母を焼いた火の神', decoy: 'ほ', reward: { item: 'chikara_ude', count: 1 } },
    { id: 'yachimata', map: 'kemono_field', x: 18, y: 11, from: 7, word: 'やちまた', hint: '古事記：道が八つに分かれる所。サルタヒコが待っていた', decoy: 'み', reward: { copper: 300 } },
    { id: 'shinatsu', map: 'kuzu_village', x: 8, y: 6, from: 7, word: 'しなつひこ', hint: '古事記：風の神の名', decoy: 'か', reward: { item: 'kokoro_kagami', count: 1 } },
    { id: 'kotomuke', map: 'amatsu', x: 21, y: 8, from: 8, word: 'ことむけやわす', hint: '古事記：刃ではなく、言葉で向き合い、和らげること', decoy: 'たな', reward: { item: 'inochi_ishi', count: 1 } },
    { id: 'izanagi', map: 'yomi_market', x: 17, y: 7, from: 11, word: 'いざなぎ', hint: '古事記：黄泉から帰り、命を生んだ神', decoy: 'み', reward: { copper: 800 } },
    { id: 'haniyasu', map: 'yomi_hani', x: 22, y: 8, from: 11, word: 'はにやす', hint: '古事記：土の神。この畑の守り手の名でもある', decoy: 'つ', reward: { item: 'fuku_suzu', count: 1 } },
    { id: 'amenominaka', map: 'oana_jou', x: 6, y: 15, from: 13, word: 'あめのみなかぬし', hint: '古事記：天のまん中に、いちばん初めに現れた神', decoy: 'たか', reward: { copper: 3000 } },
  ];
})();
