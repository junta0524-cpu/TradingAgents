// このファイルの役目：作る人用の自動チェック（ゲーム本体では使わない）。
// ブラウザ（Chromium）で index.html を開き、キー操作で各機能を試して、エラーがないか・結果が正しいかを確かめる。
// 使い方：NODE_PATH=$(npm root -g) node tools/check.js [写真の保存先フォルダ]
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

(async () => {
  const outDir = process.argv[2] || os.tmpdir();
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [], fails = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const shot = name => page.screenshot({ path: path.join(outDir, name + '.png') });
  const wait = ms => page.waitForTimeout(ms);
  const key = async (k, ms = 120) => { await page.keyboard.press(k); await wait(ms); };
  const hold = async (k, ms) => { await page.keyboard.down(k); await wait(ms); await page.keyboard.up(k); await wait(150); };
  const ev = fn => page.evaluate(fn);
  const scenes = () => ev(() => GAME.scene.names().join(' > '));
  const pos = () => ev(() => { const p = GAME.scene.top().player; return p ? `${GAME.scene.top().mapId}(${p.x},${p.y})` : '-'; });
  const expect = (label, got, want) => {
    const ok = got === want;
    console.log(`${ok ? 'OK ' : 'NG '} ${label}: ${got}${ok ? '' : '（期待：' + want + '）'}`);
    if (!ok) fails.push(label);
  };
  // テスト用：マップの好きな場所に立たせる
  const placeAt = (id, x, y, dir) => page.evaluate(([id, x, y, dir]) => {
    if (!GAME.state) GAME.party.newGame();
    GAME.scene.change(GAME.scenes.map(id, x, y, dir));
  }, [id, x, y, dir]);
  const closeMessages = async () => { for (let i = 0; i < 8 && (await scenes()).includes('メッセージ'); i++) await key('KeyZ', 150); };

  await page.goto(url);
  await wait(400);
  // フェーズ1〜5の確かめは「4章（ミナモ）にいる状態」で行う（物語の場面は最後にまとめて確かめる）
  const patchCh4 = () => ev(() => {
    GAME.party._newGameOrig = GAME.party.newGame;
    GAME.party.newGame = function () {
      GAME.party._newGameOrig();
      Object.assign(GAME.state, { chapter: 4, disguised: true, inhibitShown: true, resume: null, mapId: 'minamo', x: 15, y: 12, dir: 'down' });
    };
  });
  await patchCh4();
  await shot('01_title');
  await key('KeyZ', 300);
  expect('はじめから → 町', await pos(), 'minamo(15,12)');
  await shot('02_town');

  // 壁で止まる（上へ歩き続けるとギルドの壁の手前 y=9 で止まる）
  await hold('ArrowUp', 1500);
  expect('壁で止まる', await pos(), 'minamo(15,9)');

  // 走る（Shift）
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  await page.keyboard.down('Shift'); await hold('ArrowDown', 400); await page.keyboard.up('Shift');
  const dashY = await ev(() => GAME.scene.top().player.y);
  console.log('     走って0.4秒で進んだマス：', dashY - 12);

  // 人に話しかける
  await placeAt('minamo', 6, 5, 'up'); await wait(300);
  await key('KeyZ', 600);
  expect('話しかけると会話', (await scenes()).endsWith('メッセージ'), true);
  await shot('03_talk');
  await closeMessages();
  expect('会話を閉じる', await scenes(), 'マップ');

  // 宝箱
  await placeAt('minamo', 28, 5, 'right'); await wait(300);
  await key('KeyZ', 500);
  await shot('04_chest_open');
  await closeMessages();
  expect('宝箱のフラグ', await ev(() => GAME.flags.get('chest:minamo:quay')), true);
  expect('傷薬を手に入れた', await ev(() => JSON.stringify(GAME.state.items)), '[{"id":"kizugusuri","count":1}]');
  await key('KeyZ', 500);
  await shot('05_chest_empty');
  await closeMessages();
  expect('2回目は増えない', await ev(() => GAME.state.items[0].count), 1);

  // ギルドに入って、台越しに受付と話す
  await placeAt('minamo', 13, 9, 'up'); await wait(200);
  await hold('ArrowUp', 200); await wait(700);
  expect('ギルドに入る', await pos(), 'minamo_guild(7,9)');
  await shot('06_guild');
  await placeAt('minamo_guild', 7, 4, 'up'); await wait(200);
  await key('KeyZ', 500);
  expect('台越しに話す', (await scenes()).endsWith('メッセージ'), true);
  await closeMessages();
  await placeAt('minamo_guild', 7, 9, 'down'); await wait(200);
  await hold('ArrowDown', 200); await wait(700);
  expect('ギルドから出る', await pos(), 'minamo(13,9)');

  // 南の出口から野原へ、そして戻る
  await placeAt('minamo', 15, 22, 'down'); await wait(200);
  await hold('ArrowDown', 200); await wait(700);
  expect('野原へ出る', await pos(), 'field_minamo(20,3)');
  await shot('07_field');
  await hold('ArrowUp', 200); await wait(700);
  expect('町へ戻る', await pos(), 'minamo(15,22)');

  // メニュー（もちもの）
  await key('KeyX', 200); await key('KeyZ', 200);
  await shot('08_items');
  await key('KeyX'); await key('KeyX');
  expect('メニューを閉じる', await scenes(), 'マップ');

  // デバッグ：マップへ移動・フラグ一覧
  await key('F1', 200); await key('ArrowDown', 60); await key('KeyZ', 200);
  await shot('09_debug_maps');
  for (let i = 0; i < 4; i++) await key('ArrowDown');
  await key('KeyZ', 400);
  expect('デバッグでマップ移動', await pos(), 'field_minamo(20,3)');
  await key('F1', 200);
  for (let i = 0; i < 6; i++) await key('ArrowDown', 60);
  await key('KeyZ', 200);
  await shot('10_debug_flags');
  await key('KeyZ', 200);   // 一番上のフラグを切り替え
  await key('KeyX'); await key('KeyX');

  // ===== フェーズ2：戦闘 =====
  await key('Escape'); await key('Escape');
  // 式の確認：攻9・守3 → 基本3.75、幅±1 → 2〜4（会心なら 攻9±1）
  const calc = await ev(() => {
    const seen = new Set(); let crits = 0; const N = 64000;
    for (let i = 0; i < N; i++) { const r = GAME.battle.calcPhysical(9, 3); if (r.crit) crits++; else seen.add(r.dmg); }
    const low = new Set(); for (let i = 0; i < 2000; i++) { const r = GAME.battle.calcPhysical(3, 10, { noCrit: true }); low.add(r.dmg); }
    return { normal: [...seen].sort().join(','), critPct: (crits / N * 100).toFixed(2), low: [...low].sort().join(',') };
  });
  expect('ダメージの幅（攻9 守3）', calc.normal, '2,3,4');
  expect('基本が2未満なら0〜1', calc.low, '0,1');
  console.log('     会心の割合（64000回）：', calc.critPct + '％（決まりは約1.56％）');
  const esc = await ev(() => [0, 1, 2, 3, 9].map(GAME.battle.escapeChance).join(','));
  expect('逃げやすさ', esc, '0.5,0.5,0.75,0.875,0.875');

  // 町では敵が出ない
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  await hold('ArrowDown', 900); await hold('ArrowUp', 900);
  expect('町では敵が出ない', await scenes(), 'マップ');

  // 野原で歩くと戦闘になる（次の1歩で出会うようにしておく）
  await placeAt('field_minamo', 18, 10, 'left'); await wait(200);
  await ev(() => { GAME.state.encounterSteps = 1; GAME.rng.setFixed(true); });   // 混乱などで結果が変わらないよう乱数を固定
  await hold('ArrowLeft', 150); await wait(900);
  expect('野原で戦闘になる', (await scenes()).endsWith('戦闘'), true);
  await shot('12_battle_appear');
  // コマンドが出るまで待つ
  for (let i = 0; i < 20 && !(await ev(() => GAME.scene.top().name === '戦闘')); i++) await wait(100);
  await wait(800);
  await shot('13_battle_command');
  // 勝つまで「こうげき」をくり返す（ベルは強い）
  const copperBefore = await ev(() => GAME.state.copper);
  for (let turn = 0; turn < 30; turn++) {
    if ((await scenes()) !== 'マップ > 戦闘') break;
    await key('KeyZ', 80); await key('KeyZ', 80);   // ベル：こうげき → 敵を選ぶ
    await key('KeyZ', 80); await key('KeyZ', 80);   // オオナムチ：こうげき → 敵を選ぶ
    await page.keyboard.down('Shift'); await wait(1500); await page.keyboard.up('Shift');
    if (turn === 0) await shot('14_battle_turn');
  }
  await shot('15_battle_result');
  for (let i = 0; i < 5 && (await scenes()) !== 'マップ'; i++) await key('KeyZ', 200);
  expect('勝って地図に戻る', await scenes(), 'マップ');
  const after = await ev(() => ({ copper: GAME.state.copper, exp: GAME.state.party.map(p => p.exp).join('/') }));
  console.log('     銅貨', copperBefore, '→', after.copper, '／経験値（ベル/オオナムチ）', after.exp);
  expect('銅貨が増えた', after.copper > copperBefore, true);
  await ev(() => GAME.rng.setFixed(false));

  // ぼうぎょ → ダメージ半分（計算表示ONで確認）
  await ev(() => { GAME.debugOpts.showCalc = true; GAME.scene.push(GAME.scenes.battle(['dog'])); });
  await wait(1200);
  await key('ArrowDown', 80); await key('KeyZ', 80); await key('ArrowDown', 80); await key('KeyZ', 80);
  await wait(2500);
  await shot('16_battle_defend_calc');
  await ev(() => { GAME.debugOpts.showCalc = false; });
  for (let turn = 0; turn < 20 && (await scenes()) !== 'マップ'; turn++) {
    const top = await ev(() => GAME.scene.top().name);
    if (top !== '戦闘') break;
    await key('KeyZ', 60); await key('KeyZ', 60); await key('KeyZ', 60); await key('KeyZ', 60);
    await page.keyboard.down('Shift'); await wait(1200); await page.keyboard.up('Shift');
  }
  for (let i = 0; i < 5 && (await scenes()) !== 'マップ'; i++) await key('KeyZ', 200);

  // にげる（成功するまで）
  await ev(() => GAME.scene.push(GAME.scenes.battle(['boar'])));
  await wait(1200);
  let escaped = false;
  for (let t = 0; t < 10; t++) {
    await key('ArrowUp', 80); await key('KeyZ', 80);   // にげる（一番下）
    await page.keyboard.down('Shift'); await wait(1000); await page.keyboard.up('Shift');
    if ((await scenes()) === 'マップ') { escaped = true; break; }
  }
  expect('にげる', escaped, true);

  // オオナムチが倒れる → 最後の記録へ戻る（体力満タン）
  await ev(() => GAME.party.healAll());
  await placeAt('minamo', 15, 22, 'down'); await wait(300);   // 町に入ると記録される
  await hold('ArrowDown', 150); await wait(800);              // 野原へ
  // 阻害ゲージを少なくして、ベルが割って入れないようにしておく
  await ev(() => { GAME.state.inhibit = 5; GAME.state.party[1].hp = 1; GAME.state.party[1].def = 0; GAME.scene.push(GAME.scenes.battle(['boar', 'boar', 'boar'])); });
  await wait(1200);
  for (let t = 0; t < 15; t++) {
    if ((await ev(() => GAME.scene.top().name)) !== '戦闘') break;
    const ph = await ev(() => GAME.scene.names().join());
    await key('ArrowDown', 60); await key('KeyZ', 60);   // ぼうぎょ
    await key('ArrowDown', 60); await key('KeyZ', 60);
    await page.keyboard.down('Shift'); await wait(1500); await page.keyboard.up('Shift');
    await wait(1200);
    await shot('17_gameover');
    await key('KeyZ', 600);
    if ((await scenes()) === 'マップ') break;
  }
  expect('ゲームオーバー → 記録へ戻る', await pos(), 'minamo(15,22)');
  expect('体力が戻っている', await ev(() => GAME.state.party.map(p => p.hp === p.maxHp).join()), 'true,true');

  // デバッグ：自動で100回戦闘
  await key('F1', 200);
  for (let i = 0; i < 9; i++) await key('ArrowDown', 50);
  await key('KeyZ', 600);
  await shot('18_debug_auto');
  await closeMessages(); await key('Escape', 200);

  // ===== フェーズ3：言霊と成長 =====
  const oo = () => ev(() => { const m = GAME.party.member('oonamuchi'); return { lv: m.lv, hp: m.hp, maxHp: m.maxHp, mp: m.mp, atk: m.atk, def: m.def }; });
  await ev(() => { GAME.party.newGame(); GAME.state.copper = 200; });
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  // レベル＋1（デバッグ）：成長表のレベル2＝攻7＋古い短剣3＝10、HP22
  await key('F1', 150); for (let i = 0; i < 3; i++) await key('ArrowDown', 60);
  await key('KeyZ', 300);
  await shot('19_levelup');
  await closeMessages(); await key('Escape', 150);
  let o = await oo();
  expect('レベル＋1 → レベル2・攻撃10・最大HP22', `${o.lv}/${o.atk}/${o.maxHp}`, '2/10/22');

  // 移動中に「癒やし」：オオナムチの体力を減らしてから唱える
  await ev(() => { const m = GAME.party.member('oonamuchi'); m.hp = 5; });
  await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150);   // ことだま
  await key('ArrowDown', 60); await key('KeyZ', 150);                           // オオナムチが唱える（ベルの下）
  await shot('20_field_kotodama');
  await key('ArrowDown', 60); await key('KeyZ', 150);                           // 癒やし
  await key('ArrowDown', 60); await key('KeyZ', 300);                           // オオナムチに
  await shot('21_field_heal');
  await closeMessages();
  o = await oo();
  expect('移動中の癒やし：体力が増えMPが3減る', o.hp > 5 && o.mp === 5, true);
  for (let i = 0; i < 4 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);

  // 戦闘で言霊：オオナムチが「堅め」をベルに、ベルはぼうぎょ
  await ev(() => { GAME.party.healAll(); GAME.scene.push(GAME.scenes.battle(['dog'])); });
  await wait(1200);
  await shot('22_battle_menu');
  // ベルは「うまくやって」なので、指示はオオナムチだけ
  await key('ArrowDown', 60); await key('KeyZ', 120);   // オオナムチ：ことだま
  await shot('23_battle_kotodama_list');
  await key('KeyZ', 120);                               // 堅め
  await key('ArrowUp', 80); await key('KeyZ', 120);    // ベルに
  await page.keyboard.down('Shift'); await wait(1200); await page.keyboard.up('Shift');
  await shot('24_battle_katame');
  const buffed = await ev(() => !!(GAME.party.member('bell').buffs && GAME.party.member('bell').buffs.def) || GAME.scene.top().name !== '戦闘');
  expect('戦闘で堅め：ベルの守りが上がる', buffed, true);
  o = await oo();
  expect('堅めでMPが2減る（レベル2の最大MPは8）', o.mp, 6);
  for (let turn = 0; turn < 20 && (await scenes()) !== 'マップ'; turn++) {
    if ((await ev(() => GAME.scene.top().name)) !== '戦闘') { await key('KeyZ', 150); continue; }
    await key('KeyZ', 60); await key('KeyZ', 60);
    await page.keyboard.down('Shift'); await wait(1200); await page.keyboard.up('Shift');
  }
  expect('戦いのあと強化が消える', await ev(() => GAME.state.party.every(p => !p.buffs && p.side === undefined)), true);

  // 道具屋：傷薬と銅の短刀を買い、干し飯を売る
  await ev(() => { GAME.state.items = []; });   // 前の戦いの落とし物で数がずれないように
  await placeAt('minamo_shop', 5, 4, 'up'); await wait(200);
  await key('KeyZ', 500); await closeMessages(); await wait(200);
  await shot('25_shop');
  const c0 = await ev(() => GAME.state.copper);
  await key('KeyZ', 150);                       // 買う
  await key('KeyZ', 200); await closeMessages(); // 傷薬
  for (let i = 0; i < 4; i++) await key('ArrowDown', 60);
  await key('KeyZ', 200); await closeMessages(); // 銅の短刀（毒消し草・目覚まし香の下）
  await shot('26_shop_buy');
  const bought = await ev(() => ({ c: GAME.state.copper, k: GAME.party.count('kizugusuri'), knife: GAME.party.count('copper_knife') }));
  expect('買い物：銅貨が 8+40 減り、品物が増える', `${c0 - bought.c}/${bought.k}/${bought.knife}`, '48/1/1');
  await key('KeyX', 150);                       // 買う一覧を閉じる
  await ev(() => GAME.party.addItem('hoshiii', 2));
  await key('ArrowDown', 60); await key('KeyZ', 150);   // 売る
  await shot('27_shop_sell');
  for (let i = 0; i < 6 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);

  // 装備：銅の短刀に替える（レベル2：攻7＋6＝13）
  await key('KeyX', 150); await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 150); // そうび
  await key('KeyZ', 150);                       // オオナムチ（ベルは選べない）
  await key('KeyZ', 150);                       // 武器
  await shot('28_equip');
  await key('KeyZ', 200);                       // 銅の短刀
  o = await oo();
  expect('装備：攻撃13、古い短剣は持ち物へ', `${o.atk}/${await ev(() => GAME.party.count('old_dagger'))}`, '13/1');
  for (let i = 0; i < 5 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);

  // 宿屋：泊まると満タン、銅貨が6減り、自動で記録される
  await ev(() => { GAME.state.party.forEach(p => { p.hp = 1; }); });
  await placeAt('minamo_inn', 5, 4, 'up'); await wait(200);
  const c1 = await ev(() => GAME.state.copper);
  await key('KeyZ', 500); await closeMessages(); await wait(150);
  await shot('29_inn_confirm');
  await key('KeyZ', 900);                       // はい
  await shot('30_inn_sleep');
  await closeMessages(); await wait(500);
  const inn = await ev(() => ({ full: GAME.state.party.every(p => p.hp === p.maxHp), c: GAME.state.copper }));
  expect('宿屋：満タン・銅貨-6', `${inn.full}/${c1 - inn.c}`, 'true/6');

  // セーブ（記録1）→ 再読込 → つづきから
  await key('KeyX', 150); for (let i = 0; i < 5; i++) await key('ArrowDown', 50);
  await key('KeyZ', 150); await key('KeyZ', 300);       // セーブ → 記録1
  if ((await ev(() => GAME.scene.top().name)) === '確認') await key('KeyZ', 300);
  await shot('31_saved');
  await closeMessages();
  for (let i = 0; i < 4 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);
  const savedState = await ev(() => JSON.stringify({ lv: GAME.party.member('oonamuchi').lv, c: GAME.state.copper, m: GAME.state.mapId }));
  await page.reload(); await wait(500); await patchCh4();
  await shot('32_title_continue');
  await key('ArrowDown', 60); await key('KeyZ', 200);   // つづきから
  await shot('33_slot_list');
  await key('ArrowDown', 60); await key('KeyZ', 500);   // 記録1（一番上は自動）
  const loaded = await ev(() => JSON.stringify({ lv: GAME.party.member('oonamuchi').lv, c: GAME.state.copper, m: GAME.state.mapId }));
  expect('セーブ → 再読込 → つづきから', loaded, savedState);

  // 書き出し・読み込み（文字）
  let exported = null;
  page.once('dialog', async d => { exported = d.defaultValue(); await d.accept(); });
  await ev(() => GAME.scene.change(GAME.scenes.title())); await wait(200);
  for (let i = 0; i < 3; i++) await key('ArrowDown', 50);
  await key('KeyZ', 200); await key('ArrowDown', 60); await key('KeyZ', 400);   // 書き出し → 記録1
  expect('書き出しの文字ができる', !!exported && exported.length > 100, true);
  await ev(() => localStorage.removeItem('maou_save_2'));
  page.once('dialog', async d => { await d.accept(exported); });
  await key('ArrowDown', 60); await key('KeyZ', 400);   // 読み込み
  await key('ArrowDown', 60); await key('KeyZ', 300);   // 記録2へ
  await shot('34_imported');
  await closeMessages();
  expect('読み込んで記録2に入る', await ev(() => !!GAME.save.read('2') && GAME.save.read('2').state.copper === GAME.save.read('1').state.copper), true);

  // 言霊を全習得（デバッグ）→ 一覧
  await ev(() => GAME.scene.change(GAME.scenes.map('minamo', 15, 12, 'down'))); await wait(200);
  await key('F1', 150); for (let i = 0; i < 4; i++) await key('ArrowDown', 50);
  await key('KeyZ', 300); await closeMessages(); await key('Escape', 150);
  await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150); await key('KeyZ', 200);
  await shot('35_all_kotodama');
  for (let i = 0; i < 5 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);
  expect('言霊の数', await ev(() => GAME.party.member('oonamuchi').kotodama.length), await ev(() => Object.keys(GAME.DATA.kotodama).length));

  // ===== フェーズ4：状態異常・仲間・作戦 =====
  await ev(() => { GAME.party.newGame(); GAME.rng.setFixed(true); });
  // 状態異常のしくみ（確率1でかける）
  const stat = await ev(() => {
    const m = GAME.party.member('oonamuchi');
    const out = {};
    GAME.status.inflict(m, 'sleep', 1); GAME.status.inflict(m, 'poison', 1);
    out.tags = GAME.status.tags(m);
    out.skip = GAME.status.beforeAct(m).skip;
    const t0 = m.status.sleep; GAME.kotodama.endRound([m], null); out.dec = t0 - (m.status.sleep || 0);
    GAME.status.inflict(m, 'venom', 1);
    GAME.kotodama.clearBattleState(m); out.after = GAME.status.tags(m);
    // 心鎮めは混乱を防ぐ
    m.mind = 3; out.mind = GAME.status.inflict(m, 'confuse', 1).map(e => e.text).join('');
    delete m.mind; delete m.status;
    // 耐性：まどい狐は混乱が効かない
    const fox = { side: 'enemy', id: 'fox', name: '狐', hp: 10 };
    out.fox = GAME.status.inflict(fox, 'confuse', 1).map(e => e.text).join('');
    // 眠りの続くターン（2〜5）
    const turns = new Set(); for (let i = 0; i < 300; i++) { const u = { side: 'party', name: 'x', hp: 1 }; GAME.status.inflict(u, 'sleep', 1); turns.add(u.status.sleep); }
    out.turns = [...turns].sort().join(',');
    return out;
  });
  expect('眠り＋毒の印', stat.tags, '眠毒');
  expect('眠っていると動けない', stat.skip, true);
  expect('ターンが減る', stat.dec, 1);
  expect('戦いのあと毒だけ残る（猛毒→毒）', stat.after, '毒');
  expect('心鎮めで混乱を防ぐ', stat.mind.includes('惑わされなかった'), true);
  expect('まどい狐に混乱は効かない', stat.fox.includes('効かなかった'), true);
  expect('眠りは2〜5ターン', stat.turns, '2,3,4,5');

  // 移動中の毒：1歩ごとに1減る（1より下にはならない）
  await placeAt('field_minamo', 20, 5, 'down'); await wait(200);
  await ev(() => { GAME.encounter.enabled = false; const m = GAME.party.member('oonamuchi'); m.status = { poison: true }; m.hp = 3; });
  await hold('ArrowDown', 700);
  expect('毒で歩くと体力が減るが1で止まる', await ev(() => GAME.party.member('oonamuchi').hp), 1);
  await ev(() => { const m = GAME.party.member('oonamuchi'); delete m.status; GAME.party.healAll(); GAME.encounter.enabled = true; });

  // 臨時の仲間（デバッグで5章の二人を入れる）→ 4人で歩く
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  await key('F1', 150);
  for (let i = 0; i < 13; i++) await key('ArrowDown', 40);
  await key('KeyZ', 200); await key('KeyZ', 300);    // 5章：スクナ・コノハ
  await closeMessages(); await key('Escape', 150);
  expect('仲間が4人になる', await ev(() => GAME.state.party.map(p => p.name).join('・')), 'ベル・オオナムチ・スクナ・コノハ');
  await hold('ArrowDown', 700); await hold('ArrowRight', 500);
  await shot('36_followers');
  expect('5人目は加われない', await ev(() => GAME.party.join('kaname')), false);

  // 4人で戦う：指示はオオナムチだけ（ほかは「うまくやって」）
  await ev(() => GAME.scene.push(GAME.scenes.battle(['fox', 'moth'])));
  await wait(1300);
  await shot('37_battle_four');
  expect('指示を出すのはオオナムチだけ', await ev(() => GAME.scene.top().name === '戦闘'), true);
  // AI：オオナムチが弱っていたら、スクナが回復する
  const aiPick = await ev(() => {
    const st = { party: GAME.state.party, enemies: [{ hp: 5, key: 'e0' }] };
    const oo = GAME.party.member('oonamuchi'); const hp = oo.hp; oo.hp = 3;
    const d = GAME.ai.decide(st, GAME.party.member('sukuna')); oo.hp = hp;
    return `${d.type}:${d.id}:${d.target && d.target.name}`;
  });
  expect('うまくやって：スクナが弱った仲間を回復', aiPick.startsWith('kotodama:') && aiPick.endsWith(':オオナムチ'), true);
  for (let turn = 0; turn < 25 && (await scenes()) !== 'マップ'; turn++) {
    if ((await ev(() => GAME.scene.top().name)) !== '戦闘') { await key('KeyZ', 150); continue; }
    await key('KeyZ', 60); await key('KeyZ', 60);
    await page.keyboard.down('Shift'); await wait(1500); await page.keyboard.up('Shift');
    if (turn === 1) await shot('38_battle_status');
  }
  const fourEnd = await scenes();
  expect('4人の戦いが終わる（勝ち か 記録へ戻る）', fourEnd, 'マップ');

  // 作戦：オオナムチも「うまくやって」にすると、コマンドを聞かれない
  await ev(() => { GAME.party.newGame(); GAME.party.setTemps(['kaname', 'kotoshiro']); });
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  await key('KeyX', 150); for (let i = 0; i < 3; i++) await key('ArrowDown', 40);
  await key('KeyZ', 150);                       // さくせん
  await key('ArrowDown', 60); await key('KeyZ', 150);   // オオナムチ
  await shot('39_tactics');
  await key('ArrowUp', 60); await key('KeyZ', 200); await closeMessages();   // うまくやって
  for (let i = 0; i < 4 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);
  expect('作戦をうまくやってに', await ev(() => GAME.party.member('oonamuchi').tactic), 'auto');
  await ev(() => GAME.scene.push(GAME.scenes.battle(['dog', 'dog'])));
  let askedCommand = false;
  for (let i = 0; i < 80 && (await scenes()) !== 'マップ'; i++) {
    const ph = await ev(() => GAME.scene.top().phase);
    if (ph === 'command') askedCommand = true;
    if (ph === 'result' || ph === 'gameover') await key('KeyZ', 200);
    else { await page.keyboard.down('Shift'); await wait(250); await page.keyboard.up('Shift'); }
  }
  expect('全員うまくやって：コマンドを聞かれずに終わる', `${await scenes()}/${askedCommand}`, 'マップ/false');

  // 先手（ウズメ）は約1/4、落とし物（コトシロ）は2倍
  const perks = await ev(() => {
    GAME.party.setTemps(['uzume', 'hieda']);
    const st = GAME.battle.create(GAME.party.freshMembers(), ['dog']);
    let n = 0; for (let i = 0; i < 4000; i++) if (GAME.battle.rollFirstStrike(st)) n++;
    return (n / 4000).toFixed(2);
  });
  console.log('     ウズメの先手の割合：', perks, '（決まりは 0.25）');
  expect('先手の割合が 0.2〜0.3', Number(perks) > 0.2 && Number(perks) < 0.3, true);
  await ev(() => GAME.rng.setFixed(false));

  // ===== フェーズ5：ベル専用のしくみ =====
  await ev(() => { GAME.party.newGame(); GAME.rng.setFixed(true); });
  const g = () => ev(() => Math.round(GAME.state.inhibit * 100) / 100);
  // ベルの言霊・本気でゲージが減る（火種：8＋MP2×0.5＝9、本気：25）
  const drains = await ev(() => {
    const st = GAME.battle.create(GAME.party.active(), ['boar', 'boar']);
    const bell = st.party[0], out = [];
    let before = GAME.state.inhibit;
    GAME.battle.act(st, bell, { type: 'kotodama', id: 'hidane', target: st.enemies[0] });
    out.push(before - GAME.state.inhibit); before = GAME.state.inhibit;
    GAME.battle.act(st, bell, { type: 'fullpower', target: st.enemies[1] });
    out.push(before - GAME.state.inhibit);
    // AIのベルは力を使わない
    out.push(GAME.ai.decide(st, bell).type);
    st.party.forEach(p => GAME.kotodama.clearBattleState(p));
    return out.join('/');
  });
  expect('ベルの言霊で9、本気で25減る・AIのベルは打撃だけ', drains, '9/25/attack');

  // 守り手：オオナムチへの致命の一撃をベルが止める（1回の戦いで1度、ゲージ-10）
  const protect = await ev(() => {
    GAME.inhibit.set(100);
    const st = GAME.battle.create(GAME.party.active(), ['boar']);
    const oo = st.party[1]; oo.hp = 1;
    const m1 = GAME.battle.applyDamage(st, oo, 50);
    const first = `${oo.hp}/${GAME.state.inhibit}/${!!m1}`;
    oo.hp = 1; GAME.battle.applyDamage(st, oo, 50);
    st.party.forEach(p => GAME.kotodama.clearBattleState(p));
    return first + ' → ' + oo.hp;
  });
  expect('致命傷を止める（2度目は止められない）', protect, '1/90/true → 0');
  await ev(() => GAME.party.healAll());

  // 探知網の濃い場所（detection 3）を歩くと減る：1歩0.5
  await ev(() => { GAME.inhibit.set(100); GAME.DATA.maps.field_minamo.detection = 3; GAME.encounter.enabled = false; });
  await placeAt('field_minamo', 20, 4, 'down'); await wait(200);
  for (let i = 0; i < 4; i++) await hold('ArrowDown', 140);
  const walked = await ev(() => ({ y: GAME.state.y, g: GAME.state.inhibit }));
  expect('濃い場所を歩くと1歩0.5ずつ減る', 100 - walked.g, (walked.y - 4) * 0.5);
  await shot('40_gauge_map');

  // 残りが少ないと輪郭が揺れ、ゼロで正体露見 → 記録からやり直し
  await ev(() => GAME.inhibit.set(1));
  await shot('41_gauge_low');
  await hold('ArrowDown', 140); await hold('ArrowDown', 140); await wait(300);
  expect('ゼロで正体露見', await scenes(), '正体露見');
  await wait(3000);
  await shot('42_exposure');
  await wait(3000); await key('KeyZ', 500);
  expect('露見のあと記録へ戻る', await scenes(), 'マップ');
  await ev(() => { delete GAME.DATA.maps.field_minamo.detection; GAME.encounter.enabled = true; });

  // 宿屋で戻る（半分まで）
  await ev(() => { GAME.inhibit.set(20); GAME.state.copper = 50; });
  await placeAt('minamo_inn', 5, 4, 'up'); await wait(200);
  await key('KeyZ', 500); await closeMessages(); await wait(150); await key('KeyZ', 900); await closeMessages(); await wait(300);
  expect('宿屋で阻害ゲージが半分まで戻る', await g(), 50);

  // 戦闘で、ベルを「ぜんぶ指示する」にすると「本気」が選べる
  await ev(() => { GAME.party.member('bell').tactic = 'manual'; GAME.scene.push(GAME.scenes.battle(['boar'])); });
  await wait(1300);
  await shot('43_bell_commands');
  await key('ArrowDown', 60); await key('KeyZ', 100); await key('KeyZ', 100);   // ベル：本気 → 敵
  await key('KeyZ', 100); await key('KeyZ', 100);                               // オオナムチ：こうげき
  await page.keyboard.down('Shift'); await wait(1500); await page.keyboard.up('Shift');
  await shot('44_fullpower');
  expect('本気で阻害ゲージが25減る', await g(), 25);
  for (let i = 0; i < 20 && (await scenes()) !== 'マップ'; i++) {
    const ph = await ev(() => GAME.scene.top().phase);
    if (ph === 'command') { await key('KeyZ', 60); await key('KeyZ', 60); }
    else if (ph === 'result') await key('KeyZ', 200);
    else { await page.keyboard.down('Shift'); await wait(300); await page.keyboard.up('Shift'); }
  }
  await ev(() => { GAME.party.member('bell').tactic = 'auto'; });

  // 蹂躙戦闘（2章：消す）：10部隊を消して、風と手紙
  await ev(() => GAME.scene.push(GAME.scenes.rampage('ch2', { onEnd: r => { window.__ramp = r; GAME.scene.pop(); } })));
  await wait(1200);
  await shot('45_rampage_start');
  for (let i = 0; i < 10; i++) {
    for (let k = 0; k < 30 && (await ev(() => GAME.scene.top().phase)) === 'act'; k++) await wait(100);
    if ((await ev(() => GAME.scene.top().phase)) !== 'choose') break;
    await key('KeyZ', 200);
    if (i === 3) { await wait(300); await shot('46_rampage_fading'); }
  }
  for (let k = 0; k < 40 && (await ev(() => GAME.scene.top().phase)) === 'act'; k++) await wait(100);
  await wait(1700);
  await shot('47_rampage_after');
  await key('KeyZ', 900);
  await shot('48_rampage_letter');
  await key('KeyZ', 300);
  expect('2章の蹂躙：10部隊消える・ゲームオーバーなし', await ev(() => window.__ramp && window.__ramp.erased), 10);

  // 蹂躙戦闘（10章：止める）：4つ止めて1つ打ち払う
  await ev(() => GAME.scene.push(GAME.scenes.rampage('ch10', { onEnd: r => { window.__ramp = r; GAME.scene.pop(); } })));
  await wait(1200);
  for (let i = 0; i < 5; i++) {
    for (let k = 0; k < 30 && (await ev(() => GAME.scene.top().phase)) === 'act'; k++) await wait(100);
    await key('KeyZ', 150);
    if (i === 4) await key('ArrowDown', 80);
    await key('KeyZ', 150);
    if (i === 1) { await wait(800); await shot('49_rampage_stop'); }
  }
  for (let k = 0; k < 40 && (await ev(() => GAME.scene.top().phase)) === 'act'; k++) await wait(100);
  await wait(1700); await key('KeyZ', 300);
  expect('10章の蹂躙：止めた4・打ち払った1が記録される', await ev(() => `${GAME.state.vars.rampage_ch10.stopped}/${GAME.state.vars.rampage_ch10.harmed}`), '4/1');

  // 別行動：ベル不在 → オオナムチが先頭、戦いはベル抜き
  await ev(() => { GAME.state.split = 'away'; });
  await placeAt('minamo', 15, 12, 'down'); await wait(300);
  await shot('50_split_map');
  expect('別行動：先頭はオオナムチ', await ev(() => GAME.scene.top().player.look), 'oonamuchi');
  await ev(() => GAME.scene.push(GAME.scenes.battle(['dog'])));
  await wait(1200);
  expect('別行動：戦いにベルがいない', await ev(() => GAME.scene.top().name === '戦闘' && !GAME.party.active().some(p => p.id === 'bell') && GAME.party.active()[0].id === 'oonamuchi'), true);
  await ev(() => { GAME.scene.pop(); GAME.state.split = 'watch'; GAME.scene.push(GAME.scenes.battle(['dog'])); });
  await wait(1200);
  await shot('51_split_watch');
  await ev(() => { GAME.scene.pop(); GAME.state.split = null; GAME.rng.setFixed(false); });


  // ===== フェーズ6：第一部（1〜3章）=====
  // 場面を早送りで流す（Shiftを押しっぱなしにして、決定キーを押し続ける）。until が true になるまで
  const runThrough = async (until, max = 1500) => {
    await page.keyboard.down('Shift');
    for (let i = 0; i < max; i++) {
      if (await ev(until)) break;
      await key('KeyZ', 60);
    }
    await page.keyboard.up('Shift'); await wait(150);
  };
  const atMap = () => GAME.scene.names().join() === 'マップ';
  await ev(() => { GAME.party.newGame = GAME.party._newGameOrig; GAME.save.SLOTS.forEach(s => localStorage.removeItem('maou_save_' + s)); GAME.scene.change(GAME.scenes.title()); GAME.encounter.enabled = true; });
  await wait(300);
  await key('KeyZ', 400);
  expect('はじめから → 1章の見出し', (await scenes()).includes('イベント'), true);
  await wait(800); await shot('52_ch1_title');
  await runThrough(atMap);
  expect('1章：畑から始まる', await pos(), 'yomi_hani(7,13)');
  expect('1章：ベルイザナ一人', await ev(() => GAME.state.party.map(p => p.name + ':' + p.look).join()), 'ベルイザナ:bell_true');
  expect('1章：阻害ゲージは動かない', await ev(() => GAME.inhibit.on()), false);
  await shot('53_ch1_field');
  // ハニヤスと話す前は、市場へ行けない
  await placeAt('yomi_hani', 28, 9, 'right'); await wait(200);
  await hold('ArrowRight', 150); await wait(200);
  expect('話す前は東へ行けない', (await scenes()).endsWith('メッセージ') && (await ev(() => GAME.state.x)) === 28, true);
  await closeMessages();
  // ハニヤスに話す → 街道のオモイカ（背景の絵）
  await placeAt('yomi_hani', 6, 13, 'down'); await wait(200);
  await key('KeyZ', 300);
  await runThrough(() => { const e = GAME.scene.find('イベント'); return !!e && e.bg === 'road'; }, 80);
  await wait(900); await shot('53b_ch1_road');
  await runThrough(atMap);
  expect('ハニヤスのフラグ', await ev(() => GAME.flags.get('ch1_hani')), true);
  await placeAt('yomi_hani', 28, 9, 'right'); await wait(200);
  await hold('ArrowRight', 250); await wait(600);
  expect('市場へ行ける', await pos(), 'yomi_market(1,9)');
  await shot('54_ch1_market');
  // 鴉族の店主に台越しに話す → 会談の間
  await placeAt('yomi_market', 2, 4, 'up'); await wait(200);
  await key('KeyZ', 300);
  await runThrough(() => GAME.scene.names().includes('イベント') && GAME.flags.get('ch1_market'));
  await wait(900); await shot('55_ch1_hall');
  await runThrough(atMap);
  expect('市場のフラグ', await ev(() => GAME.flags.get('ch1_market')), true);
  await placeAt('yomi_market', 11, 1, 'up'); await wait(200);
  await hold('ArrowUp', 250); await wait(600);
  expect('宮へ戻る', await pos(), 'yomi_palace(9,11)');
  await shot('56_ch1_palace');
  // 広間の奥へ → 四天王 → 騙し討ち → 夕方の畑 → 2章（蹂躙戦闘）
  await hold('ArrowUp', 900);
  await runThrough(() => GAME.scene.names().includes('蹂躙戦闘'));
  await wait(600); await shot('57_ch2_rampage');
  await runThrough(() => GAME.state.chapter === 3 && GAME.scene.names().join() === 'マップ');
  expect('2章の蹂躙：10隊すべて消す', await ev(() => GAME.state.vars.rampage_ch2 && GAME.state.vars.rampage_ch2.erased), 10);
  expect('3章：広間に立つ', await pos(), 'yomi_palace(9,9)');
  // 3章：牢のタケルに格子越しに話す → ナキメ → 報告
  await placeAt('yomi_palace', 1, 6, 'left'); await wait(200);
  await hold('ArrowLeft', 150); await wait(600);
  expect('3章：牢へ入れる', await pos(), 'yomi_prison(6,6)');
  await placeAt('yomi_prison', 2, 4, 'up'); await wait(200);
  await shot('58_ch3_prison');
  await key('KeyZ', 300);
  await runThrough(atMap);
  expect('3章：報告のあと広間へ', await pos(), 'yomi_palace(17,6)');
  await hold('ArrowRight', 400); await wait(500);
  await runThrough(atMap);
  expect('3章：露台へ', await pos(), 'yomi_balcony(7,5)');
  await shot('59_ch3_balcony');
  // 言伝を唱える（メニュー → ことだま → ベルイザナ → 言伝）
  const kIdx = await ev(() => GAME.party.member('bell').kotodama.indexOf('kotozute'));
  await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150); await key('KeyZ', 200);
  for (let i = 0; i < kIdx; i++) await key('ArrowDown', 30);
  await key('KeyZ', 300);
  expect('言伝で場面が始まる', (await scenes()).includes('イベント'), true);
  await runThrough(() => GAME.state.chapter === 4 && GAME.scene.names().join() === 'マップ');
  expect('4章：ミナモへ', await pos(), 'minamo(15,12)');
  expect('4章：ベルとオオナムチ', await ev(() => GAME.state.party.map(p => p.name).join('・')), 'ベル・オオナムチ');
  expect('4章：阻害ゲージが動く', await ev(() => GAME.inhibit.on()), true);
  expect('ほかの場所の言伝は何も起きない', await ev(() => GAME.story.kotozute()), null);
  await shot('60_ch4_minamo');
  // デバッグ：章へ移動（3章）
  await key('F1', 150); await key('KeyZ', 200); await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 300);
  await runThrough(atMap);
  expect('デバッグで3章へ', `${await pos()}/${await ev(() => GAME.state.chapter)}`, 'yomi_palace(9,9)/3');
  // 2章の途中で記録から再開すると、2章の始まりから流れる
  await ev(() => GAME.story.jump(2)); await wait(300);
  expect('2章の記録は場面から再開', await ev(() => GAME.save.read('auto').state.resume), 'ch2_start');
  await ev(() => { GAME.party.loadRecord(); GAME.story.enterSaved(); }); await wait(300);
  expect('再開すると場面が流れる', (await scenes()).includes('イベント'), true);
  await ev(() => GAME.story.jump(4)); await runThrough(atMap);

  // スマホ縦画面
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mobile.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mobile.goto(url);
  await mobile.waitForTimeout(400);
  await mobile.tap('#pad .a');
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: path.join(outDir, '11_mobile.png') });

  console.log(errors.length ? 'エラー:\n' + errors.join('\n') : 'エラーなし');
  console.log(fails.length ? `失敗 ${fails.length} 件` : 'すべて合格');
  await browser.close();
  process.exit(errors.length || fails.length ? 1 : 0);
})();
