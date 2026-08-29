// マップデータ ― 地誌譜の全13ロケーションをタイルマップ化。
// 一枚ずつ形を描き分けている:街道は森を縫い、平原は湖を回り込み、断崖は桟道が折り返す。
// ダンジョンも野営地・塔・納骨堂・洞窟・渦と、それぞれ違う構造を持たせた。
// 絵はまだ色面のプレースホルダーだが、タイル絵に差し替えるときも形はこのまま使える。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// タイル凡例:
//   進入不可 … # 木立 / X 岩壁・崖 / Y 建物 / ~ 水場
//   通行可   … . 草原(遭遇:高) = 街道(遭遇:低) D ダンジョン床(遭遇:中) F 街の床(遭遇:なし)
//   イベント … C 出口/門  B ボス部屋  N 町の人  K 王  T 宝箱  S/W/I/H 道具屋/武器屋/宿屋/教会
Game.Data.TileDefs = {
  '#': { walkable: false, color: '#3c5c33', encounter: 0 },
  'X': { walkable: false, color: '#5a5348', encounter: 0 },
  'Y': { walkable: false, color: '#7a6248', encounter: 0 },
  '.': { walkable: true, color: '#6fa84a', encounter: 0.075 },
  '=': { walkable: true, color: '#c9b27c', encounter: 0.05 },
  '~': { walkable: false, color: '#3d6e86', encounter: 0 },
  'D': { walkable: true, color: '#4a4658', encounter: 0.12 },
  'F': { walkable: true, color: '#b7a888', encounter: 0 },
  'C': { walkable: true, color: '#b08d3e', encounter: 0, isGate: true },
  'B': { walkable: true, color: '#8a3230', encounter: 0, isBoss: true },
  'N': { walkable: true, color: '#8a76b8', encounter: 0, isNpc: true },
  'K': { walkable: true, color: '#9c7c2e', encounter: 0, isNpc: true, glyph: '王' },
  'T': { walkable: true, color: '#7a5a24', encounter: 0, isChest: true, glyph: '宝' },
  // 街の施設。踏むとそれぞれの画面が開く
  'S': { walkable: true, color: '#4f8a5c', encounter: 0, shop: 'item', glyph: '道' },
  'W': { walkable: true, color: '#8a6a3a', encounter: 0, shop: 'gear', glyph: '武' },
  'I': { walkable: true, color: '#5c6f9c', encounter: 0, shop: 'inn', glyph: '宿' },
  'H': { walkable: true, color: '#9c8f5c', encounter: 0, shop: 'church', glyph: '教' },
  // 灯す仕掛け。踏むと点り、'L'(消えている)から 'l'(点いている)へ書き換わる。
  // タイルの文字そのものを変えるので、描画側は何も知らなくてよい。
  'L': { walkable: true, color: '#3a3450', encounter: 0, isSwitch: true, glyph: '灯' },
  'l': { walkable: true, color: '#d4af5a', encounter: 0, isSwitch: true, lit: true, glyph: '灯' },
  // 月光の門。満月のあいだだけ通れる
  'O': { walkable: true, color: '#5c6f9c', encounter: 0, moonGate: true, glyph: '月' },
};

// 仕掛けを消えている状態に戻す。同じ階へ入り直すたびに呼ぶ
Game.Data.resetSwitches = function (map) {
  if (!map || !map.tiles) return;
  map.tiles = map.tiles.map(function (row) { return row.replace(/l/g, 'L'); });
};
// 点いている仕掛けの数
Game.Data.litCount = function (map) {
  if (!map || !map.tiles) return 0;
  return map.tiles.reduce(function (n, row) { return n + (row.split('l').length - 1); }, 0);
};
// その階にある仕掛けの総数
Game.Data.switchCount = function (map) {
  if (!map || !map.tiles) return 0;
  return map.tiles.reduce(function (n, row) {
    return n + (row.split('l').length - 1) + (row.split('L').length - 1);
  }, 0);
};

