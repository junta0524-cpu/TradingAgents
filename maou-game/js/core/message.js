// このファイルの役目：会話やお知らせの文章を、画面下のウィンドウに1文字ずつ表示する。
// 決定キーで一気に表示、もう一度で次へ。▼が点滅。Shiftを押している間は早送り。設定で文字を大きくできる（窓も少し高くなる）。
// 話し手に顔グラ（js/data/art.js）があれば、窓の左に顔を出し、文はその右に寄せる。
// 使い方：GAME.message.show([{ name: 'ベル', text: '……' }, '名前なしの文'], 終わったときの処理)
(function () {
  const G = window.GAME = window.GAME || {};

  const BOX_NORMAL = { x: 8, y: 240, w: 464, h: 72 };
  const BOX_LARGE = { x: 8, y: 220, w: 464, h: 92 };   // 設定「文字の大きさ：大きい」
  const PAD = 12;
  const LINES_PER_PAGE = 3;
  const large = () => G.settings.textSize === 'large';
  const boxOf = () => (large() ? BOX_LARGE : BOX_NORMAL);
  const sizeOf = () => (large() ? G.DATA.balance.TEXT_SIZE_LARGE : null);
  const lineH = () => (large() ? Math.round(G.DATA.balance.TEXT_SIZE_LARGE * 1.4) : G.renderer.LINE_HEIGHT);
  const FAST_WAIT = 6;
  const FACE = 64, FACE_GAP = 8;   // 顔グラの大きさと、文との間  // 早送り中、全文が出てから次へ進むまでのコマ数

  // 入力を「ページ（3行ずつ）」に分ける
  function toPages(list) {
    const r = G.renderer, pages = [], BOX = boxOf();
    list.forEach(entry => {
      const e = typeof entry === 'string' ? { text: entry } : entry;
      const face = G.sprite.hasFace(e.name);
      const lines = r.wrap(e.text, BOX.w - PAD * 2 - (face ? FACE + FACE_GAP : 0), sizeOf());
      for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
        pages.push({ name: e.name || '', face, lines: lines.slice(i, i + LINES_PER_PAGE) });
      }
    });
    return pages;
  }

  function msPerChar() {
    const table = G.DATA.balance.TEXT_SPEED_MS;
    return table[G.settings.textSpeed] || table.normal;
  }

  function createMessageScene(list, onDone) {
    const pages = toPages(list);
    let page = 0, shown = 0, fastTimer = 0;
    const total = () => pages[page].lines.join('').length;
    const complete = () => shown >= total();

    function next() {
      page++;
      shown = 0;
      fastTimer = 0;
      if (page >= pages.length) {
        G.scene.pop();
        if (onDone) onDone();
      }
    }

    return {
      name: 'メッセージ',
      update() {
        const inp = G.input;
        if (!complete()) {
          shown += (1000 / 60) / msPerChar();
          if (inp.held('fast')) shown = total();
          if (inp.pressed('ok')) shown = total();
          return;
        }
        if (inp.held('fast')) {
          if (++fastTimer >= FAST_WAIT) next();
          return;
        }
        if (inp.pressed('ok')) next();
      },
      draw() {
        const r = G.renderer, p = pages[page], BOX = boxOf(), size = sizeOf();
        if (!p) return;
        if (p.name) {
          const nw = Math.ceil(r.measure(p.name)) + 20;
          G.ui.drawWindow(BOX.x, BOX.y - 22, nw, 24);
          r.text(p.name, BOX.x + 10, BOX.y - 17, '#ffd866');
        }
        G.ui.drawWindow(BOX.x, BOX.y, BOX.w, BOX.h);
        let tx = BOX.x + PAD;
        if (p.face) {   // 顔グラ：窓の左、縦はまん中
          const img = G.sprite.faceOf(p.name), fy = BOX.y + Math.round((BOX.h - FACE) / 2), ctx = r.ctx;
          r.rect(BOX.x + 4, fy, FACE, FACE, '#1a1626');
          if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, BOX.x + 4, fy, FACE, FACE); }
          tx = BOX.x + 4 + FACE + FACE_GAP;
        }
        let left = Math.floor(shown);
        p.lines.forEach((line, i) => {
          const part = line.slice(0, Math.max(0, left));
          left -= line.length;
          r.text(part, tx, BOX.y + PAD + i * lineH(), '#fff', 'left', size);
        });
        if (complete() && G.ui.blinkOn()) {
          r.text('▼', BOX.x + BOX.w / 2, BOX.y + BOX.h - 14, '#fff', 'center');
        }
      },
    };
  }

  G.message = {
    show(list, onDone) {
      if (!Array.isArray(list)) list = [list];
      G.scene.push(createMessageScene(list, onDone));
    },
  };
})();
