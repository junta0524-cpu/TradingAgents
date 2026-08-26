// ゲーム全体の状態管理 ― タイトル / フィールド / 戦闘 の切り替えとメインループ
var Game = window.Game || {};
Game.Core = (function () {
  var canvas, ctx;
  var W = 640, H = 480;
  var mode = 'title'; // 'title' | 'field' | 'battle'

  function init(canvasEl) {
    canvas = canvasEl;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    Game.Party.init();
    Game.Field.load('east_road', {
      onEncounter: function (monsterId) {
        mode = 'battle';
        Game.Battle.start([monsterId], onBattleEnd);
      },
      onGate: function () {
        Game.Dialogue.show(Game.Data.Maps.east_road.onGate.message);
      },
    });

    requestAnimationFrame(loop);
  }

  function onBattleEnd(result) {
    mode = 'field';
    if (result === 'lost') {
      // DQ 式の温情リスポーン: HPが少し残った状態で入口へ
      Game.Party.list().forEach(function (m) { m.hp = Math.max(1, Math.floor(m.maxHp * 0.3)); });
      Game.Dialogue.show('目の前が まっくらに なった……。ロトは 街道の入口で 目を覚ました。');
    }
  }

  function update() {
    if (mode === 'title') {
      if (Game.Input.wasPressed('confirm')) mode = 'field';
    } else if (mode === 'field') {
      Game.Dialogue.update();
      if (!Game.Dialogue.isActive()) {
        if (Game.Menu.isOpen()) {
          Game.Menu.update();
        } else if (Game.Input.wasPressed('confirm')) {
          Game.Menu.toggle();
        } else {
          Game.Field.update();
        }
      }
    } else if (mode === 'battle') {
      Game.Battle.update();
    }
    Game.Input.endFrame();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'title') {
      drawTitle();
    } else if (mode === 'field') {
      Game.Field.draw(ctx);
      Game.Menu.draw(ctx, W, H);
      Game.Dialogue.draw(ctx, W, H);
    } else if (mode === 'battle') {
      Game.Battle.draw(ctx, W, H);
    }
  }

  function drawTitle() {
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);
    Game.Renderer.drawText(ctx, 'ロトの継承', W / 2, H / 2 - 40, { align: 'center', size: 32, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, '― 三国建国記 ―', W / 2, H / 2 - 10, { align: 'center', size: 14, color: '#a49b86' });
    Game.Renderer.drawText(ctx, 'Z / Enter でスタート', W / 2, H / 2 + 60, { align: 'center', size: 14 });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  return { init: init };
})();
