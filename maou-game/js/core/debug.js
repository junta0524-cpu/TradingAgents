// このファイルの役目：F1キーで開く「デバッグメニュー」（作る人の確認用の裏メニュー）。
// 項目は下の ITEMS に並べる。phase は「そのフェーズから使える」という意味。
// まだ作っていない項目は灰色で表示し、選ぶと「フェーズ○で使えるようになります」と出る。
(function () {
  const G = window.GAME = window.GAME || {};

  const ITEMS = [
    { label: '章へ移動',               phase: 6, run: () => G.scene.push(createChapterPicker()) },
    { label: 'マップへ移動',           phase: 1, run: () => G.scene.push(createMapPicker()) },
    {
      label: '全回復', phase: 2,
      run: () => { ensureGame(); G.party.healAll(); G.message.show('仲間の体力をすべて回復しました。'); },
    },
    {
      label: 'レベル＋1', phase: 3,
      run: () => {
        ensureGame();
        const msgs = [];
        G.state.party.forEach(m => {
          G.growth.forceLevelUp(m).forEach(u => msgs.push(`${m.name}はレベル${u.lv}になった。\n${u.diffs.join('　')}`));
        });
        G.message.show(msgs.length ? msgs : 'これ以上レベルは上がりません。');
      },
    },
    {
      label: '言霊を全習得', phase: 3,
      run: () => {
        ensureGame();
        const all = Object.keys(G.DATA.kotodama);
        G.state.party.filter(m => m.lv != null).forEach(m => { m.kotodama = all.slice(); m.mp = m.maxMp; });
        G.message.show(`オオナムチが、すべての言霊（${all.length}個）を覚えました。\nまだ作っていない言霊は、一覧で灰色になります。`);
      },
    },
    {
      label: '阻害ゲージの増減', phase: 5,
      note: () => (G.state ? `${Math.round(G.state.inhibit)}/${G.DATA.balance.INHIBIT.MAX}` : ''),
      run: () => G.scene.push(createInhibitMenu()),
    },
    { label: 'フラグ一覧と切り替え',   phase: 1, run: () => G.scene.push(createFlagList()) },
    {
      label: 'エンカウント ON/OFF', phase: 2,
      note: () => (G.encounter.enabled ? 'ON' : 'OFF'),
      run: () => {
        G.encounter.enabled = !G.encounter.enabled;
        G.message.show(G.encounter.enabled ? '敵に出会うようにしました。' : '敵に出会わないようにしました。');
      },
    },
    {
      label: '戦闘計算の中身を表示', phase: 2,
      note: () => (G.debugOpts.showCalc ? 'ON' : 'OFF'),
      run: () => {
        G.debugOpts.showCalc = !G.debugOpts.showCalc;
        G.message.show(G.debugOpts.showCalc
          ? '戦闘で、ダメージの計算の中身を灰色の字で出します。'
          : '計算の中身の表示をやめました。');
      },
    },
    { label: '自動で100回戦闘', phase: 2, run: runAutoBattles },
    {
      label: '乱数の固定', phase: 0,
      note: () => (G.rng.fixed ? 'ON' : 'OFF'),
      run: () => {
        G.rng.setFixed(!G.rng.fixed);
        G.message.show(G.rng.fixed
          ? '乱数を固定しました。毎回同じ順番の数が出ます。'
          : '乱数の固定をやめました。');
      },
    },
    { label: '蹂躙戦闘の即時開始', phase: 5, run: () => G.scene.push(createRampagePicker()) },
    { label: '別行動（試し）', phase: 5, note: () => (!G.state || !G.state.split ? 'なし' : G.state.split === 'away' ? 'ベル不在' : '見守り'), run: () => G.scene.push(createSplitPicker()) },
    { label: '臨時の仲間の入れ替え（試し）', phase: 4, run: () => G.scene.push(createTempPicker()) },
  ];

  // いま作っているフェーズ（これより後の項目は灰色）
  const CURRENT_PHASE = 8;

  function buildMenuItems() {
    return ITEMS.map(it => {
      const ready = it.phase <= CURRENT_PHASE && it.run;
      return {
        label: it.label,
        disabled: !ready,
        note: ready ? (it.note ? it.note() : '') : `フェーズ${it.phase}〜`,
      };
    });
  }

  function ensureGame() { if (!G.state) G.party.newGame(); }

  // いまのマップ（敵が出ないなら野原）の敵の組で、100回戦わせて集計する
  function runAutoBattles() {
    ensureGame();
    const here = G.DATA.maps[G.state.mapId];
    const enc = (here && here.encounter) || G.DATA.maps.field_minamo.encounter;
    const n = 100;
    const r = G.battle.simulate(n, enc.groups);
    const critPct = r.attacks ? (r.crits / r.attacks * 100).toFixed(1) : '0';
    G.message.show([
      `自動で${n}回戦いました（いまの仲間の強さ・体力満タン・全員こうげき）。`,
      `勝ち ${r.wins}回　負け ${r.loses}回\n平均 ${(r.turns / n).toFixed(1)}ターン　受けたダメージ 平均${(r.damageTaken / n).toFixed(1)}`,
      `会心 ${r.crits}回／攻撃 ${r.attacks}回（${critPct}％）\n※会心の決まりは 1/64（約1.6％）`,
    ]);
  }

  // 小さな一覧を出す、デバッグ用の共通の場面
  function smallPicker(name, title, items, onPick) {
    const menu = new G.ui.Menu(items.map(s => ({ label: s.label, note: s.note })), { x: 64, y: 60, w: 352, title });
    return {
      name, opaque: true,
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        onPick(items[res.index], menu);
      },
      draw() { G.renderer.clear('#000'); menu.draw(); },
    };
  }

  function createInhibitMenu() {
    ensureGame();
    const I = G.DATA.balance.INHIBIT;
    const items = [
      { label: '10 減らす', f: () => G.inhibit.drain(10) },
      { label: '50 減らす', f: () => G.inhibit.drain(50) },
      { label: '10 増やす', f: () => G.inhibit.set(G.state.inhibit + 10) },
      { label: '満タンにする', f: () => G.inhibit.set(I.MAX) },
      { label: 'ゼロにする（次に歩くか戦い終わると露見）', f: () => G.inhibit.set(0) },
      { label: '画面に出す／出さない', f: () => { G.state.inhibitShown = !G.state.inhibitShown; } },
    ];
    return smallPicker('デバッグ：阻害', '阻害ゲージ', items, (it, menu) => {
      it.f();
      menu.title = `阻害ゲージ　いま ${Math.round(G.state.inhibit)}/${I.MAX}${G.state.inhibitShown ? '' : '（表示なし）'}`;
    });
  }

  function createRampagePicker() {
    ensureGame();
    const items = [
      { label: '2章：根の洲（消す）', key: 'ch2' },
      { label: '10章：天津京（止める／打ち払う）', key: 'ch10' },
      { label: 'クリア後：大軍戦（止める／言霊で薙ぐ）', key: 'free' },
    ];
    return smallPicker('デバッグ：蹂躙', 'どの蹂躙戦闘にしますか', items, it => {
      G.scene.pop();
      G.scene.push(G.scenes.rampage(it.key, {
        onEnd: res => {
          G.scene.pop();
          G.message.show(`結果：消した ${res.erased}／止めた ${res.stopped}／打ち払った ${res.harmed}／言霊 ${res.kotodama}`);
        },
      }));
    });
  }

  function createSplitPicker() {
    ensureGame();
    const items = [
      { label: 'なし（ベルと一緒）', v: null },
      { label: 'ベル不在（オオナムチたちだけで動く）', v: 'away' },
      { label: 'ベルは見守るだけ（戦いの画面の端にいる）', v: 'watch' },
    ];
    return smallPicker('デバッグ：別行動', '別行動', items, it => {
      G.state.split = it.v;
      G.scene.pop();
      G.message.show(`別行動を「${it.label}」にしました。`);
    });
  }

  // 臨時の仲間を章ごとに入れ替える（物語ができるまでの試し用）
  function createTempPicker() {
    ensureGame();
    const sets = [
      { label: '5章：スクナ・コノハ', ids: ['sukuna', 'konoha'] },
      { label: '6章：カナメ・コトシロ', ids: ['kaname', 'kotoshiro'] },
      { label: '7章：ウズメ・ヒエダ', ids: ['uzume', 'hieda'] },
      { label: '臨時の仲間なし（二人旅）', ids: [] },
    ];
    const menu = new G.ui.Menu(sets.map(s => ({ label: s.label })), { x: 64, y: 60, w: 352, title: 'どの仲間にしますか' });
    return {
      name: 'デバッグ：仲間',
      opaque: true,
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        G.party.setTemps(sets[res.index].ids);
        G.scene.pop();
        G.message.show(`仲間を入れ替えました：${G.state.party.map(p => p.name).join('・')}`);
      },
      draw() { G.renderer.clear('#000'); menu.draw(); },
    };
  }

  // 章を選んで、その章の始まりへ飛ぶ
  function createChapterPicker() {
    const items = Object.keys(G.DATA.chapters).map(n => ({ label: G.DATA.chapters[n].title, n: Number(n) }));
    return smallPicker('デバッグ：章', 'どの章の始まりへ移動しますか', items, it => G.story.jump(it.n));
  }

  // マップを選んで、そこへ飛ぶ
  function createMapPicker() {
    const ids = Object.keys(G.DATA.maps);
    const menu = new G.ui.Menu(ids.map(id => ({ label: G.DATA.maps[id].name, note: id })),
      { x: 64, y: 40, w: 352, title: 'どのマップへ移動しますか', rows: 12 });
    return {
      name: 'デバッグ：マップ',
      opaque: true,
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        if (!G.state) G.party.newGame();
        const id = ids[res.index], s = G.DATA.maps[id].start;
        G.scene.change(G.scenes.map(id, s.x, s.y, s.dir));
      },
      draw() { G.renderer.clear('#000'); menu.draw(); },
    };
  }

  // フラグの一覧（宝箱など、データにあるものすべて）。決定キーで ON/OFF
  function knownFlags() {
    const names = new Set(Object.keys(G.flags.data));
    Object.keys(G.DATA.maps).forEach(id => (G.DATA.maps[id].chests || []).forEach(c => names.add(G.flags.chestKey(id, c.id))));
    return Array.from(names).sort();
  }
  function flagLabel(name) {
    const m = name.match(/^chest:([^:]+):(.+)$/);
    if (m && G.DATA.maps[m[1]]) return `宝箱：${G.DATA.maps[m[1]].name}（${m[2]}）`;
    return name;
  }
  function createFlagList() {
    const names = knownFlags();
    const build = () => names.map(n => ({ label: flagLabel(n), note: G.flags.get(n) ? 'ON' : 'OFF' }));
    const menu = new G.ui.Menu(build(), { x: 32, y: 24, w: 416, title: 'フラグ一覧（決定で切り替え）', rows: 14 });
    return {
      name: 'デバッグ：フラグ',
      opaque: true,
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        G.flags.toggle(names[res.index]);
        menu.items = build();
      },
      draw() {
        G.renderer.clear('#000');
        menu.draw();
        if (!names.length) G.renderer.text('（フラグはまだありません）', 60, 60, '#aaa');
      },
    };
  }

  function createDebugScene() {
    let fps = 60, lastTime = performance.now(), frames = 0;
    const menu = new G.ui.Menu(buildMenuItems(), { x: 64, y: 12, w: 352, title: 'デバッグメニュー（F1／Xで閉じる）' });
    return {
      name: 'デバッグ',
      opaque: true,
      resume() { menu.items = buildMenuItems(); },
      update() {
        const res = menu.update();
        if (!res) return;
        if (res.type === 'cancel') { G.scene.pop(); return; }
        const it = ITEMS[res.index];
        if (it.phase <= CURRENT_PHASE && it.run) it.run();
        else G.message.show(`「${it.label}」は、フェーズ${it.phase}で使えるようになります。`);
      },
      draw() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) { fps = frames; frames = 0; lastTime = now; }
        G.renderer.clear('#000');  // 後ろの画面は隠して読みやすく
        menu.draw();
        const y = menu.y + menu.h + 4;
        G.ui.drawWindow(menu.x, y, menu.w, 24);
        G.renderer.text(`場面：${G.scene.names().join(' > ')}　　${fps}コマ/秒`, menu.x + 10, y + 6, '#aaa');
      },
    };
  }

  G.debug = {
    CURRENT_PHASE,
    toggle() {
      const top = G.scene.top();
      if (top && top.name === 'デバッグ') G.scene.pop();
      else if (!G.scene.names().includes('デバッグ')) G.scene.push(createDebugScene());
    },
  };
})();
