// モンスターデータ ― 魔物図鑑(全60種)をゲーム用ステータスに変換したもの。
// 雑魚は「序盤/中盤/終盤」の階層(魔物図鑑の tier 表記)ごとに基準値を決め、
// 個体ごとに多少の凹凸を付けている。ボスのみ個別にステータス・特技を定義。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// 通しプレイで手に入る金が1550Gしかなく、店の主力(鋼の剣1200G・鋼の鎧2200G)に
// まったく届いていなかったので、取り分を約2.5倍に引き上げてある。
// 経験値も同じ比率で上げ、レベルの伸びが装備更新に追いつくようにした。
function tierBase(tier) {
  if (tier === 'early') return { hp: 9, atk: 4, def: 2, spd: 4, exp: 5, gold: 15 };
  if (tier === 'mid') return { hp: 20, atk: 9, def: 5, spd: 6, exp: 15, gold: 45 };
  return { hp: 34, atk: 17, def: 9, spd: 8, exp: 32, gold: 100 }; // late
}
function mon(id, name, tier, loc, over) {
  var b = tierBase(tier);
  var m = { id: id, name: name, tier: tier, loc: loc };
  for (var k in b) m[k] = b[k];
  if (over) for (var k2 in over) m[k2] = over[k2];
  return m;
}


// ---- 種族ごとの効き方 ----
// 魔物図鑑の9系統に、属性の通り方と状態異常への強さを持たせる。
// 1.0 が等倍。1.5 で弱点、0.5 で耐性、0 なら効かない。
// physical は 通常攻撃と武技(属性を持たない技)にかかる。
Game.Data.Families = {
  slime:    { name: 'スライム系',   physical: 1.0, fire: 1.2, ice: 1.0, blast: 1.3, wind: 1.0, light: 1.0, ailment: 1.2 },
  remnant:  { name: '竜王軍残党系', physical: 1.0, fire: 1.0, ice: 1.0, blast: 1.0, wind: 1.2, light: 1.2, ailment: 1.0 },
  beast:    { name: '魔獣系',       physical: 1.0, fire: 1.3, ice: 1.0, blast: 1.0, wind: 1.0, light: 1.0, ailment: 1.1 },
  plant:    { name: '植物系',       physical: 0.8, fire: 1.8, ice: 1.2, blast: 1.0, wind: 0.6, light: 1.0, ailment: 1.3 },
  sky:      { name: '空中系',       physical: 0.9, fire: 1.0, ice: 1.2, blast: 1.0, wind: 1.6, light: 1.0, ailment: 1.0 },
  undead:   { name: 'アンデッド系', physical: 1.0, fire: 1.2, ice: 0.7, blast: 1.0, wind: 1.0, light: 1.8, ailment: 0.4 },
  demon:    { name: '悪魔系',       physical: 1.0, fire: 0.8, ice: 1.0, blast: 1.0, wind: 1.0, light: 1.7, ailment: 0.7 },
  deep:     { name: '深海系',       physical: 1.0, fire: 0.5, ice: 1.5, blast: 1.2, wind: 1.0, light: 1.0, ailment: 1.0 },
  ancient:  { name: '古代文明系',   physical: 0.6, fire: 0.8, ice: 0.8, blast: 1.4, wind: 0.8, light: 1.0, ailment: 0.3 },
};

// 属性と種族から倍率を引く。分からない組み合わせは等倍にしておく。
Game.Data.resistanceOf = function (monster, element) {
  var fam = Game.Data.Families[monster && monster.family];
  if (!fam) return 1;
  var key = element || 'physical';
  return fam[key] === undefined ? 1 : fam[key];
};

var M = {};
function add(id, name, tier, loc, over) { M[id] = mon(id, name, tier, loc, over); }

// ---- スライム系 ----
add('chibi_slime', 'ちびスライム', 'early', ['east_road', 'azure_plain', 'cliff_road'], { hp: 5, atk: 3, family: 'slime' });
add('aka_slime', 'あかスライム', 'early', ['east_road'], { hp: 8, atk: 5, inflict: { status: 'confuse', chance: 0.12 }, family: 'slime' });
add('hagure_slime', 'はぐれスライム', 'early', ['ogre_camp'], { hp: 10, atk: 6, family: 'slime' });
add('king_slime_kakera', 'キングスライムの欠片', 'mid', ['cliff_road'], { hp: 24, family: 'slime' });
add('hane_slime', 'はねスライム', 'mid', ['east_road', 'azure_plain', 'cliff_road'], { hp: 10, exp: 30, gold: 50, family: 'slime' });
add('hedoro_slime', 'ヘドロスライム', 'mid', ['abyss_depth'], { inflict: { status: 'poison', chance: 0.3 }, family: 'slime' });

