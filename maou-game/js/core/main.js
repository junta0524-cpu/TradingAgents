// このファイルの役目：ゲームを起動し、1秒に60回「動かす→描く」をくり返す。
// F1キーのデバッグメニューもここで受け付ける。エラーが起きたら画面に赤字で出す。
(function () {
  const G = window.GAME = window.GAME || {};

  // 設定（ブラウザに保存してあれば、それを読む）
  G.settings = G.settings || {
    textSpeed: 'normal',   // slow / normal / fast
    encounter: 'normal',   // normal / low
    textSize: 'normal',    // normal / large（会話の文字の大きさ）
    sound: true,
    battleSpeed: 'normal', // normal / fast / fastest（戦いの文の速さ）
    autoRun: false,        // true：Shiftを押さなくても走る（押すと歩く）
    cursorMemory: true,    // true：メニューと戦いのコマンドで、前に選んだところにカーソルを置く
  };
  G.save.loadSettings();
  G.frame = 0;

  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0, crashed = null;

  function step() {
    if (G.input.pressed('debug')) G.debug.toggle();
    else G.scene.update();
    // 遊んだ時間（タイトル画面では数えない。古い記録は0から）
    if (G.state && !G.scene.find('タイトル')) G.state.playFrames = (G.state.playFrames || 0) + 1;
    G.input.endFrame();
    G.frame++;
  }

  function drawCrash() {
    const r = G.renderer;
    r.clear('#200');
    r.text('エラーが起きました。この画面を写真に撮って知らせてください。', 8, 8, '#f66');
    r.wrap(String(crashed), r.W - 16, 12).slice(0, 16).forEach((line, i) => r.text(line, 8, 32 + i * 16, '#fcc', 'left', 12));
  }

  function loop(now) {
    try {
      if (crashed) { drawCrash(); return; }
      acc += Math.min(now - last, 250);   // 別タブから戻ったときに一気に進みすぎない
      last = now;
      while (acc >= STEP) { step(); acc -= STEP; }
      G.scene.draw();
    } catch (e) {
      crashed = (e && e.stack) || e;
      console.error(e);
      drawCrash();
      return;
    } finally {
      if (!crashed) requestAnimationFrame(loop);
    }
  }

  window.addEventListener('error', e => { if (!crashed) { crashed = e.message; drawCrash(); } });

  G.sprite.preloadArt();   // 作った絵（js/data/art.js）を先に読み込んでおく
  G.scene.change(G.scenes.title());
  requestAnimationFrame(loop);
})();
