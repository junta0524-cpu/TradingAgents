// このファイルの役目：メニューの下に出す「いまの目的」の一覧（次に何をすればよいかの道しるべ）。
// 上から順に見て、chapter と条件（if／unless／all、G.flags.check と同じ書き方）が合う最初の一行を出す。
// 物語のセリフではなく案内の文。進み具合はフラグで判断する（場面の flag と同じ名前）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.objectives = [
    // ---- 第一部（魔界）----
    { chapter: 1, unless: 'ch1_hani', text: '畑にいるハニヤスに話しかける' },
    { chapter: 1, unless: 'ch1_market', text: '東の道を通って、魔界の市場へ行く' },
    { chapter: 1, unless: 'ch1_palace', text: '北の黄泉津の宮へ戻り、広間の奥の王に話しかける' },
    { chapter: 1, if: 'ch1_evening', unless: 'ch1_child', text: '夕方の畑で、子どもに話しかける' },
    { chapter: 2, text: '攻めてきた人間の軍勢を迎え撃つ' },
    { chapter: 3, unless: 'ch3_visit', text: '宮の西の扉から牢へ行き、タケルに会う' },
    { chapter: 3, if: 'ch3_report', unless: 'ch3_done', text: '宮の露台へ出て、ことだまの「言伝」を唱える' },
    // ---- 第二部（人間界・偽名の旅）----
    { chapter: 4, unless: 'ch4_guild', text: '港町ミナモの冒険者ギルドで、受付に話しかける' },
    { chapter: 4, unless: 'ch4_dogs', text: '町の南の野原へ出て、東の端からひなた野へ向かう' },
    { chapter: 4, unless: 'ch4_delivered', text: 'ひなた野で、届け物を渡す' },
    { chapter: 5, unless: 'ch5_sukuna', text: '聖の森の道を北へ進む' },
    { chapter: 5, unless: 'ch5_village', text: '森の奥の集落へ入る' },
    { chapter: 5, unless: 'ch5_konoha', text: '集落の東で、コノハに話しかける' },
    { chapter: 5, unless: 'ch5_hall', text: '集落のクシナダの館へ行く' },
    { chapter: 5, unless: 'ch5_cave', text: '森の道の東にある洞窟へ行く' },
    { chapter: 5, unless: 'ch5_minato', text: 'クシナダの館へ戻る' },
    { chapter: 5, unless: 'ch5_done', text: '夜の森の道で、ことだまの「言伝」を唱える' },
    { chapter: 6, unless: 'ch6_arrive', text: '炉ヶ岳の山道を登り、鉱山の里へ' },
    { chapter: 6, unless: 'ch6_order', text: '里の人に話しかけて、様子を聞く' },
    { chapter: 6, unless: 'ch6_blade', text: '里の真ん中の作業場を調べる' },
    { chapter: 6, unless: 'ch6_fire', text: '里の北西の炉で、炉番に話しかける' },
    { chapter: 6, unless: 'ch6_descend', text: '里の南の門で、カナメに話しかける' },
    { chapter: 6, text: '炉ヶ岳の山道を下りる' },
    { chapter: 7, unless: 'ch7_kuzu', text: '獣ノ原を東へ抜けて、葛の里へ' },
    { chapter: 7, unless: 'ch7_saru', text: '葛の里の奥、サルタヒコの岩屋へ行く' },
    { chapter: 7, if: 'ch7_night', unless: 'ch7_well', text: '夜の葛の里で、井戸へ行く' },
    { chapter: 7, unless: 'ch7_farewell', text: '朝の葛の里、西の出口でサルタヒコに話しかける' },
    { chapter: 7, unless: 'ch7_done', text: '葛の里で、ことだまの「言伝」を唱える' },
    // ---- 第三部 ----
    { chapter: 8, unless: 'ch8_debate', text: '王都の広場の討論会へ行く（円議堂の前）' },
    { chapter: 8, unless: 'ch8_meet', text: '街の東で、コトシロを探す' },
    { chapter: 8, unless: 'ch8_mio', text: '宿の主人に話して夜にし、鐘楼裏の路地から貧民区へ' },
    { chapter: 8, unless: 'ch8_done', text: '夜の天津京で、ことだまの「言伝」を唱える' },
    { chapter: 9, unless: 'ch9_ward', text: '見張りに見つからないように、院の大部屋へ' },
    { chapter: 9, unless: 'ch9_temple', text: '院の地下の神殿へ下りる' },
    { chapter: 10, text: '天津京から逃げ、魔界へ帰る' },
    { chapter: 11, unless: 'train_mika', text: '修行：角ヶ原でミカヅチと手合わせする（順番は自由）' },
    { chapter: 11, unless: 'train_susa', text: '修行：嵐ヶ峰でスサノと手合わせする（順番は自由）' },
    { chapter: 11, unless: 'train_naki', text: '修行：宮の聖域でナキメと手合わせする（順番は自由）' },
    { chapter: 11, unless: 'ch11_fest', text: '土蜘蛛族の畑へ戻る' },
    { chapter: 11, text: '物語を先へ進める' },
    { chapter: 12, text: '王の詠唱を守りの言霊で遮り、満ちる直前に踏み込む' },
    // ---- クリア後 ----
    { chapter: 13, unless: 'ame_lit', text: '師と手合わせして四系統をそろえ、畑のクナドへ' },
    { chapter: 13, unless: 'post_bell_win', text: '宮のオモイカに話しかけ、ベルとの最終手合わせに挑む' },
    { chapter: 13, text: '両方の世界を自由に巡る（大穴で行き来できる）' },
  ];

  // いまの目的（合う行がなければ null）
  G.objective = () => {
    const ch = (G.state && G.state.chapter) || 1;
    const o = G.DATA.objectives.find(x => x.chapter === ch && G.flags.check(Object.assign({}, x, { chapter: null })));
    return o ? o.text : null;
  };
})();
