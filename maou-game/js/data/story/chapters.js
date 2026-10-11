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
  const CH4 = ['ch4_guild', 'ch4_dogs', 'ch4_delivered'];
  const CH5 = ['ch5_sukuna', 'ch5_village', 'ch5_konoha', 'ch5_hall', 'ch5_cave', 'ch5_minato', 'ch5_done'];
  const CH6 = ['ch6_arrive', 'ch6_order', 'ch6_blade', 'ch6_report', 'ch6_fire', 'ch6_descend'];
  const CH7 = ['ch7_uzume', 'ch7_kuzu', 'ch7_saru', 'ch7_night', 'ch7_well', 'ch7_morning', 'ch7_farewell', 'ch7_done'];

  G.DATA.chapters = {
    1: { title: '第一章　黄泉の大地、焼ける', start: 'ch1_start', flags: [] },
    2: { title: '第二章　静かなる迎撃',       start: 'ch2_start', flags: CH1 },
    3: { title: '第三章　問うても答えぬ者',   start: 'ch3_start', flags: CH1 },
    4: { title: '第四章　同じ受付の前で',     start: 'ch4_start', flags: CH1.concat(CH3) },
    5: { title: '第五章　中立という名の森',   start: 'ch5_start', flags: CH1.concat(CH3, CH4),
         prep: { lv: 4, kotodama: ['katame', 'iyashi'], copper: 60 } },
    6: { title: '第六章　炉の火は消えず',     start: 'ch6_start', flags: CH1.concat(CH3, CH4, CH5),
         prep: { lv: 7, kotodama: ['katame', 'iyashi', 'kokoroshizume'], copper: 150 } },
    7: { title: '第七章　井戸の水を、皆で',   start: 'ch7_start', flags: CH1.concat(CH3, CH4, CH5, CH6),
         prep: { lv: 10, kotodama: ['katame', 'iyashi', 'kokoroshizume', 'hidane'], copper: 300 } },
    8: { title: '第八章（フェーズ8で作ります）', start: 'ch8_start', flags: CH1.concat(CH3, CH4, CH5, CH6, CH7),
         prep: { lv: 12, kotodama: ['katame', 'iyashi', 'kokoroshizume', 'hidane'], copper: 400 } },
  };

})();