// ---- 竜王軍残党系 ----
add('nora_goblin', '野良ゴブリン', 'early', ['east_road'], { hp: 12, atk: 6, spd: 6, family: 'remnant' });
add('araukure_orc', '荒くれオーク', 'early', ['ogre_camp'], { hp: 20, atk: 10, def: 5, family: 'remnant' });
add('sekigan_ogre', '隻眼オーガ兵', 'early', ['ogre_camp'], { hp: 22, atk: 11, family: 'remnant' });
add('ryuuga_kyousenshi', '竜牙の狂戦士', 'mid', ['east_road'], { family: 'remnant' });
add('kuzureta_gunba', '崩れた軍馬', 'mid', ['east_road'], { family: 'remnant' });
add('zantou_kyuuhei', '残党の弓兵', 'mid', ['east_road'], { family: 'remnant' });

// ---- 魔獣系 ----
add('magarou', '牙狼(まがろう)', 'early', ['east_road', 'azure_plain'], { spd: 8, family: 'beast' });
add('magatsu_shika', 'まがつ鹿', 'early', ['azure_plain'], { family: 'beast' });
add('anaguma_modoki', '穴熊もどき', 'early', ['east_road'], { def: 4, family: 'beast' });
add('kagizume_taka', 'かぎづめ鷹', 'mid', ['cliff_road'], { spd: 10, family: 'beast' });
add('dokuo_no_sasori', '毒尾のさそり', 'mid', ['azure_plain'], { inflict: { status: 'poison', chance: 0.35 }, family: 'beast' });
add('hagure_inoshishi', '平原のはぐれ猪', 'early', ['east_road'], { family: 'beast' });

// ---- 植物系 ----
add('hamigusa', '喰み草', 'early', ['east_road'], { def: 4, spd: 2, inflict: { status: 'sleep', chance: 0.18 }, family: 'plant' });
add('toge_no_mandrake', '棘のマンドレイク', 'mid', ['azure_plain'], { inflict: { status: 'confuse', chance: 0.3 }, family: 'plant' });
add('dokugiri_kinoko', '毒霧茸', 'mid', ['cliff_road'], { inflict: { status: 'poison', chance: 0.35 }, family: 'plant' });
add('karamitsuki_tsuta', '絡みつき蔦', 'mid', ['azure_tower'], { inflict: { status: 'sleep', chance: 0.22 }, family: 'plant' });
add('tanemaki_poppy', '種撒きポピー', 'early', ['azure_plain'], { inflict: { status: 'sleep', chance: 0.3 }, family: 'plant' });
add('kobokuno_bannin', '古木の番人', 'mid', ['azure_plain'], { hp: 40, exp: 35, gold: 60, family: 'plant' });

// ---- 空中系 ----
add('koumori', 'こうもり', 'early', ['azure_tower'], { hp: 6, spd: 7, family: 'sky' });
add('yogiri_no_fukurou', '夜霧のフクロウ', 'early', ['cliff_road'], { family: 'sky' });
add('dangai_no_harpy', '断崖のハーピー', 'mid', ['cliff_road'], { inflict: { status: 'confuse', chance: 0.28 }, family: 'sky' });
add('soukyu_wyvern_ko', '蒼穹のワイバーン子', 'mid', ['azure_tower'], { family: 'sky' });
add('arane_griffin_youju', '嵐羽のグリフィン幼獣', 'late', ['azure_tower'], { family: 'sky' });
add('kagewatari_bat_gun', '影渡りのバット群', 'mid', ['academy_altar'], { family: 'sky' });

// ---- アンデッド系 ----
add('samayou_yoroi', 'さまよう鎧', 'mid', ['azure_tower'], { def: 8, family: 'undead' });
add('kodai_no_bourei', '古代の亡霊', 'mid', ['azure_tower'], { family: 'undead' });
add('hone_no_banpei', '骨の番兵', 'mid', ['azure_tower'], { family: 'undead' });
add('norowareta_gakuto', '呪われた学徒の霊', 'mid', ['academy_altar'], { family: 'undead' });
add('souhaku_no_moja', '蒼白の亡者', 'late', ['forbidden_ritual_chamber'], { inflict: { status: 'poison', chance: 0.3 }, family: 'undead' });
add('dokuro_no_eishousha', '髑髏の詠唱者', 'late', ['forbidden_ritual_chamber'], { family: 'undead' });

// ---- 悪魔系 ----
add('warau_kage', '嗤う影', 'mid', ['azure_plain'], { family: 'demon' });
add('jujutsushi_modoki', '呪術師もどき', 'mid', ['cliff_road'], { family: 'demon' });
add('keiyaku_no_akuma_inu', '契約の悪魔犬', 'late', ['east_road'], { spd: 12, family: 'demon' });
add('genwaku_no_imp', '幻惑のインプ', 'mid', ['azure_tower'], { inflict: { status: 'confuse', chance: 0.3 }, family: 'demon' });
add('chi_no_daikousha', '血の代行者', 'late', ['east_road'], { family: 'demon' });
add('nanamonaki_shito', '名もなき使徒', 'late', ['forbidden_ritual_chamber'], { family: 'demon' });

