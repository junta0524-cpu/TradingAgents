// 選択肢 ― 物語の分かれ道で「どちらを選ぶか」をプレイヤーに委ねる小さな画面。
// メッセージウィンドウの上に重ねて出し、選び終わるまで他の操作を止める。
var Game = window.Game || {};
Game.Choice = (function () {
  var state = null;   // { prompt, options, cursor, cb }

  function isOpen() { return !!state; }

  // options は [{ label, note }]。選ばれた添字を cb に渡す。
  function open(prompt, options, cb) {
    state = { prompt: prompt, options: options, cursor: 0, cb: cb };
  }

  function update() {
    if (!state) return;
    var n = state.options.length;
    if (Game.Input.wasPressed('down')) state.cursor = (state.cursor + 1) % n;
    if (Game.Input.wasPressed('up')) state.cursor = (state.cursor - 1 + n) % n;
    // ここでは「もどる」を受け付けない。物語の分岐は、選ばないと先へ進めない。
    if (!Game.Input.wasPressed('confirm')) return;
    var picked = state.cursor;
    var cb = state.cb;
    state = null;
    cb && cb(picked);
  }

  function draw(ctx, W, H) {
    if (!state) return;
    ctx.fillStyle = 'rgba(8,10,18,0.78)';
    ctx.fillRect(0, 0, W, H);

    var w = W - 80, x = 40;
    var h = 96 + state.options.length * 34;
    var y = Math.round((H - h) / 2);
    Game.Renderer.drawPanel(ctx, x, y, w, h);

    Game.Renderer.drawText(ctx, state.prompt, x + 20, y + 34, { size: 15, color: '#d4af5a' });
    state.options.forEach(function (o, i) {
      var ly = y + 74 + i * 34;
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + o.label, x + 20, ly,
        { size: 15, color: sel ? '#ece7da' : '#a49b86' });
      if (o.note) {
        Game.Renderer.drawText(ctx, o.note, x + w - 20, ly,
          { size: 11, align: 'right', color: '#6b6354' });
      }
    });
    Game.Renderer.drawText(ctx, '↑↓ でえらび Z できめる', x + 20, y + h - 14,
      { size: 12, color: '#6b6354' });
  }

  return { open: open, isOpen: isOpen, update: update, draw: draw };
})();
