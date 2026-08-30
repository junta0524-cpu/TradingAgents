// モンスターデータ ― 魔物図鑑(全60種)をゲーム用ステータスに変換したもの。
//
// 強さは「どの土地で出るか」で決める。物語は16章あり、そのあいだに仲間は
// 1人から4人へ、こうげき力は20から53へ伸びる。序盤/中盤/終盤の3段階では
// この伸びを追いきれず、通しプレイの計測で中盤以降のHPの減りが中央値0%
// ―― つまり一度も削られないまま終わってしまっていた。
// そこで土地ごとに1〜6の「格」を振り、魔物の基準値をその格から引いている。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// ---- 土地の格 ----
// 章の進みと、そこへ着くころのパーティの実力(人数・レベル・装備)に合わせてある。
//   1 東の街道      第一章   ロト1人  Lv1〜3   総HP 28
//   2 蒼穹の平原/塔 第二章   2人      Lv4〜6   総HP 77
//   3 断崖の道      第三章   3人      Lv6〜8   総HP143
//   4 オーガ野営地  第五章   3人      Lv9〜11  総HP182
//   5 学院の祭壇    第六章   3人      Lv11〜13 総HP214
//   6 深淵の底      第七章   4人      Lv12〜13 総HP348
//   7 禁呪の間      第十一章 4人      Lv14〜16 総HP389
Game.Data.AreaRank = {
  east_road: 1,
  azure_plain: 2, azure_tower: 2,
  cliff_road: 3,
  ogre_camp: 4,
  academy_altar: 5,
  abyss_depth: 6,
  forbidden_ritual_chamber: 7,
};

// 格ごとの基準値。
// hp   ―― その時点の平均的な一撃で2発ぶん。1ターンでは倒しきれない厚み。
// atk  ―― 守備の堅い者に1割強、柔らかい者に4割ほど入る重さ。
// spd  ―― パーティの平均すばやさと同程度。魔物が先に動けないと、
//          こちらが一方的に殴って終わるだけの戦いになってしまう。
function rankBase(rank) {
  var T = {
    1: { hp: 14,  atk: 9,  def: 3,  spd: 6,  exp: 6,   gold: 12 },
    2: { hp: 28,  atk: 12, def: 6,  spd: 9,  exp: 14,  gold: 30 },
    3: { hp: 48,  atk: 22, def: 9,  spd: 12, exp: 28,  gold: 60 },
    4: { hp: 62,  atk: 26, def: 12, spd: 15, exp: 46,  gold: 95 },
    5: { hp: 78,  atk: 34, def: 15, spd: 19, exp: 70,  gold: 140 },
    6: { hp: 112, atk: 44, def: 19, spd: 23, exp: 110, gold: 210 },
    7: { hp: 130, atk: 48, def: 24, spd: 26, exp: 150, gold: 280 },
  };
  return T[rank] || T[1];
}

// 群れの上限も格から引く。弱い魔物は数を揃え、格が上がるほど単独で現れる。
Game.Data.groupLimitOf = function (monster) {
  var r = (monster && monster.rank) || 1;
  if (r <= 1) return 2;
  if (r <= 4) return 3;
  return 2;
};

function mon(id, name, rank, loc, over) {
  var b = rankBase(rank);
  var m = { id: id, name: name, rank: rank, loc: loc };
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
  // はぐれ者系。硬すぎて何を当てても ほとんど通らない。
  // 倒しきる前に逃げるので、まともに削るより かいしんの一撃を待つほうが早い。
  metal:    { name: 'はぐれ者系',   physical: 0.04, fire: 0.04, ice: 0.04, blast: 0.06, wind: 0.04, light: 0.06, ailment: 0.0 },
};

// 属性と種族から倍率を引く。分からない組み合わせは等倍にしておく。
Game.Data.resistanceOf = function (monster, element) {
  var fam = Game.Data.Families[monster && monster.family];
  if (!fam) return 1;
  var key = element || 'physical';
  return fam[key] === undefined ? 1 : fam[key];
};

