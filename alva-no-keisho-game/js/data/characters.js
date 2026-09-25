// キャラクターデータ ― 群像譜(キャラ設定資料)・宝物庫(呪文リスト)の数値をゲーム用に落とし込んだもの
//
// ステータスはこの手のRPGに倣って5つ。ちから/みのまもり/すばやさ/まりょく/うんのよさ。
//   ちから      → こうげき力(武器の分を足したもの)
//   みのまもり  → しゅび力(防具の分を足したもの)
//   すばやさ    → 逃走の成否
//   まりょく    → 呪文の威力と回復量(特技は ちから で殴る)
//   うんのよさ  → 状態異常を弾く確率と、渾身の一撃の出やすさ
// growth はレベルアップ時の伸び。戦士は力と身の守り、賢者は魔力とMP……と伸び方を変えている。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// stat: 'mag' の技は呪文で、まりょくから威力を出す。省略した技は武技で、ちから(こうげき力)で殴る。
// kind:
//   attack   … 攻撃。target が all_enemies なら全体
//   heal     … 回復。heal_party で味方全体
//   cure     … 状態異常を治す      revive … 生き返らせる
//   guard    … かまえ(その場で発動)
//   buff     … 味方の能力を上げる  debuff … 敵の能力を下げる
//   ailment  … 敵に状態異常をかける
//   field    … 戦闘では使えない、旅の呪文
Game.Data.Skills = {
  // ---- 回復(アルヴァ・セレスティア) ----
  mina: { id: 'mina', name: 'ミナ', mp: 3, kind: 'heal', power: 25, stat: 'mag', target: 'one_ally', field: true },
  minara: { id: 'minara', name: 'ミナラ', mp: 7, kind: 'heal', power: 70, stat: 'mag', target: 'one_ally', field: true },
  minarea: { id: 'minarea', name: 'ミナレア', mp: 14, kind: 'heal', power: 55, stat: 'mag', target: 'all_allies', field: true },
  seina: { id: 'seina', name: 'セイナ', mp: 2, kind: 'cure', cures: ['poison'], target: 'one_ally', field: true },
  seinaru: { id: 'seinaru', name: 'セイナル', mp: 5, kind: 'cure', cures: ['poison', 'sleep', 'confuse'], target: 'one_ally', field: true },
  rival: { id: 'rival', name: 'リヴァル', mp: 10, kind: 'revive', power: 0.5, chance: 0.55, target: 'dead_ally', field: true },

  // ---- 攻撃呪文(エルロード) ----
  fol: { id: 'fol', name: 'フォル', mp: 3, kind: 'attack', power: 1.1, stat: 'mag', target: 'one_enemy', element: 'fire' },
  folga: { id: 'folga', name: 'フォルガ', mp: 6, kind: 'attack', power: 1.7, stat: 'mag', target: 'one_enemy', element: 'fire' },
  folgon: { id: 'folgon', name: 'フォルゴン', mp: 10, kind: 'attack', power: 2.4, stat: 'mag', target: 'one_enemy', element: 'fire' },
  igna: { id: 'igna', name: 'イグナ', mp: 4, kind: 'attack', power: 0.8, stat: 'mag', target: 'all_enemies', element: 'fire' },
  ignas: { id: 'ignas', name: 'イグナス', mp: 9, kind: 'attack', power: 1.3, stat: 'mag', target: 'all_enemies', element: 'fire' },
  seed: { id: 'seed', name: 'シード', mp: 3, kind: 'attack', power: 1.2, stat: 'mag', target: 'one_enemy', element: 'ice' },
  seedal: { id: 'seedal', name: 'シーダル', mp: 8, kind: 'attack', power: 1.1, stat: 'mag', target: 'all_enemies', element: 'ice' },
  rau: { id: 'rau', name: 'ラウ', mp: 6, kind: 'attack', power: 1.0, stat: 'mag', target: 'all_enemies', element: 'blast' },
  rauga: { id: 'rauga', name: 'ラウガ', mp: 12, kind: 'attack', power: 1.6, stat: 'mag', target: 'all_enemies', element: 'blast' },

  // ---- 攻撃呪文(セレスティア・風と月) ----
  vim: { id: 'vim', name: 'ヴィム', mp: 4, kind: 'attack', power: 0.9, stat: 'mag', target: 'all_enemies', element: 'wind' },
  vima: { id: 'vima', name: 'ヴィマ', mp: 9, kind: 'attack', power: 1.4, stat: 'mag', target: 'all_enemies', element: 'wind' },

  // ---- 攻撃呪文(アルヴァ・光) ----
  lux: { id: 'lux', name: 'ルクス', mp: 8, kind: 'attack', power: 1.8, stat: 'mag', target: 'one_enemy', element: 'light' },
  luxor: { id: 'luxor', name: 'ルクサー', mp: 15, kind: 'attack', power: 2.2, stat: 'mag', target: 'all_enemies', element: 'light' },

  // ---- 補助 ----
  telm: { id: 'telm', name: 'テルム', mp: 3, kind: 'buff', stat_key: 'def', mul: 1.6, target: 'one_ally' },
  axebuff: { id: 'axebuff', name: 'アクス', mp: 6, kind: 'buff', stat_key: 'atk', mul: 1.5, target: 'one_ally' },
  selta: { id: 'selta', name: 'セルタ', mp: 4, kind: 'buff', stat_key: 'spd', mul: 1.8, target: 'all_allies' },

  // ---- 弱体 ----
  fragi: { id: 'fragi', name: 'フラギ', mp: 4, kind: 'debuff', stat_key: 'def', mul: 0.55, target: 'one_enemy' },
  toldo: { id: 'toldo', name: 'トルド', mp: 4, kind: 'debuff', stat_key: 'spd', mul: 0.5, target: 'all_enemies' },
  nox: { id: 'nox', name: 'ノクス', mp: 4, kind: 'ailment', ailment: 'sleep', chance: 0.6, target: 'one_enemy' },
  miras: { id: 'miras', name: 'ミラス', mp: 5, kind: 'ailment', ailment: 'blind', chance: 0.65, target: 'one_enemy' },
  vani: { id: 'vani', name: 'ヴァニ', mp: 8, kind: 'ailment', ailment: 'confuse', chance: 0.5, target: 'one_enemy' },

  // ---- 旅の呪文(戦闘では使えない) ----
  exce: { id: 'exce', name: 'エクセ', mp: 8, kind: 'field', effect: 'exit', target: 'self', field: true, fieldOnly: true },
  sankt: { id: 'sankt', name: 'サンクト', mp: 6, kind: 'field', effect: 'ward_steps', power: 120, target: 'self', field: true, fieldOnly: true },
  // 一度訪れた町へ ひとっとび。洞窟や塔の中では 天井に頭をぶつける
  riga: { id: 'riga', name: 'リガル', mp: 6, kind: 'field', effect: 'warp', target: 'self', field: true, fieldOnly: true },

  // ---- 武技(呪文ではないので まりょく を使わない) ----
  nagiharai: { id: 'nagiharai', name: 'なぎ払い', mp: 3, kind: 'attack', power: 1.3, target: 'all_enemies' },
  ukenagashi: { id: 'ukenagashi', name: '受け流し', mp: 0, kind: 'guard', target: 'self', reduction: 0.5 },
  getsuko_no_ya: { id: 'getsuko_no_ya', name: '月光の矢', mp: 4, kind: 'attack', power: 1.3, target: 'one_enemy', element: 'light' },
  mangetsu_no_ichiya: { id: 'mangetsu_no_ichiya', name: '満月の一矢', mp: 10, kind: 'attack', power: 2.0, target: 'one_enemy', element: 'light' },
  balga_nagiharai: { id: 'balga_nagiharai', name: 'なぎ払い斬り', mp: 0, kind: 'attack', power: 0.9, target: 'all_enemies' },
  chikai_no_ichigeki: { id: 'chikai_no_ichigeki', name: '誓約の一撃', mp: 8, kind: 'attack', power: 1.6, target: 'one_enemy' },

  // ---- 職の技(さだめの祠で就いた職の ★で覚える) ----
  // つるぎ士
  makko_giri: { id: 'makko_giri', name: 'まっこう斬り', mp: 2, kind: 'attack', power: 1.5, target: 'one_enemy' },
  susobarai: { id: 'susobarai', name: 'すそ払い', mp: 3, kind: 'attack', power: 0.9, target: 'all_enemies' },
  tatakkiri: { id: 'tatakkiri', name: 'たたっ斬り', mp: 6, kind: 'attack', power: 2.0, target: 'one_enemy' },
  tsurugi_no_mai: { id: 'tsurugi_no_mai', name: 'つるぎの舞', mp: 8, kind: 'attack', power: 1.3, target: 'all_enemies' },
  // こぶし士
  mawashigeri: { id: 'mawashigeri', name: 'まわし蹴り', mp: 2, kind: 'attack', power: 0.7, target: 'all_enemies' },
  seiken_zuki: { id: 'seiken_zuki', name: 'せいけん突き', mp: 4, kind: 'attack', power: 1.8, target: 'one_enemy' },
  bakuretsu_ken: { id: 'bakuretsu_ken', name: 'ばくれつ拳', mp: 6, kind: 'attack', power: 1.2, target: 'all_enemies' },
  // まほろば剣士 ― 剣に 属性を 乗せる
  homura_giri: { id: 'homura_giri', name: 'ほむら斬り', mp: 4, kind: 'attack', power: 1.5, target: 'one_enemy', element: 'fire' },
  kori_giri: { id: 'kori_giri', name: 'こおり斬り', mp: 4, kind: 'attack', power: 1.5, target: 'one_enemy', element: 'ice' },
  kamaitachi_giri: { id: 'kamaitachi_giri', name: 'かまいたち斬り', mp: 6, kind: 'attack', power: 1.0, target: 'all_enemies', element: 'wind' },
  mahoroba_issen: { id: 'mahoroba_issen', name: 'まほろば一閃', mp: 10, kind: 'attack', power: 2.4, target: 'one_enemy', element: 'light' },
};

