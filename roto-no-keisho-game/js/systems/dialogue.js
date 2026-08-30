// メッセージウィンドウ ― フィールド/戦闘共通で使うテキスト表示キュー。
// 長い文章は枠幅に合わせて自動で折り返し、3行を超える分はページ送りにする。
var Game = window.Game || {};
Game.Dialogue = (function () {
  // キューの各要素は { lines: [表示行...], cb: 送り終えた時に呼ぶ関数 or null }
  var queue = [];
  // ドラクエの文字送り。1フレームに CHARS_PER_FRAME 文字ずつ出し、
  // 出しきる前に決定を押したら、そのページを一気に全部出す(2度押しで次へ)。
  var shown = 0;                 // いま何文字まで出したか
  var CHARS_PER_FRAME = 0.9;

  var FONT = '16px "Yu Gothic","Hiragino Sans",sans-serif';
  var LINE_H = 22;
  var MAX_LINES = 3;
  var PANEL_H = 104;
  var PAD_X = 16; // 枠の左右インセット
  var TEXT_PAD = 16; // 枠内の左右余白
  var canvasW = 640; // Core.init から実際の幅を受け取る

  function setWidth(w) { canvasW = w; }
  function wrapWidth() { return canvasW - PAD_X * 2 - TEXT_PAD * 2; }

  var measureCanvas = null;
  function measureCtx() {
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    var ctx = measureCanvas.getContext('2d');
    ctx.font = FONT;
    return ctx;
  }

  // 行頭に来ると不格好な文字(句読点・閉じ括弧など)は前の行に残す
  var NO_LINE_START = '、。,.!?」』)】〕〉》]!?・ー';

  function wrap(text, maxWidth) {
    var ctx = measureCtx();
    var lines = [];
    var cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var candidate = cur + ch;
      if (cur.length > 0 && ctx.measureText(candidate).width > maxWidth) {
        // 次の文字が行頭禁則文字なら、その文字までは今の行に押し込む
        if (NO_LINE_START.indexOf(ch) !== -1) {
          lines.push(candidate);
          cur = '';
        } else {
          lines.push(cur);
          cur = ch;
        }
      } else {
        cur = candidate;
      }
    }
    if (cur.length > 0) lines.push(cur);
    return lines.length > 0 ? lines : [''];
  }

  function show(text, cb) {
    var lines = wrap(String(text), wrapWidth());
    var pages = [];
    for (var i = 0; i < lines.length; i += MAX_LINES) {
      pages.push(lines.slice(i, i + MAX_LINES));
    }
    pages.forEach(function (pageLines, idx) {
      // コールバックは、そのメッセージの最後のページを送り終えた時だけ呼ぶ
      queue.push({ lines: pageLines, cb: (idx === pages.length - 1) ? (cb || null) : null });
    });
  }

  function isActive() { return queue.length > 0; }

  function pageLength(entry) {
    return entry.lines.reduce(function (n, l) { return n + l.length; }, 0);
  }
  function isDone() {
    return !isActive() || shown >= pageLength(queue[0]);
  }

  function update() {
    if (!isActive()) return;
    var entry = queue[0];
    var full = pageLength(entry);

    if (Game.Input.wasPressed('confirm')) {
      if (shown < full) { shown = full; return; }   // まず全部出す
      queue.shift();
      shown = 0;
      if (entry.cb) entry.cb();
      return;
    }
    if (shown < full) {
      shown += CHARS_PER_FRAME;
      if (shown > full) shown = full;
    }
  }

  function draw(ctx, W, H) {
    if (!isActive()) return;
    var entry = queue[0];
    var top = H - PANEL_H - 6;
    Game.Renderer.drawPanel(ctx, PAD_X / 2, top, W - PAD_X, PANEL_H);

    // 出した文字数を、行をまたいで振り分ける
    var left = Math.floor(shown);
    entry.lines.forEach(function (line, i) {
      var part = left <= 0 ? '' : line.slice(0, left);
      left -= line.length;
      if (part) Game.Renderer.drawText(ctx, part, PAD_X / 2 + TEXT_PAD, top + 28 + i * LINE_H, { size: 16 });
    });

    // 送り終えたら、右下の ▼ が点滅して入力を待つ
    if (shown >= pageLength(entry) && Math.floor(Date.now() / 400) % 2 === 0) {
      Game.Renderer.drawText(ctx, '▼', W - TEXT_PAD - 12, top + PANEL_H - 12,
        { size: 14, align: 'right', color: '#ece7da' });
    }
  }

  return {
    show: show, isActive: isActive, update: update, draw: draw, setWidth: setWidth,
    isDone: isDone,
    // 検証用: いま出ている文面
    current: function () { return queue.length ? queue[0].lines.join('') : ''; },
  };
})();
