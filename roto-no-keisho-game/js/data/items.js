// 道具データ ― 宝物庫(装備・アイテム設定資料)の消耗品リストより抜粋
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Items = {
  yakusou: { id: 'yakusou', name: 'やくそう', kind: 'heal_hp', power: 25, desc: 'HPを少し回復する', price: 12 },
  dokukeshi: { id: 'dokukeshi', name: 'どくけし草', kind: 'cure', status: 'poison', desc: '毒を治す', price: 10 },
};

// 初期所持品
Game.Data.START_INVENTORY = [
  { id: 'yakusou', count: 3 },
  { id: 'dokukeshi', count: 1 },
];
