// このファイルの役目：寄り道の章（docs/novel の ch04_5.md などの小説）をゲームで読むときの一覧。
// id は場面の名前（js/data/story/sidestory.js。tools/novel_to_scene.py が小説から作る）。title は思い出の帳の見出し。
// after：この章を過ぎると思い出の帳で読める（13＝クリア後）。offer：その場所に入ったとき「読みますか？」と聞く条件（flags.check の書き方＋map）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.sidestories = [
    { id: 'side_ch01_5', title: '一・五　避難の夜', after: 1 },
    { id: 'side_ch02_5', title: '二・五　牢の粥', after: 2 },
    { id: 'side_ch03_5', title: '三・五　比良坂を渡る', after: 3 },
    { id: 'side_ch04_5', title: '四・五　名を呼ばれない港', after: 4, offer: { map: 'minamo', chapterFrom: 5, chapterTo: 9, chapterAlso: 13 } },
    { id: 'side_ch05_5', title: '五・五　森の底の石', after: 5, offer: { map: 'kukunochi', chapterFrom: 6, chapterTo: 9, chapterAlso: 13 } },
    { id: 'side_ch06_5', title: '六・五　納めの鉄', after: 6, offer: { map: 'magane', chapterFrom: 7, chapterTo: 9, chapterAlso: 13 } },
    { id: 'side_ch07_5', title: '七・五　風の岩溝', after: 7, offer: { map: 'iwakura', chapterFrom: 8, chapterTo: 9, chapterAlso: 13 } },
    { id: 'side_ch08_5', title: '八・五　削られた丘', after: 8, offer: { map: 'takama', chapterFrom: 9, chapterTo: 9, chapterAlso: 13 } },
    { id: 'side_ch11_5', title: '四天王編　土と角と牙と羽', after: 11, offer: { map: 'yomi_hani', chapter: 13 } },
    { id: 'side_ch12_5', title: '十二・五　三か月', after: 12, offer: { map: 'kuzu_village', chapter: 13 } },
    { id: 'side_bangai1', title: '番外編一　五つ目の窪み', after: 13, offer: { map: 'takama', chapter: 13, knows: 'chouwa' } },
    { id: 'side_bangai2', title: '番外編二　旗を降ろさぬ者たち', after: 13, offer: { map: 'iwakura', chapter: 13, if: 'side_read_side_bangai1' } },
    { id: 'side_bangai3', title: '番外編三　名を喰う底', after: 13, offer: { map: 'minamo', chapter: 13, all: ['side_read_side_bangai2', 'gm:yomi_fuchi2:nushi'] } },
    { id: 'side_bangai4', title: '番外編四　ミサキへ', after: 13, offer: { map: 'magane', chapter: 13, if: 'side_read_side_bangai3' } },
    { id: 'side_bangai5', title: '番外編五　十一人の名', after: 13, offer: { map: 'hirasaka', chapter: 13, if: 'side_read_side_bangai4' } },
    { id: 'side_bangai6', title: '番外編六　名を呼び合う祭り', after: 13, offer: { map: 'yomi_hani', chapter: 13, if: 'side_read_side_bangai5' } },
  ];

  // 思い出の帳の「寄り道の章」に並べる（読んだかは side_read_<id>、章を過ぎたかは after）
  if (G.DATA.memories) G.DATA.sidestories.forEach(s => G.DATA.memories.list.push({ id: s.id, group: 15, title: s.title, flag: 'side_read_' + s.id, after: s.after }));
})();