var M = {};
function add(id, name, rank, loc, over) { M[id] = mon(id, name, rank, loc, over); }

// 詠唱者と呪術師は、名前のとおり唱えてくる。魔獣と竜は息を吐く。
var SPELL = {
  gira:   { kind: 'spell',  name: 'ギラ',       power: 1.15, element: 'fire' },
  merami: { kind: 'spell',  name: 'メラミ',     power: 1.35, element: 'fire' },
  hyado:  { kind: 'spell',  name: 'ヒャド',     power: 1.1,  element: 'ice' },
  begira: { kind: 'breath', name: 'ベギラマ',   power: 0.85, target: 'all_party', element: 'fire' },
  honoo:  { kind: 'breath', name: 'ほのおの息', power: 0.8,  target: 'all_party', element: 'fire' },
  fubuki: { kind: 'breath', name: 'こごえる息', power: 0.9,  target: 'all_party', element: 'ice' },
  hoimi:  { kind: 'heal',   name: 'ホイミ',     power: 28 },
  behoimi:{ kind: 'heal',   name: 'ベホイミ',   power: 70 },
  rarihoo:{ kind: 'ailment', name: 'ラリホー',  ailment: 'sleep' },
  medapani:{ kind: 'ailment', name: 'メダパニ', ailment: 'confuse' },
};


// ---- スライム系 ----
add('chibi_slime', 'ちびスライム', 1, ['east_road', 'azure_plain'], { hp: 10, atk: 7, family: 'slime' });
add('aka_slime', 'あかスライム', 1, ['east_road'], { hp: 13, atk: 8, inflict: { status: 'confuse', chance: 0.12 }, family: 'slime' });
// ---- はぐれ者 ----
// 硬く、すばやく、すぐ逃げる。そのかわり倒せば経験値が跳ねる。
// まともに削ろうとしても通らないので、かいしんの一撃が出るかどうかの勝負になる。
add('hane_slime', 'はねスライム', 1, ['east_road', 'azure_plain', 'cliff_road'],
    { hp: 6, atk: 6, def: 40, spd: 30, exp: 120, gold: 90, family: 'metal', metal: true });
add('hagure_slime', 'はぐれスライム', 4, ['ogre_camp', 'academy_altar', 'abyss_depth'],
    { hp: 10, atk: 20, def: 90, spd: 42, exp: 900, gold: 500, family: 'metal', metal: true });
add('king_slime_kakera', 'キングスライムの欠片', 3, ['cliff_road'], { hp: 72, atk: 19, family: 'slime' });
add('hedoro_slime', 'ヘドロスライム', 6, ['abyss_depth'], { inflict: { status: 'poison', chance: 0.3 }, family: 'slime' });

// ---- 竜王軍残党系 ----
// 竜王軍の残党は、散り散りになった先のオーガ野営地に集まっている。
add('nora_goblin', '野良ゴブリン', 1, ['east_road'], { hp: 15, atk: 9, spd: 8, family: 'remnant' });
add('araukure_orc', '荒くれオーク', 4, ['ogre_camp'], { hp: 70, atk: 27, def: 14, family: 'remnant' });
add('sekigan_ogre', '隻眼オーガ兵', 4, ['ogre_camp'], { hp: 76, atk: 28, family: 'remnant' });
add('ryuuga_kyousenshi', '竜牙の狂戦士', 4, ['ogre_camp'], { atk: 29, def: 9, family: 'remnant' });
add('kuzureta_gunba', '崩れた軍馬', 4, ['ogre_camp'], { spd: 20, family: 'remnant' });
add('zantou_kyuuhei', '残党の弓兵', 3, ['cliff_road', 'ogre_camp'], { def: 6, spd: 15, family: 'remnant' });

