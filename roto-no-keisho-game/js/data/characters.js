// キャラクターデータ ― 群像譜(キャラ設定資料)・宝物庫(呪文リスト)の数値をゲーム用に落とし込んだもの
//
// ステータスはドラクエに倣って5つ。ちから/みのまもり/すばやさ/まりょく/うんのよさ。
//   ちから      → こうげき力(武器の分を足したもの)
//   みのまもり  → しゅび力(防具の分を足したもの)
//   すばやさ    → 逃走の成否
//   まりょく    → 呪文の威力と回復量(特技は ちから で殴る)
//   うんのよさ  → 状態異常を弾く確率と、かいしんの一撃の出やすさ
// growth はレベルアップ時の伸び。戦士は力と身の守り、賢者は魔力とMP……と伸び方を変えている。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// stat: 'mag' の技は呪文で、まりょくから威力を出す。省略した技は武技で、ちから(こうげき力)で殴る。
// kind:
//   attack   … 攻撃。target が all_enemies なら全体、group なら並んだ数体
//   heal     … 回復。heal_party で味方全体
//   cure     … 状態異常を治す      revive … 生き返らせる
//   guard    … かまえ(その場で発動)
//   buff     … 味方の能力を上げる  debuff … 敵の能力を下げる
//   ailment  … 敵に状態異常をかける
//   field    … 戦闘では使えない、旅の呪文
Game.Data.Skills = {
  // ---- 回復(ロト・セレスティア) ----
  hoimi: { id: 'hoimi', name: 'ホイミ', mp: 3, kind: 'heal', power: 25, stat: 'mag', target: 'one_ally', field: true },
  behoimi: { id: 'behoimi', name: 'ベホイミ', mp: 7, kind: 'heal', power: 70, stat: 'mag', target: 'one_ally', field: true },
  behomara: { id: 'behomara', name: 'ベホマラー', mp: 14, kind: 'heal', power: 55, stat: 'mag', target: 'all_allies', field: true },
  kiari: { id: 'kiari', name: 'キアリー', mp: 2, kind: 'cure', cures: ['poison'], target: 'one_ally', field: true },
  kiaral: { id: 'kiaral', name: 'キアラル', mp: 5, kind: 'cure', cures: ['poison', 'sleep', 'confuse'], target: 'one_ally', field: true },
  zaoral: { id: 'zaoral', name: 'ザオラル', mp: 10, kind: 'revive', power: 0.5, chance: 0.55, target: 'dead_ally', field: true },

  // ---- 攻撃呪文(エルロード) ----
  mera: { id: 'mera', name: 'メラ', mp: 3, kind: 'attack', power: 1.1, stat: 'mag', target: 'one_enemy', element: 'fire' },
  merami: { id: 'merami', name: 'メラミ', mp: 6, kind: 'attack', power: 1.7, stat: 'mag', target: 'one_enemy', element: 'fire' },
  merazoma: { id: 'merazoma', name: 'メラゾーマ', mp: 10, kind: 'attack', power: 2.4, stat: 'mag', target: 'one_enemy', element: 'fire' },
  gira: { id: 'gira', name: 'ギラ', mp: 4, kind: 'attack', power: 0.8, stat: 'mag', target: 'all_enemies', element: 'fire' },
  begiramaa: { id: 'begiramaa', name: 'ベギラマ', mp: 9, kind: 'attack', power: 1.3, stat: 'mag', target: 'all_enemies', element: 'fire' },
  hyado: { id: 'hyado', name: 'ヒャド', mp: 3, kind: 'attack', power: 1.2, stat: 'mag', target: 'one_enemy', element: 'ice' },
  hyadaruko: { id: 'hyadaruko', name: 'ヒャダルコ', mp: 8, kind: 'attack', power: 1.1, stat: 'mag', target: 'all_enemies', element: 'ice' },
  io: { id: 'io', name: 'イオ', mp: 6, kind: 'attack', power: 1.0, stat: 'mag', target: 'all_enemies', element: 'blast' },
  iora: { id: 'iora', name: 'イオラ', mp: 12, kind: 'attack', power: 1.6, stat: 'mag', target: 'all_enemies', element: 'blast' },

  // ---- 攻撃呪文(セレスティア・風と月) ----
  bagi: { id: 'bagi', name: 'バギ', mp: 4, kind: 'attack', power: 0.9, stat: 'mag', target: 'all_enemies', element: 'wind' },
  bagima: { id: 'bagima', name: 'バギマ', mp: 9, kind: 'attack', power: 1.4, stat: 'mag', target: 'all_enemies', element: 'wind' },

  // ---- 攻撃呪文(ロト・光) ----
  dein: { id: 'dein', name: 'デイン', mp: 8, kind: 'attack', power: 1.8, stat: 'mag', target: 'one_enemy', element: 'light' },
  raidein: { id: 'raidein', name: 'ライデイン', mp: 15, kind: 'attack', power: 2.2, stat: 'mag', target: 'all_enemies', element: 'light' },

  // ---- 補助 ----
  sukara: { id: 'sukara', name: 'スカラ', mp: 3, kind: 'buff', stat_key: 'def', mul: 1.6, target: 'one_ally' },
  baikiruto: { id: 'baikiruto', name: 'バイキルト', mp: 6, kind: 'buff', stat_key: 'atk', mul: 1.5, target: 'one_ally' },
  piorimu: { id: 'piorimu', name: 'ピオリム', mp: 4, kind: 'buff', stat_key: 'spd', mul: 1.8, target: 'all_allies' },

  // ---- 弱体 ----
  rukani: { id: 'rukani', name: 'ルカニ', mp: 4, kind: 'debuff', stat_key: 'def', mul: 0.55, target: 'one_enemy' },
  bomiosu: { id: 'bomiosu', name: 'ボミオス', mp: 4, kind: 'debuff', stat_key: 'spd', mul: 0.5, target: 'all_enemies' },
  rariho: { id: 'rariho', name: 'ラリホー', mp: 4, kind: 'ailment', ailment: 'sleep', chance: 0.6, target: 'one_enemy' },
  manusa: { id: 'manusa', name: 'マヌーサ', mp: 5, kind: 'ailment', ailment: 'blind', chance: 0.65, target: 'one_enemy' },
  medapani: { id: 'medapani', name: 'メダパニ', mp: 8, kind: 'ailment', ailment: 'confuse', chance: 0.5, target: 'one_enemy' },

  // ---- 旅の呪文(戦闘では使えない) ----
  riremito: { id: 'riremito', name: 'リレミト', mp: 8, kind: 'field', effect: 'exit', target: 'self', field: true, fieldOnly: true },
  toherosu: { id: 'toherosu', name: 'トヘロス', mp: 6, kind: 'field', effect: 'ward_steps', power: 120, target: 'self', field: true, fieldOnly: true },

  // ---- 武技(呪文ではないので まりょく を使わない) ----
  nagiharai: { id: 'nagiharai', name: 'なぎ払い', mp: 3, kind: 'attack', power: 1.3, target: 'all_enemies' },
  ukenagashi: { id: 'ukenagashi', name: '受け流し', mp: 0, kind: 'guard', target: 'self', reduction: 0.5 },
  getsuko_no_ya: { id: 'getsuko_no_ya', name: '月光の矢', mp: 4, kind: 'attack', power: 1.3, target: 'one_enemy', element: 'light' },
  mangetsu_no_ichiya: { id: 'mangetsu_no_ichiya', name: '満月の一矢', mp: 10, kind: 'attack', power: 2.0, target: 'one_enemy', element: 'light' },
  garai_nagiharai: { id: 'garai_nagiharai', name: 'なぎ払い斬り', mp: 0, kind: 'attack', power: 0.9, target: 'all_enemies' },
  chikai_no_ichigeki: { id: 'chikai_no_ichigeki', name: '誓約の一撃', mp: 8, kind: 'attack', power: 1.6, target: 'one_enemy' },
};

