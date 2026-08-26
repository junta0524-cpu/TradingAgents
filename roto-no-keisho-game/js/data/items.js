// 道具データ ― 宝物庫(装備・アイテム設定資料)の消耗品リストをすべて実装
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Items = {
  yakusou: { id: 'yakusou', name: 'やくそう', kind: 'heal_hp', power: 25, price: 12 },
  jokyu_yakusou: { id: 'jokyu_yakusou', name: 'じょうきゅうやくそう', kind: 'heal_hp', power: 60, price: 55 },
  dokukeshi: { id: 'dokukeshi', name: 'どくけし草', kind: 'cure', status: 'poison', price: 10 },
  mezame_no_ha: { id: 'mezame_no_ha', name: 'めざめの葉', kind: 'cure', status: 'confuse_sleep', price: 15 },
  seisui: { id: 'seisui', name: 'せいすい', kind: 'cure_undead', price: 18 },
  mahou_no_mi: { id: 'mahou_no_mi', name: '魔法の実', kind: 'heal_mp', power: 8, price: 40 },
  kago_no_gofu: { id: 'kago_no_gofu', name: '加護の護符', kind: 'ward', price: 60 },
  kikan_no_hane: { id: 'kikan_no_hane', name: '帰還の羽根', kind: 'return', price: 30 },
  phoenix_no_shizuku: { id: 'phoenix_no_shizuku', name: 'フェニックスの雫', kind: 'revive', power: 0.5, price: 150 },
};

// 初期所持品
Game.Data.START_INVENTORY = [
  { id: 'yakusou', count: 4 },
  { id: 'dokukeshi', count: 1 },
  { id: 'phoenix_no_shizuku', count: 1 },
];
