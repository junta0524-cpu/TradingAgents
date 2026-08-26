// モンスターデータ ― 魔物図鑑(モンスター設定資料)より、東方街道に出現する序盤の面子を抜粋
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Monsters = {
  chibi_slime: { id: 'chibi_slime', name: 'ちびスライム', hp: 5, atk: 3, def: 1, spd: 3, exp: 1, gold: 2 },
  aka_slime: { id: 'aka_slime', name: 'あかスライム', hp: 8, atk: 5, def: 2, spd: 4, exp: 2, gold: 4 },
  hagure_slime: { id: 'hagure_slime', name: 'はぐれスライム', hp: 10, atk: 6, def: 2, spd: 3, exp: 3, gold: 5 },
  nora_goblin: { id: 'nora_goblin', name: '野良ゴブリン', hp: 12, atk: 6, def: 3, spd: 6, exp: 3, gold: 6 },
  araukure_orc: { id: 'araukure_orc', name: '荒くれオーク', hp: 20, atk: 10, def: 5, spd: 4, exp: 6, gold: 12 },
  magarou: { id: 'magarou', name: '牙狼(まがろう)', hp: 14, atk: 8, def: 3, spd: 8, exp: 4, gold: 5 },
  hamigusa: { id: 'hamigusa', name: '喰み草', hp: 11, atk: 5, def: 4, spd: 2, exp: 3, gold: 4 },

  // 第一章・第五章 ボス(魔物図鑑「ボス」参照)
  galoz: {
    id: 'galoz', name: '牙のオーガ将軍ガロズ', boss: true,
    hp: 120, atk: 18, def: 8, spd: 5, exp: 80, gold: 150,
    skills: [{ name: '咆哮', power: 1.4, target: 'all_enemies' }],
  },
};

// 東方街道での出現テーブル(道中は弱め、奥に進むほど強い個体が混ざる想定)
Game.Data.EncounterTable = [
  { id: 'chibi_slime', weight: 5 },
  { id: 'aka_slime', weight: 4 },
  { id: 'hagure_slime', weight: 3 },
  { id: 'nora_goblin', weight: 3 },
  { id: 'magarou', weight: 3 },
  { id: 'hamigusa', weight: 2 },
  { id: 'araukure_orc', weight: 1 },
];
