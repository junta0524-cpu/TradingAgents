// このファイルの役目：ウィンドウ（黒い半透明の枠）と、選択肢のメニュー（点滅する▶カーソル）を作る。
// 見た目の決まり：黒い半透明背景、白い2pxの枠、角は少し丸く。
(function () {
  const G = window.GAME = window.GAME || {};

  const BG = 'rgba(0, 0, 0, 0.78)';
  const BORDER = '#fff';
  const RADIUS = 4;

  function roundPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ウィンドウを描く
  function drawWindow(x, y, w, h) {
    const ctx = G.renderer.ctx;
    roundPath(ctx, x + 1, y + 1, w - 2, h - 2, RADIUS);
    ctx.fillStyle = BG;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = BORDER;
    ctx.stroke();
  }

  // 点滅の表示・非表示（約0.5秒ごと）
  function blinkOn() { return Math.floor(G.frame / 30) % 2 === 0; }

  // 選択肢メニュー
  // items: [{ label: '文字', disabled: true/false, note: '右側の小さな文字' }]
  // update() の戻り値：{ type: 'select', index } / { type: 'cancel' } / null
  class Menu {
    constructor(items, opts) {
      opts = opts || {};
      this.items = items;
      this.x = opts.x || 0;
      this.y = opts.y || 0;
      this.w = opts.w || 160;
      this.title = opts.title || '';
      this.cancelable = opts.cancelable !== false;
      this.index = opts.index || 0;
      this.rows = opts.rows || 0;   // 一度に見せる行数（0＝全部）。多いときは上下に流れる
      this.top = 0;
      this.lineH = 16;
      this.pad = 8;
    }
    get visible() { return this.rows ? Math.min(this.rows, this.items.length) : this.items.length; }
    get h() {
      return this.pad * 2 + this.visible * this.lineH + (this.title ? this.lineH + 4 : 0);
    }
    update() {
      const inp = G.input, n = this.items.length;
      if (inp.repeat('up')) this.index = (this.index - 1 + n) % n;
      if (inp.repeat('down')) this.index = (this.index + 1) % n;
      if (this.index < this.top) this.top = this.index;
      if (this.index >= this.top + this.visible) this.top = this.index - this.visible + 1;
      if (inp.pressed('ok')) return { type: 'select', index: this.index, item: this.items[this.index] };
      if (this.cancelable && inp.pressed('cancel')) return { type: 'cancel' };
      return null;
    }
    draw() {
      const r = G.renderer;
      drawWindow(this.x, this.y, this.w, this.h);
      let ty = this.y + this.pad;
      if (this.title) {
        r.text(this.title, this.x + this.pad, ty, '#ffd866');
        ty += this.lineH + 4;
      }
      const visibleItems = this.items.slice(this.top, this.top + this.visible);
      visibleItems.forEach((it, k) => {
        const i = this.top + k;
        const y = ty + k * this.lineH;
        const color = it.disabled ? '#777' : '#fff';
        r.text(it.label, this.x + this.pad + 14, y + 1, color);
        if (it.note) r.text(it.note, this.x + this.w - this.pad, y + 1, it.disabled ? '#666' : '#aaa', 'right');
        if (i === this.index && blinkOn()) r.text('▶', this.x + this.pad, y + 1, '#fff');
      });
      // 続きがあるときの印
      if (this.top > 0) r.text('▲', this.x + this.w / 2, ty - 12, '#aaa', 'center');
      if (this.top + this.visible < this.items.length) r.text('▼', this.x + this.w / 2, this.y + this.h - 11, '#aaa', 'center');
    }
  }

  G.ui = { drawWindow, blinkOn, Menu };
})();
