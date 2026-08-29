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

  function onModeChange(nextMode) {
    mode = nextMode;
    updateBgm();
  }

  // 場面に合った曲へ。町と野外は同じ「フィールド」扱いにせず、
  // 町に入ったら落ち着いた曲に変える(ドラクエで街に着いたときのあの感じ)。
  function updateBgm() {
    if (mode === 'title') { Game.Audio.bgm('title'); return; }
    if (mode === 'ending') { Game.Audio.bgm('ending'); return; }
    if (mode === 'battle') {
      var map = Game.Field.currentMap();
      // ボス床のあるダンジョンで戦っていても、雑魚戦は通常の戦闘曲のまま。
      // ボス曲は Story がボス戦を始めるときに指定する
      Game.Audio.bgm(bossFight ? 'boss' : 'battle');
      return;
    }
    var m = Game.Field.currentMap();
    Game.Audio.bgm(m && m.kind === 'town' ? 'town' : 'field');
  }

  // いまボスと戦っているか。Story から知らせてもらう
  var bossFight = false;
  function setBossFight(on) { bossFight = !!on; }

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

  // 全滅したときの扱い。DQ にならって、いちばん近い町の教会で目を覚ます。
  // 傷は神官がすべて癒してくれるが、そのぶん所持金の半分を置いていくことになる。
  // 罰はHPではなく金で受ける ―― これがドラクエの死の重さの付け方で、
  // 稼いだ金がそのまま「失いたくないもの」として効いてくる。
  function onPartyWiped() {
    var map = Game.Field.currentMap();
    var church = (map && map.church) || 'ちかくの 教会';
    Game.Party.restAll();
    var lost = Math.floor(Game.Party.gold() / 2);
    Game.Party.spend(lost);
    // 世界はまだ地続きに歩けないので、目を覚ましたあとは
    // その舞台の入り口へ送り返す(章の進行を止めないため)
    Game.Field.resetToStart();
    Game.Audio.play('wipe');
    Game.Dialogue.show('目の前が まっくらに なった……。', function () {
      Game.Dialogue.show('気がつくと ' + church + 'で 寝かされていた。', function () {
        Game.Dialogue.show(lost > 0
          ? '神官「傷は 癒しておいた。……だが お布施として ' + lost + 'ゴールド いただいたよ」'
          : '神官「傷は 癒しておいた。もう 無茶を なさるな」');
      });
    });
  }

  // 最初の操作があるまで音は鳴らせない。鳴らせるようになったら、
  // その場面の曲を改めて頼み直す(題名画面で無音のまま止まらないように)
  var audioWoken = false;
  function wakeAudio() {
    if (audioWoken) return;
    if (!Game.Input.anyPressed()) return;
    audioWoken = true;
    Game.Audio.init();
    var keep = mode;
    mode = null; onModeChange(keep);   // 同じ曲でも鳴らし直させる
  }

  // 入力の音は一か所でまとめて鳴らす。どの画面でも同じ手触りになるように
  function playInputSound() {
    if (Game.Input.wasPressed('up') || Game.Input.wasPressed('down')) Game.Audio.play('cursor');
    else if (Game.Input.wasPressed('confirm')) Game.Audio.play('confirm');
    else if (Game.Input.wasPressed('cancel')) Game.Audio.play('cancel');
  }

  function update() {
    wakeAudio();
    playInputSound();
    // M キーで音を消す/戻す
    if (Game.Input.wasPressed('mute')) {
      var m = Game.Audio.toggleMute();
      if (!m) updateBgm();
    }
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
      // 分かれ道を出しているあいだは、選び終わるまで他の操作を受け付けない
      if (!Game.Dialogue.isActive() && Game.Choice.isOpen()) {
        if (!dialogueWasActive) Game.Choice.update();
        Game.Input.endFrame();
        return;
      }
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
    Game.Fx.tick();
    Game.Input.endFrame();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 揺れは画面ぜんぶにかける。文字も枠も一緒に振れないと、殴られた感じが出ない
    var off = Game.Fx.offset();
    ctx.save();
    if (off.x || off.y) ctx.translate(off.x, off.y);
    drawScene();
    ctx.restore();
    // 被弾の赤みは揺れの外側に。画面全体を薄く染める
    var a = Game.Fx.veilAlpha();
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = Game.Fx.veilTone();
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function drawScene() {
    if (mode === 'title') {
      drawTitle();
    } else if (mode === 'field') {
      Game.Field.draw(ctx);
      drawChapterBanner();
      Game.Menu.draw(ctx, W, H);
      Game.Choice.draw(ctx, W, H);
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

  // 章のタイトルと、いま何をすべきかを画面の隅に出しておく。
  // 「どこへ行けばいいのか分からない」が、遊び始めで最初に詰まる場所なので。
  function drawChapterBanner() {
    Game.Renderer.drawText(ctx, Game.Story.currentTitle(), 12, 20, { size: 12, color: '#d4af5a' });
    var goal = Game.Story.currentGoal();
    if (!goal) return;
    Game.Renderer.drawText(ctx, '▶ ' + goal, 12, 38, { size: 12, color: '#ece7da' });
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

  return { init: init, onPartyWiped: onPartyWiped, setBossFight: setBossFight, updateBgm: updateBgm };
})();
