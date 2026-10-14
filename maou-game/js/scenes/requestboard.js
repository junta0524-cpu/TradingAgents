// このファイルの役目：ギルドの掲示板（依頼を選んで受ける）と、メニューの「いらい」（受けている依頼と、町の人の頼みごとの進み具合）の画面。
// 一覧の下の窓に、選んでいるものの中身・ごほうび・進み具合を出す。依頼の報告は受付の人に、頼みごとは頼んだ人に話す。
// しくみは js/systems/requests.js（ギルドの依頼）と js/systems/quests.js（町の人の頼みごと。who がある）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const LABEL = { open: '受けられる', ready: '済んだ', claimed: '報告済み' };
  const api = r => (r.who ? G.quests : G.requests);   // 町の人の頼みごとには who（頼んだ人）がある
  function note(r) {
    const st = api(r).status(r);
    if (st === 'active') { if (r.kind === 'deliver' || r.kind === 'look') return '途中'; const p = api(r).progress(r); return `${p.n}/${p.need}`; }
    return LABEL[st];
  }
  const items = list => list.map(r => ({ label: (r.who ? '頼み：' : '') + r.title, note: note(r), disabled: api(r).status(r) === 'claimed' }));

  // 一覧の下：選んでいる依頼の中身
  function drawDetail(r) {
    if (!r) return;
    const R = G.renderer, lh = R.large() ? 18 : 16;
    G.ui.drawWindow(8, 196, 464, 116);
    R.wrap(r.desc, 436).slice(0, 3).forEach((l, i) => R.text(l, 22, 206 + i * lh, '#fff'));
    R.text('報酬：' + api(r).rewardText(r), 22, 206 + 3 * lh + 4, '#f0e8a0', 'left', null, 436);
    const st = api(r).status(r), p = api(r).progress(r);
    const ready = r.who ? `済んだ。${r.who}に知らせよう` : '済んだ。受付に報告しよう';
    const how = st === 'open' ? '（まだ受けていない）' : st === 'claimed' ? '（報告済み）' : st === 'ready' ? ready : r.who && (r.kind === 'deliver' || r.kind === 'look') ? '進み具合：まだ' : `進み具合：${p.n}／${p.need}`;
    R.text(how, 22, 206 + 4 * lh + 6, st === 'ready' ? '#9f9' : '#ccc', 'left', null, 436);
  }

  // ギルドの掲示板
  G.scenes.openRequestBoard = function () {
    let list = G.requests.board();
    if (!list.length) { G.message.show('人気の討伐依頼や護衛の仕事は、朝のうちに剥がされる。残るのは、報酬の安い、手間のかかる依頼だけだ。'); return; }
    G.ui.choose(items(list), {
      x: 8, y: 8, w: 464, rows: 8, title: 'ギルドの掲示板（依頼を受ける）', name: '掲示板', stay: true,
      refresh: () => { list = G.requests.board(); return items(list); },
      extra: menu => drawDetail(list[menu.index]),
    }, (i, menu) => {
      const r = list[i], st = G.requests.status(r);
      if (st === 'open') {
        G.ui.confirm(`依頼「${r.title}」を受けますか？`, () => {
          G.requests.accept(r.id); G.sound.se('ok');
          menu.items = items(list);   // 受けたことを、すぐ一覧に出す
          G.message.show(`依頼「${r.title}」を受けた。`);
        });
      } else if (st === 'active') {
        const p = G.requests.progress(r);
        G.message.show(`まだ途中だ。（${p.n}／${p.need}）`);
      } else if (st === 'ready') G.message.show('済んでいる。受付に報告しよう。');
    });
  };

  // メニューの「いらい」：受けている依頼と、引き受けた頼みごと
  G.scenes.openRequestList = function () {
    const list = G.requests.taken().concat(G.quests.taken());
    if (!list.length) { G.message.show('受けている依頼はない。\nミナモのギルドの掲示板で受けられる（5章から）。寄り道の町の人から、頼みごとをされることもある。'); return; }
    G.ui.choose(items(list), {
      x: 8, y: 8, w: 464, rows: 8, title: '受けている依頼・頼みごと', name: 'いらい',
      extra: menu => drawDetail(list[menu.index]),
    }, () => {});
  };
})();
