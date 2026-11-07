// このファイルの役目：ゲーム画面（横480×縦320）に絵や文字を描く道具をまとめる。
// ブラウザの大きさに合わせて、ドットがぼやけないよう整数倍に拡大する。
// 文字がにじまないよう、画面の中身は「表示の大きさ×画面の細かさ」の解像度で描く（座標は480×320のまま）。
(function () {
  const G = window.GAME = window.GAME || {};

  const W = 480, H = 320, TILE = 16;
  const FONT_SIZE = 12;
  const FONT_FAMILY = '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';
  const FONT = `${FONT_SIZE}px ${FONT_FAMILY}`;
  // 大きさを省いたときの文字：設定「文字の大きさ：大きい」なら balance.js の UI_TEXT_SIZE_LARGE、ふつうは FONT_SIZE
  const baseSize = () => (G.settings && G.settings.textSize === 'large' && G.DATA && G.DATA.balance ? G.DATA.balance.UI_TEXT_SIZE_LARGE : FONT_SIZE);
  const fontOf = size => `${size || baseSize()}px ${FONT_FAMILY}`;

  const NO_LINE_START = '、。，．,.」』）)！？!?…ーっゃゅょ';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const MAX_RES = 6;   // 解像度の上限（480×320 の何倍まで細かく描くか）

  // 画面に合わせて拡大率を決める（1以上は整数倍、狭い画面だけ縮小）
  function resize() {
    const box = document.getElementById('screen');
    const aw = box.clientWidth, ah = box.clientHeight;
    let s = Math.min(aw / W, ah / H);
    s = s >= 1 ? Math.floor(s) : s;
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    // 実際の画素の数に合わせて描く細かさを決める（整数倍にしてドットをくっきり保つ）
    const k = Math.max(1, Math.min(MAX_RES, Math.ceil(s * (window.devicePixelRatio || 1))));
    if (canvas.width !== W * k) {
      canvas.width = W * k; canvas.height = H * k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    G.renderer && (G.renderer.res = k);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  G.renderer = {
    W, H, TILE, FONT, FONT_SIZE, LINE_HEIGHT: 16,
    canvas, ctx, resize, res: 1, baseSize,
    large() { return baseSize() !== FONT_SIZE; },

    clear(color) {
      ctx.fillStyle = color || '#000';
      ctx.fillRect(0, 0, W, H);
    },
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },
    // 文字を描く。align は 'left' | 'center' | 'right'
    // size：文字の大きさ（省くと設定どおり）。maxWidth：この幅を超えるときは横に縮めて収める
    text(str, x, y, color, align, size, maxWidth) {
      ctx.font = fontOf(size);
      ctx.textBaseline = 'top';
      ctx.textAlign = align || 'left';
      ctx.fillStyle = color || '#fff';
      if (maxWidth > 0) ctx.fillText(str, Math.round(x), Math.round(y), maxWidth);
      else ctx.fillText(str, Math.round(x), Math.round(y));
    },
    measure(str, size) {
      ctx.font = fontOf(size);
      return ctx.measureText(str).width;
    },
    // 幅に収まるように文字列を行に分ける（\n は改行）
    wrap(str, maxWidth, size) {
      const lines = [];
      String(str).split('\n').forEach(para => {
        let line = '';
        for (const ch of para) {
          // 句読点や閉じかっこは行の頭に来ないよう、前の行にぶら下げる
          if (line && !NO_LINE_START.includes(ch) && G.renderer.measure(line + ch, size) > maxWidth) {
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
  resize();
})();
