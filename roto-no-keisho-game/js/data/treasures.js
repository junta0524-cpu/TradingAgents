// 宝箱の中身 ― ダンジョンを歩き回る理由。
// kind は 'gold'(お金) / 'item'(道具) / 'gear'(装備)。
// 一度開けた箱は Game.Story が覚えていて、二度目からは空になる。
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Treasures = {
  // ---- はぐれオーガの野営地(第一・五章)----
  ogre_gold_s:   { kind: 'gold', amount: 90 },
  ogre_yakusou:  { kind: 'item', id: 'yakusou', count: 3 },
  ogre_shield:   { kind: 'gear', id: 'iron_shield' },
  ogre_gold_l:   { kind: 'gold', amount: 220 },

  // ---- 蒼穹の塔(第二章)----
  tower_mahou:   { kind: 'item', id: 'mahou_no_mi', count: 2 },
  tower_staff:   { kind: 'gear', id: 'sage_staff' },
  tower_gold:    { kind: 'gold', amount: 260 },
  tower_gofu:    { kind: 'item', id: 'kago_no_gofu', count: 2 },

  // ---- 断崖の道(第三章)----
  // 満月のあいだだけ開く入り江の奥。待って通った者だけが受け取る
  cliff_moon_gold: { kind: 'gear', id: 'swift_necklace' },

  // ---- 学院地下祭壇(第六・十一章)----
  altar_seisui:  { kind: 'item', id: 'seisui', count: 3 },
  altar_earring: { kind: 'gear', id: 'spirit_earring' },
  altar_gold:    { kind: 'gold', amount: 320 },

  // ---- 業の底(第七章)----
  abyss_jokyu:   { kind: 'item', id: 'jokyu_yakusou', count: 3 },
  abyss_brooch:  { kind: 'gear', id: 'moonlight_brooch' },
  abyss_gold:    { kind: 'gold', amount: 380 },
  abyss_phoenix: { kind: 'item', id: 'phoenix_no_shizuku', count: 1 },

  // ---- 禁呪暴走空間(第十一章)----
  ritual_gold:   { kind: 'gold', amount: 500 },
  ritual_armor:  { kind: 'gear', id: 'steel_armor' },
  ritual_phoenix:{ kind: 'item', id: 'phoenix_no_shizuku', count: 2 },
  ritual_ring:   { kind: 'gear', id: 'power_ring' },
};

// ---- ちいさなメダル ----
// 使い道は無いが、集めればローレシアの好事家が珍しいものと換えてくれる。
// 行き止まりや遠回りの先に置いてあり、寄り道の理由そのものになっている。
Game.Data.Treasures.medal_ogre    = { kind: 'item', id: 'chiisana_medal', count: 1 };
Game.Data.Treasures.medal_tower   = { kind: 'item', id: 'chiisana_medal', count: 1 };
Game.Data.Treasures.medal_altar   = { kind: 'item', id: 'chiisana_medal', count: 1 };
Game.Data.Treasures.medal_abyss   = { kind: 'item', id: 'chiisana_medal', count: 2 };
Game.Data.Treasures.medal_ritual  = { kind: 'item', id: 'chiisana_medal', count: 2 };
Game.Data.Treasures.medal_cliff   = { kind: 'item', id: 'chiisana_medal', count: 1 };
Game.Data.Treasures.medal_road    = { kind: 'item', id: 'chiisana_medal', count: 1 };
Game.Data.Treasures.medal_plain   = { kind: 'item', id: 'chiisana_medal', count: 1 };

// 中身を受け取ったときの一言と、実際の付与処理
Game.Data.openTreasure = function (id) {
  var t = Game.Data.Treasures[id];
  if (!t) return '……箱は 空っぽだった';
  if (t.kind === 'gold') {
    Game.Party.addGold(t.amount);
    return t.amount + 'ゴールドを 手に入れた!';
  }
  if (t.kind === 'item') {
    var def = Game.Data.Items[t.id];
    Game.Party.grantItem(t.id, t.count || 1);
    return def.name + (t.count > 1 ? 'を ' + t.count + 'つ' : 'を') + ' 手に入れた!';
  }
  if (t.kind === 'gear') {
    Game.Party.grantGear(t.id);
    return Game.Data.Equipment[t.id].name + 'を 手に入れた!';
  }
  return '……箱は 空っぽだった';
};
