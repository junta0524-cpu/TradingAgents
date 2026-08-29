// 章データ ― シナリオ資料集「ロトの継承」全16章(序章+第一〜十四章+終章)の進行定義。
// 各章は1つ以上の stage(フィールド/街=gate到達で完了、ダンジョン=ボス撃破で完了)から成る。
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Chapters = [
  {
    title: '序章 ― 竜王討滅、そしてラダトームの選択',
    intro: [
      '竜王の城が くずれ落ちる轟音を背に、ロトはローラ姫を抱えてラダトームへ帰還した。',
      '国王「ロトよ、そなたに 王位と姫の手を授けよう」',
      'ロト「……陛下、竜王は滅びました。しかしこの目で見たのです。やつの軍勢は、なお大陸のすみずみに 散らばっています」',
      'その夜、ロトはローラ、エルロード、セレスティアと円卓を囲み、三方に散って大陸を守る誓いを立てた。',
    ],
    stages: [{
      map: 'radatome', type: 'gate',
      goal: '城の者たちと 話してから 城を出る',
      require: { talk: ['radatome_king', 'radatome_soldier', 'radatome_oldwoman'] },
      blocked: '別れも告げずに 発つわけにはいかない。',
    }],
    outro: ['ロトは旅装を整え、東の沃野へと歩き出した。'],
  },
  {
    title: '第一章 ― 東方の沃野へ',
    intro: ['ラダトームを離れ、ロトは東へ向かう。この先に肥沃な平野が広がっているという。'],
    stages: [{
      map: 'east_road', type: 'gate',
      goal: '街道の魔物を 退けて 東へ抜ける',
      require: { defeat: 3 },
      blocked: '魔物が うろついている。このままでは 開拓民が 通れない。',
    }],
    outro: ['丘陵の向こうに、新たな都を築くにふさわしい土地が見えた。ここが、のちのローレシアとなる。'],
  },
  {
    title: '第二章 ― 蒼穹の塔の賢者',
    intro: ['一方その頃、エルロードは大陸北方の高原、古代文明の遺構「蒼穹の塔」を目指していた。'],
    stages: [
      {
        map: 'azure_plain', type: 'gate',
        goal: '湖を回り込んで 北の塔へ向かう',
        require: { defeat: 3 },
        blocked: '塔へ続く道に 魔物が 群れている。',
      },
      {
        map: 'azure_tower', type: 'boss', bossId: 'astro_guardian',
        goal: '各階の 燭台に 火を入れてから 最上層へ',
        require: { light: 3 },
        lightWord: '燭台',
        blocked: '最上層の扉は 冷たく閉ざされている。塔の燭台に 火が要る。',
        onEnter: { recruit: 'elrode' },
        intro: [
          '塔の中でロトはエルロードと合流した。エルロード「共に行きましょう」',
          'エルロード「各階に 燭台があります。すべてに 火が入らないかぎり、最上層の扉は 開きません」',
        ],
      },
    ],
    outro: ['封印の番人を退け、エルロードは「知の国」を興す決意を固めた。以後もロトの一行として、共に歩むこととなる。'],
    onComplete: { gear: ['azure_staff'], gold: 200 },
  },
  {
    title: '第三章 ― 月下の誓い',
    intro: ['セレスティアは西へ向かう。一族の悲願だった、断崖の防衛拠点の建設地を目指して。'],
    stages: [
      {
        map: 'cliff_road', type: 'gate',
        goal: '桟道を のぼって 断崖の村をめざす',
        require: { defeat: 3 },
        blocked: '海から這い出た 異形が 道をふさいでいる。',
      },
      { map: 'cliff_village', type: 'gate',
        goal: '村の者から 深海の異変を 聞く',
        require: { talk: ['cliff_elder', 'cliff_fisher'] },
        blocked: 'まだ 聞くべきことが 残っている。',
        intro: ['断崖の氏族村で、深海から現れた異形の魔物と、それを操るとおぼしき仮面の人物を目撃した。正体は掴めぬまま、姿を消した。'] },
    ],
    outro: ['セレスティアは「西方の脅威はまだ終わっていない」と確信し、ロトの一行に加わった。'],
    onComplete: { recruit: 'celestia', gear: ['moon_bow'], gold: 200 },
  },
  {
    title: '第四章 ― 三者の道、それぞれの礎',
    intro: [
      'ロト・エルロード・セレスティアは、それぞれの地で最初の困難を乗り越えた。',
      'ロトの剣・鎧・盾――ロトの遺産の扱いを巡って、三者の間で書簡が交わされる。',
      'この議論の決着は、盟約の日まで持ち越されることとなる。',
    ],
    stages: [{
      map: 'loureshia_town', type: 'gate',
      goal: '城下の者と話し、築城の支度を ととのえる',
      require: { talk: ['loureshia_roula', 'loureshia_smith', 'loureshia_noble'] },
      blocked: 'まだ 話を通していない者が いる。',
    }],
    outro: ['ローレシアの築城が、いよいよ本格的に始まる。'],
  },
  {
    title: '第五章 ― ローレシア築城',
    intro: ['築城が進む中、周辺一帯を縄張りとする竜王軍の残存幹部「牙のオーガ将軍ガロズ」が姿を現した。'],
    stages: [{
      map: 'ogre_camp', type: 'boss', bossId: 'galoz',
      goal: '野営地の奥の ガロズを たおす',
      require: { defeat: 3 },
      blocked: '手下が 多すぎる。まず 数を 減らそう。',
      intro: ['野営地の最奥で、ガロズが牙の棍棒を構えている。'],
      afterClear: {
        prompt: '倒れ伏したガロズが、こちらを見上げている。',
        options: [
          { label: '投降を 受け入れる', note: '赦しによる国造り', flag: 'galoz_spared',
            lines: [
              'ロト「立て。お前の武は、これから 守るために使え」',
              'ガロズ「……なぜだ。俺は お前の民を 幾人も 殺めた」',
              'ロト「だからこそだ。斬れば ひとり減る。赦せば ひとり増える」',
              'ガロズは 長く沈黙し、やがて 牙の棍棒を 地に置いた。',
            ] },
          { label: 'とどめを 刺す', note: '力による国造り', flag: 'galoz_slain',
            lines: [
              'ロト「……すまない。お前を 生かしておけば、民が 枕を高くして眠れない」',
              'ガロズ「それでいい。将は 戦場で 死ぬものだ」',
              '牙のオーガ将軍は、最後まで 誇りを 崩さなかった。',
            ] },
        ],
      },
    }],
    outro: ['ローレシアの地に、平穏が戻った。築城は着実に進んでいく。'],
    outroIf: [
      { flag: 'galoz_spared', lines: ['「敵将を 生かした」という報せは、良くも悪くも 城下を ざわつかせた。'] },
      { flag: 'galoz_slain', lines: ['「敵将を 討った」という報せに 城下は沸いたが、ロトの表情は 晴れなかった。'] },
    ],
  },
  {
    title: '第六章 ― 魔法学院創設',
    intro: ['エルロードは蒼穹の塔の麓に学院都市の建設を開始した。しかし創設式典の夜、禁呪の残滓が暴走する。'],
    stages: [
      {
        map: 'samaltria_town', type: 'gate',
        goal: '学院の者に 話を聞き、地下へ向かう',
        require: { talk: ['samaltria_vance', 'samaltria_librarian'] },
        blocked: '事故の様子を もう少し 聞いておこう。',
      },
      { map: 'academy_altar', type: 'boss', bossId: 'magatsuki',
        goal: '召喚された魔物を 片づけ、祭壇の主を たおす',
        require: { defeat: 5, withinSteps: 90 },
        blocked: '召喚された魔物が まだ 暴れている。',
        overrunFlag: 'academy_burned',
        overrun: '地上から 悲鳴が 届いた。……祭壇の外へ 一体、逃がしてしまった。',
        intro: [
          '地下祭壇で、名もなき召魔が姿を現した。',
          'エルロード「手早く。ここで食い止めないと、召喚されたものが 地上へ 出ます」',
        ] },
    ],
    outro: ['エルロードは弟子ヴァンスの才を見出しつつも、力を扱う責任の重さを痛感するのだった。'],
    outroIf: [
      { flag: 'academy_burned',
        lines: ['地上へ逃れた一体が 学院の東棟を 焼いた。創設の式典は、焼け跡の前で 執り行われた。'] },
    ],
  },
  {
    title: '第七章 ― 断崖の防人',
    intro: ['セレスティアは氏族の民を糾合し、断崖の上にムーンブルク城の基礎を築いた。並行して「業の底」の掃討作戦が始まる。'],
    stages: [
      {
        map: 'moonbrook_town', type: 'gate',
        goal: '防人たちから 海の異変を 聞く',
        require: { talk: ['moonbrook_knight', 'moonbrook_priestess'] },
        blocked: 'まだ 聞いていない者が いる。',
      },
      { map: 'abyss_depth', type: 'boss', bossId: 'abyss_matriarch',
        goal: '巣を 掃討し、最奥の巣母を たおす',
        require: { defeat: 6 },
        blocked: '巣の魔物が 多すぎる。まず 掃討しよう。', intro: ['深海棲の魔物の巣、その最奥に「深淵の巣母」が潜んでいた。'] },
    ],
    outro: ['掃討の最中、深海の魔物を操っていたとおぼしき仮面の人物を再び目撃するが、正体をつかめぬまま逃走を許してしまう。'],
  },
  {
    title: '第八章 ― ロトの盟約',
    intro: [
      '三国の基礎が固まったところで、ロト・エルロード・セレスティアはローレシアに集い、正式な建国と同盟の儀式を執り行う。',
      '「ロトの遺産」の分与が決定した――剣はローレシア王家に、鎧はサマルトリアの学院に、盾はムーンブルクの防人に。',
      '三国は「いずれかの国が滅びの危機に瀕した時、残る二国は必ず助けに向かう」という盟約を結んだ。',
    ],
    stages: [{
      map: 'loureshia_town', type: 'gate',
      goal: '三国の代表と 話し、盟約の席へ着く',
      require: { talk: ['loureshia_roula', 'loureshia_smith', 'loureshia_noble'] },
      blocked: 'まだ 席に着いていない者が いる。',
      afterClear: {
        prompt: 'ロトの遺産――鎧と盾を、どこへ託すか。',
        options: [
          { label: '鎧を学院へ、盾を防人へ', note: '三国で 分け持つ', flag: 'legacy_split',
            lines: [
              'ロト「鎧は サマルトリアへ。守りの術式を 解き明かしてくれ」',
              'ロト「盾は ムーンブルクへ。最前線に 立つ者が 持つべきだ」',
              'エルロードとセレスティアは、静かに うなずいた。',
            ] },
          { label: '三つとも ローレシアに納める', note: '力を 一箇所に集める', flag: 'legacy_kept',
            lines: [
              'ロト「遺産は 分けぬ。散らせば、いずれ どれかが 失われる」',
              'エルロード「……それは、力を 一所に 集めるということですよ」',
              'ロト「わかっている。だからこそ、見張る目が 要る」',
            ] },
        ],
      },
    }],
    outro: ['三国建国の宴は、幾日も続いたという。'],
    outroIf: [
      { flag: 'legacy_split', lines: ['剣はローレシアに、鎧はサマルトリアに、盾はムーンブルクに。三つの国は、三つの遺産で 結ばれた。'] },
      { flag: 'legacy_kept', lines: ['三つの遺産は ローレシアの宝物庫に並んだ。美しい眺めだったが、エルロードは 最後まで 何も言わなかった。'] },
    ],
    // ロトの遺産の分与。剣はローレシア王家に、鎧は学院に、盾はムーンブルクの防人へ。
    onComplete: { gear: ['roto_sword', 'silver_armor', 'roto_shield'], gold: 500 },
  },
  {
    title: '第九章 ― 影の萌芽',
    intro: [
      '建国から数年。旅の聖職者を名乗る「大司教バロウズ」が各国を訪れ始めた。',
      '貧しい辺境の村に施しを与える彼の姿に、誰も疑いを抱かない。だがその裏で、三国それぞれの「弱点」が静かに観察されていた。',
    ],
    stages: [{
      map: 'loureshia_town', type: 'gate',
      goal: '城下を歩き、旅の聖職者の噂を 集める',
      require: { talk: ['loureshia_smith', 'loureshia_noble', 'loureshia_roula'] },
      blocked: 'まだ 聞いていない噂が ある。',
      afterClear: {
        prompt: '大司教バロウズ。彼を どう扱うか。',
        options: [
          { label: '疑いを 持って 見張る', note: '真相に 近づく', flag: 'barrows_suspected',
            lines: [
              'ロト「あの男は 施しの量に対して、聞き出す量が 多すぎる」',
              'ロトは 密かに 見張りを付けるよう命じた。バロウズは そのことに 気づいた素振りすら 見せなかった。',
            ] },
          { label: '善意の聖職者として 迎える', note: '疑わずに 過ごす', flag: 'barrows_trusted',
            lines: [
              'ロト「飢えた者に 施す手を 疑うのは、王のすることではない」',
              'バロウズは 深く頭を下げた。その口元が どう動いたかを、見た者は いない。',
            ] },
        ],
      },
    }],
    outro: ['平穏な日々の裏側で、何かが静かに動き始めていた。'],
  },
  {
    title: '第十章 ― 貴族の反乱',
    intro: [
      'ローレシア国内で、旧来の武門貴族たちが「元竜王軍出身の将ガライを重用するロトの方針」に反発し、クーデターを画策した。',
      'ロトはガライへの信を貫くと決め、その意志を示すように、ガライ自身が反乱鎮圧の先頭に立った。',
    ],
    stages: [{
      map: 'loureshia_town', type: 'gate',
      goal: '貴族たちの言い分を 聞いて回る',
      require: { talk: ['loureshia_noble', 'loureshia_smith', 'loureshia_roula'] },
      blocked: 'まだ 言い分を 聞いていない者が いる。',
      afterClear: {
        prompt: '貴族たちは ガライの追放を求めている。',
        options: [
          { label: 'ガライへの信を 貫く', note: '将軍として 迎える', flag: 'garai_trusted',
            lines: [
              'ロト「彼を 退けるということは、赦しによって国を建てるという 私の言葉を 退けることだ」',
              'ガライは 何も言わず、ただ 全軍の先頭に立った。反乱は 一日で 鎮まった。',
            ],
            result: { recruit: 'garai', gear: ['oathkeeper'], gold: 400 } },
          { label: '貴族の要求を 飲む', note: 'ガライは 去る', flag: 'garai_exiled',
            lines: [
              'ロト「……すまない、ガライ」',
              'ガライ「よいのです。俺は 赦されるべき男では なかった」',
              '将軍は 一礼し、誰にも行き先を告げずに 城を出ていった。',
              '(ガライは 仲間にならない。以後も 三人で 旅を続けることになる)',
            ],
            result: { gold: 400 } },
        ],
      },
    }],
    outro: ['反乱は鎮まった。だがその裏に流れていた資金の出どころは、ついに掴めなかった。'],
    outroIf: [
      { flag: 'garai_trusted', lines: ['ガライはロトの最も忠実な右腕として、正式に一行へ加わった。'] },
      { flag: 'garai_exiled', lines: ['ガライの去った城は、以前より静かで、以前より少しだけ 冷たくなった。'] },
    ],
  },
  {
    title: '第十一章 ― 賢者の代償',
    intro: [
      'エルロードの弟子ヴァンスが、禁じられていたはずの禁呪研究に単独で手を染めていたことが発覚した。',
      '制止も聞かず実験を強行するヴァンス。エルロードは単身、彼を止めに向かう。',
    ],
    stages: [
      {
        map: 'samaltria_town', type: 'gate',
        goal: '学院の者から ヴァンスの行方を 聞く',
        require: { talk: ['samaltria_librarian', 'samaltria_vance'] },
        blocked: 'まだ 手がかりが 足りない。',
      },
      { map: 'forbidden_ritual_chamber', type: 'boss', bossId: 'genso_no_katsubo',
        goal: '渦の回廊の 核を すべて 断ってから 中心へ',
        require: { defeat: 4, light: 4 },
        lightWord: '核',
        blocked: '核が 残っている。中心のものは 何度でも 形を取り戻すだろう。',
        intro: [
          '崩れゆく実験室で、意志を持たない禁呪の集合体「原初の渇望」が渦を巻いていた。',
          'エルロード「渦の腕に 核が四つ。あれを断たないかぎり、中心のものは 何度でも 甦ります」',
        ] },
    ],
    outro: ['暴走を辛うじて鎮めた瞬間、爆発の余波でヴァンスは姿を消した――生死不明のまま。'],
  },
  {
    title: '第十二章 ― 月の巫女の試練',
    intro: ['セレスティアは後継者たちに月衆の秘技を伝える儀式を行う。妨害するかのように、再び仮面の人物の気配が過ぎった。'],
    stages: [{
      map: 'moonbrook_town', type: 'gate',
      goal: '後継者たちに 秘技を 伝える',
      require: { talk: ['moonbrook_celestia', 'moonbrook_knight', 'moonbrook_priestess'] },
      blocked: 'まだ 伝え終えていない者が いる。',
      // 三人に何を伝えるか。伝えたものが百年後のムーンブルクの形になる。
      // 選んだ技は形になって手元にも返る(教えた側が受け取るもの)。
      afterClear: [
        {
          prompt: 'セレスティア「弓を引く者に、何を 伝えましょうか」',
          options: [
            { label: '射抜く技', note: '狩り、そして戦を', flag: 'moon_taught_bow',
              lines: [
                'セレスティア「風を読み、待ち、一度で射抜く。……戦のための技です」',
                '若い射手は 眉ひとつ動かさず、うなずいた。',
              ],
              result: { gold: 260 } },
            { label: '狙わぬ技', note: '構えて、抑えとする', flag: 'moon_taught_restraint',
              lines: [
                'セレスティア「引き絞ったまま、放たぬこと。……そのほうが 難しい」',
                '若い射手は しばらく考え、それから 弓を下ろした。',
              ],
              result: { items: [{ id: 'jokyu_yakusou', count: 3 }] } },
          ],
        },
        {
          prompt: 'セレスティア「剣を持つ者には」',
          options: [
            { label: '常在戦場の心得', note: '備えを絶やさぬ国に', flag: 'moon_taught_vigil',
              lines: [
                'セレスティア「眠るときも 剣を離すな。ムーンブルクは 最も海に近い」',
                '若い衛士は 目を伏せ、それから 深く 頭を下げた。',
              ],
              result: { gear: ['steel_shield'] } },
            { label: '退くべき時の見極め', note: '民を先に逃がす国に', flag: 'moon_taught_retreat',
              lines: [
                'セレスティア「城は 建て直せます。人は 建て直せません」',
                '若い衛士は 唇を噛み、しかし 頷いた。',
              ],
              result: { items: [{ id: 'phoenix_no_shizuku', count: 1 }] } },
          ],
        },
        {
          prompt: 'セレスティア「祈る者には、何を 遺しましょう」',
          options: [
            { label: '月を読む術', note: '空を見て備える', flag: 'moon_taught_reading',
              lines: [
                'セレスティア「月が細るほど、あれらは 濃くなります。空を 読みなさい」',
                '若い巫女は 夜通し 空を見上げていたという。',
              ],
              result: { items: [{ id: 'seisui', count: 4 }] } },
            { label: '人を癒す術', note: '傷ついた者を先に', flag: 'moon_taught_healing',
              lines: [
                'セレスティア「まず 手を当てなさい。恐れは 痛みから 生まれます」',
                '若い巫女は その手を じっと 見つめていた。',
              ],
              result: { items: [{ id: 'jokyu_yakusou', count: 4 }] } },
          ],
        },
      ],
    }],
    outro: ['セレスティアは、伝えるべきものを伝え終えた。あとは、受け取った者たちの百年である。'],
    outroIf: [
      { flag: 'moon_taught_vigil',
        lines: ['ムーンブルク王家は「常在戦場」を国是に据えた。以後 百年、この国の兵は 鎧を脱がなかった。'] },
      { flag: 'moon_taught_retreat',
        lines: ['ムーンブルク王家は「民を先に」を国是に据えた。以後 百年、この国は 逃げ道を 絶やさなかった。'] },
      { flag: 'moon_taught_reading',
        lines: ['月を読む務めは 巫女から巫女へと 受け継がれ、この国は 空を見上げる 習わしを持った。'] },
    ],
  },
  {
    title: '第十三章 ― 百年の平穏',
    intro: [
      'ロト、エルロード、セレスティアはそれぞれ年を重ね、王位を子へ、弟子へ、後継者へと譲っていく。',
      '三国は交易・婚姻・学問交流を重ね、大陸有数の繁栄を築いていった。',
    ],
    stages: [{
      map: 'radatome', type: 'gate',
      goal: '古都をめぐり、過ぎた歳月を 見届ける',
      require: { talk: ['radatome_king', 'radatome_oldwoman', 'radatome_soldier'] },
      blocked: 'まだ 見届けていない歳月が ある。',
      afterClear: {
        prompt: '百年のうち、どの一場面を いちばん長く 語り継ぐか。',
        options: [
          { label: '初代の死', note: '静かな幕引き', flag: 'era_death',
            lines: [
              'ロトは 玉座ではなく、東方街道の見える丘で 息を引き取った。',
              '「……そうか」が、最後の言葉だったと 伝えられている。',
            ] },
          { label: '二代目の戴冠', note: '受け継がれる誓い', flag: 'era_crown',
            lines: [
              '若き二代目は、父の剣に手を触れずに 戴冠した。',
              '「これは 抜くための剣ではない。抜かずに済ませるための 剣だ」',
            ] },
          { label: '建国百年祭', note: '三国の絆', flag: 'era_festival',
            lines: [
              '三国の旗が 同じ広場に並んだのは、この日が 初めてだった。',
              '子どもたちは 三色の紋章を 布に描き、夜通し 掲げて回った。',
            ] },
        ],
      },
    }],
    outro: ['百年の平和がもたらした慢心――それこそが、この物語最大の警句であった。'],
  },
  {
    title: '第十四章 ― 忍び寄る影',
    intro: [
      '建国百年を迎える頃、大陸各地で不穏な兆候が相次いだ。',
      '姿を消していたヴァンスは、地の底深くで何者かに呼びかけられる幻夢を見ていた。三国の王家は、これを「解決された脅威の残り火」程度にしか捉えていない。',
    ],
    stages: [{
      map: 'moonbrook_town', type: 'gate',
      goal: '街の噂を 集める',
      require: { talk: ['moonbrook_knight', 'moonbrook_priestess'] },
      blocked: 'まだ 拾っていない噂が ある。',
    }],
    outro: ['まだ誰も気づいていない暗雲が、静かに、しかし確実に近づいていた。'],
  },
  {
    title: '終章 ― 竜の子らへ',
    intro: [
      '建国百年の式典が、盛大に執り行われた。ローレシア、サマルトリア、ムーンブルクの王家三代目たちが一堂に会し、「ロトの盟約」を改めて誓い合う。',
      '式典の最後、ロトの子孫である若き王子が、宝物庫に眠るロトの剣に静かに手を伸ばす。',
      '遠くムーンブルクの海の彼方に、まだ誰も気づいていない暗雲が浮かんでいた――。',
    ],
    stages: [{ map: 'loureshia_town', type: 'gate', goal: '式典の広場へ 向かう' }],
    outro: ['式典は 滞りなく 終わった。'],
    // ここまでの分かれ道が、式典の描写に返ってくる
    outroIf: [
      { flag: 'galoz_spared', lines: ['広間の隅には、かつて敵将だった老兵の 肖像が 掛けられていた。誰も その名を 悪くは 言わなかった。'] },
      { flag: 'galoz_slain', lines: ['広間の隅に、名を刻まれぬ墓標の絵が 一枚だけ 掛けられていた。由来を知る者は、もう いない。'] },
      { flag: 'legacy_split', lines: ['三国の王家三代目は、それぞれの遺産を 携えて 並び立った。剣と、鎧と、盾が 百年ぶりに 同じ広間に 揃った。'] },
      { flag: 'legacy_kept', lines: ['遺産は すべてローレシアの宝物庫にあった。他の二国の王は、それを 遠くから 眺めていた。'] },
      { flag: 'garai_trusted', lines: ['ローレシア軍の旗には、いまも 折れた牙の意匠が 縫い込まれている。'] },
      { flag: 'garai_exiled', lines: ['ローレシア軍の旗は 剣のみを描いている。折れた牙の意匠は、どこにも 残らなかった。'] },
      { flag: 'barrows_suspected', lines: ['見張りの記録は 百年ぶんの書庫に 眠っている。読む者さえ いれば、真相に たどり着けたはずだった。'] },
      { flag: 'barrows_trusted', lines: ['旅の聖職者の名は、感謝とともに 記録に残っていた。それが どれほど危ういことか、まだ 誰も知らない。'] },
      // 月の巫女が三人の弟子に伝えたものが、百年後のムーンブルクの形になっている
      { flag: 'moon_taught_vigil', lines: ['ムーンブルクの衛士だけが、式典のあいだも 鎧を 着けたままだった。三代前の巫女の 言いつけである。'] },
      { flag: 'moon_taught_retreat', lines: ['ムーンブルクの城には、他の二国にはない 逃げ道が 幾重にも 掘られている。三代前の巫女の 言いつけである。'] },
      { flag: 'moon_taught_reading', lines: ['ムーンブルクの巫女だけが、式典のあいだ ときおり 空を 見上げていた。細くなっていく月を 数えるように。'] },
      { flag: 'moon_taught_healing', lines: ['ムーンブルクの巫女は 式典に出ず、港の病者のもとに いたという。それもまた、三代前から 変わらない。'] },
      { lines: ['式典の最後、ロトの子孫である若き王子が、宝物庫に眠るロトの剣に 静かに手を伸ばした。'] },
      { lines: ['― ロトの継承、完 ―'] },
      { lines: ['この物語は、百年後の「ムーンブルク王国陥落」へと続いていく。'] },
    ],
  },
];
