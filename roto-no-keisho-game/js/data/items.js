// 道具データ ― 宝物庫(装備・アイテム設定資料)の消耗品リストをすべて実装
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Items = {
  yakusou: { id: 'yakusou', name: '薬草', kind: 'heal_hp', power: 25, price: 12 },
  jokyu_yakusou: { id: 'jokyu_yakusou', name: '上級薬草', kind: 'heal_hp', power: 60, price: 55 },
  dokukeshi: { id: 'dokukeshi', name: '解毒草', kind: 'cure', cures: ['poison'], price: 10 },
  mezame_no_ha: { id: 'mezame_no_ha', name: 'めざめの葉', kind: 'cure', cures: ['sleep', 'confuse'], price: 15 },
  // 清めの水は「浄める水」として、あらゆる状態異常を洗い流す
  seisui: { id: 'seisui', name: '清めの水', kind: 'cure', cures: ['poison', 'sleep', 'confuse'], price: 18 },
  mahou_no_mi: { id: 'mahou_no_mi', name: '魔法の実', kind: 'heal_mp', power: 8, price: 40 },
  // 次に受ける状態異常を一度だけ防ぐ
  kago_no_gofu: { id: 'kago_no_gofu', name: '加護の護符', kind: 'ward', price: 60 },
  kikan_no_hane: { id: 'kikan_no_hane', name: '帰還の羽根', kind: 'return', price: 30 },
  phoenix_no_shizuku: { id: 'phoenix_no_shizuku', name: 'フェニックスの雫', kind: 'revive', power: 0.5, price: 150 },
  // 使い道は無い。集めて、集める人のところへ持っていくためのもの。
  chiisana_medal: { id: 'chiisana_medal', name: 'ちいさな徽章', kind: 'keepsake', price: 0 },
};

// 初期所持品
Game.Data.START_INVENTORY = [
  { id: 'yakusou', count: 4 },
  { id: 'dokukeshi', count: 1 },
  { id: 'phoenix_no_shizuku', count: 1 },
];
