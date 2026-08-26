// メッセージウィンドウ ― フィールド/戦闘共通で使うテキスト表示キュー
var Game = window.Game || {};
Game.Dialogue = (function () {
  var queue = [];
  var onDone = null;

  function show(text, cb) {
    queue.push(text);
    if (cb) onDone = cb;
  }

  function isActive() { return queue.length > 0; }

  function update() {
    if (!isActive()) return;
    if (Game.Input.wasPressed('confirm')) {
      queue.shift();
      if (queue.length === 0 && onDone) {
        var cb = onDone; onDone = null; cb();
      }
    }
  }

  function draw(ctx, canvasW, canvasH) {
    if (!isActive()) return;
    var h = 88;
    var y = canvasH - h;
    Game.Renderer.drawPanel(ctx, 8, y, canvasW - 16, h - 8);
    Game.Renderer.drawText(ctx, queue[0], 24, y + 34, { size: 16 });
    Game.Renderer.drawText(ctx, '▼ Zキーで進む', canvasW - 24, y + h - 20, { size: 12, align: 'right', color: '#a49b86' });
  }

  return { show: show, isActive: isActive, update: update, draw: draw };
})();
