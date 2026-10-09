// このファイルの役目：ゲーム画面（横480×縦320）に絵や文字を描く道具をまとめる。
// ブラウザの大きさに合わせて、ドットがぼやけないよう整数倍に拡大する。
(function () {
  const G = window.GAME = window.GAME || {};

  const W = 480, H = 320, TILE = 16;
  const FONT_SIZE = 12;
  const FONT = `${FONT_SIZE}px "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Noto Sans JP", sans-serif`;

  const NO_LINE_START = '、。，．,.」』）)！？!?…ーっゃゅょ';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 画面に合わせて拡大率を決める（1以上は整数倍、狭い画面だけ縮小）
  function resize() {
    const box = document.getElementById('screen');
    const aw = box.clientWidth, ah = box.clientHeight;
    let s = Math.min(aw / W, ah / H);
    s = s >= 1 ? Math.floor(s) : s;
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  G.renderer = {
    W, H, TILE, FONT, FONT_SIZE, LINE_HEIGHT: 16,
    canvas, ctx, resize,

    clear(color) {
      ctx.fillStyle = color || '#000';
      ctx.fillRect(0, 0, W, H);
    },
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },
    // 文字を描く。align は 'left' | 'center' | 'right'
    text(str, x, y, color, align) {
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      ctx.textAlign = align || 'left';
      ctx.fillStyle = color || '#fff';
      ctx.fillText(str, Math.round(x), Math.round(y));
    },
    measure(str) {
      ctx.font = FONT;
      return ctx.measureText(str).width;
    },
    // 幅に収まるように文字列を行に分ける（\n は改行）
    wrap(str, maxWidth) {
      const lines = [];
      String(str).split('\n').forEach(para => {
        let line = '';
        for (const ch of para) {
          // 句読点や閉じかっこは行の頭に来ないよう、前の行にぶら下げる
          if (line && !NO_LINE_START.includes(ch) && G.renderer.measure(line + ch) > maxWidth) {
            lines.push(line);
            line = '';
          }
          line += ch;
        }
        lines.push(line);
      });
      return lines;
    },
  };
})();
