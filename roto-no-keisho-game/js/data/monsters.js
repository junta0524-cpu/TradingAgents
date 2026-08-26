// モンスターデータ ― 魔物図鑑(全60種)をゲーム用ステータスに変換したもの。
// 雑魚は「序盤/中盤/終盤」の階層(魔物図鑑の tier 表記)ごとに基準値を決め、
// 個体ごとに多少の凹凸を付けている。ボスのみ個別にステータス・特技を定義。
var Game = window.Game || {};
Game.Data = Game.Data || {};

function tierBase(tier) {
  if (tier === 'early') return { hp: 9, atk: 4, def: 2, spd: 4, exp: 2, gold: 4 };
  if (tier === 'mid') return { hp: 20, atk: 9, def: 5, spd: 6, exp: 6, gold: 12 };
  return { hp: 34, atk: 17, def: 9, spd: 8, exp: 13, gold: 28 }; // late
}
function mon(id, name, tier, loc, over) {
  var b = tierBase(tier);
  var m = { id: id, name: name, tier: tier, loc: loc };
  for (var k in b) m[k] = b[k];
  if (over) for (var k2 in over) m[k2] = over[k2];
  return m;
}

var M = {};
function add(id, name, tier, loc, over) { M[id] = mon(id, name, tier, loc, over); }

// ---- スライム系 ----
add('chibi_slime', 'ちびスライム', 'early', ['east_road', 'azure_plain', 'cliff_road'], { hp: 5, atk: 3 });
add('aka_slime', 'あかスライム', 'early', ['east_road'], { hp: 8, atk: 5 });
add('hagure_slime', 'はぐれスライム', 'early', ['ogre_camp'], { hp: 10, atk: 6 });
add('king_slime_kakera', 'キングスライムの欠片', 'mid', ['cliff_road'], { hp: 24 });
add('hane_slime', 'はねスライム', 'mid', ['east_road', 'azure_plain', 'cliff_road'], { hp: 10, exp: 12, gold: 20 });
add('hedoro_slime', 'ヘドロスライム', 'mid', ['abyss_depth']);

// ---- 竜王軍残党系 ----
add('nora_goblin', '野良ゴブリン', 'early', ['east_road'], { hp: 12, atk: 6, spd: 6 });
add('araukure_orc', '荒くれオーク', 'early', ['ogre_camp'], { hp: 20, atk: 10, def: 5 });
add('sekigan_ogre', '隻眼オーガ兵', 'early', ['ogre_camp'], { hp: 22, atk: 11 });
add('ryuuga_kyousenshi', '竜牙の狂戦士', 'mid', ['east_road']);
add('kuzureta_gunba', '崩れた軍馬', 'mid', ['east_road']);
add('zantou_kyuuhei', '残党の弓兵', 'mid', ['east_road']);

// ---- 魔獣系 ----
add('magarou', '牙狼(まがろう)', 'early', ['east_road', 'azure_plain'], { spd: 8 });
add('magatsu_shika', 'まがつ鹿', 'early', ['azure_plain']);
add('anaguma_modoki', '穴熊もどき', 'early', ['east_road'], { def: 4 });
add('kagizume_taka', 'かぎづめ鷹', 'mid', ['cliff_road'], { spd: 10 });
add('dokuo_no_sasori', '毒尾のさそり', 'mid', ['azure_plain']);
add('hagure_inoshishi', '平原のはぐれ猪', 'early', ['east_road']);

// ---- 植物系 ----
add('hamigusa', '喰み草', 'early', ['east_road'], { def: 4, spd: 2 });
add('toge_no_mandrake', '棘のマンドレイク', 'mid', ['azure_plain']);
add('dokugiri_kinoko', '毒霧茸', 'mid', ['cliff_road']);
add('karamitsuki_tsuta', '絡みつき蔦', 'mid', ['azure_tower']);
add('tanemaki_poppy', '種撒きポピー', 'early', ['azure_plain']);
add('kobokuno_bannin', '古木の番人', 'mid', ['azure_plain'], { hp: 40, exp: 14, gold: 24 });

// ---- 空中系 ----
add('koumori', 'こうもり', 'early', ['azure_tower'], { hp: 6, spd: 7 });
add('yogiri_no_fukurou', '夜霧のフクロウ', 'early', ['cliff_road']);
add('dangai_no_harpy', '断崖のハーピー', 'mid', ['cliff_road']);
add('soukyu_wyvern_ko', '蒼穹のワイバーン子', 'mid', ['azure_tower']);
add('arane_griffin_youju', '嵐羽のグリフィン幼獣', 'late', ['azure_tower']);
add('kagewatari_bat_gun', '影渡りのバット群', 'mid', ['academy_altar']);