// ---- 魔獣系 ----
add('magarou', '牙狼(まがろう)', 1, ['east_road', 'azure_plain'], { spd: 9, family: 'beast' });
add('anaguma_modoki', '穴熊もどき', 1, ['east_road'], { hp: 18, def: 5, spd: 4, family: 'beast' });
add('hagure_inoshishi', '平原のはぐれ猪', 1, ['east_road'], { hp: 18, atk: 10, family: 'beast' });
add('magatsu_shika', 'まがつ鹿', 2, ['azure_plain'], { family: 'beast' });
add('dokuo_no_sasori', '毒尾のさそり', 2, ['azure_plain'], { inflict: { status: 'poison', chance: 0.35 }, family: 'beast' });
add('kagizume_taka', 'かぎづめ鷹', 3, ['cliff_road'], { spd: 18, family: 'beast' });

// ---- 植物系 ----
add('hamigusa', '喰み草', 1, ['east_road'], { def: 6, spd: 2, inflict: { status: 'sleep', chance: 0.18 }, family: 'plant' });
add('tanemaki_poppy', '種撒きポピー', 2, ['azure_plain'], { inflict: { status: 'sleep', chance: 0.3 }, family: 'plant' });
add('toge_no_mandrake', '棘のマンドレイク', 2, ['azure_plain'], { inflict: { status: 'confuse', chance: 0.3 }, family: 'plant' });
add('kobokuno_bannin', '古木の番人', 2, ['azure_plain'], { hp: 56, def: 10, spd: 4, exp: 26, gold: 55, family: 'plant' });
add('karamitsuki_tsuta', '絡みつき蔦', 2, ['azure_tower'], { inflict: { status: 'sleep', chance: 0.22 }, family: 'plant' });
add('dokugiri_kinoko', '毒霧茸', 3, ['cliff_road'], { inflict: { status: 'poison', chance: 0.35 }, family: 'plant' });

// ---- 空中系 ----
add('koumori', 'こうもり', 2, ['azure_tower'], { hp: 18, atk: 12, spd: 14, family: 'sky' });
add('soukyu_wyvern_ko', '蒼穹のワイバーン子', 2, ['azure_tower'], { spd: 12, family: 'sky', skills: [SPELL.honoo], skillRate: 0.35 });
add('yogiri_no_fukurou', '夜霧のフクロウ', 3, ['cliff_road'], { spd: 15, family: 'sky', skills: [SPELL.rarihoo], skillRate: 0.3 });
add('dangai_no_harpy', '断崖のハーピー', 3, ['cliff_road'], { inflict: { status: 'confuse', chance: 0.28 }, family: 'sky' });
// 塔の主に近い一体。第二章では格上として、ときどきだけ姿を見せる。
add('arane_griffin_youju', '嵐羽のグリフィン幼獣', 3, ['azure_tower'], { family: 'sky', skills: [SPELL.fubuki], skillRate: 0.35 });
add('kagewatari_bat_gun', '影渡りのバット群', 5, ['academy_altar'], { spd: 24, family: 'sky' });

// ---- アンデッド系 ----
add('samayou_yoroi', 'さまよう鎧', 2, ['azure_tower'], { def: 11, spd: 5, family: 'undead' });
add('kodai_no_bourei', '古代の亡霊', 2, ['azure_tower'], { family: 'undead', skills: [SPELL.hoimi], skillRate: 0.3 });
add('hone_no_banpei', '骨の番兵', 2, ['azure_tower'], { def: 9, family: 'undead' });
add('norowareta_gakuto', '呪われた学徒の霊', 5, ['academy_altar'], { family: 'undead', skills: [SPELL.hyado, SPELL.medapani], skillRate: 0.35 });
add('souhaku_no_moja', '蒼白の亡者', 7, ['forbidden_ritual_chamber'], { inflict: { status: 'poison', chance: 0.3 }, family: 'undead' });
add('dokuro_no_eishousha', '髑髏の詠唱者', 7, ['forbidden_ritual_chamber'], { atk: 52, def: 18, family: 'undead', skills: [SPELL.merami, SPELL.begira], skillRate: 0.45 });

