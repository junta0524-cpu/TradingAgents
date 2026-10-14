// このファイルの役目：「言の葉の石碑」の謎解きの画面。ばらばらの文字から選んで、正しい順に並べると言葉ができる。
// 左右キーで文字を選び、決定キーで並べる。Ｘキーで1文字戻す（何も並べていなければ、やめる）。全部並べると答え合わせ。
// 石碑の一覧は js/data/kotoba.js、石碑を調べたときの処理は js/systems/gimmick.js（type: 'kotoba'）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  // 文字を混ぜる（石碑ごとに決まった並び。答えと同じ並びにはしない）
  function shuffle(stone) {
    const letters = [...stone.word, ...(stone.decoy || '')];
    let seed = [...stone.id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
    for (let n = 0; n < 20; n++) {
      for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
      if (letters.slice(0, stone.word.length).join('') !== stone.word) break;
    }
    return letters;
  }

  // onDone(true) で解けた、onDone(false) でやめた
  G.scenes.kotoba = function (stone, onDone) {
    const letters = shuffle(stone), need = [...stone.word].length;
    let cur = 0, picked = [], wrong = 0, solved = false;
    const word = () => picked.map(i => letters[i]).join('');

    return {
      name: '言の葉の石碑',
      get answer() { return letters; },   // 自動チェック用：並んでいる文字
      get cursor() { return cur; },        // 自動チェック用：選んでいる文字
      get solved() { return solved; },
      update() {
        const inp = G.input;
        if (wrong > 0) { if (--wrong === 0) picked = []; return; }
        if (solved) { if (inp.pressed('ok') || inp.pressed('cancel')) { G.scene.pop(); onDone(true); } return; }
        if (inp.repeat('left')) { cur = (cur + letters.length - 1) % letters.length; G.sound.se('cursor'); }
        if (inp.repeat('right')) { cur = (cur + 1) % letters.length; G.sound.se('cursor'); }
        if (inp.pressed('cancel')) {
          if (picked.length) { picked.pop(); G.sound.se('cancel'); } else { G.scene.pop(); onDone(false); }
          return;
        }
        if (inp.pressed('ok')) {
          if (picked.includes(cur)) { G.sound.se('cancel'); return; }
          picked.push(cur); G.sound.se('ok');
          // 次の、まだ使っていない文字へカーソルを送る
          for (let k = 1; k <= letters.length; k++) { const n = (cur + k) % letters.length; if (!picked.includes(n)) { cur = n; break; } }
          if (picked.length === need) {
            if (word() === stone.word) { solved = true; G.sound.se('learn'); }
            else { wrong = 40; G.sound.se('damage'); }
          }
        }
      },
      draw() {
        const r = G.renderer, ctx = r.ctx;
        r.rect(0, 0, r.W, r.H, 'rgba(0,0,0,0.55)');
        G.ui.drawWindow(30, 36, 420, 236);
        r.text('言の葉の石碑', r.W / 2, 48, '#e8e0c8', 'center');
        r.wrap(`手がかり：${stone.hint}`, 380).slice(0, 2).forEach((l, i) => r.text(l, 50, 74 + i * 18, '#cfe'));
        // 答えの枠
        const box = 26, gap = 4, sw = need * (box + gap) - gap, sx = Math.round((r.W - sw) / 2), sy = 118;
        for (let i = 0; i < need; i++) {
          const x = sx + i * (box + gap), ch = picked[i] != null ? letters[picked[i]] : '';
          const col = solved ? '#fff4c0' : wrong > 0 ? '#ff7070' : '#ffd866';
          r.rect(x, sy, box, box, '#1a1620'); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, sy + 0.5, box - 1, box - 1);
          if (ch) r.text(ch, x + box / 2, sy + 5, col, 'center', 16);
        }
        // 刻まれた文字
        const tw = letters.length * (box + gap) - gap, tx = Math.round((r.W - tw) / 2), ty = 174;
        letters.forEach((ch, i) => {
          const x = tx + i * (box + gap), used = picked.includes(i);
          r.rect(x, ty, box, box, used ? '#2a2630' : '#4a4058');
          r.text(ch, x + box / 2, ty + 5, used ? '#666' : '#fff', 'center', 16);
          if (i === cur && !solved && G.ui.blinkOn()) r.text('▲', x + box / 2, ty + box + 2, '#ffd866', 'center');
        });
        const msg = solved ? '石碑の文字が、光った！（決定キー）' : wrong > 0 ? '……何も起きない。言葉が違うようだ。' : '←→：文字を選ぶ　決定：置く　Ｘ：ひとつ戻す／やめる';
        r.text(msg, r.W / 2, 240, solved ? '#fff4c0' : wrong > 0 ? '#ff9090' : '#aaa', 'center', null, 400);
      },
    };
  };
})();
