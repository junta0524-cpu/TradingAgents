// さくせん ― パーティ全体の戦い方。
//
// 後期のシリーズ作の「せめまくれ」に当たるもの。
// 4人ぶんのコマンドを毎ラウンド選ばせるのは、その気が無いときには
// ただの手間になる。方針だけ決めておけば、あとは自分で動いてもらう。
//
// 選んだ方針は戦闘中でも変えられ、たびのきろくにも残る。
var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.Tactics = [
  { id: 'manual',   name: 'ひとりずつ さしずする', note: 'ひとりずつ 指図する' },
  { id: 'attack',   name: 'せめまくれ', note: '強い技で 攻めきる' },
  { id: 'careful',  name: 'いのちをまもれ', note: '傷を先に 手あてする' },
  { id: 'nomagic',  name: 'じゅもんは ひかえろ', note: 'MPを 使わない' },
];

Game.Data.tacticOf = function (id) {
  for (var i = 0; i < Game.Data.Tactics.length; i++) {
    if (Game.Data.Tactics[i].id === id) return Game.Data.Tactics[i];
  }
  return Game.Data.Tactics[0];
};
