// 画像素材の読み込み ― 届いたものだけ絵で描き、まだ無いものは今までの色面のままにする。
// 1枚ずつ差し替えていけるよう、読み込みに失敗しても何も壊れない造りにしている。
var Game = window.Game || {};
Game.Assets = (function () {
  var BASE = 'assets/';
  var images = {};   // パス -> Image(読み込み済みのものだけ)
  var pending = 0;

  // タイル記号 -> 画像。ここに足せばそのタイルが絵になる。
  var TILE_FILES = {
    '.': 'tiles/tile_grass.png',
    '=': 'tiles/tile_road.png',
    '#': 'tiles/tile_forest.png',
    'X': 'tiles/tile_rock.png',
    'Y': 'tiles/tile_building.png',
    '~': 'tiles/tile_water.png',
    'D': 'tiles/tile_dungeon.png',
    'F': 'tiles/tile_town.png',
    'C': 'tiles/tile_gate.png',
    'B': 'tiles/tile_boss.png',
    'T': 'tiles/tile_chest.png',
    'S': 'tiles/tile_shop_item.png',
    'W': 'tiles/tile_shop_gear.png',
    'I': 'tiles/tile_inn.png',
    'H': 'tiles/tile_church.png',
    'K': 'tiles/tile_throne.png',
  };

  // 戦闘背景とタイトル画面。キャンバスと同じ 640×480 で持つ。
  // 元絵は 320×240 で描かれているので、1ドット=2px にちょうど乗る。
  var BG_FILES = ['title', 'battle_field', 'battle_cliff',
                  'battle_dungeon', 'battle_cave', 'battle_ritual'];

  // どの場所の戦いで、どの背景を敷くか。載っていない場所は今までどおり色面のまま。
  var BG_FOR_MAP = {
    east_road: 'battle_field',
    azure_plain: 'battle_field',
    cliff_road: 'battle_cliff',
    ogre_camp: 'battle_dungeon',
    academy_altar: 'battle_dungeon',
    azure_tower: 'battle_ritual',
    forbidden_ritual_chamber: 'battle_ritual',
    abyss_depth: 'battle_cave',
  };

  // 人物のスプライト。1マス(32px)より背が高く、足元をマスの下端に合わせて描く。
  var SPRITE_W = 32, SPRITE_H = 48;
  var CHAR_IDS = ['rota', 'elrode', 'celestia', 'garai',
                  'npc_king', 'npc_soldier', 'npc_oldwoman', 'npc_smith',
                  'npc_noble', 'npc_scholar', 'npc_priestess', 'npc_fisher',
                  'roula', 'vance', 'vance_fallen', 'barrows'];

  // 街の人がどのスプライトで立つか。無いものは今までどおり色の四角になる。
  var NPC_SPRITE = {
    radatome_king: 'npc_king',
    radatome_soldier: 'npc_soldier',
    radatome_oldwoman: 'npc_oldwoman',
    loureshia_roula: 'roula',
    loureshia_smith: 'npc_smith',
    loureshia_noble: 'npc_noble',
    loureshia_garai: 'garai',
    samaltria_elrode: 'elrode',
    samaltria_vance: 'vance',
    samaltria_librarian: 'npc_scholar',
    moonbrook_celestia: 'celestia',
    moonbrook_knight: 'npc_soldier',
    moonbrook_priestess: 'npc_priestess',
    cliff_elder: 'npc_oldwoman',
    cliff_fisher: 'npc_fisher',
  };

  function tryLoad(path) {
    // 単一ファイル版のプレビューでは assets/ を読めないので、
    // 埋め込まれた data URI があればそちらを使う。
    var inline = window.__INLINE_ASSETS__ && window.__INLINE_ASSETS__[path];
    pending += 1;
    var img = new Image();
    img.onload = function () { images[path] = img; pending -= 1; };
    img.onerror = function () { pending -= 1; };  // まだ描かれていないだけ。無視してよい
    img.src = inline || (BASE + path);
  }

  // 歩行アニメのシート。1枚に3コマ(横に並べる)で、向きごとに1枚。
  // 左右は同じ絵を左右反転して使うので "side" の1枚で足りる。
  var WALK_DIRS = ['down', 'up', 'side'];
  var WALK_FRAMES = 3;

  function load() {
    Object.keys(TILE_FILES).forEach(function (ch) { tryLoad(TILE_FILES[ch]); });
    CHAR_IDS.forEach(function (id) {
      tryLoad('chars/' + id + '.png');
      WALK_DIRS.forEach(function (d) { tryLoad('chars/' + id + '_walk_' + d + '.png'); });
    });
    BG_FILES.forEach(function (id) { tryLoad('bg/' + id + '.png'); });
  }

  // 背景。まだ届いていないものは null を返し、呼び出し側が色面で描く。
  function bg(id) { return id ? images['bg/' + id + '.png'] || null : null; }
  function battleBg(mapId) { return bg(BG_FOR_MAP[mapId]); }

  // その向きの歩行シートを返す。まだ無ければ null(立ち絵1枚で代用される)
  function walkSheet(id, dir) {
    var key = (dir === 'left' || dir === 'right') ? 'side' : dir;
    var img = images['chars/' + id + '_walk_' + key + '.png'];
    if (!img) return null;
    return { img: img, frames: WALK_FRAMES, flip: dir === 'left' };
  }

  function tile(ch) {
    var p = TILE_FILES[ch];
    return p ? images[p] || null : null;
  }
  function sprite(id) { return id ? images['chars/' + id + '.png'] || null : null; }
  function spriteForNpc(npcId) { return sprite(NPC_SPRITE[npcId]); }

  return {
    load: load, tile: tile, sprite: sprite, spriteForNpc: spriteForNpc,
    walkSheet: walkSheet, WALK_FRAMES: WALK_FRAMES,
    bg: bg, battleBg: battleBg,
    SPRITE_W: SPRITE_W, SPRITE_H: SPRITE_H,
    isLoading: function () { return pending > 0; },
  };
})();
