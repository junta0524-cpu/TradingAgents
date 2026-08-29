// 装備データ ― 宝物庫(装備・アイテム設定資料)の武器・防具・装飾品をゲーム用に落とし込んだもの。
// kind は「誰が装備できるか」の区分。キャラクターごとの equipKinds と突き合わせて判定する。
// 補正値は atk=こうげき / def=しゅび / spd=すばやさ / mag=まりょく / luck=うんのよさ。
// 杖は殴る力こそ乏しいが まりょく が大きく伸びる ―― 賢者は杖で戦うのではなく、杖で唱える。
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Equipment = {
  // ---- 剣(ロト)----
  copper_sword: { id: 'copper_sword', name: '銅の剣', slot: 'weapon', kind: 'sword', atk: 8, price: 120 },
  iron_sword: { id: 'iron_sword', name: '鉄の剣', slot: 'weapon', kind: 'sword', atk: 18, price: 450 },
  steel_sword: { id: 'steel_sword', name: '鋼の剣', slot: 'weapon', kind: 'sword', atk: 32, price: 1200 },
  dragon_slayer: { id: 'dragon_slayer', name: '竜殺しの剣', slot: 'weapon', kind: 'sword', atk: 50, price: 3000 },
  roto_sword: { id: 'roto_sword', name: 'ロトの剣', slot: 'weapon', kind: 'sword', atk: 72, price: 0, story: true },

  // ---- 大剣(ガライ)----
  iron_greatsword: { id: 'iron_greatsword', name: '鉄の大剣', slot: 'weapon', kind: 'greatsword', atk: 20, price: 500 },
  steel_greatsword: { id: 'steel_greatsword', name: '鋼の大剣', slot: 'weapon', kind: 'greatsword', atk: 38, price: 1400 },
  fangbreaker: { id: 'fangbreaker', name: '竜牙砕きの大剣', slot: 'weapon', kind: 'greatsword', atk: 58, price: 3500 },
  oathkeeper: { id: 'oathkeeper', name: '誓約の剣', slot: 'weapon', kind: 'greatsword', atk: 82, price: 0, story: true },

  // ---- 杖(エルロード)----
  wood_staff: { id: 'wood_staff', name: '木の杖', slot: 'weapon', kind: 'staff', atk: 4, mag: 6, price: 100 },
  silver_staff: { id: 'silver_staff', name: '銀の杖', slot: 'weapon', kind: 'staff', atk: 8, mag: 14, price: 600 },
  sage_staff: { id: 'sage_staff', name: '賢者の杖', slot: 'weapon', kind: 'staff', atk: 14, mag: 28, price: 1800 },
  azure_staff: { id: 'azure_staff', name: '蒼穹の杖', slot: 'weapon', kind: 'staff', atk: 22, mag: 46, price: 0, story: true },

  // ---- 弓(セレスティア)----
  wood_bow: { id: 'wood_bow', name: '木の弓', slot: 'weapon', kind: 'bow', atk: 10, price: 150 },
  steel_bow: { id: 'steel_bow', name: '鋼の弓', slot: 'weapon', kind: 'bow', atk: 25, price: 700 },
  falcon_bow: { id: 'falcon_bow', name: '隼羽の弓', slot: 'weapon', kind: 'bow', atk: 40, price: 2000 },
  moon_bow: { id: 'moon_bow', name: '月の弓', slot: 'weapon', kind: 'bow', atk: 65, mag: 10, luck: 6, price: 0, story: true },

  // ---- よろい(全員)----
  cloth_robe: { id: 'cloth_robe', name: '布の服', slot: 'armor', kind: 'armor', def: 4, mag: 2, price: 80 },
  leather_armor: { id: 'leather_armor', name: '革の鎧', slot: 'armor', kind: 'armor', def: 10, price: 300 },
  chainmail: { id: 'chainmail', name: '鎖帷子', slot: 'armor', kind: 'armor', def: 18, price: 800 },
  steel_armor: { id: 'steel_armor', name: '鋼の鎧', slot: 'armor', kind: 'armor', def: 30, price: 2200 },
  silver_armor: { id: 'silver_armor', name: '白銀の鎧', slot: 'armor', kind: 'armor', def: 42, luck: 6, price: 0, story: true },

  // ---- 盾 ----
  wood_shield: { id: 'wood_shield', name: '木の盾', slot: 'shield', kind: 'shield', def: 4, price: 100 },
  iron_shield: { id: 'iron_shield', name: '鉄の盾', slot: 'shield', kind: 'shield', def: 10, price: 500 },
  steel_shield: { id: 'steel_shield', name: '鋼の盾', slot: 'shield', kind: 'shield', def: 18, price: 1500 },
  roto_shield: { id: 'roto_shield', name: 'ロトの盾', slot: 'shield', kind: 'shield', def: 32, luck: 8, price: 0, story: true },

  // ---- 兜 ----
  leather_helm: { id: 'leather_helm', name: '革の兜', slot: 'helmet', kind: 'helmet', def: 3, price: 80 },
  iron_helm: { id: 'iron_helm', name: '鉄の兜', slot: 'helmet', kind: 'helmet', def: 8, price: 400 },
  steel_helm: { id: 'steel_helm', name: '鋼の兜', slot: 'helmet', kind: 'helmet', def: 14, price: 1200 },

  // ---- 装飾品 ----
  power_ring: { id: 'power_ring', name: '力の指輪', slot: 'accessory', kind: 'accessory', atk: 8, price: 900 },
  swift_necklace: { id: 'swift_necklace', name: '素早さの首飾り', slot: 'accessory', kind: 'accessory', spd: 10, luck: 3, price: 900 },
  spirit_earring: { id: 'spirit_earring', name: '精神の耳飾り', slot: 'accessory', kind: 'accessory', def: 6, mag: 8, price: 1100 },
  moonlight_brooch: { id: 'moonlight_brooch', name: '月光のブローチ', slot: 'accessory', kind: 'accessory', def: 8, luck: 10, price: 1400 },
  sage_glasses: { id: 'sage_glasses', name: '賢者のメガネ', slot: 'accessory', kind: 'accessory', def: 3, mag: 12, price: 1300 },

  // ---- 呪われた品 ----
  // どれも同じ格の装備より強い。そのかわり、身につけたら自分では外せない。
  // 解けるのは教会だけで、解いた品は そのまま朽ちて消える。
  // 「強いが、代償がある」を装備選びの中に置くためのもの。
  cursed_blade: {
    id: 'cursed_blade', name: '呪われた剣', slot: 'weapon', kind: 'sword',
    atk: 62, def: -12, luck: -12, price: 0, cursed: true,
    curse: '柄を握った瞬間、手が離れなくなった!',
  },
  shinigami_ring: {
    id: 'shinigami_ring', name: '死神の指輪', slot: 'accessory', kind: 'accessory',
    atk: 14, mag: 16, spd: 8, def: -10, luck: -20, price: 0, cursed: true,
    curse: '指輪が 骨まで 食い込んでくる!',
  },
};

// 装備が伸ばせるステータスと、画面に出すときの短い表記
Game.Data.GEAR_STATS = [
  { key: 'atk', label: '攻' }, { key: 'def', label: '守' }, { key: 'spd', label: '速' },
  { key: 'mag', label: '魔' }, { key: 'luck', label: '運' },
];

Game.Data.EQUIP_SLOTS = ['weapon', 'armor', 'shield', 'helmet', 'accessory'];
Game.Data.SLOT_LABELS = {
  weapon: 'ぶき', armor: 'よろい', shield: 'たて', helmet: 'かぶと', accessory: 'そうしょくひん',
};