// ---- 悪魔系 ----
add('warau_kage', '嗤う影', 2, ['azure_plain'], { spd: 13, family: 'demon' });
add('genwaku_no_imp', '幻惑のインプ', 2, ['azure_tower'], { inflict: { status: 'confuse', chance: 0.3 }, family: 'demon', skills: [SPELL.medapani], skillRate: 0.3 });
add('jujutsushi_modoki', '呪術師もどき', 3, ['cliff_road'], { family: 'demon', skills: [SPELL.gira, SPELL.rarihoo], skillRate: 0.4 });
add('keiyaku_no_akuma_inu', '契約の悪魔犬', 5, ['academy_altar'], { spd: 28, family: 'demon' });
add('chi_no_daikousha', '血の代行者', 5, ['academy_altar'], { atk: 38, family: 'demon', skills: [SPELL.begira, SPELL.behoimi], skillRate: 0.4 });
add('nanamonaki_shito', '名もなき使徒', 7, ['forbidden_ritual_chamber'], { family: 'demon' });

// ---- 深海系 ----
add('hakkou_kurage', '発光クラゲ', 6, ['abyss_depth'], { inflict: { status: 'sleep', chance: 0.25 }, family: 'deep', skills: [SPELL.hyado], skillRate: 0.3 });
add('koukaku_kani', '甲殻の蟹型魔物', 6, ['abyss_depth'], { def: 26, spd: 12, family: 'deep' });
add('shokushu_uo', '触手魚', 6, ['abyss_depth'], { family: 'deep' });
add('shinkai_lobster', '深海のロブスター', 6, ['abyss_depth'], { def: 28, spd: 10, family: 'deep' });
add('subo_no_youtai', '巣母の幼体', 6, ['abyss_depth'], { hp: 120, family: 'deep', skills: [SPELL.hoimi], skillRate: 0.3 });
add('shinen_no_ankou', '深淵のアンコウ', 6, ['abyss_depth'], { inflict: { status: 'confuse', chance: 0.25 }, family: 'deep', skills: [SPELL.fubuki], skillRate: 0.3 });

// ---- 古代文明系 ----
// 守備が高く、物理が通りにくい。爆裂系の呪文で崩すのが早い。
add('ishi_no_bannin', '石の番人', 2, ['azure_tower'], { def: 14, spd: 3, family: 'ancient' });
add('sabita_golem', '錆びたゴーレム', 2, ['azure_tower'], { def: 15, spd: 4, family: 'ancient' });
add('madou_ningyou', '魔導人形', 2, ['azure_tower'], { family: 'ancient', skills: [SPELL.gira], skillRate: 0.3 });
add('tenkyugi_no_shugoju', '天球儀の守護獣', 3, ['azure_tower'], { family: 'ancient' });
add('kuzureshi_kenja_no_genei', '崩れし賢者の幻影', 3, ['azure_tower'], { family: 'ancient', skills: [SPELL.merami, SPELL.behoimi], skillRate: 0.45 });
add('fuuin_no_shugosekizou', '封印の守護石像', 3, ['azure_tower'], { hp: 66, def: 16, spd: 4, exp: 36, gold: 80, family: 'ancient' });

Game.Data.Monsters = M;

