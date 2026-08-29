// ちいさなメダル ― 集める理由。
//
// 使い道の無い品を、寄り道の先に少しずつ置いておく。
// 集めた枚数だけ、ローレシアの好事家が珍しいものと引き換えてくれる。
// 店では買えないもの・まだ買えないものを前倒しで手に入れる道になる。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// 世に出ているメダルは全部で10枚。値段は「全部は換えられない」ように付けてある。
// 何と換えるかを選ぶこと自体が、この仕組みの遊びどころ。
Game.Data.MedalPrizes = [
  { cost: 2,  kind: 'item', id: 'jokyu_yakusou', count: 3,     note: 'まずは 手当ての備えを' },
  { cost: 3,  kind: 'gear', id: 'iron_shield',                 note: '守りを ひとつ厚く' },
  { cost: 4,  kind: 'item', id: 'phoenix_no_shizuku', count: 2, note: '倒れても やり直せる' },
  { cost: 5,  kind: 'gear', id: 'power_ring',                  note: '店より 早く手に入る' },
  { cost: 6,  kind: 'gear', id: 'moonlight_brooch',            note: '月の加護を その身に' },
  { cost: 8,  kind: 'gear', id: 'falcon_bow',                  note: '弓を引く者へ' },
  { cost: 10, kind: 'gear', id: 'dragon_slayer',               note: '竜を殺した剣の写し' },
];

// いま持っているメダルの枚数
Game.Data.medalCount = function () {
  var e = Game.Party.inventory().filter(function (it) { return it.id === 'chiisana_medal'; })[0];
  return e ? e.count : 0;
};
