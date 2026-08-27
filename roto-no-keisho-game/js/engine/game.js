// ゲーム全体の状態管理 ― タイトル / フィールド / 戦闘 / エンディング の切り替えとメインループ
var Game = window.Game || {};
Game.Core = (function () {
  var canvas, ctx;
  var W = 640, H = 480;
  var mode = 'title'; // 'title' | 'field' | 'battle' | 'shop' | 'ending'
  var titleCursor = 0;

  function titleOptions() {
    return Game.Save.exists() ? ['つづきから', 'はじめから'] : ['はじめから'];
  }

  function init(canvasEl) {
    canvas = canvasEl;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    Game.Dialogue.setWidth(W); // 会話ウィンドウの折り返し幅をキャンバス幅に合わせる
    requestAnimationFrame(loop);
  }

  function onModeChange(nextMode) { mode = nextMode; }

  function startNewGame() {
    Game.Save.clear();
    Game.Party.init();
    mode = 'field';
    Game.Story.begin(onModeChange);
  }

  function continueGame() {
    if (!Game.Save.load(onModeChange)) { startNewGame(); return; }
    mode = 'field';
    Game.Dialogue.show('ぼうけんのしょから 旅を再開した。');
  }

  function onPartyWiped() {
    // DQ 式の温情リスポーン: HP/MPが少し残った状態で、そのマップの入り口からやり直す
    // (MPも戻さないと、立て直す手段が無いまま同じ場所で詰んでしまう)
    Game.Party.list().forEach(function (m) {
      m.hp = Math.max(1, Math.floor(m.maxHp * 0.3));
      m.mp = Math.max(m.mp, Math.floor(m.maxMp * 0.3));
      m.guarding = false;
    });
    // DQ の慣例にならい、全滅すると所持金の半分を落とす
    var lost = Math.floor(Game.Party.gold() / 2);
    Game.Party.spend(lost);
    Game.Field.resetToStart();
    Game.Dialogue.show('目の前が まっくらに なった……。', function () {
      Game.Dialogue.show(lost > 0
        ? '気がつくと 入り口に 倒れていた。' + lost + 'ゴールドを 失ってしまった……'
        : '気がつくと 入り口に 倒れていた。');
    });
  }

  function update() {
    if (mode === 'title') {
      var opts = titleOptions();
      if (Game.Input.wasPressed('down')) titleCursor = (titleCursor + 1) % opts.length;
      if (Game.Input.wasPressed('up')) titleCursor = (titleCursor - 1 + opts.length) % opts.length;
      if (Game.Input.wasPressed('confirm')) {
        if (opts[titleCursor] === 'つづきから') continueGame(); else startNewGame();
      }
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
    } else if (mode === 'shop') {
      Game.Shop.update();
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
    } else if (mode === 'shop') {
      Game.Field.draw(ctx); // 店の背景として街を描いておく
      Game.Shop.draw(ctx, W, H);
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
    Game.Renderer.drawText(ctx, 'ロトの継承', W / 2, H / 2 - 70, { align: 'center', size: 32, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, '― 三国建国記 ―', W / 2, H / 2 - 40, { align: 'center', size: 14, color: '#a49b86' });

    var opts = titleOptions();
    opts.forEach(function (label, i) {
      var selected = i === titleCursor;
      Game.Renderer.drawText(ctx, (selected ? '▶ ' : '　') + label, W / 2, H / 2 + 10 + i * 28,
        { align: 'center', size: 16, color: selected ? '#d4af5a' : '#ece7da' });
    });

    var sum = Game.Save.summary();
    if (sum) {
      Game.Renderer.drawText(ctx, sum.title + '  /  Lv' + sum.level + '  なかま' + sum.partySize + '人',
        W / 2, H / 2 + 84, { align: 'center', size: 12, color: '#a49b86' });
    }
    Game.Renderer.drawText(ctx, '↑↓ でえらび Z / Enter できめる', W / 2, H - 30,
      { align: 'center', size: 12, color: '#6b6354' });
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
