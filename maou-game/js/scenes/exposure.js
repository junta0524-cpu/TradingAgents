// このファイルの役目：阻害ゲージがゼロになったときの「正体露見」の場面。
// 偽名がはがれ、ベルの姿が魔王に戻っていく。王の声は小説 第十章の文をそのまま使う。
// 物語の10章（フェーズ8）では、このあと脱出の場面へつなぐ。それ以外の場所では、直前の記録からやり直す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  // 小説 第十章より
  const VOICE = [
    '『ベルイザナ』',
    '『まことの名、ベルイザナ。黄泉の王。人に化けて潜む者よ』',
  ];

  G.scenes.exposure = function (opts) {
    opts = opts || {};
    let t = 0, line = -1;
    const LINE_AT = [80, 200];
    return {
      name: '正体露見',
      opaque: true,
      update() {
        t++;
        if (line < VOICE.length - 1 && t >= LINE_AT[line + 1]) line++;
        if (t > 320 && G.input.pressed('ok')) {
          if (opts.onEnd) { opts.onEnd(); return; }
          G.party.loadRecord();
          G.story.enterSaved();
        }
      },
      draw() {
        const r = G.renderer, ctx = r.ctx;
        // 赤く沈む夜
        const k = Math.min(1, t / 120);
        r.clear(`rgb(${Math.round(20 + 40 * k)}, 4, ${Math.round(14 - 8 * k)})`);
        // ベルの姿：輪郭が揺れ、髪と目が魔王の色に変わっていく
        const shake = t < 240 ? (Math.random() - 0.5) * 4 * (1 - t / 240) + (Math.random() - 0.5) * 2 : 0;
        const look = t > 160 ? 'bell_true' : 'bell';
        const scale = 4 + Math.min(1, Math.max(0, (t - 160) / 80));   // 少し大きくなる
        ctx.save();
        ctx.translate(r.W / 2 + shake, 150);
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = false;
        if (t > 120 && t < 170 && Math.floor(t / 3) % 2 === 0) ctx.globalAlpha = 0.4;
        G.sprite.drawPerson(ctx, look, 'down', 0, false, -8, -16);
        ctx.restore();
        ctx.globalAlpha = 1;
        // 王の声（画面に文字だけ）
        for (let i = 0; i <= line; i++) {
          r.text(VOICE[i], r.W / 2, 30 + i * 22, '#f0e8ff', 'center');
        }
        if (t > 260) {
          G.ui.drawWindow(8, 240, 464, 72);
          r.text('阻害が破れ、正体が露見した。', 22, 252, '#f88');
          r.text(opts.onEnd ? '' : '直前の記録から、やり直します。', 22, 270, '#fff');
          r.text('（物語の10章では、ここから脱出の場面へつながります）', 22, 288, '#999');
          if (t > 320 && G.ui.blinkOn()) r.text('▼', 456, 294, '#fff', 'center');
        }
      },
    };
  };
})();
