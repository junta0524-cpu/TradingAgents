// ステータスメニュー ― フィールド上で Enter(confirm) を押すと開く簡易パーティ確認画面
var Game = window.Game || {};
Game.Menu = (function () {
  var open = false;

  function toggle() { open = !open; }
  function isOpen() { return open; }
  function close() { open = false; }

  function update() {
    if (!open) return;
    if (Game.Input.wasPressed('cancel') || Game.Input.wasPressed('confirm')) close();
  }

  function draw(ctx, W, H) {
    if (!open) return;
    var x = W / 2 - 160, y = 60, w = 320, h = 220;
    Game.Renderer.drawPanel(ctx, x, y, w, h);
    Game.Renderer.drawText(ctx, 'パーティ', x + 16, y + 30, { size: 16, color: '#d4af5a' });
    Game.Party.list().forEach(function (m, i) {
      var ly = y + 60 + i * 60;
      Game.Renderer.drawText(ctx, m.name + '  Lv' + m.level, x + 16, ly, { size: 14 });
      Game.Renderer.drawText(ctx, 'HP', x + 16, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 44, ly + 14, 110, 8, m.hp / m.maxHp, '#5fae5f');
      Game.Renderer.drawText(ctx, m.hp + '/' + m.maxHp, x + 160, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawText(ctx, 'MP', x + 200, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 228, ly + 14, 70, 8, m.maxMp ? m.mp / m.maxMp : 0, '#5c8ecf');
    });
    Game.Renderer.drawText(ctx, 'しょじきん: ' + Game.Party.gold() + 'G', x + 16, y + h - 16, { size: 13, color: '#a49b86' });
    Game.Renderer.drawText(ctx, 'X または Enter で とじる', x + w - 16, y + h - 16, { size: 11, align: 'right', color: '#6b6354' });
  }

  return { toggle: toggle, isOpen: isOpen, close: close, update: update, draw: draw };
})();
