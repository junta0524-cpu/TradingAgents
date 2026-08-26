// ゲーム全体の状態管理 ― タイトル / フィールド / 戦闘 / エンディング の切り替えとメインループ
var Game = window.Game || {};
Game.Core = (function () {
  var canvas, ctx;
  var W = 640, H = 480;
  var mode = 'title'; // 'title' | 'field' | 'battle' | 'ending'

  function init(canvasEl) {
    canvas = canvasEl;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    requestAnimationFrame(loop);
  }

  function startNewGame() {
    Game.Party.init();
    mode = 'field';
    Game.Story.begin(function (nextMode) { mode = nextMode; });
  }

  function onPartyWiped() {
    // DQ 式の温情リスポーン: HPが少し残った状態で、そのマップの入り口からやり直す
    Game.Party.list().forEach(function (m) { m.hp = Math.max(1, Math.floor(m.maxHp * 0.3)); });
    Game.Field.resetToStart();
    Game.Dialogue.show('目の前が まっくらに なった……。一行は 気を取り直して、入り口から 歩き出した。');
  }

  function update() {
    if (mode === 'title') {
      if (Game.Input.wasPressed('confirm')) startNewGame();
    } else if (mode === 'field') {
      if (Game.Story.isFinished()) { mode = 'ending'; Game.Input.endFrame(); return; }
      var dialogueWasActive = Game.Dialogue.isActive();
      Game.Dialogue.update();
      // ダイアログを閉じたのと同じフレームの confirm 入力を、
      // メニュー開閉やフィールド操作へ二重に使ってしまわないようにする
      if (dialogueWasActive) {
        // このフレームは何もしない
      } else if (Game.Menu.isOpen()) {
        Game.Menu.update();
      } else if (Game.Input.wasPressed('confirm')) {
        Game.Menu.toggle();
      } else {
        Game.Field.update();
      }
    } else if (mode === 'battle') {
      Game.Battle.update();
    } else if (mode === 'ending') {
      // エンディングでは操作待ちのみ
    }
    Game.Input.endFrame();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'title') {
      drawTitle();
    } else if (mode === 'field') {
      Game.Field.draw(ctx);
      drawChapterBanner();
      Game.Menu.draw(ctx, W, H);
      Game.Dialogue.draw(ctx, W, H);
    } else if (mode === 'battle') {
      Game.Battle.draw(ctx, W, H);
    } else if (mode === 'ending') {
      drawEnding();
    }
  }

  function drawChapterBanner() {
    Game.Renderer.drawText(ctx, Game.Story.currentTitle(), 12, 20, { size: 12, color: '#d4af5a' });
  }

  function drawTitle() {
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);
    Game.Renderer.drawText(ctx, 'ロトの継承', W / 2, H / 2 - 40, { align: 'center', size: 32, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, '― 三国建国記 ―', W / 2, H / 2 - 10, { align: 'center', size: 14, color: '#a49b86' });
    Game.Renderer.drawText(ctx, 'Z / Enter でスタート', W / 2, H / 2 + 60, { align: 'center', size: 14 });
  }

  function drawEnding() {
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);
    Game.Renderer.drawText(ctx, '― ロトの継承 完 ―', W / 2, H / 2 - 30, { align: 'center', size: 26, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, 'この物語は、百年後の「ムーンブルク王国陥落」へと続いていく。', W / 2, H / 2 + 20, { align: 'center', size: 13, color: '#a49b86' });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  return { init: init, onPartyWiped: onPartyWiped };
})();
