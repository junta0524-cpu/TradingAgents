// マップデータ ― 地誌譜「東方街道」のタイルマップ実装(序盤フィールドの土台)
var Game = window.Game || {};
Game.Data = Game.Data || {};

// タイル凡例:  # 木(進入不可)  . 草原(遭遇率:高)  = 街道(遭遇率:低)  ~ 水場(進入不可)  C 街の門(到達でイベント)
Game.Data.TileDefs = {
  '#': { walkable: false, color: '#3c5c33', encounter: 0 },
  '.': { walkable: true, color: '#6fa84a', encounter: 0.09 },
  '=': { walkable: true, color: '#c9b27c', encounter: 0.035 },
  '~': { walkable: false, color: '#3d6e86', encounter: 0 },
  'C': { walkable: true, color: '#b08d3e', encounter: 0, isGate: true },
};

var eastRoad = [
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

Game.Data.Maps = {
  east_road: {
    id: 'east_road',
    name: '東方街道',
    tiles: eastRoad,
    startX: 2,
    startY: 4,
    encounterTable: 'east_road', // Game.Data.EncounterTable を参照
    onGate: { message: 'ローレシア城の門が見えてきた……。(この先は次の開発フェーズで実装)', },
  },
};
