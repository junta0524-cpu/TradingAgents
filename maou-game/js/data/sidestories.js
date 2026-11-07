// このファイルの役目：寄り道の章（docs/novel の ch04_5.md などの小説）をゲームで読むときの一覧。
// id は場面の名前（js/data/story/sidestory.js。tools/novel_to_scene.py が小説から作る）。title は思い出の帳の見出し。
// after：この章を過ぎると思い出の帳で読める（13＝クリア後）。いまは寄り道クエスト（js/data/sidequests/）として遊ぶので「読みますか？」は聞かない。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.sidestories = [
    { id: 'side_ch01_5', title: '一・五　避難の夜', after: 1 },
    { id: 'side_ch02_5', title: '二・五　牢の粥', after: 2 },
    { id: 'side_ch03_5', title: '三・五　比良坂を渡る', after: 3 },
    { id: 'side_ch04_5', title: '四・五　名を呼ばれない港', after: 4 },
    { id: 'side_ch05_5', title: '五・五　森の底の石', after: 5 },
    { id: 'side_ch06_5', title: '六・五　納めの鉄', after: 6 },
    { id: 'side_ch07_5', title: '七・五　風の岩溝', after: 7 },
    { id: 'side_ch08_5', title: '八・五　削られた丘', after: 8 },
    { id: 'side_ch11_5', title: '四天王編　土と角と牙と羽', after: 11 },
    { id: 'side_ch12_5', title: '十二・五　三か月', after: 12 },
    { id: 'side_bangai1', title: '番外編一　五つ目の窪み', after: 13 },
    { id: 'side_bangai2', title: '番外編二　旗を降ろさぬ者たち', after: 13 },
    { id: 'side_bangai3', title: '番外編三　名を喰う底', after: 13 },
    { id: 'side_bangai4', title: '番外編四　ミサキへ', after: 13 },
    { id: 'side_bangai5', title: '番外編五　十一人の名', after: 13 },
    { id: 'side_bangai6', title: '番外編六　名を呼び合う祭り', after: 13 },
  ];

  // 前日譚（docs/novel/plus/prequel_*.md。クリア後に帳で読める）と、名の欠片の人の話（docs/novel/names.md。名を返すと帳に加わる）
  const PRE = [['haniyasu', 'ハニヤス　最初の一株'], ['mikazuchi', 'ミカヅチ　受けきった日'], ['susano', 'スサノ　手の形'], ['nakime', 'ナキメ　底の見えない人'], ['omoika', 'オモイカ　十四の名'], ['amatsu', 'アマツ王　穏やかな始まり'], ['takeru', 'タケル　胸にあるもの'], ['oonamuchi', 'オオナムチ　同じ井戸の水'], ['bell', 'ベルイザナ　宮の書庫']];
  PRE.forEach(([id, title]) => G.DATA.sidestories.push({ id: 'side_prequel_' + id, title, after: 13, group: 16 }));
  const NAMES = [['isana', 'イサナ　十の年の舟'], ['asagi', 'アサギ　網の目の数'], ['tomari', 'トマリ　泊まりなさい'], ['nogiku', 'ノギク　裾の名'], ['fuki', 'フキ　かくれんぼの数'], ['tane', 'タネ　豆の畝'],
    ['tsuyukusa', 'ツユクサ　朝露の籠'], ['shii', 'シイ　見えるもの'], ['yuzuriha', 'ユズリハ　火の前の話'], ['hagane', 'ハガネ　打つ音'], ['sumi', 'スミ　炭の灯り'], ['tatara', 'タタラ　炉の守りの弟子'],
    ['susuki', 'ススキ　見張りの朝'], ['nazuna', 'ナズナ　井戸の縄'], ['kuzuha', 'クズハ　織り場の窓'], ['shiroe', 'シロエ　書き写す手'], ['mikage', 'ミカゲ　門の番'], ['uta', 'ウタ　節回し'],
    ['akane', 'アカネ　畦の声'], ['kuroha', 'クロハ　風の便り'], ['yamabuki', 'ヤマブキ　研ぎ上げた日'], ['utsuho', 'ウツホ　番小屋の茶'], ['yomiji', 'ヨミジ　道を訊く'], ['homura', 'ホムラ　消さない火']];
  NAMES.forEach(([id, title]) => G.DATA.sidestories.push({ id: 'side_meishi_' + id, title, nameId: id, group: 17 }));

  // 思い出の帳の「寄り道の章」に並べる（読んだかは side_read_<id>、章を過ぎたかは after）
  if (G.DATA.memories) G.DATA.sidestories.forEach(s => G.DATA.memories.list.push({ id: s.id, group: s.group || 15, title: s.title, flag: 'side_read_' + s.id, after: s.after, nameId: s.nameId }));
})();
