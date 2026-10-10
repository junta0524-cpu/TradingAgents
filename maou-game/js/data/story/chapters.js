// このファイルの役目：章の一覧（見出し・始まりの場面・その章に飛んだとき立っているはずのフラグ）。
// 場面の書き方の共通の道具（S＝セリフ、N＝語り）もここに置く。場面そのものは ch01.js などに書く。
// セリフと語りは、ユーザー提供の小説（docs/novel/）の文をそのまま使う。ベルの2章以降のセリフは差し替え表に従う。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.events = G.DATA.events || {};
  G.DATA.kotozute = G.DATA.kotozute || [];

  // 場面を書くための短い道具
  G.DATA.storyKit = {
    S: (name, text) => ({ t: 'say', name, text }),
    N: text => ({ t: 'nar', text }),
  };

  const CH1 = ['ch1_hani', 'ch1_child', 'ch1_market', 'ch1_palace', 'ch1_evening'];
  const CH3 = ['ch3_visit', 'ch3_report', 'ch3_done'];

  G.DATA.chapters = {
    1: { title: '第一章　黄泉の大地、焼ける', start: 'ch1_start', flags: [] },
    2: { title: '第二章　静かなる迎撃',       start: 'ch2_start', flags: CH1 },
    3: { title: '第三章　問うても答えぬ者',   start: 'ch3_start', flags: CH1 },
    4: { title: '第四章　同じ受付の前で',     start: 'ch4_start', flags: CH1.concat(CH3) },
  };

  // 4章の始まり（第二部の入口）。4章の物語そのものはフェーズ7で作る
  G.DATA.events.ch4_start = [
    { t: 'fade', to: 1 },
    { t: 'state', set: { chapter: 4, resume: 'ch4_start', split: null } },
    { t: 'title', text: '第四章', sub: '同じ受付の前で' },
    { t: 'party', ids: ['bell', 'oonamuchi'] },
    { t: 'rename', id: 'bell', name: 'ベル', look: null },
    { t: 'state', set: { disguised: true, inhibitShown: true, inhibit: G.DATA.balance.INHIBIT.MAX } },
    { t: 'goto', map: 'minamo', x: 15, y: 12, dir: 'down' },
    { t: 'state', set: { resume: null } },
    { t: 'save' },
    { t: 'fade', to: 0 },
    { t: 'nar', text: '（4章の物語は、次のフェーズ7で作ります。いまは、これまでどおりミナモの町と野原を歩けます）' },
  ];
})();
