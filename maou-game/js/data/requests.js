// このファイルの役目：ミナモのギルドの掲示板に貼られる「寄り道の依頼」の一覧（物語とは別の小さな仕事）。
// kind：slay（enemy の敵を count 体倒す）／awaken（人の敵を count 人目覚めさせる）／bring（item を count 個持ってくる。報告で渡す）／flag（flag が立つ＝寄り道ダンジョンの主を倒す）。
// from：その章から貼られる（クリア後は 13）。reward：copper（銅貨）と item（品。count で数）。文は物語のセリフではなく、依頼書の案内。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.requests = [
    // ---- 5章から ----
    { id: 'inu', from: 5, title: '野犬の群れ', kind: 'slay', enemy: 'dog', count: 6,
      desc: 'ミナモの南の野原に、野犬の群れが出る。荷車が通れないので、6匹退治してほしい。', reward: { copper: 60, item: 'kizugusuri', count: 3 } },
    { id: 'kusuri', from: 5, title: '傷薬の届け物', kind: 'bring', item: 'kizugusuri', count: 3,
      desc: '港の倉庫番が、傷薬を切らしている。傷薬を3つ、受付まで持ってきてほしい。', reward: { copper: 50 } },
    { id: 'kumo', from: 5, title: '森蜘蛛の巣払い', kind: 'slay', enemy: 'morigumo', count: 5,
      desc: '聖の森の道に、森蜘蛛が巣を張って道をふさいでいる。5匹退治してほしい。', reward: { copper: 90, item: 'dokukeshi', count: 2 } },
    { id: 'koke', from: 5, title: '苔むした地下道の主', kind: 'flag', flag: 'gm:hijiri_deep:nushi',
      desc: '森の洞窟の奥の石段の下に、大きな蜘蛛が棲みついているという。退治してほしい。', reward: { copper: 300, item: 'mezamashi', count: 3 } },
    // ---- 6章から ----
    { id: 'nezumi', from: 6, title: '火鼠の駆除', kind: 'slay', enemy: 'hinezumi', count: 8,
      desc: '炉ヶ岳の坑道で、火鼠が荷をかじる。8匹駆除してほしい。', reward: { copper: 150, item: 'hayate_obi', count: 1 } },
    { id: 'doku', from: 6, title: '毒消し草を集めて', kind: 'bring', item: 'dokukeshi', count: 4,
      desc: '鉱山の里で、毒にあたる者が増えている。毒消し草を4つ、受付まで持ってきてほしい。', reward: { copper: 80, item: 'dokuyoke', count: 1 } },
    { id: 'iwa', from: 6, title: '古い坑道の主', kind: 'flag', flag: 'gm:ro_mine:nushi',
      desc: '炉ヶ岳の古い坑道の奥で、岩を噛み砕く何かが道を食い荒らしている。退治してほしい。', reward: { copper: 500 } },
    // ---- 7章から ----
    { id: 'ookami', from: 7, title: '荒野の狼', kind: 'slay', enemy: 'arano_ookami', count: 6,
      desc: '獣ノ原へ向かう荷が、狼に襲われている。6匹退治してほしい。', reward: { copper: 240 } },
    { id: 'sasori', from: 7, title: '大蠍の退治', kind: 'slay', enemy: 'oosasori', count: 4,
      desc: '獣ノ原の岩場に、大蠍が出る。毒に気をつけて、4匹退治してほしい。', reward: { copper: 200, item: 'mezamashi', count: 2 } },
    { id: 'washi', from: 7, title: '風の岩溝の主', kind: 'flag', flag: 'gm:kemono_ravine:nushi',
      desc: '獣ノ原の南東の岩溝に、大きな鷲の巣があるという。退治してほしい。', reward: { copper: 600 } },
    // ---- 8章から ----
    { id: 'mezame1', from: 8, title: '白い腕章の兵', kind: 'awaken', count: 3,
      desc: '王都のまわりを見回る兵の中に、家族の顔も分からなくなった者がいるという。3人、目を覚まさせてほしい。', reward: { copper: 300, item: 'mezame_suzu', count: 1 } },
    { id: 'mezame2', from: 8, title: '目を覚ます声', kind: 'awaken', count: 10,
      desc: '目を覚ました兵の家族から、ほかの者もどうか、と頼まれた。10人、目を覚まさせてほしい。', reward: { copper: 600, item: 'kokoro_kagami', count: 1 } },
    { id: 'hoshii', from: 8, title: '干し飯の差し入れ', kind: 'bring', item: 'hoshiii', count: 5,
      desc: 'ひなた野の子どもたちへの差し入れに、干し飯を5つ集めている。', reward: { copper: 60 } },
    // ---- クリア後 ----
    { id: 'zantou', from: 13, title: '残党軍', kind: 'awaken', count: 3,
      desc: '両方の地図を、旧王軍の残党がさまよっている。3人、目を覚まさせてほしい。', reward: { copper: 2000 } },
    { id: 'orochi', from: 13, title: '黄泉の大蛇', kind: 'flag', flag: 'gm:yomi_fuchi1:nushi',
      desc: '大穴の最深部のさらに下、黄泉の深淵に大蛇が棲みついた。退治してほしい。', reward: { copper: 3000, item: 'fuku_suzu', count: 1 } },
    { id: 'hyoumon', from: 13, title: '氷門の番人', kind: 'flag', flag: 'gm:oana_jou:nushi',
      desc: '大穴の上層の氷の門を、番人が守っている。退けてほしい。', reward: { copper: 3000 } },
    { id: 'nushi', from: 13, title: '大穴の主', kind: 'flag', flag: 'gm:oana_chuu:nushi',
      desc: '大穴の中層の奥に、主が眠っているという。鎮めてほしい。', reward: { copper: 5000 } },
  ];
})();
