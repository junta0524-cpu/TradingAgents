// このファイルの役目：物語の進み方で、同じ人の顔グラを切り替える決まり（ユーザー依頼：タケルの洗脳中と洗脳が解けたあと）。
// 話し手の名前ごとに、上から順に条件（flags.check の書き方）を見て、合った最初の face を使う。どれも合わなければ art.js の faceNames の顔。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.faceStates = {
    // 11章の手合わせのあと、心鎮めで王の声が遮られた所（ch11_takeru のフラグ takeru_free）から。12章より後もこちら
    'タケル': [{ face: 'takeru_free', if: 'takeru_free' }, { face: 'takeru_free', chapterFrom: 12 }],
  };
})();