Game.Data.Characters = {
  rota: {
    id: 'rota', tokenColor: '#d4af5a', name: 'ロト', title: '流浪の王',
    level: 1, exp: 0, expToNext: 12,
    hp: 28, maxHp: 28, mp: 4, maxMp: 4,
    atk: 12, def: 8, spd: 9, mag: 6, luck: 8,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '王の一閃', power: 2.6, stat: 'atk' },
    growth: { hp: 7, mp: 2, atk: 2, def: 2, spd: 1, mag: 1, luck: 1 },
    equipKinds: ['sword', 'armor', 'shield', 'helmet', 'accessory'],
    equip: { weapon: 'copper_sword', armor: 'cloth_robe' },
    // level はその技を覚えるレベル。上がるたびに「〜を おぼえた!」と告げる
    skills: [
      { id: 'ukenagashi', level: 1 },
      { id: 'hoimi', level: 2 },
      { id: 'kiari', level: 4 },
      { id: 'nagiharai', level: 6 },
      { id: 'behoimi', level: 9 },
      { id: 'dein', level: 12 },
      { id: 'zaoral', level: 15 },
      { id: 'behomara', level: 18 },
      { id: 'raidein', level: 22 },
    ],
  },
  elrode: {
    id: 'elrode', tokenColor: '#7fb0c2', name: 'エルロード', title: '蒼穹の賢者',
    level: 3, exp: 0, expToNext: 22,
    hp: 20, maxHp: 20, mp: 12, maxMp: 12,
    atk: 8, def: 5, spd: 7, mag: 16, luck: 6,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '蒼穹の裂け目', power: 1.5, stat: 'mag', target: 'all_enemies', element: 'io' },
    growth: { hp: 4, mp: 4, atk: 1, def: 1, spd: 1, mag: 3, luck: 1 },
    equipKinds: ['staff', 'armor', 'accessory'],
    equip: { weapon: 'silver_staff', armor: 'cloth_robe' },
    skills: [
      { id: 'mera', level: 1 },
      { id: 'rukani', level: 3 },
      { id: 'gira', level: 5 },
      { id: 'rariho', level: 6 },
      { id: 'hyado', level: 8 },
      { id: 'merami', level: 9 },
      { id: 'riremito', level: 10 },
      { id: 'manusa', level: 11 },
      { id: 'io', level: 13 },
      { id: 'begiramaa', level: 14 },
      { id: 'toherosu', level: 15 },
      { id: 'hyadaruko', level: 16 },
      { id: 'merazoma', level: 18 },
      { id: 'medapani', level: 20 },
      { id: 'iora', level: 23 },
    ],
  },
  celestia: {
    id: 'celestia', tokenColor: '#cfd6e6', name: 'セレスティア', title: '月衆の乙女',
    level: 3, exp: 0, expToNext: 22,
    hp: 24, maxHp: 24, mp: 8, maxMp: 8,
    atk: 12, def: 6, spd: 12, mag: 10, luck: 12,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '月を射抜く', power: 2.4, stat: 'atk', element: 'light' },
    growth: { hp: 5, mp: 3, atk: 2, def: 1, spd: 3, mag: 2, luck: 2 },
    equipKinds: ['bow', 'armor', 'helmet', 'accessory'],
    equip: { weapon: 'steel_bow', armor: 'leather_armor' },
    skills: [
      { id: 'getsuko_no_ya', level: 1 },
      { id: 'bagi', level: 4 },
      { id: 'piorimu', level: 6 },
      { id: 'kiaral', level: 8 },
      { id: 'mangetsu_no_ichiya', level: 9 },
      { id: 'bomiosu', level: 11 },
      { id: 'bagima', level: 14 },
      { id: 'behoimi', level: 17 },
    ],
  },
  garai: {
    id: 'garai', tokenColor: '#b08d6a', name: 'ガライ将軍', title: '牙を折った将',
    level: 5, exp: 0, expToNext: 41,
    hp: 46, maxHp: 46, mp: 12, maxMp: 12,
    atk: 15, def: 13, spd: 5, mag: 4, luck: 5,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '牙折りの一太刀', power: 2.9, stat: 'atk' },
    growth: { hp: 9, mp: 1, atk: 3, def: 3, spd: 1, mag: 0, luck: 1 },
    equipKinds: ['greatsword', 'armor', 'shield', 'helmet', 'accessory'],
    equip: { weapon: 'steel_greatsword', armor: 'chainmail', helmet: 'iron_helm' },
    skills: [
      { id: 'garai_nagiharai', level: 1 },
      { id: 'sukara', level: 3 },
      { id: 'chikai_no_ichigeki', level: 7 },
      { id: 'baikiruto', level: 12 },
    ],
  },
};

// ゲーム開始時点のパーティ(以降 Game.Party.recruit() で仲間が増える)
Game.Data.PARTY_ORDER = ['rota'];
