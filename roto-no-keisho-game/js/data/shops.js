// 店の品揃え ― 街ごとに扱う商品を変え、物語が進むほど良い装備が並ぶようにしている。
// 物語で手に入る装備(story: true)は店には並ばない。
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Shops = {
  radatome: {
    item: ['yakusou', 'dokukeshi', 'mezame_no_ha'],
    gear: ['copper_sword', 'wood_staff', 'wood_bow', 'cloth_robe', 'wood_shield', 'leather_helm'],
  },
  loureshia_town: {
    item: ['yakusou', 'jokyu_yakusou', 'dokukeshi', 'mezame_no_ha', 'mahou_no_mi', 'kikan_no_hane'],
    gear: ['iron_sword', 'steel_sword', 'iron_greatsword', 'steel_greatsword',
           'leather_armor', 'chainmail', 'iron_shield', 'iron_helm', 'power_ring'],
  },
  samaltria_town: {
    item: ['yakusou', 'jokyu_yakusou', 'mahou_no_mi', 'seisui', 'kago_no_gofu', 'phoenix_no_shizuku'],
    gear: ['silver_staff', 'sage_staff', 'chainmail', 'steel_shield', 'sage_glasses', 'spirit_earring',
           'emberward_cloak', 'mending_pendant'],
  },
  moonbrook_town: {
    item: ['yakusou', 'jokyu_yakusou', 'mahou_no_mi', 'seisui', 'phoenix_no_shizuku'],
    gear: ['steel_bow', 'falcon_bow', 'steel_armor', 'steel_shield', 'steel_helm',
           'frostbite_shield', 'thorn_cuirass',
           'moonlight_brooch', 'swift_necklace'],
  },
  cliff_village: {
    item: ['yakusou', 'dokukeshi', 'mezame_no_ha', 'mahou_no_mi'],
    gear: ['wood_bow', 'steel_bow', 'leather_armor', 'leather_helm'],
  },
};

// 宿代・蘇生費用。人数とレベルに応じて上がっていく。
Game.Data.innPrice = function (party) {
  var top = party.reduce(function (n, m) { return Math.max(n, m.level); }, 1);
  return 4 * party.length + 2 * top;
};
Game.Data.revivePrice = function (member) {
  return 20 + member.level * 10;
};
