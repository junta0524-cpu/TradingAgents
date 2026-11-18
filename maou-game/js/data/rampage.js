// このファイルの役目：蹂躙戦闘（ベル単独の大軍戦）の場面ごとの設定。仕様書 7-3。
// mode：erase（消す・2章）／stop（止める・10章）／free（クリア後。止めるか、言霊で薙ぐかを選ぶ）
// 文章のうち、「風だけが、残った。」と手紙の文は、ユーザー提供の文（MakePlay用プロンプト③と小説 第二章）をそのまま使う。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  const UNIT_NAMES = ['第一隊', '第二隊', '第三隊', '第四隊', '第五隊', '第六隊', '第七隊', '第八隊', '第九隊', '第十隊'];

  G.DATA.rampage = {
    UNIT_NAMES,
    ch2: {
      title: '根の洲', mode: 'erase', units: 10, look: 'bell_true',
      intro: ['……'],
      after: ['風だけが、残った。'],
      // 小説 第二章：兵の懐の、書きかけの手紙
      letter: ['『戦が終われば、英雄の凱旋で街が祝うそうだ。おまえにも土産を』', '娘に――'],
    },
    ch10: {
      title: '天津京', mode: 'stop', units: 5, look: 'bell_true',
      intro: ['……'],
      after: [],
    },
    free: {
      title: '大軍', mode: 'free', units: 10, look: 'bell_true',
      intro: ['……'],
      after: ['風だけが、残った。'],
      mercyTitle: '慈悲の魔王',   // 言霊を使わず、すべての部隊を止めたときの称号
    },
  };
})();
