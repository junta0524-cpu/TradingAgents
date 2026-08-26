// キャラクターデータ ― 群像譜(キャラ設定資料)・宝物庫(呪文リスト)の数値をゲーム用に落とし込んだもの
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Skills = {
  // ロト
  nagiharai: { id: 'nagiharai', name: 'なぎ払い', mp: 3, kind: 'attack', power: 1.3, target: 'all_enemies' },
  ukenagashi: { id: 'ukenagashi', name: '受け流し', mp: 0, kind: 'guard' },
  kanni_kaifuku: { id: 'kanni_kaifuku', name: 'ホイミ(簡易)', mp: 4, kind: 'heal', power: 18, target: 'one_ally' },
  // エルロード
  mera: { id: 'mera', name: 'メラ', mp: 3, kind: 'attack', power: 1.1, target: 'one_enemy' },
  merazoma: { id: 'merazoma', name: 'メラゾーマ', mp: 10, kind: 'attack', power: 2.0, target: 'one_enemy' },
  // セレスティア
  getsuko_no_ya: { id: 'getsuko_no_ya', name: '月光の矢', mp: 4, kind: 'attack', power: 1.3, target: 'one_enemy' },
  mangetsu_no_ichiya: { id: 'mangetsu_no_ichiya', name: '満月の一矢', mp: 10, kind: 'attack', power: 2.0, target: 'one_enemy' },
  // ガライ
  garai_nagiharai: { id: 'garai_nagiharai', name: 'なぎ払い斬り', mp: 0, kind: 'attack', power: 0.9, target: 'all_enemies' },
  chikai_no_ichigeki: { id: 'chikai_no_ichigeki', name: '誓約の一撃', mp: 8, kind: 'attack', power: 1.6, target: 'one_enemy' },
};

Game.Data.Characters = {
  rota: {
    id: 'rota', name: 'ロト', title: '流浪の王',
    level: 1, exp: 0, expToNext: 12,
    hp: 28, maxHp: 28, mp: 4, maxMp: 4,
    atk: 12, def: 8, spd: 9,
    weapon: '銅の剣',
    skills: ['nagiharai', 'ukenagashi', 'kanni_kaifuku'],
  },
  elrode: {
    id: 'elrode', name: 'エルロード', title: '蒼穹の賢者',
    level: 3, exp: 0, expToNext: 22,
    hp: 20, maxHp: 20, mp: 12, maxMp: 12,
    atk: 8, def: 5, spd: 7,
    weapon: '銀の杖',
    skills: ['mera', 'merazoma'],
  },
  celestia: {
    id: 'celestia', name: 'セレスティア', title: '月衆の乙女',
    level: 3, exp: 0, expToNext: 22,
    hp: 24, maxHp: 24, mp: 8, maxMp: 8,
    atk: 12, def: 6, spd: 12,
    weapon: '鋼の弓',
    skills: ['getsuko_no_ya', 'mangetsu_no_ichiya'],
  },
  garai: {
    id: 'garai', name: 'ガライ将軍', title: '牙を折った将',
    level: 5, exp: 0, expToNext: 41,
    hp: 46, maxHp: 46, mp: 0, maxMp: 0,
    atk: 15, def: 13, spd: 5,
    weapon: '鋼の大剣',
    skills: ['garai_nagiharai', 'chikai_no_ichigeki'],
  },
};

// ゲーム開始時点のパーティ(以降 Game.Party.recruit() で仲間が増える)
Game.Data.PARTY_ORDER = ['rota'];