// ---- アンデッド系 ----
add('samayou_yoroi', 'さまよう鎧', 'mid', ['azure_tower'], { def: 8 });
add('kodai_no_bourei', '古代の亡霊', 'mid', ['azure_tower']);
add('hone_no_banpei', '骨の番兵', 'mid', ['azure_tower']);
add('norowareta_gakuto', '呪われた学徒の霊', 'mid', ['academy_altar']);
add('souhaku_no_moja', '蒼白の亡者', 'late', ['forbidden_ritual_chamber']);
add('dokuro_no_eishousha', '髑髏の詠唱者', 'late', ['forbidden_ritual_chamber']);

// ---- 悪魔系 ----
add('warau_kage', '嗤う影', 'mid', ['azure_plain']);
add('jujutsushi_modoki', '呪術師もどき', 'mid', ['cliff_road']);
add('keiyaku_no_akuma_inu', '契約の悪魔犬', 'late', ['east_road'], { spd: 12 });
add('genwaku_no_imp', '幻惑のインプ', 'mid', ['azure_tower']);
add('chi_no_daikousha', '血の代行者', 'late', ['east_road']);
add('nanamonaki_shito', '名もなき使徒', 'late', ['forbidden_ritual_chamber']);

// ---- 深海系 ----
add('hakkou_kurage', '発光クラゲ', 'mid', ['abyss_depth']);
add('koukaku_kani', '甲殻の蟹型魔物', 'mid', ['abyss_depth'], { def: 9 });
add('shokushu_uo', '触手魚', 'mid', ['abyss_depth']);
add('shinkai_lobster', '深海のロブスター', 'mid', ['abyss_depth'], { def: 10 });
add('subo_no_youtai', '巣母の幼体', 'mid', ['abyss_depth']);
add('shinen_no_ankou', '深淵のアンコウ', 'mid', ['abyss_depth']);

// ---- 古代文明系 ----
add('ishi_no_bannin', '石の番人', 'mid', ['azure_tower'], { def: 10, spd: 3 });
add('sabita_golem', '錆びたゴーレム', 'mid', ['azure_tower'], { def: 11 });
add('madou_ningyou', '魔導人形', 'mid', ['azure_tower']);
add('tenkyugi_no_shugoju', '天球儀の守護獣', 'late', ['azure_tower']);
add('kuzureshi_kenja_no_genei', '崩れし賢者の幻影', 'late', ['azure_tower']);
add('fuuin_no_shugosekizou', '封印の守護石像', 'late', ['azure_tower'], { hp: 44, exp: 16, gold: 30 });

Game.Data.Monsters = M;

// ---- ボス(魔物図鑑「ボス」より) ----
// HP/ATKは、その章時点のパーティ人数(第二章=2人、第五・六章=3人、第七章=3人、第十一章=4人)を
// 想定して調整している。第二章のみエルロードが戦闘直前に合流するので2人想定。
Game.Data.Monsters.galoz = {
  id: 'galoz', name: '牙のオーガ将軍ガロズ', boss: true, loc: ['ogre_camp'],
  hp: 90, atk: 13, def: 7, spd: 5, exp: 80, gold: 150,
  bossSkills: [{ name: '咆哮', power: 1.3, target: 'all_party' }],
};
Game.Data.Monsters.astro_guardian = {
  id: 'astro_guardian', name: '星読みの巨像アストロガーディアン', boss: true, loc: ['azure_tower'],
  hp: 70, atk: 11, def: 9, spd: 4, exp: 100, gold: 180,
  bossSkills: [{ name: '星導の光', power: 1.2, target: 'all_party' }],
};
Game.Data.Monsters.magatsuki = {
  id: 'magatsuki', name: '名もなき召魔「まがつき」', boss: true, loc: ['academy_altar'],
  hp: 80, atk: 12, def: 6, spd: 9, exp: 70, gold: 120,
  bossSkills: [{ name: '禁呪の残滓', power: 1.2, target: 'all_party' }],
};
Game.Data.Monsters.abyss_matriarch = {
  id: 'abyss_matriarch', name: '深淵の巣母', boss: true, loc: ['abyss_depth'],
  hp: 110, atk: 14, def: 8, spd: 5, exp: 130, gold: 220,
  bossSkills: [{ name: '深淵の波動', power: 1.3, target: 'all_party' }],
};
Game.Data.Monsters.genso_no_katsubo = {
  id: 'genso_no_katsubo', name: '原初の渇望', boss: true, loc: ['forbidden_ritual_chamber'],
  hp: 150, atk: 16, def: 10, spd: 7, exp: 160, gold: 260,
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
