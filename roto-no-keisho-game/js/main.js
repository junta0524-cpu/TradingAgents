// エントリーポイント
window.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('game-canvas');
  Game.Core.init(canvas);
  Game.Touch.mount(); // 指で操作する端末なら、画面下に仮想パッドを出す
});
