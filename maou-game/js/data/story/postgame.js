// このファイルの役目：クリア後の場面（仕様書 第10章）。師との修行で四系統を育て、クナドの案内で試練の扉へ。天の声の問い、調和の光、
// ベルとの特訓・最終手合わせ、任意の大軍戦（蹂躙戦闘）、ツクヨミの社の祭壇。
// 小説にクリア後の文はないので、登場人物のセリフは小説の中の言葉を使い回し、ほかは（ ）の案内文にしている。天の声の問いだけは仕様書に沿って新しく書いた。
(function () {
  const G = window.GAME = window.GAME || {};
  const E = G.DATA.events;
  const { S, N } = G.DATA.storyKit;
  const OO = 'オオナムチ';
  const P = () => G.DATA.balance.POSTGAME;

  // 四系統（守・攻・再生・知）の育ち具合
  const SYSTEMS = [['yama', '守'], ['hono', '攻'], ['iza', '再生'], ['tsuku', '知']];
  function counts() {
    const m = G.party.member('oonamuchi');
    return SYSTEMS.map(([sys, label]) => ({ label, n: m ? m.kotodama.filter(id => (G.DATA.kotodama[id] || {}).sys === sys).length : 0 }));
  }
  const ready = () => counts().every(c => c.n >= P().SYSTEM_REQ);
  const report = () => '（四系統の育ち具合　' + counts().map(c => `${c.label} ${Math.min(c.n, P().SYSTEM_REQ)}/${P().SYSTEM_REQ}`).join('　') + '）';

  // 手合わせ：耐えきれば勝ち。ベルは見守る
  const hold = rounds => st => {
    st.hookRound = (st.hookRound || 0) + 1;
    if (st.hookRound >= rounds) { st.forceWin = true; return [{ type: 'msg', text: '（耐えきった！）' }]; }
    return [{ type: 'msg', text: `（あと ${rounds - st.hookRound} ラウンド、耐えろ）` }];
  };
  const spar = (enemy, list, bg, away) => [
    { t: 'state', set: { split: away ? 'away' : 'watch' } },
    { t: 'battle', enemies: [enemy], bg, training: true, hook: hold(P().HOLD_ROUNDS) },
    { t: 'state', set: { split: null } },
    { t: 'run', fn: () => G.party.healAll() },
    { t: 'if', flag: 'last_battle_won', then: [{ t: 'teach', list }], else: [N('（もう一度、挑める）')] },
    { t: 'save' },
  ];

  // ---- クリア後の始まり ----
  E.post_start = [
    { t: 'fade', to: 1 },
    { t: 'state', set: { chapter: 13, cleared: true, resume: null, split: null, disguised: false } },
    { t: 'party', ids: ['bell', 'oonamuchi'] },
    { t: 'rename', id: 'bell', name: 'ベル', look: 'bell_true' },
    { t: 'goto', map: 'yomi_hani', x: 7, y: 13, dir: 'up' },
    { t: 'save' },
    { t: 'fade', to: 0 },
    { t: 'call', id: 'post_intro' },
  ];
  E.post_intro = [
    N('（クリア後：魔界を自由に歩ける。師との手合わせで四系統（守・攻・再生・知）の言霊を育てると、クナドが大穴の最深部の「試練の扉」へ案内してくれる）'),
    N('（守＝ハニヤス（この畑）、攻＝ミカヅチ（角ヶ原）、再生＝ナキメ（宮の聖域）、知＝ナキメの裏修行・ツクヨミの社（嵐ヶ峰の北）・ベルとの特訓（宮のオモイカに頼む））'),
    N('（クリア後は、仲間が倒れても、そのラウンドのうちに起こせば戦いを続けられる。ベルは「生き返し」で助けてくれる）'),
    { t: 'flag', set: 'post_intro' },
  ];

  // ---- クナド：試練の扉への案内 ----
  E.post_kunado = [
    { t: 'msgfn', fn: report },
    { t: 'run', fn: () => G.flags.set('post_ready', ready()) },
    { t: 'if', flag: 'post_ready', then: [
      S('クナド', '「お通りください」'),
      { t: 'fade', to: 1 }, { t: 'goto', map: 'oana_soko', x: 12, y: 20, dir: 'up' }, { t: 'fade', to: 0 },
      N('（大穴の最深部。いちばん奥に、試練の扉がある）'),
    ], else: [
      N('クナドは、何も言わなかった。けれど、その眼差しは、いつか訪れる日を、待っているようだった。'),
      N(`（四系統を、それぞれ${G.DATA.balance.POSTGAME.SYSTEM_REQ}つずつ覚えると、案内してもらえる）`),
    ] },
  ];

  // ---- 試練の扉：天の声の問い（各章のテーマから一問ずつ。正解は「どちらが誠実か」）----
  // まちがえると答えは言わず、その章を思い出させる一言だけ出して終わる。何度でも挑める
  const Q = (theme, text, options, hint) => ({ t: 'choice', text: `天の声（${theme}）「${text}」`, options: options.map(o => ({
    label: o[0], then: o[1] ? [] : [N(`天の声「――${hint}」`), { t: 'stop' }],
  })) });
  E.post_door = [
    N('扉の前に立つと、声が、降ってきた。どこからでもなく、骨の内側で、静かに響く声だった。'),
    Q('森', '欲しい言葉を、ちょうどいい順番でくれる者がいる。どうする', [['頷く。分かってくれる人だから', false], ['自分の考えを、たどり直す', true]], '聖の森の広間の、使者の声を、思い出せ'),
    Q('鍛冶', '人を染める刃を打てと命じられた。断れば、里が飢える', [['頼まれた品質で打ち、芯で術を跳ね返す', true], ['命じられたとおりに打つ。仕方がない', false]], '炉ヶ岳の、夜の炉の前を、思い出せ'),
    Q('差別', '見た目が似ているから、念のため距離を置こう、と言われた', [['念のためなら、仕方がない', false], ['その人の顔を、自分の目で見る', true]], '白い都の、昼の広場を、思い出せ'),
    Q('洗脳', '操られた友が、槍を向けてくる', [['名と、思い出を呼ぶ', true], ['斬って、止める', false]], '葛の里の、夜の井戸を、思い出せ'),
    Q('正体', '隣を歩いてきた者が、魔王だった', [['名前で決めて、石を投げる', false], ['見てきた顔を、信じる', true]], 'やすらぎの院の門前を、思い出せ'),
    Q('共生', '憎み合った二つの国が、同じ卓に着く', [['先に頭を下げ、失われた名を覚える', true], ['相手が先に詫びるのを、待つ', false]], '衢の里の、白い円卓を、思い出せ'),
    // ---- 突破：調和の光 ----
    { t: 'fade', to: 1 },
    { t: 'bg', key: 'trial', actors: [] },
    { t: 'fade', to: 0 },
    { t: 'wait', frames: 120 },
    N('四つの光が、巡っていた。山の色、火の色、生の色、月の色。'),
    N('中央の、平らな窪みに、ゆっくりと、光が灯った。'),
    N('（アメノミナカヌシの紋が、灯った。オオナムチの胸に、まことの名が、静かに刻まれた）'),
    { t: 'learn', id: 'oonamuchi', kotodama: 'chouwa' },
    { t: 'flag', set: 'ame_lit' },
    { t: 'wait', frames: 60 },
    { t: 'fade', to: 1 },
    { t: 'bg', key: null },
    { t: 'fade', to: 0 },
    S('クナド', '「境の神も、お喜びでしょう」'),
    N('（ベルとの最終手合わせが、宮のオモイカに頼めるようになった）'),
    { t: 'save' },
  ];

  // ---- 師たち ----
  // 守：ハニヤス（埴の里）
  E.post_hani = [
    S('ハニヤス', '「土は黙っているが、忘れはせん」'),
    { t: 'choice', text: '（ハニヤスと、手合わせをする？　守の言霊を一つ教わる）', options: [
      { label: '手合わせ（4ラウンド耐える）', then: spar('haniyasu_t', 'haniyasu', 'field') },
      { label: 'やめる', then: [] },
    ] },
  ];
  // 攻：ミカヅチ（角ヶ原）。任意の大軍戦もここで
  E.post_mika = [
    S('ミカヅチ', '「鬼族は、立ち上がる者には、何度でも付き合う」'),
    { t: 'choice', text: '（何をする？）', options: [
      { label: '手合わせ（攻の言霊を教わる）', then: spar('mikazuchi_t', 'mikazuchi', 'mountain') },
      { label: '大軍戦（ベル一人の蹂躙戦闘）', then: [
        N('（クリア後の大軍戦：止めるか、言霊で薙ぐかを選べる。言霊を使わず、すべて止めると称号「慈悲の魔王」）'),
        { t: 'rampage', key: 'free' },
        { t: 'run', fn: () => { const r = (G.state.vars || {}).rampage_free; if (r && r.stopped === G.DATA.rampage.free.units) G.flags.set('title_mercy'); } },
        { t: 'save' },
      ] },
      { label: 'やめる', then: [] },
    ] },
  ];
  // 再生：ナキメ（聖域）。知の裏修行（理論）も
  const ura = (flag, q, right, wrong) => [
    { t: 'choice', text: `ナキメ「${q}」`, options: [
      { label: right, then: [S('ナキメ', '「相性は、傾向にすぎません。個人と状況で、覆る。肝心なのは、目の前の相手を、よく見ること」'), { t: 'teach', list: 'nakime_tsuku' }, { t: 'flag', set: flag }, { t: 'save' }] },
      { label: wrong, then: [S('ナキメ', '「できません」'), N('（四すくみを、思い出そう。スサノが教えてくれた）')] },
    ] },
  ];
  E.post_naki = [
    S('ナキメ', '「焦らないことです。あなたが誰かを失いかけた時、本当の名呼びは、その時、生まれます」'),
    { t: 'choice', text: '（何をする？）', options: [
      { label: '手合わせ（再生の言霊を教わる）', then: spar('nakime_t', 'nakime', 'night') },
      { label: '裏修行（知の言霊・問いに答える）', then: [
        { t: 'if', flag: 'ura3', then: [N('（もう、教わることはない）')], else: [
          { t: 'if', flag: 'ura2', then: ura('ura3', '土蜘蛛は、何に弱い？', '嵐狼', '鴉'), else: [
            { t: 'if', flag: 'ura1', then: ura('ura2', '嵐狼は、何に弱い？', '鬼', '土蜘蛛'), else: ura('ura1', '鬼は、何に弱い？', '鴉', '嵐狼') },
          ] },
        ] },
      ] },
      { label: 'やめる', then: [] },
    ] },
  ];

  // ---- オモイカ：ベルとの特訓（知）・最終手合わせ ----
  E.post_omoika = [
    S('オモイカ', '「ようこそ、おいでくださいました」'),
    { t: 'choice', text: '（オモイカに頼む）', options: [
      { label: 'ベルとの特訓（知の言霊を教わる）', then: [
        S('ベル', '「半分ずつだ」'),
        ...spar('bell_t', 'bell', 'night', true),
      ] },
      { label: 'ベルとの最終手合わせ', disabled: false, then: [
        { t: 'if', flag: 'ame_lit', not: true, then: [N('（試練の扉を越えてから）')], else: [
          S('ベル', '「見ている。最後まで、おまえの背中を、見ている。それだけは、許してくれ」'),
          N(`（ベルイザナとの最終手合わせ：オオナムチ一人で、${G.DATA.balance.POSTGAME.BELL_FINAL_ROUNDS}ラウンド耐えきれば勝ち）`),
          { t: 'state', set: { split: 'away' } },
          { t: 'battle', enemies: ['bell_final'], bg: 'night', training: true, hook: hold(G.DATA.balance.POSTGAME.BELL_FINAL_ROUNDS) },
          { t: 'state', set: { split: null } },
          { t: 'run', fn: () => G.party.healAll() },
          { t: 'if', flag: 'last_battle_won', then: [
            S('ベル', '「よくやった。見ていた。最後まで見ていた」'),
            S(OO, '「半分ずつ、ですね」'),
            { t: 'learn', id: 'oonamuchi', kotodama: 'makoto' },
            { t: 'flag', set: 'post_bell_win' },
            { t: 'save' },
          ], else: [N('（もう一度、挑める）')] },
        ] },
      ] },
      { label: 'やめる', then: [] },
    ] },
  ];

  // ---- ツクヨミの社（探求）----
  E.post_altar1 = [N('（祭壇に、細い月の印が刻まれている。手をかざすと、言葉が胸に降りてきた）'), { t: 'learn', id: 'oonamuchi', kotodama: 'nemurigasumi' }, { t: 'flag', set: 'altar1' }, { t: 'save' }];
  E.post_altar2 = [N('（祭壇に、絡み合う糸の印が刻まれている。手をかざすと、言葉が胸に降りてきた）'), { t: 'learn', id: 'oonamuchi', kotodama: 'shibari' }, { t: 'flag', set: 'altar2' }, { t: 'save' }];
  E.post_altar3 = [N('（奥の祭壇。偽りの名を剥がす言葉が、胸に降りてきた）'), { t: 'learn', id: 'oonamuchi', kotodama: 'naabaki' }, { t: 'flag', set: 'altar3' }, { t: 'save' }];
  E.post_shrine_open = [S(OO, '「――見破り」'), N('（偽りの壁が、ほどけて消えた）'), { t: 'flag', set: 'shrine_open' }];
})();