Game.Data.Characters = {
  alva: {
    id: 'alva', tokenColor: '#d4af5a', name: 'アルヴァ', title: '流浪の王',
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
      { id: 'mina', level: 2 },
      { id: 'seina', level: 4 },
      { id: 'nagiharai', level: 6 },
      { id: 'riga', level: 7 },
      { id: 'minara', level: 9 },
      { id: 'lux', level: 12 },
      { id: 'rival', level: 15 },
      { id: 'minarea', level: 18 },
      { id: 'luxor', level: 22 },
    ],
  },
  elrode: {
    id: 'elrode', tokenColor: '#7fb0c2', name: 'エルロード', title: '蒼穹の賢者',
    level: 3, exp: 0, expToNext: 22,
    hp: 20, maxHp: 20, mp: 12, maxMp: 12,
    atk: 8, def: 5, spd: 7, mag: 16, luck: 6,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '蒼穹の裂け目', power: 1.5, stat: 'mag', target: 'all_enemies', element: 'rau' },
    growth: { hp: 4, mp: 4, atk: 1, def: 1, spd: 1, mag: 3, luck: 1 },
    equipKinds: ['staff', 'armor', 'accessory'],
    equip: { weapon: 'silver_staff', armor: 'cloth_robe' },
    skills: [
      { id: 'fol', level: 1 },
      { id: 'fragi', level: 3 },
      { id: 'igna', level: 5 },
      { id: 'nox', level: 6 },
      { id: 'seed', level: 8 },
      { id: 'folga', level: 9 },
      { id: 'exce', level: 10 },
      { id: 'miras', level: 11 },
      { id: 'rau', level: 13 },
      { id: 'ignas', level: 14 },
      { id: 'sankt', level: 15 },
      { id: 'seedal', level: 16 },
      { id: 'folgon', level: 18 },
      { id: 'vani', level: 20 },
      { id: 'rauga', level: 23 },
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
      { id: 'vim', level: 4 },
      { id: 'selta', level: 6 },
      { id: 'seinaru', level: 8 },
      { id: 'mangetsu_no_ichiya', level: 9 },
      { id: 'toldo', level: 11 },
      { id: 'vima', level: 14 },
      { id: 'minara', level: 17 },
    ],
  },
  balga: {
    id: 'balga', tokenColor: '#b08d6a', name: 'バルガ将軍', title: '牙を折った将',
    level: 5, exp: 0, expToNext: 41,
    hp: 46, maxHp: 46, mp: 12, maxMp: 12,
    atk: 15, def: 13, spd: 5, mag: 4, luck: 5,
    // 猛りが満ちたときに撃てる、そのひとの一撃
    limit: { name: '牙折りの一太刀', power: 2.9, stat: 'atk' },
    growth: { hp: 9, mp: 1, atk: 3, def: 3, spd: 1, mag: 0, luck: 1 },
    equipKinds: ['greatsword', 'armor', 'shield', 'helmet', 'accessory'],
    equip: { weapon: 'steel_greatsword', armor: 'chainmail', helmet: 'iron_helm' },
    skills: [
      { id: 'balga_nagiharai', level: 1 },
      { id: 'telm', level: 3 },
      { id: 'chikai_no_ichigeki', level: 7 },
      { id: 'axebuff', level: 12 },
    ],
  },
};

// ゲーム開始時点のパーティ(以降 Game.Party.recruit() で仲間が増える)
Game.Data.PARTY_ORDER = ['alva'];
