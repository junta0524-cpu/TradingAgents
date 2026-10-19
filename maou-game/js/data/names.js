// このファイルの役目：「名の欠片」（名を奪われた人の名前のかけら）の一覧。拾って持ち主に返す寄り道。
// at：欠片が落ちている場所（踏むと拾う）。owner：名を失った持ち主が立つ場所（話すと返せる）。from：その章から現れる（クリア後は 13）。
// who は持ち主の呼び名、hint は見聞録の「手がかり」。名前と文は物語のセリフではない（小説に出ない、このゲームの寄り道の人たち）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.nameFragments = [
    { id: 'isana', name: 'イサナ', who: '港の漁師', from: 4, hint: '港町ミナモのあたり', at: { map: 'minamo', x: 14, y: 5 }, owner: { map: 'minamo', x: 11, y: 12, look: 'sailor' } },
    { id: 'asagi', name: 'アサギ', who: '網元の娘', from: 4, hint: 'ミナモの南の野原', at: { map: 'field_minamo', x: 38, y: 13 }, owner: { map: 'minamo', x: 8, y: 19, look: 'villager' } },
    { id: 'tomari', name: 'トマリ', who: '港の荷運び', from: 4, hint: 'ミナモの南の野原', at: { map: 'field_minamo', x: 1, y: 22 }, owner: { map: 'minamo', x: 29, y: 9, look: 'villager' } },
    { id: 'nogiku', name: 'ノギク', who: 'ひなた野の機織り', from: 4, hint: 'ミナモの南の野原', at: { map: 'field_minamo', x: 38, y: 5 }, owner: { map: 'hinatano', x: 10, y: 4, look: 'oldwoman' } },
    { id: 'fuki', name: 'フキ', who: 'ひなた野の子', from: 4, hint: 'ひなた野', at: { map: 'hinatano', x: 9, y: 8 }, owner: { map: 'hinatano', x: 17, y: 2, look: 'kid_ear' } },
    { id: 'tane', name: 'タネ', who: '畑の老人', from: 4, hint: 'ひなた野', at: { map: 'hinatano', x: 13, y: 12 }, owner: { map: 'hinatano', x: 15, y: 5, look: 'elder' } },
    { id: 'tsuyukusa', name: 'ツユクサ', who: '森の薬草摘み', from: 5, hint: '聖の森の道', at: { map: 'hijiri_path', x: 26, y: 16 }, owner: { map: 'hijiri_village', x: 8, y: 11, look: 'elf2' } },
    { id: 'shii', name: 'シイ', who: '森の弓手', from: 5, hint: '聖の森の集落', at: { map: 'hijiri_village', x: 11, y: 8 }, owner: { map: 'hijiri_village', x: 19, y: 5, look: 'elf' } },
    { id: 'yuzuriha', name: 'ユズリハ', who: '森の語り部', from: 5, hint: '苔むした地下道', at: { map: 'hijiri_deep', x: 20, y: 13 }, owner: { map: 'hijiri_village', x: 15, y: 11, look: 'elf2' } },
    { id: 'hagane', name: 'ハガネ', who: '鉱山の鍛冶', from: 6, hint: '炉ヶ岳の山道', at: { map: 'ro_path', x: 21, y: 15 }, owner: { map: 'ro_village', x: 5, y: 8, look: 'dwarf' } },
    { id: 'sumi', name: 'スミ', who: '炭焼き', from: 6, hint: '鉱山の里', at: { map: 'ro_village', x: 12, y: 3 }, owner: { map: 'ro_village', x: 22, y: 7, look: 'dwarf2' } },
    { id: 'tatara', name: 'タタラ', who: '炉番の弟子', from: 6, hint: '古い坑道', at: { map: 'ro_mine', x: 17, y: 12 }, owner: { map: 'ro_village', x: 20, y: 9, look: 'dwarf' } },
    { id: 'susuki', name: 'ススキ', who: '葛の里の見張り', from: 7, hint: '獣ノ原', at: { map: 'kemono_field', x: 15, y: 4 }, owner: { map: 'kuzu_village', x: 22, y: 5, look: 'beastwoman' } },
    { id: 'nazuna', name: 'ナズナ', who: '井戸番', from: 7, hint: '葛の里', at: { map: 'kuzu_village', x: 24, y: 11 }, owner: { map: 'kuzu_village', x: 8, y: 11, look: 'kid_tail' } },
    { id: 'kuzuha', name: 'クズハ', who: '葛の里の織り手', from: 7, hint: '風の岩溝', at: { map: 'kemono_ravine', x: 1, y: 9 }, owner: { map: 'kuzu_village', x: 21, y: 8, look: 'beastwoman' } },
    { id: 'shiroe', name: 'シロエ', who: '王都の書記', from: 8, hint: '王都 天津京', at: { map: 'amatsu', x: 30, y: 3 }, owner: { map: 'amatsu', x: 5, y: 10, look: 'villager' } },
    { id: 'mikage', name: 'ミカゲ', who: '王都の衛士', from: 8, hint: '王都 天津京', at: { map: 'amatsu', x: 26, y: 2 }, owner: { map: 'amatsu', x: 16, y: 13, look: 'guard' } },
    { id: 'uta', name: 'ウタ', who: '旅の歌い手', from: 8, hint: '人間界の地図のどこか', at: { map: 'world_ningen', x: 58, y: 82 }, owner: { map: 'amatsu', x: 22, y: 13, look: 'merchant' } },
    { id: 'akane', name: 'アカネ', who: '土蜘蛛族の畑番', from: 11, hint: '土蜘蛛族の畑', at: { map: 'yomi_hani', x: 16, y: 1 }, owner: { map: 'yomi_market', x: 14, y: 4, look: 'tsuchi' } },
    { id: 'kuroha', name: 'クロハ', who: '鴉族の伝令', from: 11, hint: '魔界の市場', at: { map: 'yomi_market', x: 2, y: 4 }, owner: { map: 'yomi_market', x: 8, y: 5, look: 'crow' } },
    { id: 'yamabuki', name: 'ヤマブキ', who: '鬼族の鍛冶', from: 11, hint: '魔界の地図のどこか', at: { map: 'world_makai', x: 126, y: 74 }, owner: { map: 'yomi_market', x: 13, y: 8, look: 'oni' } },
    { id: 'utsuho', name: 'ウツホ', who: '大穴の番人だった者', from: 13, hint: '大穴 上層', at: { map: 'oana_jou', x: 22, y: 15 }, owner: { map: 'yomi_hani', x: 24, y: 10, look: 'oni' } },
    { id: 'yomiji', name: 'ヨミジ', who: '黄泉の旅人', from: 13, hint: '大穴 中層', at: { map: 'oana_chuu', x: 19, y: 13 }, owner: { map: 'yomi_hani', x: 10, y: 8, look: 'crow' } },
    { id: 'homura', name: 'ホムラ', who: '炎の守り手', from: 13, hint: '大穴の最深部', at: { map: 'oana_soko', x: 24, y: 4 }, owner: { map: 'yomi_hani', x: 14, y: 8, look: 'tsuchi' } },
  ];
})();
