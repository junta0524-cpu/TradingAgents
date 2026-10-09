// このファイルの役目：会話やお知らせの文章を、画面下のウィンドウに1文字ずつ表示する。
// 決定キーで一気に表示、もう一度で次へ。▼が点滅。Shiftを押している間は早送り。
// 使い方：GAME.message.show([{ name: 'ベル', text: '……' }, '名前なしの文'], 終わったときの処理)
(function () {
  const G = window.GAME = window.GAME || {};

  const BOX = { x: 8, y: 240, w: 464, h: 72 };
  const PAD = 12;
  const LINES_PER_PAGE = 3;
  const FAST_WAIT = 6;  // 早送り中、全文が出てから次へ進むまでのコマ数

  // 入力を「ページ（3行ずつ）」に分ける
  function toPages(list) {
    const r = G.renderer, pages = [];
    list.forEach(entry => {
      const e = typeof entry === 'string' ? { text: entry } : entry;
      const lines = r.wrap(e.text, BOX.w - PAD * 2);
      for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
        pages.push({ name: e.name || '', lines: lines.slice(i, i + LINES_PER_PAGE) });
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
        const r = G.renderer, p = pages[page];
        if (!p) return;
        if (p.name) {
          const nw = Math.ceil(r.measure(p.name)) + 20;
          G.ui.drawWindow(BOX.x, BOX.y - 22, nw, 24);
          r.text(p.name, BOX.x + 10, BOX.y - 17, '#ffd866');
        }
        G.ui.drawWindow(BOX.x, BOX.y, BOX.w, BOX.h);
        let left = Math.floor(shown);
        p.lines.forEach((line, i) => {
          const part = line.slice(0, Math.max(0, left));
          left -= line.length;
          r.text(part, BOX.x + PAD, BOX.y + PAD + i * r.LINE_HEIGHT, '#fff');
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