// 各マップは art(タイルの絵)をそのまま持つ。
// art の中の数字は目印で、chests / npcs の対応表を引いて宝箱・人物に置き換える。
// こうしておくと、形を描き替えても座標を数え直さずに済む。
function buildMap(def) {
  var chestAt = {}, npcAt = {};
  var tiles = def.art.map(function (row, y) {
    var out = '';
    for (var x = 0; x < row.length; x++) {
      var ch = row[x];
      var chest = def.chests && def.chests[ch];
      var npc = def.npcs && def.npcs[ch];
      if (chest) { chestAt[x + ',' + y] = chest; out += 'T'; }
      else if (npc) { npcAt[x + ',' + y] = npc.id; out += npc.king ? 'K' : 'N'; }
      else { out += ch; }
    }
    return out;
  });
  var map = {
    id: def.id, name: def.name, kind: def.kind,
    startX: def.startX, startY: def.startY,
    tiles: tiles,
  };
  if (def.encounterTable) map.encounterTable = def.encounterTable;
  if (def.church) map.church = def.church;
  if (def.bossId) map.bossId = def.bossId;
  if (def.chests) map.chestAt = chestAt;
  if (def.npcs) map.npcAt = npcAt;
  return map;
}

Game.Data.Maps = {
  // ============ 街 ============
  // 城。奥の玉座の間と城下の広場を大扉で仕切っている
  radatome: buildMap({
    id: 'radatome', name: 'ラダトーム', kind: 'town', startX: 9, startY: 8,
    npcs: {
          '1': { id: 'radatome_soldier' },
          '2': { id: 'radatome_oldwoman' },
          'K': { id: 'radatome_king', king: true },
        },
    art: [
      'YYYYYYYYYYYYYYYYYYYY',
      'YFYYYFFFFFFFFFFYYYFY',
      'YFYYYFFFFKFFFFFYYYFY',
      'YFFFFFFFFFFFFFFFFFFY',
      'YYYYYYYYYFFYYYYYYYYY',
      'YFFFFFFFFFFFFFFFFFFY',
      'YFFFSFFFWFFFIFFFFFFY',
      'YFFYYFFFFFFFFFFYYFFY',
      'YFFYYFFFFFFFFFFYYFFY',
      'YFFFFFFFYYYYFFFFFFFY',
      'YFFFFFFFYYYYFFFFFFFY',
      'YF1FFFFFFFFFFFFF2FFY',
      'YFFFFFFFFCFFFFFFFFFY',
      'YYYYYYYYYYYYYYYYYYYY',
    ],
  }),

  // 十字の大通りが四つの街区を分ける城塞都市
  loureshia_town: buildMap({
    id: 'loureshia_town', name: 'ローレシア城下', kind: 'town', startX: 10, startY: 9,
    npcs: {
          '1': { id: 'loureshia_roula' },
          '2': { id: 'loureshia_garai' },
          '3': { id: 'loureshia_smith' },
          '4': { id: 'loureshia_noble' },
        },
    art: [
      'YYYYYYYYYYYYYYYYYYYYYY',
      'YYYYYYYYYYFYYYYYYYYYYY',
      'YYF1FFFFFYFYFFFFFF2YYY',
      'YYFFYYFFFYFYFFFYYFFYYY',
      'YYFFFFFFFYFYFFFFFFFYYY',
      'YYYYFYYYYYFYYYYYFYYYYY',
      'YFFSFFFWFFFFFFIFFFHFFY',
      'YYYYFYYYYYFYYYYYFYYYYY',
      'YYFFFFFFFYFYFFFFFFFYYY',
      'YYFFYYFFFYFYFFFYYFFYYY',
      'YYFFYYFFFYFYFFFYYFFYYY',
      'YYF3FFFFFYFYFFFFFF4YYY',
      'YYYYYYYYYYCYYYYYYYYYYY',
      'YYYYYYYYYYYYYYYYYYYYYY',
    ],
  }),

  // 中庭の泉を回廊がぐるりと囲む学院都市
  samaltria_town: buildMap({
    id: 'samaltria_town', name: '学院都市サマルトリア', kind: 'town', startX: 10, startY: 11,
    npcs: {
          '1': { id: 'samaltria_elrode' },
          '2': { id: 'samaltria_vance' },
          '3': { id: 'samaltria_librarian' },
        },
    art: [
      'YYYYYYYYYYYYYYYYYYYY',
      'YFFFFFFFFFFFFFFFFFFY',
      'YFYYFFFF1FFFFFFFYYFY',
      'YFYYFFFFFFFFFFFFYYFY',
      'YFFFFFYYYYYYYYFFFFFY',
      'YFFFFFY~~~~~~YFFFFFY',
      'YFFSFFY~~~~~~YFFIFFY',
      'YFFFFFY~~~~~~YFFFFFY',
      'YFFWFFY~~~~~~YFFHFFY',
      'YFFFFFYYYYYYYYFFFFFY',
      'YFYYYFFFFFFFFFFYYYFY',
      'YFYYY3FFFFFF2FFYYYFY',
      'YFFFFFFFFFCFFFFFFFFY',
      'YYYYYYYYYYYYYYYYYYYY',
    ],
  }),

  // 円形の広場から街道が放射状に伸びる月の都
  moonbrook_town: buildMap({
    id: 'moonbrook_town', name: 'ムーンブルク', kind: 'town', startX: 9, startY: 6,
    npcs: {
          '1': { id: 'moonbrook_celestia' },
          '2': { id: 'moonbrook_knight' },
          '3': { id: 'moonbrook_priestess' },
        },
    art: [
      'YYYYYYYYYYYYYYYYYYYY',
      'YYYYYYYYYFYYYYYYYYYY',
      'YYFYYYYYY1YYYYYYFYYY',
      'YYFYYYFFFFFFFYYYFYYY',
      'YYFYYSFFFFFFFWYYFYYY',
      'YYFYFFFFFFFFFFFYFYYY',
      'YYFFFFFFFFFFFFFFFYYY',
      'YYFYFFFFFFFFFFFYFYYY',
      'YYFYYFFFFFFFFFYYFYYY',
      'YYFYYIFFFFFFFHYYFYYY',
      'YYF2YYYYYFYYYYYY3YYY',
      'YYYYYYYYYFYYYYYYYYYY',
      'YYYYYYYYYCYYYYYYYYYY',
      'YYYYYYYYYYYYYYYYYYYY',
    ],
  }),

  // 海へ張り出した岩棚の上の小さな集落
  cliff_village: buildMap({
    id: 'cliff_village', name: '断崖の氏族村', kind: 'town', startX: 8, startY: 6,
    npcs: {
          '1': { id: 'cliff_elder' },
          '2': { id: 'cliff_fisher' },
        },
    art: [
      'YYYYYYYYYYYYYYYYYY',
      'YFFFFFYYYFFF~~~~~Y',
      'YFYYFFYYYFFF~~~~~Y',
      'YFYYFFFFFFFF~~~~~Y',
      'YFFFFFFFFFFF~~~~~Y',
      'YFF1FSFFFIFFFF~~~Y',
      'YFFFFFFFFFFFFF~~~Y',
      'YFYYYFFFFFF2FF~~~Y',
      'YFYYYFFFYYYFFFFFFY',
      'YFFFFFFFYYYFFFFFFY',
      'YFFFFFFFCFFFFFFFFY',
      'YYYYYYYYYYYYYYYYYY',
    ],
  }),

  // ============ フィールド ============
  // 森を縫う街道。北へ抜ける枝道と、南の行き止まりがある
  east_road: buildMap({
    id: 'east_road', name: '東方街道', kind: 'field', startX: 1, startY: 4,
    encounterTable: 'east_road', church: 'ラダトームの 教会',
    art: [
      '########################',
      '#..###........####.....#',
      '#..###..##....####.....#',
      '#.......##..=======.##.#',
      '#=====..##..=.....=.##.#',
      '#....=.~~~~.=.....=....#',
      '#.##.=.~~~~.=...##=....#',
      '#.##.=.~~~~#=...##=....#',
      '#.##.===========##=....#',
      '#.##..###......=##=.##.#',
      '#.....###......=..====C#',
      '#..............=....##.#',
      '#.......~~~.###........#',
      '#...####~~~.###...###..#',
      '#...####....###...###..#',
      '########################',
    ],
  }),

  // 大きな湖を抱く平原。街道は湖の北岸と南岸に分かれる
  azure_plain: buildMap({
    id: 'azure_plain', name: '蒼穹平原', kind: 'field', startX: 1, startY: 7,
    encounterTable: 'azure_plain', church: 'ラダトームの 教会',
    art: [
      '##########################',
      '#...........###..........#',
      '#..##.......###.....##...#',
      '#..##.==================C#',
      '#.....=~~.........=.##...#',
      '#.....=~~~~~~~~~~.=......#',
      '#.....=.~~~~~~~~~.=......#',
      '#======.~~~~~~~~~.=......#',
      '#.....=.~~~~~=~~~.=......#',
      '#.....=.~~~~~=~~~~=......#',
      '#.....=......=..~~=......#',
      '#...##========....=......#',
      '#...###......======###...#',
      '#..........##......###...#',
      '#..........##............#',
      '##########################',
    ],
  }),

  // 左手は海。細い桟道が崖を折り返しながら上っていく
  cliff_road: buildMap({
    id: 'cliff_road', name: '断崖の道', kind: 'field', startX: 7, startY: 16,
    encounterTable: 'cliff_road', church: '断崖の氏族村の 祠',
    chests: { '5': 'cliff_moon_gold' },
    art: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'X~~~~~~XXXXXXXCXXXXXXX',
      'X~~~~~~XXXXXXX=XXXXXXX',
      'X~~~~~~XXXXXXX=XXXXXXX',
      'X~=============XXXXXXX',
      'X~~~=~~XXXXXXXXXXXXXXX',
      'X~~~...XXXXXXXXXXXXXXX',
      'X~~~...XXXXXXXXXXXXXXX',
      'X~~===============XXXX',
      'X~~=~~~XXXXXXXXXOXXXXX',
      'X~~=~~~XXXXXXXX.5.XXXX',
      'X~~=~~~XXXXXXXXXXXXXXX',
      'X~~=========X=XXXXXXXX',
      'X~~~~~~=XXXXX=XXXXXXXX',
      'X~~~~~~=....X=XXXXXXXX',
      'X~~~~~~=XXXXX=XXXXXXXX',
      'X~~~~~~=======XXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXX',
    ],
  }),

  // ============ ダンジョン(宝箱は奥へ行くほど中身が良い)============
  // 柵と天幕で見通しの悪い屋外の陣。奥の天幕に首領がいる
  ogre_camp: buildMap({
    id: 'ogre_camp', name: 'はぐれオーガの野営地', kind: 'dungeon', startX: 1, startY: 14,
    encounterTable: 'ogre_camp', church: 'ローレシア城下の 教会', bossId: 'galoz',
    chests: { '1': 'ogre_gold_s', '2': 'ogre_yakusou', '3': 'ogre_shield', '4': 'ogre_gold_l' },
    art: [
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XD1DDDDDDXDDDDDDDXXXXXXX',
      'XDDDDDDXXXDDDDD2DXDDDBXX',
      'XDDXXDDXXXDDDDDDDXDDDDXX',
      'XDDXXDDDDDDDXXDDDDDDDDXX',
      'XDDDDDDDDXDDXXDDDXDDDDXX',
      'XDDDDDDDDXDDXXDDDXXXXXXX',
      'XDDDDDDDDDDDDDDDDDDDDDDX',
      'XDDDDXXXDDDDDDDDDDDDDDDX',
      'XDDDDXXXDDXXXXDDDXDDDDDX',
      'XDDDDDDDDDXXXXDDDXDDXXDX',
      'XDDDDDDDDDDDDDDDDXDDXXDX',
      'XDDXXDDDDDDDDDXXXDDDXXDX',
      'XDDXXD3DDDDDDDXXXXD4DDDX',
      'XDDDDDDDDDDDDDDDDXDDDDDX',
      'XXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  }),

  // 柱の並ぶ大広間を、左右交互の階段で四層のぼる
  azure_tower: buildMap({
    id: 'azure_tower', name: '蒼穹の塔', kind: 'dungeon', startX: 4, startY: 15,
    encounterTable: 'azure_tower', church: 'ラダトームの 教会', bossId: 'astro_guardian',
    chests: { '1': 'tower_mahou', '2': 'tower_gofu', '3': 'tower_gold', '4': 'tower_staff' },
    art: [
      'XXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXX',
      'XXDDDDDDDDBDDDDDDDXX',
      'XXDDDDXXDDDDXXDDDDXX',
      'XXDDDDDDDDDDDDDD4DXX',
      'XXXXXXXXXXXXXXXXXDXX',
      'XXDDDDDDDDDDDDDDDDXX',
      'XXDDDDXXDDDDXXDDDDXX',
      'XXD3DDLDDDDDDDDDDDXX',
      'XXDXXXXXXXXXXXXXXXXX',
      'XXDDDDDDDDDDDDDDDDXX',
      'XXDDDDXXDDDDXXDDDDXX',
      'XXDDDLDDDDDDDDDDD2XX',
      'XXXXXXXXXXXXXXXXXDXX',
      'XXDDDDDDDDDDDDDDDDXX',
      'XXDDDDXXDDDDXXDDDDXX',
      'XX1DDLDDDDDDDDDDDDXX',
      'XXXXXXXXXXXXXXXXXXXX',
    ],
  }),

  // 小部屋が格子状に並ぶ納骨堂。扉の無い袋小路が多い
  academy_altar: buildMap({
    id: 'academy_altar', name: '学院地下祭壇', kind: 'dungeon', startX: 2, startY: 2,
    encounterTable: 'academy_altar', church: '学院都市サマルトリアの 礼拝堂', bossId: 'magatsuki',
    chests: { '1': 'altar_seisui', '2': 'altar_gold', '3': 'altar_earring' },
    art: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XDDDDDDDDDDDDDDDDDD2DDDDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XXDXXXXXXXXXDXXXXXXXXXDXXX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XDDDDDDDDDXDDDDXDDDDDDBDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XXXXXXXDXXXXXXXXXDXXXXXXXX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'X1DDDDDDDDDDD3DDDDDDDDDDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XDDDDXDDDDXDDDDXDDDDXDDDDX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  }),

  // 地底湖を抱く洞窟。うねる回廊が水際を回り込む
  abyss_depth: buildMap({
    id: 'abyss_depth', name: '業の底', kind: 'dungeon', startX: 1, startY: 16,
    encounterTable: 'abyss_depth', church: 'ムーンブルクの 月の神殿', bossId: 'abyss_matriarch',
    chests: { '1': 'abyss_jokyu', '2': 'abyss_phoenix', '3': 'abyss_gold', '4': 'abyss_brooch' },
    art: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXDDDXXXXDDDXXXXXXXX',
      'XXXXXXXXDDDDDDDDDDXXXXXXXX',
      'XXXXXXXXDDDXXXXDD3XXXXXXXX',
      'XXXXXXXXXDXXXXXXDXXXXXXXXX',
      'XXX2DDXXDDDX~~~~DDXXDDDXXX',
      'XXXDDDDDDDDX~~~~DDDDDDDXXX',
      'XXXDDDXXDDDX~~~~DDXXDDDXXX',
      'XXXXDXXXXXXX~~~~XXXXXDXXXX',
      'XXXDDDXXXXDDDXXXXXXXXDXXXX',
      'XDDDDDDDDDDDDXDDDXXXDDDXXX',
      'XDDDDDDDXXDDDXDDDDDDDDDBDX',
      'XDDXXDDDXXXDXXDDDXXXDDDDDX',
      'XDXXXDDDXXDDDXXDXX~~~XDDDX',
      'XD1XXDDDDDDDDXDDDX~~~XDDDX',
      'XDDXXDDDXXDDDXDDDD4DDDDDDX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  }),

  // 中心へ向かって渦を巻く同心の回廊。最奥に禍の核がある
  forbidden_ritual_chamber: buildMap({
    id: 'forbidden_ritual_chamber', name: '禁呪暴走空間', kind: 'dungeon', startX: 1, startY: 1,
    encounterTable: 'forbidden_ritual_chamber', church: '学院都市サマルトリアの 礼拝堂', bossId: 'genso_no_katsubo',
    chests: { '1': 'ritual_phoenix', '2': 'ritual_ring', '3': 'ritual_armor', '4': 'ritual_gold' },
    art: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XDDDDLDDDDDDDDDDDDDD2X',
      'XDXXXXXXXXXDXXXXXXXXDX',
      'XDXXDDDLDDDDDDDDD4XXDX',
      'XDXXDXXXXXXXXXXXXDXXDX',
      'XDXXDXXDDDLDDDDXXDXXDX',
      'XDXXDXXDXXDXXXDXXDXXDX',
      'XDXXDXXDXDDDDXDXXDXXDX',
      'XDXXDXXDXDBDDXDXXDXXDX',
      'XDXXDXXDXDDDDXDXXDXXDX',
      'XDXXDXXDXDDDDXDXXDXXDX',
      'XDXXDXXDXXXXXXDXXDXXDX',
      'XDXXDXXDDDDDDDDXXDXXDX',
      'XDXXDXXXXXXDXXXXXDXXDX',
      'XDXX3DDDDDLDDDDDDDXXDX',
      'XDXXXXXXXXXXXXXXXXXXDX',
      'X1DDDDDDDDDDDDDDDDDDDX',
      'XXXXXXXXXXXXXXXXXXXXXX',
    ],
  }),

};
