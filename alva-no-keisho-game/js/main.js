// エントリーポイント
window.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('game-canvas');
  Game.Assets.load(); // 届いている絵を先に読み込む(無いものは色面のまま)
  Game.Core.init(canvas);
  Game.Touch.mount(); // 指で操作する端末なら、画面下に仮想パッドを出す
});