// ---- 深海系 ----
add('hakkou_kurage', '発光クラゲ', 'mid', ['abyss_depth'], { inflict: { status: 'sleep', chance: 0.25 }, family: 'deep' });
add('koukaku_kani', '甲殻の蟹型魔物', 'mid', ['abyss_depth'], { def: 9, family: 'deep' });
add('shokushu_uo', '触手魚', 'mid', ['abyss_depth'], { family: 'deep' });
add('shinkai_lobster', '深海のロブスター', 'mid', ['abyss_depth'], { def: 10, family: 'deep' });
add('subo_no_youtai', '巣母の幼体', 'mid', ['abyss_depth'], { family: 'deep' });
add('shinen_no_ankou', '深淵のアンコウ', 'mid', ['abyss_depth'], { inflict: { status: 'confuse', chance: 0.25 }, family: 'deep' });

// ---- 古代文明系 ----
add('ishi_no_bannin', '石の番人', 'mid', ['azure_tower'], { def: 10, spd: 3, family: 'ancient' });
add('sabita_golem', '錆びたゴーレム', 'mid', ['azure_tower'], { def: 11, family: 'ancient' });
add('madou_ningyou', '魔導人形', 'mid', ['azure_tower'], { family: 'ancient' });
add('tenkyugi_no_shugoju', '天球儀の守護獣', 'late', ['azure_tower'], { family: 'ancient' });
add('kuzureshi_kenja_no_genei', '崩れし賢者の幻影', 'late', ['azure_tower'], { family: 'ancient' });
add('fuuin_no_shugosekizou', '封印の守護石像', 'late', ['azure_tower'], { hp: 44, exp: 40, gold: 75, family: 'ancient' });

Game.Data.Monsters = M;

// ---- ボス(魔物図鑑「ボス」より) ----
// HP/ATKは、その章時点のパーティ人数(第二章=2人、第五・六章=3人、第七章=3人、第十一章=4人)を
// 想定して調整している。第二章のみエルロードが戦闘直前に合流するので2人想定。
Game.Data.Monsters.galoz = {
  id: 'galoz', name: '牙のオーガ将軍ガロズ', boss: true, loc: ['ogre_camp'],
  hp: 90, atk: 13, def: 7, spd: 5, exp: 200, gold: 375,
  bossSkills: [{ name: '咆哮', power: 1.3, target: 'all_party' }],
};
Game.Data.Monsters.astro_guardian = {
  id: 'astro_guardian', name: '星読みの巨像アストロガーディアン', boss: true, loc: ['azure_tower'],
  hp: 70, atk: 11, def: 9, spd: 4, exp: 250, gold: 450,
  bossSkills: [{ name: '星導の光', power: 1.2, target: 'all_party' }],
};
Game.Data.Monsters.magatsuki = {
  id: 'magatsuki', name: '名もなき召魔「まがつき」', boss: true, loc: ['academy_altar'],
  hp: 80, atk: 12, def: 6, spd: 9, exp: 175, gold: 300,
  bossSkills: [{ name: '禁呪の残滓', power: 1.2, target: 'all_party' }],
};
Game.Data.Monsters.abyss_matriarch = {
  id: 'abyss_matriarch', name: '深淵の巣母', boss: true, loc: ['abyss_depth'],
  hp: 110, atk: 14, def: 8, spd: 5, exp: 325, gold: 550,
  bossSkills: [{ name: '深淵の波動', power: 1.3, target: 'all_party' }],
};
Game.Data.Monsters.genso_no_katsubo = {
  id: 'genso_no_katsubo', name: '原初の渇望', boss: true, loc: ['forbidden_ritual_chamber'],
  hp: 150, atk: 16, def: 10, spd: 7, exp: 400, gold: 650,
  bossSkills: [{ name: '渇望の奔流', power: 1.4, target: 'all_party' }],
};

// ---- ロケーションごとの出現テーブル(重み付き抽選)。M の loc から自動生成 ----
Game.Data.EncounterTables = (function () {
  var tables = {};
  Object.keys(M).forEach(function (id) {
    var m = M[id];
    if (m.boss) return; // ボスは固定のボス床でのみ戦う。ランダムエンカウントには出さない
    m.loc.forEach(function (locId) {
      tables[locId] = tables[locId] || [];
      var weight = m.tier === 'early' ? 5 : m.tier === 'mid' ? 3 : 1;
      tables[locId].push({ id: id, weight: weight });
    });
  });
  return tables;
})();