// ---- ボス(魔物図鑑「ボス」より) ----
// 雑魚と同じ物差しで置いてある。その章のパーティが 4〜6ターンかけて削りきり、
// そのあいだに総HPの半分前後を持っていかれる重さ。
// 目安は「一度も回復せず、ただ殴り合った場合」で立ててある(下は実測値)。
//   アストロガーディアン 4ターン / 総HPの45%  ガロズ 4ターン / 57%
//   まがつき 5ターン / 69%  深淵の巣母 5ターン / 59%  原初の渇望 6ターン / 70%
// 実際には回復も ぼうぎょ も呪文も使えるので、ここが上限に当たる。
// 第二章のみエルロードが戦闘直前に合流するので2人想定。
Game.Data.Monsters.astro_guardian = {
  id: 'astro_guardian', name: '星読みの巨像アストロガーディアン', boss: true, rank: 2,
  loc: ['azure_tower'], family: 'ancient',
  hp: 115, atk: 16, def: 10, spd: 10, exp: 250, gold: 450,
  bossSkills: [
    { name: '星導の光', power: 1.2, target: 'all_party', element: 'light' },
    { name: '観測の眼', kind: 'ailment', ailment: 'sleep' },
  ],
};
Game.Data.Monsters.galoz = {
  id: 'galoz', name: '牙のオーガ将軍ガロズ', boss: true, rank: 4,
  loc: ['ogre_camp'], family: 'remnant',
  hp: 290, atk: 30, def: 14, spd: 16, exp: 400, gold: 700,
  bossSkills: [
    { name: '咆哮', power: 1.3, target: 'all_party' },   // 無属性。銘では弾けない
    { name: '痛恨の一撃', kind: 'crit', power: 1.5 },
  ],
};
Game.Data.Monsters.magatsuki = {
  id: 'magatsuki', name: '名もなき召魔「まがつき」', boss: true, rank: 5,
  loc: ['academy_altar'], family: 'demon',
  hp: 350, atk: 36, def: 16, spd: 21, exp: 560, gold: 900,
  bossSkills: [
    { name: '禁呪の残滓', power: 1.2, target: 'all_party', element: 'io' },
    { name: '正気を 削る囁き', kind: 'ailment', ailment: 'confuse' },
  ],
};
Game.Data.Monsters.abyss_matriarch = {
  id: 'abyss_matriarch', name: '深淵の巣母', boss: true, rank: 6,
  loc: ['abyss_depth'], family: 'deep',
  hp: 560, atk: 50, def: 20, spd: 18, exp: 820, gold: 1300,
  bossSkills: [
    { name: '深淵の波動', power: 1.3, target: 'all_party', element: 'ice' },
    { name: '喰らいつき', kind: 'crit', power: 1.4 },
    { name: '毒の霧', kind: 'ailment', ailment: 'poison' },
  ],
};
Game.Data.Monsters.genso_no_katsubo = {
  id: 'genso_no_katsubo', name: '原初の渇望', boss: true, rank: 7,
  loc: ['forbidden_ritual_chamber'], family: 'demon',
  hp: 680, atk: 54, def: 24, spd: 24, exp: 1100, gold: 1800,
  bossSkills: [
    { name: '渇望の奔流', power: 1.4, target: 'all_party' },   // 無属性。最後の壁なので銘では弾けない
    { name: '痛恨の一撃', kind: 'crit', power: 1.6 },
    { name: '意識を 塗りつぶす', kind: 'ailment', ailment: 'confuse' },
  ],
};

// ---- ロケーションごとの出現テーブル(重み付き抽選)。M の loc から自動生成 ----
// その土地の格と同じ魔物をよく出し、格上の魔物はまれにしか出さない。
// 「たまに手強いのが混じる」という手触りは残しつつ、着いた早々に
// 格違いと当たって全滅する、ということが起きないようにしてある。
Game.Data.EncounterTables = (function () {
  var tables = {};
  Object.keys(M).forEach(function (id) {
    var m = M[id];
    if (m.boss) return; // ボスは固定のボス床でのみ戦う。ランダムエンカウントには出さない
    m.loc.forEach(function (locId) {
      tables[locId] = tables[locId] || [];
      var areaRank = Game.Data.AreaRank[locId] || m.rank;
      var gap = m.rank - areaRank;
      var weight = gap > 0 ? 1 : gap < 0 ? 3 : 6;
      // はぐれ者は滅多に出ない。出会えたこと自体が当たりであってほしい
      if (m.metal) weight = 1;
      tables[locId].push({ id: id, weight: weight });
    });
  });
  return tables;
})();
