// マップデータ ― 地誌譜の全13ロケーションをタイルマップ化。
// フィールド/ダンジョン/街はそれぞれ共通ジェネレータで生成し(現状は色面のプレースホルダー)、
// 実タイル絵に差し替える際もこの生成部分だけ置き換えれば良い構造にしている。
var Game = window.Game || {};
Game.Data = Game.Data || {};

// タイル凡例:
//   #木(進入不可) .草原(遭遇率:高) =街道(遭遇率:低) ~水場(進入不可)
//   D ダンジョン床(遭遇率:中)      F 街の床(遭遇率:なし)
//   C 出口/門(到達でイベント)      B ボス部屋(到達でボス戦)   N NPC(会話イベント)
Game.Data.TileDefs = {
  '#': { walkable: false, color: '#3c5c33', encounter: 0 },
  '.': { walkable: true, color: '#6fa84a', encounter: 0.09 },
  '=': { walkable: true, color: '#c9b27c', encounter: 0.035 },
  '~': { walkable: false, color: '#3d6e86', encounter: 0 },
  'D': { walkable: true, color: '#4a4658', encounter: 0.14 },
  'F': { walkable: true, color: '#b7a888', encounter: 0 },
  'C': { walkable: true, color: '#b08d3e', encounter: 0, isGate: true },
  'B': { walkable: true, color: '#8a3230', encounter: 0, isBoss: true },
  'N': { walkable: true, color: '#8a76b8', encounter: 0, isNpc: true },
};

// ---- フィールド(街道)テンプレート:東方街道で検証済みの形をそのまま使い回す ----
function fieldGrid() {
  return [
    '####################',
    '#..................#',
    '#..##..........##..#',
    '#..............=...#',
    '#===============C..#',
    '#..............=...#',
    '#..##..........##..#',
    '#..................#',
    '#....~~~....###....#',
    '#....~~~....###....#',
    '#..................#',
    '#..##..........##..#',
    '#..................#',
    '####################',
  ];
}

// ---- ダンジョン:壁で仕切った蛇腹通路を生成し、最奥にボス部屋を置く(接続保証) ----
function dungeonGrid(cols, rows) {
  cols = cols || 20; rows = rows || 14;
  var grid = [];
  for (var y = 0; y < rows; y++) grid.push(new Array(cols).fill('#'));
  var corridorRows = [];
  for (var ry = 1; ry < rows - 1; ry += 2) corridorRows.push(ry);
  corridorRows.forEach(function (ry, idx) {
    for (var cx = 1; cx < cols - 1; cx++) grid[ry][cx] = 'D';
    if (idx < corridorRows.length - 1) {
      var nextRy = corridorRows[idx + 1];
      var connX = (idx % 2 === 0) ? cols - 2 : 1;
      for (var cy = ry; cy <= nextRy; cy++) grid[cy][connX] = 'D';
    }
  });
  var lastIdx = corridorRows.length - 1;
  var lastRy = corridorRows[lastIdx];
  var endX = (lastIdx % 2 === 0) ? cols - 2 : 1;
  grid[lastRy][endX] = 'B';
  return grid.map(function (row) { return row.join(''); });
}

// ---- 街:安全な広場 + 会話イベントタイル + 出口 ----
function townGrid(cols, rows, npcSpots) {
  cols = cols || 16; rows = rows || 10;
  var grid = [];
  for (var y = 0; y < rows; y++) {
    var row = [];
    for (var x = 0; x < cols; x++) {
      row.push((y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? '#' : 'F');
    }
    grid.push(row);
  }
  grid[rows - 2][Math.floor(cols / 2)] = 'C';
  (npcSpots || []).forEach(function (p) { grid[p.y][p.x] = 'N'; });
  return grid.map(function (row) { return row.join(''); });
}

Game.Data.Maps = {
  // 街
  radatome: { id: 'radatome', name: 'ラダトーム', kind: 'town', tiles: townGrid(16, 10, [{ x: 4, y: 4 }]), startX: 8, startY: 7 },
  loureshia_town: { id: 'loureshia_town', name: 'ローレシア城下', kind: 'town', tiles: townGrid(16, 10, [{ x: 4, y: 4 }, { x: 11, y: 4 }]), startX: 8, startY: 7 },
  samaltria_town: { id: 'samaltria_town', name: '学院都市サマルトリア', kind: 'town', tiles: townGrid(16, 10, [{ x: 4, y: 4 }, { x: 11, y: 4 }]), startX: 8, startY: 7 },
  moonbrook_town: { id: 'moonbrook_town', name: 'ムーンブルク', kind: 'town', tiles: townGrid(16, 10, [{ x: 4, y: 4 }]), startX: 8, startY: 7 },
  cliff_village: { id: 'cliff_village', name: '断崖の氏族村', kind: 'town', tiles: townGrid(14, 9, [{ x: 4, y: 4 }]), startX: 7, startY: 6 },

  // フィールド
  east_road: { id: 'east_road', name: '東方街道', kind: 'field', tiles: fieldGrid(), startX: 2, startY: 4, encounterTable: 'east_road' },
  azure_plain: { id: 'azure_plain', name: '蒼穹平原', kind: 'field', tiles: fieldGrid(), startX: 2, startY: 4, encounterTable: 'azure_plain' },
  cliff_road: { id: 'cliff_road', name: '断崖の道', kind: 'field', tiles: fieldGrid(), startX: 2, startY: 4, encounterTable: 'cliff_road' },

  // ダンジョン
  ogre_camp: { id: 'ogre_camp', name: 'はぐれオーガの野営地', kind: 'dungeon', tiles: dungeonGrid(), startX: 1, startY: 1, encounterTable: 'ogre_camp', bossId: 'galoz' },
  azure_tower: { id: 'azure_tower', name: '蒼穹の塔', kind: 'dungeon', tiles: dungeonGrid(), startX: 1, startY: 1, encounterTable: 'azure_tower', bossId: 'astro_guardian' },
  academy_altar: { id: 'academy_altar', name: '学院地下祭壇', kind: 'dungeon', tiles: dungeonGrid(), startX: 1, startY: 1, encounterTable: 'academy_altar', bossId: 'magatsuki' },
  abyss_depth: { id: 'abyss_depth', name: '業の底', kind: 'dungeon', tiles: dungeonGrid(), startX: 1, startY: 1, encounterTable: 'abyss_depth', bossId: 'abyss_matriarch' },
  forbidden_ritual_chamber: { id: 'forbidden_ritual_chamber', name: '禁呪暴走空間', kind: 'dungeon', tiles: dungeonGrid(), startX: 1, startY: 1, encounterTable: 'forbidden_ritual_chamber', bossId: 'genso_no_katsubo' },
};
