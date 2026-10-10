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
  await key('F1', 200); await key('KeyZ', 200);
  await shot('09_debug_maps');
  for (let i = 0; i < 4; i++) await key('ArrowDown');
  await key('KeyZ', 400);
  expect('デバッグでマップ移動', await pos(), 'field_minamo(20,3)');
  await key('F1', 200);
  for (let i = 0; i < 5; i++) await key('ArrowDown', 60);
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
  await ev(() => { GAME.state.encounterSteps = 1; });
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
  await ev(() => { GAME.state.party[1].hp = 1; GAME.state.party[1].def = 0; GAME.scene.push(GAME.scenes.battle(['boar', 'boar', 'boar'])); });
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
  for (let i = 0; i < 8; i++) await key('ArrowDown', 50);
  await key('KeyZ', 600);
  await shot('18_debug_auto');
  await closeMessages(); await key('Escape', 200);

  // ===== フェーズ3：言霊と成長 =====
  const oo = () => ev(() => { const m = GAME.party.member('oonamuchi'); return { lv: m.lv, hp: m.hp, maxHp: m.maxHp, mp: m.mp, atk: m.atk, def: m.def }; });
  await ev(() => { GAME.party.newGame(); GAME.state.copper = 200; });
  await placeAt('minamo', 15, 12, 'down'); await wait(200);
  // レベル＋1（デバッグ）：成長表のレベル2＝攻7＋古い短剣3＝10、HP22
  await key('F1', 150); await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 300);
  await shot('19_levelup');
  await closeMessages(); await key('Escape', 150);
  let o = await oo();
  expect('レベル＋1 → レベル2・攻撃10・最大HP22', `${o.lv}/${o.atk}/${o.maxHp}`, '2/10/22');

  // 移動中に「癒やし」：オオナムチの体力を減らしてから唱える
  await ev(() => { const m = GAME.party.member('oonamuchi'); m.hp = 5; });
  await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150);   // ことだま
  await key('KeyZ', 150);                                                       // オオナムチが唱える（最初からカーソルがある）
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
  await key('ArrowDown', 60); await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 80);  // ベル：ぼうぎょ
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
    await key('KeyZ', 60); await key('KeyZ', 60); await key('KeyZ', 60); await key('KeyZ', 60);
    await page.keyboard.down('Shift'); await wait(1200); await page.keyboard.up('Shift');
  }
  expect('戦いのあと強化が消える', await ev(() => GAME.state.party.every(p => !p.buffs && p.side === undefined)), true);

  // 道具屋：傷薬と銅の短刀を買い、干し飯を売る
  await placeAt('minamo_shop', 5, 4, 'up'); await wait(200);
  await key('KeyZ', 500); await closeMessages(); await wait(200);
  await shot('25_shop');
  const c0 = await ev(() => GAME.state.copper);
  await key('KeyZ', 150);                       // 買う
  await key('KeyZ', 200); await closeMessages(); // 傷薬
  await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 200); await closeMessages(); // 銅の短刀
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
  await key('KeyX', 150); for (let i = 0; i < 4; i++) await key('ArrowDown', 50);
  await key('KeyZ', 150); await key('KeyZ', 300);       // セーブ → 記録1
  if ((await ev(() => GAME.scene.top().name)) === '確認') await key('KeyZ', 300);
  await shot('31_saved');
  await closeMessages();
  for (let i = 0; i < 4 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);
  const savedState = await ev(() => JSON.stringify({ lv: GAME.party.member('oonamuchi').lv, c: GAME.state.copper, m: GAME.state.mapId }));
  await page.reload(); await wait(500);
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
  await key('F1', 150); for (let i = 0; i < 3; i++) await key('ArrowDown', 50);
  await key('KeyZ', 300); await closeMessages(); await key('Escape', 150);
  await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150); await key('KeyZ', 200);
  await shot('35_all_kotodama');
  for (let i = 0; i < 5 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 120);
  expect('言霊の数', await ev(() => GAME.party.member('oonamuchi').kotodama.length), await ev(() => Object.keys(GAME.DATA.kotodama).length));

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
