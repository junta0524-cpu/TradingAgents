// このファイルの役目：寄り道クエストのあいだだけ出る敵（ユーザー決定B：魔界の人を操る章などでも敵を出して、やりがいを）。
// クエストの id → マップ → { steps, groups }。そのクエストのあいだ、マップの encounter の代わりに使う（js/systems/encounter.js）。
// notWith：その人を操っているときは出さない（戦わない人）。強さは操る人ひとりで勝てて、数戦で薬が要るくらいに合わせた。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.sqEncounters = {
    // 一・五　避難の夜（ハニヤス・スサノ・ミカヅチ）：焼ける根の洲と、嵐ヶ峰の北の斜面
    ch01_5: {
      nenosu: { steps: [22, 36], groups: [['yomotsu_inu', 'yomotsu_inu', 'hainezumi'], ['yakeno_onibi', 'yakeno_onibi', 'hainezumi'], ['arano_ookami', 'arano_ookami', 'arano_ookami']] },
      sq_mine: { steps: [22, 36], groups: [['yami_hitome'], ['hainezumi', 'hainezumi', 'yakeno_onibi'], ['yomotsu_inu', 'yomotsu_inu']] },
    },
    // 二・五　牢の粥（ヒサメ）：根の洲の焼け野
    ch02_5: {
      nenosu: { steps: [24, 40], groups: [['yomotsu_inu', 'hainezumi'], ['arano_ookami', 'arano_ookami'], ['yakeno_onibi', 'hainezumi']] },
    },
    // 四天王編（ハニヤス・スサノ・ナキメ・ミカヅチ。オモイカは戦わない）：嵐ヶ峰と角ヶ原
    ch11_5: {
      arashigamine: { steps: [24, 40], notWith: ['sq_omoika'], groups: [['yomotsu_inu'], ['hainezumi', 'sajin_hebi'], ['arano_ookami', 'arano_ookami']] },
      tsunogahara: { steps: [24, 40], notWith: ['sq_omoika'], groups: [['yomotsu_inu'], ['hainezumi', 'sajin_hebi'], ['arano_ookami', 'arano_ookami']] },
    },
    // 番外編五　十一人の名（ナキメ）：魔界の野（クリア後の強い組の代わり）
    bangai5: {
      world_makai: { steps: [24, 40], groups: [['yomotsu_inu', 'yomotsu_inu', 'hainezumi', 'yakeno_onibi'], ['kage_oni'], ['yami_hitome', 'yami_hitome']] },
    },
  };
})();
