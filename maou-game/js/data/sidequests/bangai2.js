// このファイルの役目：寄り道クエスト「番外編二　旗を降ろさぬ者たち」（小説 docs/novel/bangai2.md、設計 docs/寄り道クエスト/bangai2.md）。
// 番外編一のあと（sq_done_bangai1）、魔界の畑の西の畦で鍬をふるうタケルに話すと始まる。オオナムチとタケルで人間界の北の古い砦
// （js/data/maps/sq_maps_c.js の kita_toride。地図の (50,16)）へ行き、残党の兵を名で呼んで目を覚まさせ、タケル一人で老将ヤツカと向き合い、中継の石を砕く。
(function () {
  const G = window.GAME = window.GAME || {};
  const E = G.DATA.events;
  const { S, N } = G.DATA.storyKit;
  const B = G.DATA.balance, SQ = B.SIDEQUEST.bangai2;
  const BELL = 'ベル', OO = 'オオナムチ', TAKERU = 'タケル', MIKA = 'ミカヅチ', KOTO = 'コトシロ', OMOIKA = 'オモイカ',
    SEKI = 'セキ', NAGI = 'ナギ', YATSUKA = 'ヤツカ';
  const A = (look, x, y, dir) => ({ look, x, y, dir });

  // ---- 操る人：タケル（樫の木刀。斬らない）----
  Object.assign(G.DATA.characters, {
    c_takeru: { name: 'タケル', look: 'takeru', temp: true, fixed: true, tactic: 'auto', kotodama: [] },
  });
  Object.assign(B.TEMP_PARTY, SQ.party);

  // ---- 見た目：老将ヤツカ（長い白い髭、古い鎧）----
  Object.assign(G.DATA.sprites.LOOKS, {
    yatsuka: { K: '#120e16', H: '#e8e8e8', S: '#d8b088', E: '#2a2a2a', C: '#5a5e68', D: '#3a3e48', B: '#2a2a2a' },
  });

  // ---- 敵：残党の将ヤツカ（残党の将 zantou を元に。絵も残党の将のもの）----
  const base = G.DATA.enemies.zantou;
  Object.assign(G.DATA.enemies, {
    zantou_yatsuka: Object.assign({}, base, SQ.yatsuka, {
      name: 'ヤツカ', counter: '人', tribe: base.tribe, big: true, unique: true, awaken: true, hits: 2,
      actions: [{ w: 1, type: 'attack' }], drop: null,
      palette: { K: '#06040a', H: '#e8e8e8', D: '#3a3e48', E: '#ff6040', W: '#f0f0f0' },
    }),
  });
  if (G.DATA.art && G.DATA.art.enemies && G.DATA.art.enemies.zantou) G.DATA.art.enemies.zantou_yatsuka = G.DATA.art.enemies.zantou;

  // ---- 品 ----
  Object.assign(G.DATA.items, {
    kita_meibo: { name: '北の砦の名簿', type: 'key', desc: 'コトシロが院の記録から拾い出した、北の古い砦の兵の名簿。',
      read: () => ['一人ずつ、名と、生まれた村と、年が、記されている。', 'マサゴ。南の浜辺の村。十九。', 'トキワ。山の炭焼きの村。旗持ち。', 'セキ。北の山村。弓兵。二十二。　ナギ。同じ村。薬師。', 'ヤツカ。北の山村。守将。妻はハツ。', '……四十二人。'] },
    kashi_tsuba: Object.assign({ name: '樫の木刀の鍔', type: 'accessory', who: ['oonamuchi'],
      desc: 'タケルが北の砦で振るった、鬼の稽古の樫の木刀の鍔。人に向けても死なない木刀の、受けきるための重み。' }, SQ.accessory),
  });
  B.PRICES.kashi_tsuba = SQ.price;

  // 仲間の入れ替え（一騎討ちと石室はタケル一人）。オオナムチの育ちはクエストのあとも残す
  const solo = id => ({ t: 'run', fn: () => { G.state.vars = G.state.vars || {}; G.state.vars.sq_b2_party = JSON.parse(JSON.stringify(G.state.party)); G.state.party = G.state.party.filter(m => m.id === id); G.state.split = null; } });
  const unsolo = () => ({ t: 'run', fn: () => { const v = G.state.vars; if (v && v.sq_b2_party) { G.state.party = v.sq_b2_party; delete v.sq_b2_party; } G.state.split = 'away'; } });
  const keep = id => ({ t: 'run', fn: () => { const m = G.party.member(id); G.state.vars = G.state.vars || {}; if (m) G.state.vars['sqkeep_' + id] = JSON.parse(JSON.stringify(m)); } });
  const restore = id => ({ t: 'run', fn: () => { const v = G.state.vars || {}, k = v['sqkeep_' + id], m = G.party.member(id); if (k && m) { Object.assign(m, k); G.party.recalc(m); } delete v['sqkeep_' + id]; } });
  // 終わったら下ろすフラグ（雪原・中庭・石の印は残す：門は開いたまま、石室は砕けた石のまま）
  const FLAGS = ['sq_b2_go'];

  // ---- 一：根の洲の畑（タケルに話すと始まる）----
  E.sq_b2_start = [
    { t: 'fade', to: 1 },
    { t: 'title', text: '番外編二', sub: '旗を降ろさぬ者たち' },
    { t: 'sq', start: 'bangai2' },
    { t: 'save' },
    { t: 'bg', key: 'scorched_after', actors: [A('takeru', 220, 256, 'down')] },
    { t: 'fade', to: 0 },
    N('根の洲の土に、ようやく、緑が混じり始めていた。タケルは、鍬を止めて、畦の端にしゃがんだ。焦げた根の隙間から、細い草が、一本だけ伸びている。'),
    N('(踏まないように)'),
    { t: 'bg', key: 'scorched_after', actors: [A('takeru', 220, 256, 'right'), A('mikazuchi', 320, 240, 'left')] },
    S(MIKA, '「手が止まっているぞ」'),
    S(TAKERU, '「芽が、出ていた」'),
    S(MIKA, '「芽が出たくらいで、鍬を止める奴があるか」'),
    N('ミカヅチは、腕を組んだまま、鼻を鳴らした。けれど、その足は、草をよけて、一歩、横へずれていた。'),
    N('懐の内側で、紙が、かさりと鳴った。焼け残った手紙だ。『ミサキへ』。人間界の村々に出した問い合わせの文に、まだ、返事は一通も来ない。'),
    { t: 'bg', key: 'scorched_after', actors: [A('takeru', 220, 256, 'left'), A('mikazuchi', 320, 240, 'left'), A('kotoshiro', 140, 250, 'right')] },
    S(KOTO, '「タケル殿」'),
    S(TAKERU, '「コトシロ殿」'),
    S(KOTO, '「お仕事中に、失礼します」'),
    S(KOTO, '「軍務局から持ち出した写しを、この四か月、整理しておりました。移送の記録、兵の配置、それから、中継の石の場所」'),
    S(TAKERU, '「中継の」'),
    S(KOTO, '「王都の地下の神殿にあったものと、同じ造りの石です。人間界に、七つありました。六つは、王が亡くなった日に、光を失っています」'),
    S(KOTO, '「七つ目だけが、まだ、確かめられておりません。北の古い砦です」'),
    S(TAKERU, '「北の、砦」'),
    S(KOTO, '「ご存じですか」'),
    S(TAKERU, '「……ああ」'),
    S(TAKERU, '「あそこの守将は、ヤツカ様だ。俺に、剣を教えてくださった方だ」'),
    S(KOTO, '「その砦の兵が、まだ、戻っていないのです。王が亡くなって四か月、旗を掲げたまま、門を閉ざしている。議会の使いが二度、出向きましたが、二度とも、矢で追い返されました」'),
    S(MIKA, '「矢、だと」'),
    S(KOTO, '「死者は出ておりません。威嚇の矢でした。ただ、使いの者が、門の上から聞こえた言葉を、書き留めております」'),
    S(KOTO, '「『旗を降ろすな。境を守れ。魔族は話の通じぬ者たちである』」'),
    N('根の洲に、風が吹いた。タケルは、その言葉を、知っていた。牢の中で、自分が、何度も繰り返した言葉だった。'),
    // 二：露台
    { t: 'fade', to: 1 },
    { t: 'bg', key: 'balcony', actors: [A('bell_true', 240, 226, 'down'), A('omoika', 170, 246, 'right'), A('kotoshiro', 310, 246, 'left'), A('takeru', 200, 280, 'up'), A('mikazuchi', 400, 240, 'left'), A('oonamuchi', 70, 270, 'right')] },
    { t: 'fade', to: 0 },
    N('黄泉津の宮の露台には、昼でも、赤い光が満ちていた。オオナムチは、柱の陰に立って、卓を囲む人々を見ていた。'),
    S(OMOIKA, '「王が死んで、洗脳は、解けたはずです」'),
    S(OMOIKA, '「けれど、石だけが、残った。王が、この砦に最後に流した命令を、こだまのように、繰り返しているのでしょう。王の喉は、もう、何も紡がない。ですから、新しい言葉は、届かない。同じ言葉だけが、四か月、ずっと」'),
    S(BELL, '「それを聞かされ続けた兵は」'),
    S(OMOIKA, '「はい。解けるきっかけが、ありません」'),
    N('ベルは、黙った。外套の脇で、拳が、ゆっくりと握られていくのが見えた。'),
    S(BELL, '「私が行く」'),
    S(OMOIKA, '「なりません」'),
    S(OMOIKA, '「ベル様が、魔王の姿で、砦の前に立てば、どうなりますか。門の上の兵は、何を見ますか」'),
    S(BELL, '「……王の言葉が、本当になる」'),
    S(OMOIKA, '「そのとおりです。魔族は話の通じぬ者。旗を降ろすな。境を守れ。兵たちは、頭の中の声が正しかったと、確かめるだけです」'),
    N('ベルの拳が、白くなった。オオナムチは、柱の陰から、一歩、出た。'),
    S(OO, '「俺が、行きます」'),
    S(OO, '「俺は、人間です。冒険者です。門の前に立っても、たぶん、矢は飛んでこない。飛んできても、堅めがあります」'),
    S(BELL, '「オオナムチ」'),
    S(BELL, '「おまえに、また、背負わせることになる」'),
    S(OO, '「半分ずつ、ですよね」'),
    S(OO, '「ベルさんは、ここで、待っていてください。見ていてください。それで、半分です」'),
    N('ベルは、何も言わなかった。長い沈黙のあとで、拳が、ゆっくりと、ほどけた。'),
    S(TAKERU, '「俺も、行く」'),
    S(TAKERU, '「ヤツカ様は、俺の師だ。あの言葉を、俺に最初に教えたのも、あの方だった。いや」'),
    S(TAKERU, '「あの方の口を借りて、王が、教えた。俺は、それを、正しいと信じて、あの方と一緒に、何年も唱えた」'),
    S(TAKERU, '「壊したものを、俺の手で、直せと、言われた」'),
    S(BELL, '「剣は」'),
    S(TAKERU, '「持たない」'),
    S(TAKERU, '「もう、人に向ける剣は、持たない」'),
    N('壁際で、ミカヅチが、ふん、と鼻を鳴らした。布をほどくと、使い込まれた木刀が、一本、現れた。'),
    S(MIKA, '「鬼の稽古で使う、樫の木刀だ。俺の若い衆が、毎朝、これで、俺に叩きのめされている」'),
    S(MIKA, '「人に向けても、死なん。だが、受けきるには、重いぞ」'),
    N('タケルは、木刀を、両手で受け取った。ベルが、立ち上がった。'),
    S(BELL, '「行け」'),
    S(BELL, '「見ている」'),
    { t: 'bg', key: 'balcony', actors: [A('bell_true', 240, 226, 'down'), A('oonamuchi', 240, 270, 'up')] },
    N('露台を出るとき、オオナムチは、ベルに呼び止められた。'),
    S(BELL, '「オオナムチ」'),
    S(OO, '「はい」'),
    S(BELL, '「名を呼ぶのは、おまえの力だ。私には、あの砦の兵の名を、一つも呼べぬ」'),
    S(OO, '「ベルさん」'),
    S(BELL, '「根の洲で消した兵の名も、私は、一つも知らぬ。知ろうともしなかった」'),
    S(OO, '「じゃあ、帰ってきたら、教えます」'),
    S(BELL, '「何を」'),
    S(OO, '「砦の人たちの、名前。全部」'),
    S(BELL, '「……覚えよう」'),
    N('その声は、オモイカの随員の名を、覚えた夜と、同じ響きをしていた。'),
    { t: 'fade', to: 1 },
    { t: 'bg', key: null },
    { t: 'join', id: 'c_takeru' },
    { t: 'state', set: { split: 'away' } },   // ベルは宮で待つ
    { t: 'item', id: 'kita_meibo' },
    { t: 'flag', set: 'sq_b2_go' },
    { t: 'flag', set: 'sq_b2_open' },   // 地図の砦の入口（クエストのあとも入れる）
    { t: 'goto', map: 'world_ningen', x: 50, y: 18, dir: 'up' },
    { t: 'fade', to: 0 },
    N('（大穴を抜けて、人間界へ。イワクラ城の北の、灰色の岩山の肩に、古い砦がある）'),
    { t: 'save' },
  ];

  // ---- 三：物見台のセキとナギ／四の頭：麓の林（砦に入ったとき）----
  E.sq_b2_arrive = [
    { t: 'fade', to: 1 },
    { t: 'bg', key: 'fortress', actors: [A('soldier', 220, 240, 'right')] },
    { t: 'fade', to: 0 },
    N('セキは、砦の物見台で、弓を抱えていた。北の風は、骨まで冷たかった。'),
    N('『旗を降ろすな』『境を守れ』『魔族は話の通じぬ者たちである』'),
    N('(いつからだろう) 声が、同じことしか、言わなくなったのは。補給の荷は、来なかった。蔵の麦は、もう、底が見えている。'),
    { t: 'bg', key: 'fortress', actors: [A('soldier', 220, 240, 'right'), A('clerk', 290, 250, 'left')] },
    S(NAGI, '「セキ」'),
    S(NAGI, '「麦湯だ。薄いけどな」'),
    S(SEKI, '「……すまない」'),
    N('指が、震えて、うまく持てなかった。ナギが、その手を、上から包んでくれた。'),
    S(NAGI, '「なあ、セキ」'),
    S(SEKI, '「何だ」'),
    S(NAGI, '「おまえ、声に、何か、聞いたことあるか」'),
    S(SEKI, '「聞く、とは」'),
    S(NAGI, '「問いかけたこと。こっちから」'),
    N('あった。一度だけ。故郷の母が、病だと聞いた日。帰ってもいいか、と、心の中で問うた。声は、答えなかった。'),
    S(SEKI, '「……答えは、なかった」'),
    S(NAGI, '「俺もだ」'),
    S(NAGI, '「村の、ゴロウさん、覚えてるか。字の下手な」'),
    S(SEKI, '「根の洲へ行った人か」'),
    S(NAGI, '「ああ。出ていく前の晩、娘に手紙ばかり書いてた。字が右に流れて、読めねえって、皆で笑ってさ」'),
    S(NAGI, '「俺も、ああいうの、書いてみようと思ったんだ。母ちゃんに。でも、書こうとすると、頭の中が、旗を降ろすなって、それだけになる」'),
    N('紙には、宛名のほかに、何も、書かれていなかった。'),
    S(NAGI, '「なあ。陛下は、本当に、まだ、俺たちに、話しかけてくださってるのかな」'),
    N('セキは、答えられなかった。それでも、胸の底に、小さな棘のようなものが、残った。物見台の下を、雪の混じった風が、吹き抜けていった。'),
    { t: 'fade', to: 1 },
    { t: 'bg', key: null },
    { t: 'fade', to: 0 },
    N('北の古い砦は、灰色の岩山の、肩のところにあった。オオナムチは、麓の林の陰から、門を見上げた。'),
    S(TAKERU, '「門の上に、弓兵が二人」'),
    S(TAKERU, '「城壁の内に、騎兵の厩がある。槍の歩兵が、二十ほど。術師が一人、いるはずだ。それから、旗持ちと、薬師」'),
    S(OO, '「詳しいですね」'),
    S(TAKERU, '「ここで、何度も、稽古をつけてもらった」'),
    N('オオナムチは、懐から、紙の束を取り出した。砦の兵の名簿だった。(呼ばれていないんだ)'),
    S(OO, '「行きます」'),
    { t: 'flag', set: 'sq_b2_seki' },
    N('（林を出て、雪原を門へ。打っても兵は倒れない。弱らせて、心鎮めや名呼びで目を覚まさせよう）'),
  ];

  // ---- 四：雪原の戦い（目覚めさせるだけの戦い×3）----
  const once = (st, key) => { st.said = st.said || {}; if (st.said[key]) return false; st.said[key] = true; return true; };
  const talk = list => ({ type: 'talk', list });
  const hookOne = () => st => {
    st.hookRound = (st.hookRound || 0) + 1;
    if (st.hookRound === 1 && once(st, 'masago')) return [talk([
      { name: OO, text: '「――心鎮め」' }, '先頭の兵の槍が、わずかに、鈍った。オオナムチは、名簿の一行目を、思い出した。',
      { name: OO, text: '「マサゴ」' }, { name: OO, text: '「南の、浜辺の村の、マサゴさん。年は、十九」' },
      { name: 'マサゴ', text: '「なんで、俺の、名を」' },
      { name: OO, text: '「お母さんが、議会に、手紙を出していました。息子は、どこにいるのかって」' },
      '次の兵が、槍を構えた。オオナムチは、その名を、呼んだ。次の兵の名も。その次も。',
    ])];
    return [];
  };
  const hookTwo = () => st => {
    st.hookRound = (st.hookRound || 0) + 1;
    if (st.enemies.some(e => e.id === 'zantou_kihei' && e.awakened) && once(st, 'kihei')) return [talk([
      'タケルは、鞍から転げ落ちる騎兵の体が雪に叩きつけられる前に、腕で、受け止めた。',
      { name: TAKERU, text: '「怪我は、ないか」' }, { name: '騎兵', text: '「……勇者、さま」' },
    ])];
    return [];
  };
  const hookThree = () => st => {
    st.hookRound = (st.hookRound || 0) + 1;
    if (st.hookRound === 2 && once(st, 'tokiwa')) return [talk([
      '術師が、門の内側で、唱えていた。甘い声だった。『惑わされるな。それは、魔族の手口だ』',
      '城壁の上で、旗持ちが、王家の紋の、白い旗を振り回していた。',
      { name: OO, text: '「トキワさん」' }, { name: OO, text: '「トキワさん！　山の炭焼きの村の、トキワさん！」' },
      '旗は、振られ続けた。',
    ])];
    if (st.hookRound >= 3 && once(st, 'seki')) {
      const seki = st.enemies.find(e => e.id === 'zantou_yumi' && e.hp > 0 && !e.awakened);
      const out = [talk([
        '物見台の上で、弓兵が、弓を引き絞った。矢が、放たれた。その瞬間、誰かが、弓兵の腕に、しがみついた。矢は、わずかに逸れて、オオナムチの頬を、かすめた。',
        { name: '薬師', text: '「セキ、やめろ！　あいつ、俺たちの名前を、呼んでるんだぞ！」' },
        { name: OO, text: '「セキさん！」' },
        { name: OO, text: '「ナギさんが、隣にいるでしょう。顔を、見てください。頭の中の声じゃなくて、ナギさんの顔を」' },
        '長い、長い、沈黙だった。弓兵の手から、弓が、ゆっくりと、下がっていった。',
      ])];
      if (seki) { seki.hp = 1; return out.concat(G.battle.tryAwaken(st, seki)); }
      return out;
    }
    return [];
  };
  const fight = (key, enemies, hook, next) => {
    E['sq_b2_fight_' + key] = [
      { t: 'save' },
      { t: 'battle', enemies, bg: 'mountain', spare: true, training: true, hook },
      { t: 'run', fn: () => G.party.healAll() },
      { t: 'if', flag: 'last_battle_won', then: next, else: [N('（もう一度。名を、呼び続けよう）'), { t: 'call', id: 'sq_b2_fight_' + key }] },
    ];
  };
  fight('1', ['zantou_hohei', 'zantou_hohei', 'zantou_hohei', 'zantou_hohei', 'zantou_kusushi'], hookOne(), [
    N('槍の穂先が、ゆっくりと、下がった。兵の膝が、雪に、ついた。'),
    N('騎兵が、厩から、飛び出してきた。速い。馬の脚が、雪を蹴散らして、迫ってくる。タケルが、前に出た。'),
    { t: 'call', id: 'sq_b2_fight_2' },
  ]);
  fight('2', ['zantou_kihei', 'zantou_kihei', 'zantou_hohei', 'zantou_hohei'], hookTwo(), [
    N('(同じ手口だ) オオナムチは、膜を、もっと、広げた。名を、呼び続けた。一人ずつ。声が、嗄れるまで。'),
    { t: 'call', id: 'sq_b2_fight_3' },
  ]);
  fight('3', ['zantou_jutsu', 'zantou_hata', 'zantou_yumi'], hookThree(), [
    N('城壁の上の旗持ちの腕も、いつの間にか、止まっていた。'),
    N('雪原に、槍が、一本、また一本と、置かれていった。'),
    { t: 'flag', set: 'sq_b2_snow' },
    N('（門が開いた。中庭へ）'),
  ]);
  E.sq_b2_snowfield = [
    N('オオナムチは、林から、出た。門の前の、開けた雪原を、まっすぐ、歩いた。矢が、一本、足元に、突き刺さった。'),
    S('門の上の兵', '「止まれ！」'),
    S('門の上の兵', '「何者だ。名を名乗れ」'),
    S(OO, '「オオナムチ。ミナモのギルドの、冒険者です」'),
    S('門の上の兵', '「冒険者が、何の用だ」'),
    S(OO, '「話を、しに来ました」'),
    S('門の上の兵', '「話すことはない。境を守れ、とのご命令だ」'),
    N('二本目の矢が、飛んできた。今度は、肩を狙っていた。'),
    S(OO, '「――堅め」'),
    N('膜が、立ち上がった。矢は、膜に弾かれて、雪の上に落ちた。門が、軋んで、開いた。槍の歩兵が、なだれ出てきた。目が、虚ろだった。'),
    { t: 'call', id: 'sq_b2_fight_1' },
  ];

  // ---- 五：中庭の老将ヤツカ（タケル一人。耐える戦い）----
  const duelHook = () => {
    const hold = G.sq.hooks.holdOut(SQ.duelRounds, '（受けきった！）');
    return st => {
      const first = !st.hookRound;
      const out = hold(st);
      if (first) return [talk(['木刀が、剣の腹を、叩いた。乾いた音が、中庭に、響いた。ヤツカの手から、剣が、離れなかった。老将は、笑った。',
        { name: YATSUKA, text: '「甘い。それで、勇者か」' }, { name: TAKERU, text: '「勇者では、ありません」' }])].concat(out);
      return out;
    };
  };
  E.sq_b2_courtyard = [
    N('砦の中庭に、一人の老人が、立っていた。長い白い髭が、胸の下まで垂れていた。手には、刃こぼれ一つない、古い剣を握っていた。'),
    S(TAKERU, '「ヤツカ様」'),
    N('老将の目が、タケルを、捉えた。虚ろではなかった。深く、澄んで、そして、冷たかった。'),
    S(YATSUKA, '「タケルか」'),
    S(YATSUKA, '「魔界から、戻ったか。英雄の凱旋は、もう、済んだのか」'),
    S(TAKERU, '「……ヤツカ様」'),
    S(YATSUKA, '「その木の棒は、何だ。剣は、どうした」'),
    S(TAKERU, '「捨てました」'),
    S(YATSUKA, '「捨てた、だと」'),
    S(TAKERU, '「人に向ける剣は、もう、持ちません」'),
    S(YATSUKA, '「腑抜けたか」'),
    S(YATSUKA, '「ならば、教え直してやる。旗を降ろすな。境を守れ。魔族は、話の通じぬ者たちである」'),
    N('(違う) 今なら、分かる。この人の声の、ずっと奥で、別の声が、喋っていた。'),
    N('ヤツカが、踏み込んだ。(受けきれ) 受けきるとは、退かぬことだ。(斬るな) (この人を、斬るな)'),
    N(`（タケル一人で、${SQ.duelRounds}ラウンド受けきれば勝ち。木刀は、老将を斬らない）`),
    solo('c_takeru'),
    { t: 'call', id: 'sq_b2_duel' },
  ];
  E.sq_b2_duel = [
    { t: 'save' },
    { t: 'battle', enemies: ['zantou_yatsuka'], bg: 'mountain', spare: true, training: true, hook: duelHook() },
    { t: 'run', fn: () => G.party.healAll() },
    { t: 'if', flag: 'last_battle_won', then: [{ t: 'call', id: 'sq_b2_duel_after' }], else: [N('（もう一度。受けきれ）'), { t: 'call', id: 'sq_b2_duel' }] },
  ];
  E.sq_b2_duel_after = [
    N('タケルは、木刀を、下ろした。構えを、解いた。'),
    S(TAKERU, '「ヤツカ様。俺は、魔界の会談の席で、刃を抜きました。和平を望んだ使者たちを、斬りました。根の洲を、焼きました」'),
    S(TAKERU, '「その全部を、俺は、正しいと信じていました。あなたに、教わった言葉と、同じだったから」'),
    S(YATSUKA, '「……黙れ」'),
    S(TAKERU, '「陛下は、もう、いません」'),
    S(TAKERU, '「四か月前に、亡くなりました。頭の中の声は、陛下ではありません。石です。陛下が、この砦に最後に流した言葉を、石が、繰り返しているだけです」'),
    S(YATSUKA, '「黙れ！」'),
    N('剣が、振り下ろされた。タケルは、避けなかった。その時、背後から、声がした。'),
    S(OO, '「ヤツカさん」'),
    S(OO, '「ヤツカさん。北の山村の、ヤツカさん。奥さんは、ハツさん。娘さんは、二人」'),
    N('ヤツカの剣が、空中で、止まった。'),
    S(OO, '「四か月、名を、呼ばれていないでしょう」'),
    S(OO, '「ハツさんが、毎晩、あなたの名前を、呼んでいるそうです。帰ってきますように、って」'),
    N('老将の手が、震えた。長い髭の奥で、唇が、何かを言おうとして、動いた。'),
    S(YATSUKA, '「……ハツ」'),
    N('剣が、ゆっくりと、下がった。'),
    { t: 'flag', set: 'sq_b2_yatsuka' },
    N('（タケル：物見台の下の石室へ）'),
  ];

  // ---- 六：中継の石 ----
  E.sq_b2_stone = [
    N('黒い石の台座に、細い銀の線が、幾重にも絡みついている。中央で、淡い光が、脈打っている。光が脈打つたびに、声がした。'),
    S('石の声', '『旗を降ろすな』'),
    S('石の声', '『境を守れ』'),
    S('石の声', '『魔族は話の通じぬ者たちである』'),
    N('王の声だった。柔らかく、温かい声。今も、この声を聞くと、胸の奥が、少しだけ、温かくなる。それが、いちばん、恐ろしかった。'),
    S(OO, '「タケルさん」'),
    S(OO, '「俺が、やりましょうか」'),
    S(TAKERU, '「いや」'),
    S(TAKERU, '「俺が、やる」'),
    N('木刀を、石の脇に、置いた。それから、両の拳を、握った。剣ではなく。木刀でもなく。自分の手で。'),
    S(TAKERU, '「壊したものを、俺の手で、直せ」'),
    S(TAKERU, '「焼かれた土を、耕せ。折れた畦を、積み直せ」'),
    S(TAKERU, '「失われた者たちの、名を、覚えろ」'),
    N('振り下ろした。拳が、黒い石に、叩きつけられた。骨が、軋んだ。皮が、裂けた。石は、割れなかった。'),
    S('石の声', '『旗を降ろすな』'),
    N('もう一度、振り下ろした。血が、銀の線に、飛び散った。'),
    S('石の声', '『境を守れ』'),
    N('もう一度。石の表面に、細い、ひびが、走った。'),
    S('石の声', '『魔族は』'),
    N('もう一度。ひびが、広がった。光が、乱れた。'),
    S('石の声', '『話の、通じ』'),
    N('タケルは、叫んだ。声にならない、叫びだった。拳が、石を、砕いた。脈打っていた光が、ふっと、消えた。'),
    N('静かになった。何の声も、しなかった。'),
    S(TAKERU, '「……静かだ」'),
    N('砦じゅうで、何かが、床に落ちる音。槍の音。弓の音。それから、誰かが、泣き出す声。'),
    N('物見台の上で、セキが、頭を抱えて、うずくまっていた。隣で、ナギが、凍った旗の綱に、手をかけていた。'),
    S(NAGI, '「降ろすぞ」'),
    S(SEKI, '「……ああ」'),
    N('綱が、軋んだ。白い旗が、ゆっくりと、降りていった。'),
    { t: 'flag', set: 'sq_b2_stone' },
    unsolo(),
    // 七：比良坂の縁
    { t: 'fade', to: 1 },
    { t: 'bg', key: 'hirasaka', actors: [A('bell_true', 380, 230, 'left')] },
    { t: 'fade', to: 0 },
    N('比良坂の縁には、朝の光が、差していた。坂の下から、人の列が、上ってくる。北の砦の兵たちだった。槍も、弓も、持っていない。'),
    N('列の先頭に、オオナムチとタケルがいた。タケルの両手には、白い布が、厚く巻かれていた。ベルは、岩陰から、出なかった。(今は、見るだけでよい)'),
    N('ふと、列の中から、一人が、離れた。ヤツカは、まっすぐ、岩陰のほうへ、歩いてきた。'),
    { t: 'bg', key: 'hirasaka', actors: [A('bell_true', 330, 230, 'left'), A('yatsuka', 250, 246, 'right')] },
    S(YATSUKA, '「あなたが、魔王か」'),
    S(BELL, '「そうだ」'),
    N('ヤツカは、長い間、ベルを見ていた。それから、ゆっくりと、膝をついた。'),
    S(YATSUKA, '「わしは、五十年、剣を振った。そのうちの何年かは、わしのものではなかった。その間に、何を斬り、何を教えたか」'),
    S(YATSUKA, '「弟子に、間違った言葉を、教えた」'),
    S(BELL, '「面を上げられよ」'),
    S(BELL, '「おまえの弟子は、今朝、自分の拳で、石を砕いた。間違った言葉を、自分の手で、黙らせた」'),
    S(BELL, '「教えたのは、言葉だけではあるまい。剣の握り方を、教えたのだろう。受けきることを、教えたのだろう」'),
    S(BELL, '「あの者は、おまえに教わった剣で、誰も斬らずに、戻ってきた」'),
    N('老将の目から、涙が、一筋、こぼれた。'),
    { t: 'bg', key: 'hirasaka', actors: [A('takeru', 220, 250, 'right'), A('soldier', 300, 250, 'left')] },
    S(SEKI, '「勇者さま。いや、タケル殿」'),
    S(TAKERU, '「何だ」'),
    S(SEKI, '「根の洲の戦に、同じ村のゴロウって男が、行ってました。娘に、手紙ばかり書いてる男で。字が、右に流れて、誰にも読めなくて」'),
    S(TAKERU, '「娘の名は」'),
    S(SEKI, '「ミサキ、だったと思います」'),
    N('タケルは、白い布を巻いた手を、胸の内側に、当てた。焼け残った紙が、そこにあった。右に流れる、不器用な字の、紙が。'),
    S(TAKERU, '「村の名を、教えてくれ」'),
    S(TAKERU, '「続きを、届けに行かなければならない。それが、俺の、次の仕事だ」'),
    N('坂の上の集落で、誰かが、誰かの名を、呼んでいた。何度も、何度も。その中に、ハツ、という声が、混じっていた。'),
    S('ハツ', '「ヤツカ」'),
    N('老人が、振り向いた。坂の上で、白髪の女が、手を振っていた。'),
    { t: 'fade', to: 1 },
    { t: 'bg', key: 'hirasaka', actors: [A('oonamuchi', 220, 256, 'right'), A('bell_true', 290, 250, 'left')] },
    { t: 'fade', to: 0 },
    N('その夜、比良坂の縁に、二つの影が、並んで座っていた。オオナムチは、膝の上に、コトシロの名簿を広げていた。'),
    S(OO, '「マサゴさん。南の浜辺の村の、十九歳」'),
    S(BELL, '「マサゴ」'),
    S(OO, '「トキワさん。山の炭焼きの村の、旗持ち。旗を振る腕が、いちばん強かった人です」'),
    S(BELL, '「トキワ」'),
    S(OO, '「セキさん。弓兵。ナギさん。薬師。二人は、幼なじみで」'),
    S(BELL, '「セキ。ナギ」'),
    N('一人ずつ、名が、夜の中に、置かれていった。オオナムチは、時々、言葉に詰まった。そのたびに、ベルは、黙って、待った。'),
    S(OO, '「ヤツカさん。北の山村の、守将。奥さんは、ハツさん」'),
    S(BELL, '「ヤツカ」'),
    S(BELL, '「四十二人」'),
    S(OO, '「はい。全員です」'),
    S(BELL, '「根の洲の兵の名は、もう、誰も、教えてはくれぬ」'),
    S(OO, '「タケルさんが、探しています。ミサキさんの村も、分かりそうだって」'),
    S(BELL, '「そうか」'),
    S(BELL, '「ならば、一人ずつだ」'),
    S(OO, '「はい」'),
    S(BELL, '「一人ずつ、覚える。何年かかっても」'),
    N('大穴の底から、細い光の筋が、立ち昇っていた。その光の中で、ベルの横顔は、もう、何かを握りしめてはいなかった。'),
    { t: 'fade', to: 1 },
    { t: 'bg', key: null },
    keep('oonamuchi'),
    { t: 'sq', end: 'bangai2', stay: true },
    restore('oonamuchi'),
    { t: 'run', fn: () => { FLAGS.forEach(f => G.flags.set(f, false)); G.party.addItem('kita_meibo'); } },
    { t: 'goto', map: 'hirasaka', x: 10, y: 13, dir: 'up' },
    { t: 'fade', to: 0 },
    N('（番外編二「旗を降ろさぬ者たち」を終えた。北の砦の名簿は、持ち物に残っている）'),
    { t: 'item', id: 'kashi_tsuba' },
    { t: 'save' },
  ];

  // ---- マップに足すもの ----
  // 畑の西の焼けた畦で鍬をふるうタケル（番外編一のあと）
  G.sq.add('yomi_hani', {
    npcs: [{ id: 'takeru13', look: 'takeru', x: 3, y: 11, dir: 'down', move: 'still', chapter: 13, if: 'sq_done_bangai1', unless: 'sq_done_bangai2', event: 'sq_b2_start' }],
  });
  // 人間界の地図：イワクラ城の北の山のとなり (50,16) に北の古い砦（クエストを受けるまでは入れない。クエストのあとも入れる）
  G.sq.add('world_ningen', {
    flagTiles: [{ x: 50, y: 16, ch: '9', chapter: 13 }],
    warps: [{ x: 50, y: 16, to: 'kita_toride', tx: 12, ty: 18, dir: 'up', requires: { chapter: 13, if: 'sq_b2_open' }, blockedText: '岩山の上に、古い砦が見える。' }],
  });
  G.sq.add('kita_toride', {
    onEnter: [{ event: 'sq_b2_arrive', if: 'sq_b2_go', unless: 'sq_b2_seki' }],
    triggers: Array.from({ length: 22 }, (_, i) => ({ x: i + 2, y: 13, event: 'sq_b2_snowfield', if: 'sq_b2_seki', unless: 'sq_b2_snow' }))
      .concat([12, 13].map(x => ({ x, y: 6, event: 'sq_b2_courtyard', if: 'sq_b2_snow', unless: 'sq_b2_yatsuka' }))),
    npcs: [
      { id: 'b2_yatsuka', look: 'yatsuka', x: 12, y: 4, dir: 'down', move: 'still', if: 'sq_b2_snow', unless: 'sq_b2_stone', talk: ['……。'] },
      // 目を覚ました兵（セリフは足さない）
      ...[[6, 10], [9, 11], [16, 10], [19, 12], [8, 5], [17, 5]].map(([x, y], i) => ({ id: 'b2_hei' + i, look: 'soldier', x, y, dir: 'down', move: 'still', if: 'sq_b2_snow', unless: 'sq_b2_stone', talk: ['（槍を、雪の上に置いて、座り込んでいる）'] })),
    ],
  });
  G.sq.add('kita_ishimuro', {
    spots: [5, 6].map(x => ({ x, y: 3, event: 'sq_b2_stone', if: 'sq_b2_yatsuka', unless: 'sq_b2_stone' })),
  });

  // ---- クエストのあいだの目的 ----
  G.DATA.sqObjectives = G.DATA.sqObjectives || [];
  G.DATA.sqObjectives.push(
    { sq: 'bangai2', unless: 'sq_b2_seki', text: 'イワクラ城の北の、古い砦へ' },
    { sq: 'bangai2', unless: 'sq_b2_snow', text: '麓の林を出て、雪原を門へ' },
    { sq: 'bangai2', unless: 'sq_b2_yatsuka', text: '門をくぐって、中庭へ' },
    { sq: 'bangai2', text: '（タケル）物見台の下の石室へ' },
  );
})();
