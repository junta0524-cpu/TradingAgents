// このファイルの役目：物語の進み方で、同じ人の顔グラを切り替える決まり（ユーザー依頼：タケルの洗脳中と洗脳が解けたあと）。
// 話し手の名前ごとに、上から順に条件（flags.check の書き方）を見て、合った最初の face を使う。どれも合わなければ art.js の faceNames の顔。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.faceStates = {
    // 11章の手合わせのあと、心鎮めで王の声が遮られた所（ch11_takeru のフラグ takeru_free）から。12章より後もこちら
    'タケル': [{ face: 'takeru_free', if: 'takeru_free' }, { face: 'takeru_free', chapterFrom: 12 }],
    // アマツ王：12章で笑みを消した（本性を見せた）あとは、笑みのない顔（ch12.js の ch12_king_true）
    'アマツ王': [{ face: 'amatsu_true', if: 'ch12_king_true', chapter: 12 }],
    // オオナムチの成長（ユーザー案の4段階）：①駆け出し 4〜5章（oonamuchi）／②旅の冒険者 6〜9章（炉ヶ岳の軽鎧）／
    // ③魔界の修行 10〜11章（四天王の贈り物）／④名を呼ぶ者 12章〜エピローグ・クリア後（五つの紋）。使い古した短剣は最後まで同じ。
    // 寄り道クエストは、物語の時期に合わせる（遊ぶ章ではなく、そのクエストがいつの話か）
    'オオナムチ': [
      { face: 'oonamuchi', sq: ['ch04_5', 'ch05_5'] },
      { face: 'oonamuchi2', sq: ['ch06_5', 'ch07_5', 'ch08_5'] },
      { face: 'oonamuchi3', sq: ['ch11_5'] },
      { face: 'oonamuchi4', sq: ['ch12_5', 'bangai1', 'bangai2', 'bangai3', 'bangai4', 'bangai5', 'bangai6'] },
      { face: 'oonamuchi4', chapterFrom: 12 },
      { face: 'oonamuchi3', chapterFrom: 10 },
      { face: 'oonamuchi2', chapterFrom: 6 },
    ],
  };
})();
