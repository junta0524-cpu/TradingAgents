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
      GAME.party.member('oonamuchi').kotodama = ['katame', 'iyashi'];
      GAME.flags.set('ch4_guild'); GAME.flags.set('ch4_dogs');   // 4章の場面は最後にまとめて確かめる
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
  // ベルは別行動にして、先に敵を倒してしまわないようにする
  await ev(() => { GAME.state.split = 'away'; GAME.state.inhibit = 5; GAME.state.party[1].hp = 1; GAME.state.party[1].def = 0; GAME.scene.push(GAME.scenes.battle(['boar', 'boar', 'boar'])); });
  await wait(1200);
  for (let t = 0; t < 15; t++) {
    if ((await ev(() => GAME.scene.top().name)) !== '戦闘') break;
    const ph = await ev(() => GAME.scene.names().join());
    await key('ArrowDown', 60); await key('KeyZ', 60);   // ぼうぎょ
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
  // 冒険者ベルはタケルと同じ強さで、野犬は一撃で倒れる。オオナムチの番が来るよう3匹にする
  await ev(() => { GAME.party.healAll(); GAME.scene.push(GAME.scenes.battle(['dog', 'dog', 'dog'])); });
  await wait(1200);
  await shot('22_battle_menu');
  // ベルは「うまくやって」なので、指示はオオナムチだけ
  await key('ArrowDown', 60); await key('KeyZ', 120);   // オオナムチ：ことだま
  await shot('23_battle_kotodama_list');
  await key('KeyZ', 120);                               // 堅め
  await key('ArrowUp', 80); await key('KeyZ', 120);    // ベルに
  // ラウンドが終わる（次の指示の番か、戦いの終わり）まで早送りで待つ
  await page.keyboard.down('Shift');
  for (let i = 0; i < 40 && (await ev(() => GAME.scene.top().name === '戦闘' && GAME.scene.top().phase === 'play')); i++) await wait(100);
  await page.keyboard.up('Shift');
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
    const st = GAME.battle.create(GAME.party.active(), ['boar', 'boar', 'boar']);   // 2匹は火種と本気で倒れる。AIの判断用に1匹残す
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
      if ((await scenes()).endsWith('選択肢')) {
        // 9章の祈りは、まだ灯っていない紋を上から順に。ほかの選択肢は下（正しい方）を選ぶ
        const n = await ev(() => GAME.state.mapId === 'yasuragi_temple' ? ['yama', 'iza', 'hono', 'tsuku'].filter(s => GAME.flags.get('pray_' + s)).length : 1);
        for (let k = 0; k < n; k++) await key('ArrowDown', 60);
      }
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
  // 広間の奥へ → 四天王 → 騙し討ち → 夕方の畑 → 2章（兵との戦い・タケルとの戦い）
  await hold('ArrowUp', 900);
  await ev(() => { const o = GAME.battle.act; window.__ch2 = []; window.__ch2Act = o; GAME.battle.act = function () { const r = o.apply(this, arguments); r.forEach(e => e.text && window.__ch2.push(e.text)); return r; }; });
  await runThrough(() => GAME.scene.names().includes('戦闘') && GAME.scene.top().phase === 'command');
  await wait(300); await shot('57_ch2_battle');
  expect('2章：兵とはふつうの戦闘（ベルイザナを操作）', await ev(() => `${GAME.party.member('bell').tactic}/${GAME.scene.top().name}`), 'manual/戦闘');
  await runThrough(() => GAME.state.chapter === 3 && GAME.scene.names().join() === 'マップ');
  const ch2log = await ev(() => { GAME.battle.act = window.__ch2Act; return window.__ch2; });
  expect('2章：攻撃は敵全体へ2回、兵は消える', `${ch2log.filter(l => l.endsWith('の攻撃！（敵全体）')).length >= 3}/${ch2log.filter(l => l.endsWith('は、消えた。')).length}`, 'true/8');
  expect('2章：タケルとの戦い（1ターンに2回斬る・倒れない）', `${ch2log.filter(l => l === 'タケルの攻撃！').length >= 2}/${ch2log.some(l => l === 'タケルを倒した。')}`, 'true/false');
  expect('2章のあと：作戦は元に戻る', await ev(() => GAME.party.member('bell').tactic), 'auto');
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
  // 言伝を唱える（メニュー → ことだま → ベル → 言伝）
  const castKotozute = async () => {
    const kIdx = await ev(() => GAME.party.member('bell').kotodama.indexOf('kotozute'));
    await key('KeyX', 150); await key('ArrowDown', 60); await key('KeyZ', 150); await key('KeyZ', 200);
    for (let i = 0; i < kIdx; i++) await key('ArrowDown', 30);
    await key('KeyZ', 300);
  };
  await castKotozute();
  expect('言伝で場面が始まる', (await scenes()).includes('イベント'), true);
  await runThrough(() => GAME.state.chapter === 4 && GAME.scene.names().join() === 'マップ');
  expect('4章：ミナモへ', await pos(), 'minamo(15,21)');
  expect('4章：ベル一人で着く', await ev(() => GAME.state.party.map(p => p.name).join('・')), 'ベル');
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

  // ===== フェーズ7：第二部前半（4〜7章）=====
  const walkTo = async (id, x, y, dir, k, ms = 250) => { await placeAt(id, x, y, dir); await wait(200); await hold(k, ms); await wait(500); };
  const talk = async (id, x, y, dir) => { await placeAt(id, x, y, dir); await wait(200); await key('KeyZ', 300); };
  const flag = f => ev(new Function('return GAME.flags.get(' + JSON.stringify(f) + ')'));
  const names = () => ev(() => GAME.state.party.map(p => p.name).join('・'));
  await ev(() => { GAME.rng.setFixed(true); GAME.story.jump(4); }); await wait(300);
  await runThrough(atMap);
  expect('4章：ミナモに一人で着く', `${await pos()}/${await names()}`, 'minamo(15,21)/ベル');
  await walkTo('minamo', 13, 9, 'up', 'ArrowUp');
  await shot('61_ch4_guild');
  await runThrough(atMap);
  expect('4章：オオナムチが加わる（言霊はまだない）', `${await names()}/${await ev(() => GAME.party.member('oonamuchi').kotodama.length)}`, 'ベル・オオナムチ/0');
  await walkTo('field_minamo', 29, 26, 'down', 'ArrowDown', 150);
  await runThrough(() => GAME.scene.names().includes('戦闘'));
  await wait(900); await shot('62_ch4_dogs');
  await runThrough(() => GAME.scene.names().join() === 'マップ' && GAME.flags.get('ch4_dogs'));
  expect('4章：野犬戦で堅め・癒やしを覚える', await ev(() => GAME.party.member('oonamuchi').kotodama.join()), 'katame,iyashi');
  await walkTo('field_minamo', 38, 27, 'right', 'ArrowRight', 150);
  await runThrough(() => { const e = GAME.scene.find('イベント'); return !!e && e.bg === 'sunset'; });
  await wait(900); await shot('63_ch4_sunset');
  await runThrough(() => GAME.state.chapter === 5 && GAME.scene.names().join() === 'マップ');
  expect('5章：聖の森の道へ', await pos(), 'hijiri_path(13,20)');
  // 5章
  await walkTo('hijiri_path', 13, 17, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  expect('5章：スクナが加わる', await names(), 'ベル・オオナムチ・スクナ');
  await walkTo('hijiri_path', 13, 1, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  await shot('64_ch5_village');
  await talk('hijiri_village', 25, 13, 'up');
  await runThrough(atMap);
  expect('5章：コノハが加わる（4人）', await names(), 'ベル・オオナムチ・スクナ・コノハ');
  await walkTo('hijiri_village', 14, 3, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  expect('5章：使者の来訪', await flag('ch5_hall'), true);
  await walkTo('hijiri_path', 27, 6, 'right', 'ArrowRight', 150);
  await runThrough(atMap);
  expect('5章：洞窟の魔族', `${await pos()}/${await flag('ch5_cave')}`, 'hijiri_cave(8,6)/true');
  await shot('65_ch5_cave');
  await walkTo('hijiri_village', 14, 3, 'up', 'ArrowUp', 150);
  await runThrough(() => GAME.scene.names().includes('選択肢'));
  await shot('66_ch5_choice');
  await key('KeyZ', 300);   // 1回目は「頷く」
  await runThrough(atMap);
  expect('5章：心鎮めを覚える（頷いた回数1）', `${await ev(() => GAME.party.member('oonamuchi').kotodama.includes('kokoroshizume'))}/${await ev(() => GAME.state.vars.ch5_nod)}`, 'true/1');
  expect('5章：夜の森へ', await pos(), 'hijiri_path(27,6)');
  await castKotozute();
  await runThrough(() => GAME.state.chapter === 6 && GAME.scene.names().join() === 'マップ');
  expect('6章：臨時の仲間は別れる', await names(), 'ベル・オオナムチ');
  // 6章
  await walkTo('ro_path', 12, 1, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  await shot('67_ch6_village');
  await talk('ro_village', 7, 5, 'up');
  await runThrough(atMap);
  expect('6章：納品の日', await flag('ch6_order'), true);
  await talk('ro_village', 12, 10, 'up');
  await runThrough(atMap);
  expect('6章：コトシロが加わる', await names(), 'ベル・オオナムチ・コトシロ');
  await talk('ro_village', 3, 5, 'up');
  await runThrough(atMap);
  expect('6章：火種を覚える', await ev(() => GAME.party.member('oonamuchi').kotodama.includes('hidane')), true);
  await talk('ro_village', 12, 14, 'up');
  await runThrough(atMap);
  expect('6章：カナメも加わって山道を下る', `${await pos()}/${await names()}`, 'ro_path(12,1)/ベル・オオナムチ・コトシロ・カナメ');
  await walkTo('ro_path', 12, 19, 'down', 'ArrowDown', 150);
  await runThrough(() => GAME.state.chapter === 7 && GAME.scene.names().join() === 'マップ');
  expect('7章：獣ノ原でウズメが加わる', `${await pos()}/${await names()}`, 'kemono_field(1,10)/ベル・オオナムチ・ウズメ');
  // 7章
  await walkTo('kemono_field', 13, 10, 'right', 'ArrowRight', 150);
  await runThrough(atMap);
  await talk('kemono_field', 24, 16, 'up');
  await runThrough(atMap);
  expect('7章：ウズメが抜け道を見つける', await ev(() => GAME.flags.get('ch7_secret') && GAME.scene.top().player && true), true);
  await walkTo('kemono_field', 30, 10, 'right', 'ArrowRight', 150);
  await runThrough(atMap);
  expect('7章：葛の里でヒエダが加わる', await names(), 'ベル・オオナムチ・ウズメ・ヒエダ');
  await shot('68_ch7_kuzu');
  await walkTo('kuzu_village', 23, 3, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  expect('7章：夜の里', `${await pos()}/${await flag('ch7_night')}`, 'kuzu_village(23,3)/true');
  await ev(() => { const o = GAME.party.member('oonamuchi'); while (o.lv < 14) GAME.growth.forceLevelUp(o); GAME.party.healAll(); });
  const inhBefore = await ev(() => GAME.state.inhibit);
  await walkTo('kuzu_village', 12, 5, 'down', 'ArrowDown', 150);
  await runThrough(() => GAME.scene.names().includes('戦闘'));
  await wait(1200); await shot('69_ch7_watch');
  expect('7章：夜の井戸はベルが見守る', await ev(() => GAME.state.split), 'watch');
  await runThrough(() => GAME.scene.names().join() === 'マップ' && GAME.flags.get('ch7_morning'));
  expect('7章：ヒエダは里に残り、力の滲みで阻害が減る', `${await names()}/${Math.round(inhBefore - (await ev(() => GAME.state.inhibit)))}`, 'ベル・オオナムチ・ウズメ/25');
  await talk('kuzu_village', 3, 9, 'left');
  await runThrough(atMap);
  expect('7章：ウズメとも別れる', await names(), 'ベル・オオナムチ');
  await castKotozute();
  await runThrough(() => GAME.state.chapter === 8 && GAME.scene.names().join() === 'マップ');
  expect('8章：王都 天津京へ', await pos(), 'amatsu(15,18)');
  // デバッグ：6章へ飛ぶと、オオナムチがその章の強さになる
  await ev(() => GAME.story.jump(6)); await runThrough(atMap);
  expect('デバッグで6章へ：レベル7・心鎮めあり', await ev(() => { const o = GAME.party.member('oonamuchi'); return o.lv + '/' + o.kotodama.includes('kokoroshizume'); }), '7/true');
  await ev(() => GAME.rng.setFixed(false));

  // ===== フェーズ8：8〜12章・エピローグ =====
  await ev(() => { GAME.rng.setFixed(true); GAME.story.jump(8); }); await wait(300);
  await runThrough(atMap);
  expect('8章：天津京、阻害ゲージ70', `${await pos()}/${await ev(() => Math.round(GAME.state.inhibit))}`, 'amatsu(15,18)/70');
  await shot('70_ch8_city');
  await walkTo('amatsu', 15, 9, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  expect('8章：討論会で心鎮め', await flag('ch8_debate'), true);
  await talk('amatsu', 23, 9, 'right');
  await runThrough(atMap);
  expect('8章：コトシロと再会', await flag('ch8_meet'), true);
  await talk('amatsu_inn', 5, 4, 'up');
  for (let i = 0; i < 10 && !(await scenes()).endsWith('選択肢'); i++) await key('KeyZ', 120);
  await key('KeyZ', 300);   // 夜まで待つ
  await runThrough(atMap);
  expect('8章：夜になる', await flag('amatsu_night'), true);
  await shot('71_ch8_night');
  await walkTo('amatsu', 30, 8, 'right', 'ArrowRight', 150);
  await runThrough(atMap);
  expect('8章：貧民区でミオとヒナ', `${await pos()}/${await flag('ch8_mio')}`, 'amatsu_slum(24,6)/true');
  await walkTo('amatsu_slum', 24, 6, 'right', 'ArrowRight', 150);
  await runThrough(atMap);
  await castKotozute();
  await runThrough(() => GAME.state.chapter === 9 && GAME.scene.names().join() === 'マップ');
  expect('9章：やすらぎの院', await pos(), 'yasuragi(13,18)');
  await shot('72_ch9_sanatorium');
  // 見張りに見つかると塀の外へ戻る
  await ev(() => GAME.scene.change(GAME.scenes.map('yasuragi', 5, 13, 'right'))); await wait(200);
  await hold('ArrowUp', 150); await wait(400);
  await runThrough(atMap, 40);
  expect('9章：見張りに見つかると入口へ', await pos(), 'yasuragi(13,18)');
  await walkTo('yasuragi', 6, 3, 'up', 'ArrowUp', 150);
  await runThrough(atMap);
  expect('9章：大部屋', await flag('ch9_ward'), true);
  await walkTo('yasuragi', 21, 3, 'up', 'ArrowUp', 150);
  await runThrough(() => GAME.scene.names().includes('選択肢'));
  await shot('73_ch9_prayer');
  await ev(() => { const o = GAME.party.member('oonamuchi'); while (o.lv < 18) GAME.growth.forceLevelUp(o); GAME.party.healAll(); });
  await runThrough(() => GAME.scene.names().includes('蹂躙戦闘'));
  expect('9章：四柱が灯る（祈りの強さ>0）', await ev(() => ['yama', 'iza', 'hono', 'tsuku'].every(s => GAME.flags.get('pray_' + s)) && GAME.state.vars.prayer > 0), true);
  await wait(600); await shot('74_ch10_rampage');
  expect('10章：正体が露見して魔王の姿に', await ev(() => GAME.party.member('bell').look + '/' + GAME.state.disguised), 'bell_true/false');
  await runThrough(() => GAME.state.chapter === 11 && GAME.scene.names().join() === 'マップ');
  expect('10章の蹂躙：5隊とも止めた', await ev(() => GAME.state.vars.rampage_ch10.stopped), 5);
  expect('11章：魔界の畑から', await pos(), 'yomi_hani(7,13)');
  await talk('tsunogahara', 8, 5, 'up');
  await runThrough(atMap);
  await talk('yomi_sanctum', 5, 6, 'left');
  await runThrough(atMap);
  await talk('arashigamine', 8, 5, 'up');
  await runThrough(atMap);
  expect('11章：三つの修行（堅め連・先読み）', await ev(() => ['train_mika', 'train_naki', 'train_susa'].every(f => GAME.flags.get(f)) + '/' + ['katame_ren', 'sakiyomi'].every(k => GAME.party.member('oonamuchi').kotodama.includes(k))), 'true/true');
  await walkTo('yomi_market', 1, 9, 'left', 'ArrowLeft', 150);
  await runThrough(() => GAME.scene.names().includes('戦闘'));
  await wait(1200); await shot('75_ch11_takeru');
  await runThrough(() => GAME.state.chapter === 12 && GAME.scene.names().includes('戦闘'));
  await wait(1500); await shot('76_ch12_king');
  await runThrough(() => GAME.scene.names().join() === 'タイトル', 3000);
  expect('12章：名呼びを覚える', await ev(() => GAME.state.party.find(p => p.id === 'oonamuchi').kotodama.includes('nayobi')), true);
  expect('エピローグのあと、クリアの記録が残る', await ev(() => !!GAME.save.read('auto').state.cleared), true);
  await shot('77_ending_title');
  await ev(() => GAME.rng.setFixed(false));

  // ===== フェーズ9：クリア後 =====
  // 選択肢で k 番目（0から）を選ぶ
  const pick = async k => {
    for (let i = 0; i < 20 && !(await scenes()).endsWith('選択肢'); i++) await key('KeyZ', 120);
    for (let i = 0; i < k; i++) await key('ArrowDown', 60);
    await key('KeyZ', 300);
  };
  await ev(() => { GAME.rng.setFixed(true); GAME.story.jump(13); }); await wait(300);
  await runThrough(atMap);
  expect('クリア後：魔界の畑から', `${await pos()}/${await ev(() => GAME.state.chapter + ':' + GAME.state.cleared)}`, 'yomi_hani(7,13)/13:true');
  await ev(() => { const o = GAME.party.member('oonamuchi'); while (o.lv < 30) GAME.growth.forceLevelUp(o); GAME.party.healAll(); });
  expect('クリア後：レベル30まで上がる', await ev(() => GAME.party.member('oonamuchi').lv), 30);
  // 守：ハニヤスとの手合わせで、言霊を一つ教わる
  const yamaBefore = await ev(() => GAME.party.member('oonamuchi').kotodama.length);
  await talk('yomi_hani', 6, 13, 'down');
  await pick(0);
  await runThrough(atMap);
  expect('手合わせに勝つと言霊を一つ教わる', (await ev(() => GAME.party.member('oonamuchi').kotodama.length)) - yamaBefore, 1);
  // 四系統が足りないと、クナドは案内しない
  await talk('yomi_hani', 9, 12, 'up');
  await runThrough(atMap);
  expect('四系統が足りないと案内されない', await pos(), 'yomi_hani(9,12)');
  // 四系統をそろえる（テスト用に言霊を足す）→ 案内される
  await ev(() => { const o = GAME.party.member('oonamuchi'); const T = GAME.DATA.balance.POSTGAME.TEACH; ['haniyasu', 'mikazuchi', 'nakime', 'bell'].forEach(k => T[k].slice(0, 5).forEach(id => { if (!o.kotodama.includes(id)) o.kotodama.push(id); })); });
  await talk('yomi_hani', 9, 12, 'up');
  await runThrough(atMap);
  expect('四系統がそろうと大穴の最深部へ', await pos(), 'oana_soko(12,20)');
  await shot('78_post_abyss');
  // 天の声：まちがえると、そこで終わる
  await talk('oana_soko', 12, 3, 'up');
  await pick(0);   // 1問目を「頷く」（まちがい）
  await runThrough(atMap);
  expect('天の声：まちがえると扉は開かない', await flag('ame_lit'), false);
  // 正しく答える（誠実な方）
  await talk('oana_soko', 12, 3, 'up');
  for (const k of [1, 0, 1, 0, 1, 0]) await pick(k);
  await runThrough(() => { const e = GAME.scene.find('イベント'); return !!e && e.bg === 'trial'; }, 60);
  await wait(700); await shot('79_post_trial');
  await runThrough(atMap);
  expect('天の声：正しく答えると調和の光', `${await flag('ame_lit')}/${await ev(() => GAME.party.member('oonamuchi').kotodama.includes('chouwa'))}`, 'true/true');
  // ベルとの最終手合わせ → まことの名
  await talk('yomi_palace', 9, 4, 'up');
  await pick(1);
  await runThrough(atMap);
  expect('ベルとの最終手合わせで「まことの名」', await ev(() => GAME.party.member('oonamuchi').kotodama.includes('makoto')), true);
  // 任意の大軍戦（すべて止める → 慈悲の魔王）
  await talk('tsunogahara', 8, 5, 'up');
  await pick(1);
  await runThrough(atMap);
  expect('大軍戦をすべて止めると称号', await flag('title_mercy'), true);
  // ツクヨミの社：祭壇と、見破りで見抜く壁
  await talk('tsukuyomi_yashiro', 3, 4, 'up');
  await runThrough(atMap);
  await talk('tsukuyomi_yashiro', 10, 3, 'down');
  await runThrough(atMap);
  expect('ツクヨミの社：祭壇で覚え、偽りの壁が消える', `${await ev(() => GAME.party.member('oonamuchi').kotodama.includes('nemurigasumi'))}/${await flag('shrine_open')}`, 'true/true');
  await shot('80_post_shrine');
  expect('生き返しが使える', await ev(() => GAME.kotodama.usableIn(GAME.DATA.kotodama.ikikaeshi, 'battle')), true);
  // タイトルにクリアの印
  await ev(() => { GAME.save.write('1'); GAME.scene.change(GAME.scenes.title()); }); await wait(300);
  await shot('81_post_title');
  expect('記録の一覧に★', await ev(() => GAME.save.summary('1').startsWith('★')), true);
  await ev(() => GAME.rng.setFixed(false));

  // ===== フェーズ10：仕上げ（作戦・音・設定）=====
  // 作戦ごとの考え方：体力6割の仲間がいるとき
  const tac = await ev(() => {
    GAME.party.newGame();
    const st = GAME.battle.create(GAME.party.active(), ['boar']);
    const o = st.party.find(p => p.id === 'oonamuchi');
    o.kotodama = ['iyashi', 'hidane']; o.mp = o.maxMp;
    const b = st.party.find(p => p.id === 'bell'); b.hp = Math.ceil(b.maxHp * 0.6);
    const pickFor = t => { o.tactic = t; const c = GAME.ai.decide(st, o); return c.type === 'kotodama' ? c.id : c.type; };
    return ['heal', 'save', 'attack', 'life', 'auto'].map(t => t + ':' + pickFor(t)).join(' ');
  });
  expect('作戦ごとに動きが変わる', tac, 'heal:iyashi save:attack attack:hidane life:attack auto:attack');
  // 音：場所ごとに曲が変わる
  await ev(() => GAME.scene.change(GAME.scenes.title())); await wait(200);
  const songs = [await ev(() => GAME.sound.current())];
  await placeAt('minamo', 15, 12, 'down'); await wait(200); songs.push(await ev(() => GAME.sound.current()));
  await placeAt('field_minamo', 20, 3, 'down'); await wait(200); songs.push(await ev(() => GAME.sound.current()));
  await ev(() => GAME.scene.push(GAME.scenes.battle(['dog']))); await wait(300); songs.push(await ev(() => GAME.sound.current()));
  await ev(() => GAME.scene.pop()); await wait(200);
  await placeAt('yomi_hani', 7, 13, 'up'); await wait(200); songs.push(await ev(() => GAME.sound.current()));
  expect('曲：タイトル・町・野原・戦闘・魔界', songs.join(','), 'title,town,field,battle,yomi');
  // 設定：タイトルから開いて、敵の出やすさと音を切り替える
  await ev(() => { GAME.settings.encounter = 'normal'; GAME.settings.sound = true; GAME.scene.change(GAME.scenes.title()); }); await wait(200);
  await key('ArrowDown', 60); await key('ArrowDown', 60); await key('KeyZ', 200);   // 設定
  await shot('82_settings');
  await key('ArrowDown', 60); await key('KeyZ', 150);   // 敵の出やすさ → 少なめ
  await key('ArrowDown', 60); await key('KeyZ', 150);   // 音 → 切
  await key('ArrowDown', 60); await key('KeyZ', 300);   // 文字の大きさ → 大きい（試しの会話が出る）
  const bigText = await ev(() => `${GAME.settings.textSize}/${GAME.scene.names().includes('メッセージ')}`);
  await closeMessages();
  expect('設定：文字の大きさを大きくできる（試しの会話が出る）', bigText, 'large/true');
  await key('KeyX', 150);
  expect('設定：敵は少なめ・音は切（保存される）', await ev(() => `${GAME.settings.encounter}/${GAME.settings.sound}/${JSON.parse(localStorage.getItem('maou_settings')).sound}`), 'low/false/false');
  await ev(() => { GAME.settings.encounter = 'normal'; GAME.settings.sound = true; GAME.settings.textSize = 'normal'; GAME.save.saveSettings(); });

  // ===== 仕上げの追加（手紙・クナドの補助）=====
  await placeAt('minamo', 15, 12, 'up'); await wait(200);
  await ev(() => { const o = GAME.message.show; window.__msgs = []; GAME.message.show = (a, b) => { window.__msgs.push(JSON.stringify(a)); return o.call(GAME.message, a, b); }; });
  expect('2章：手紙の窓のあとで手紙を拾う', await ev(() => JSON.stringify(Object.values(GAME.DATA.events).flat().filter(c => c && c.t === 'item' && c.id === 'kakikake_tegami').length)), '1');
  await ev(() => { GAME.state.items = []; GAME.event.run([{ t: 'item', id: 'kakikake_tegami' }], () => {}); }); await wait(300);
  await closeMessages();
  expect('手紙が大事なものとして持ち物に入る', await ev(() => `${GAME.party.count('kakikake_tegami')}/${GAME.DATA.items.kakikake_tegami.type}`), '1/key');
  await ev(() => GAME.shop.open('minamo')); await wait(200);
  await key('ArrowDown', 80); await key('KeyZ', 200); await key('KeyZ', 200);   // 売る → 手紙
  expect('手紙は売れない', await ev(() => `${GAME.party.count('kakikake_tegami')}/${window.__msgs.some(m => m.includes('手放せない'))}`), '1/true');
  await closeMessages();
  for (let i = 0; i < 4 && (await scenes()).includes('お店'); i++) await key('KeyX', 150);
  await key('KeyX', 250); await key('KeyZ', 200); await key('KeyZ', 250);   // メニュー → もちもの → 手紙
  expect('持ち物から手紙を読める', await ev(() => window.__msgs.some(m => m.includes('娘に'))), true);
  await closeMessages();
  for (let i = 0; i < 4 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 150);
  const assist = await ev(() => {
    const cmd = GAME.DATA.events.ch12_battle.concat(GAME.DATA.events.ch12_start).find(c => c.t === 'run' && String(c.fn).includes('nayobi_assist'));
    const m = GAME.party.member('oonamuchi'), lv = m.lv, out = [];
    m.lv = GAME.DATA.balance.NAYOBI_LV - 3; cmd.fn(); out.push(GAME.flags.get('nayobi_assist'));
    m.lv = GAME.DATA.balance.NAYOBI_LV; cmd.fn(); out.push(!!GAME.flags.get('nayobi_assist'));
    m.lv = lv; return out.join('/');
  });
  expect('12章：育ちが足りないとクナドが名呼びを支える', assist, 'true/false');

  // ===== 四すくみ（構え）=====
  const aff = await ev(() => {
    const oo = GAME.party.member('oonamuchi'), saveKo = oo.kotodama.slice(), saveMp = oo.mp, out = [];
    GAME.flags.set('train_susa', false);
    const st = GAME.battle.create([oo], ['mikazuchi_t', 'susano_t', 'nakime_t']);
    const [mika, susa, naki] = st.enemies;
    oo.mp = 99;
    const cast = (id, t) => GAME.battle.act(st, oo, { type: 'kotodama', id, target: t || oo }).map(e => e.text || '').join('|');
    const noKnow = cast('katame');
    out.push(oo.stance, GAME.affinity.mult(oo, mika), noKnow.includes('構え'));      // 山＝土蜘蛛：鬼には効かない／まだ相性は見えない
    GAME.flags.set('train_susa');
    const t2 = cast('iyashi');
    out.push(oo.stance, GAME.affinity.mult(oo, mika), t2.includes('鴉の構え'));       // 生＝鴉：鬼に強い
    cast('hidane', naki);
    out.push(oo.stance, GAME.affinity.mult(oo, susa), GAME.affinity.mult(oo, naki));  // 火＝鬼：嵐狼に強く、鴉に弱い
    out.push(GAME.affinity.mult(mika, oo) === 1, GAME.affinity.mult(naki, oo));       // 構えは受けるときにも効く
    oo.kotodama = saveKo; oo.mp = saveMp; oo.stance = null;
    return out.join(',');
  });
  expect('四すくみ：言霊の系統で構えが変わり、倍率が決まる', aff, 'tsuchigumo,1,false,karasu,1.5,true,oni,1.5,0.75,true,1.5');
  // 戦闘画面に種族と弱点が出る
  await ev(() => { GAME.flags.set('train_susa'); GAME.scene.push(GAME.scenes.battle(['mikazuchi_t'], { training: true })); }); await wait(1200);
  for (let i = 0; i < 6 && !(await ev(() => GAME.scene.top().phase === 'command')); i++) await key('KeyZ', 300);
  await shot('91_tribe');
  expect('戦闘画面：敵の種族と弱点', await ev(() => GAME.affinity.weakTo(GAME.DATA.enemies.mikazuchi_t.tribe)), 'karasu');
  await ev(() => { GAME.scene.pop(); GAME.state.party.forEach(m => { m.stance = null; }); });
  await wait(200);

  // ===== フィールドマップ（人間界・魔界）=====
  await ev(() => { GAME.story.jump(7); GAME.encounter.enabled = false; }); await wait(1500);
  await placeAt('world_ningen', 8, 6, 'up'); await wait(400); await shot('92_world_ningen');
  await hold('ArrowUp', 200); await wait(400);
  expect('人間界：炉ヶ岳の印に乗ると山道へ', await pos(), 'ro_path(12,19)');
  await hold('ArrowDown', 200); await wait(400);
  expect('人間界：山道の南の端からフィールドへ', await pos(), 'world_ningen(8,6)');
  await placeAt('world_ningen', 26, 12, 'up'); await wait(300); await hold('ArrowUp', 200);
  const blockedMsg = (await scenes()).includes('メッセージ');
  await closeMessages();
  expect('人間界：まだの章の町には入れない（7章で天津京）', `${await pos()}/${blockedMsg}`, 'world_ningen(26,12)/true');
  expect('章ごとの敵（7章は獣ノ原の敵）', await ev(() => { GAME.state.encounterSteps = 0; GAME.encounter.enabled = true; const g = GAME.encounter.step(GAME.DATA.maps.world_ningen, GAME.DATA.tiles['.']); GAME.encounter.enabled = false; return ['arano_ookami', 'oosasori'].includes(g[0]); }), true);
  await ev(() => { GAME.story.jump(11); }); await wait(1500);
  await runThrough(atMap, 200);
  await ev(() => { GAME.encounter.enabled = false; });
  await placeAt('yomi_hani', 14, 16, 'down'); await wait(300); await hold('ArrowDown', 200); await wait(400);
  expect('魔界：11章は畑の南から魔界のフィールドへ', await pos(), 'world_makai(16,17)');
  await shot('93_world_makai');
  await placeAt('world_makai', 25, 10, 'up'); await wait(300); await hold('ArrowUp', 200); await wait(400);
  expect('魔界：嵐ヶ峰へ入れる', await pos(), 'arashigamine(8,10)');
  // クリア後：大穴で両世界を行き来、Lv99でカンスト
  await ev(() => { GAME.story.jump(13); }); await wait(1500);
  await runThrough(atMap, 200);
  await ev(() => { GAME.encounter.enabled = false; });
  await placeAt('world_makai', 15, 11, 'up'); await wait(300); await hold('ArrowUp', 200); await wait(400);
  expect('クリア後：魔界の大穴から人間界へ', await pos(), 'world_ningen(16,11)');
  await placeAt('world_ningen', 16, 14, 'up'); await wait(300); await hold('ArrowUp', 200); await wait(400);
  expect('クリア後：人間界の町にも入れる（ミナモ）', await pos(), 'minamo(15,22)');
  expect('偽名の間、オオナムチのいない場面ではベルの印象が薄れる', await ev(() => {
    const d = GAME.state.disguised; GAME.state.disguised = true;
    const alone = GAME.inhibit.impression('bell', [{ look: 'bell' }, { look: 'guild' }]);
    const withOo = GAME.inhibit.impression('bell', [{ look: 'bell' }, { look: 'oonamuchi' }]);
    GAME.state.disguised = false; const trueForm = GAME.inhibit.impression('bell', [{ look: 'bell' }]);
    GAME.state.disguised = d;
    return `${alone < 1}/${withOo}/${trueForm}`;
  }), 'true/1/1');
  expect('敵全体への攻撃では会心が出ない', await ev(() => {
    const bell = GAME.party.member('bell'), ch = GAME.state.chapter, orig = GAME.rng.chance;
    GAME.state.chapter = 2; GAME.rng.chance = () => true;   // 会心の判定を必ず当たりにしても出ない
    const st = GAME.battle.create([bell], ['zantou', 'zantou']);
    const ev = GAME.battle.act(st, bell, { type: 'attack', target: st.enemies[0] });
    GAME.rng.chance = orig; GAME.state.chapter = ch; GAME.kotodama.clearBattleState(bell);
    return ev.some(e => e.text === '会心の一撃！');
  }), false);
  expect('2章のほかはベルイザナもふつうの1回攻撃', await ev(() => {
    const bell = GAME.party.member('bell'), st = GAME.battle.create([bell], ['zantou', 'zantou']);
    const ev = GAME.battle.act(st, bell, { type: 'attack', target: st.enemies[0] });
    GAME.kotodama.clearBattleState(bell);
    return `${ev.filter(e => e.text && e.text.includes('の攻撃！')).length}/${st.enemies.filter(e => e.hp < e.maxHp).length}`;
  }), '1/1');
  expect('クリア後のやりこみ：レベルに応じて強い敵', await ev(() => {
    const o = GAME.party.member('oonamuchi'), lv = o.lv, map = GAME.DATA.maps.world_makai, tile = GAME.DATA.tiles['$'], out = [];
    GAME.encounter.enabled = true;
    [20, 80].forEach(l => { o.lv = l; GAME.state.encounterSteps = 0; out.push(GAME.encounter.step(map, tile).some(id => ['orochi', 'nakui_ou', 'zantou'].includes(id))); });
    GAME.encounter.enabled = false; o.lv = lv; return out.join('/');
  }), 'false/true');
  await placeAt('world_makai', 16, 17, 'left'); await wait(2500); await shot('94_world_makai_post');
  expect('レベル99でカンスト（装備を足しても255まで）', await ev(() => { const o = GAME.party.member('oonamuchi'); while (GAME.growth.forceLevelUp(o).length) {} return `${o.lv}/${o.maxHp}/${o.maxMp}/${o.atk}/${o.def}`; }), '99/999/999/255/255');
  await ev(() => { GAME.encounter.enabled = true; });

  // メニューの「いまの目的」
  expect('どの章にも、いまの目的がある', await ev(() => {
    const ch = GAME.state.chapter, fl = Object.assign({}, GAME.flags.data), miss = [];
    for (let c = 1; c <= 13; c++) { GAME.state.chapter = c; GAME.flags.reset(); if (!GAME.objective()) miss.push(c); }
    GAME.state.chapter = ch; GAME.flags.data = fl; return miss.join(',') || 'なし';
  }), 'なし');
  expect('目的は進み具合で変わる（4章：ギルド→野原→ひなた野）', await ev(() => {
    const ch = GAME.state.chapter, fl = Object.assign({}, GAME.flags.data), out = [];
    GAME.state.chapter = 4; GAME.flags.reset(); out.push(GAME.objective().includes('ギルド'));
    GAME.flags.set('ch4_guild'); out.push(GAME.objective().includes('野原'));
    GAME.flags.set('ch4_dogs'); out.push(GAME.objective().includes('届け物'));
    GAME.state.chapter = ch; GAME.flags.data = fl; return out.join('/');
  }), 'true/true/true');
  await placeAt('minamo', 15, 12, 'down'); await wait(300); await key('KeyX', 300); await shot('95_menu_goal');
  for (let i = 0; i < 3 && (await scenes()) !== 'マップ'; i++) await key('KeyX', 150);
  expect('文字を大きくすると、メニューや戦闘の字も大きくなる（ふつう12→14）', await ev(() => {
    const keep = GAME.settings.textSize, R = GAME.renderer, out = [R.baseSize()];
    GAME.settings.textSize = 'large'; out.push(R.baseSize(), new GAME.ui.Menu([{ label: 'a' }]).lineH);
    GAME.settings.textSize = keep; return out.join('/');
  }), '12/14/18');
  expect('文字を大きくしても、戦いのコマンド窓は画面に収まる（ベルの6項目でも）', await ev(() => {
    const keep = GAME.settings.textSize; GAME.settings.textSize = 'large';
    const m = new GAME.ui.Menu([1, 2, 3, 4, 5, 6].map(i => ({ label: 'x' + i })), { title: 'ベル', w: 150 });
    const sub = new GAME.ui.Menu([1, 2, 3, 4, 5, 6].map(i => ({ label: 'x' + i })), { title: '言霊', rows: 5, w: 310 });
    GAME.settings.textSize = keep;
    return 312 - m.h >= 60 && 312 - sub.h >= 60;
  }), true);
  expect('マップのデータに食い違いがない（行の長さ・出入口の行き先・人の立つ場所・場面の名前）', await ev(() => {
    const D = GAME.DATA, out = [];
    const solid = (m, x, y) => { const c = (m.rows[y] || '')[x]; return c == null || !D.tiles[c] || D.tiles[c].solid; };
    for (const [id, m] of Object.entries(D.maps)) {
      const W = m.rows[0].length;
      m.rows.forEach((r, y) => { if (r.length !== W) out.push(`${id}:行${y}`); });
      (m.warps || []).forEach(w => { if (!D.maps[w.to] || solid(D.maps[w.to], w.tx, w.ty)) out.push(`${id}:出入口(${w.x},${w.y})`); });
      (m.npcs || []).forEach(n => {
        if (solid(m, n.x, n.y)) out.push(`${id}:人(${n.x},${n.y})`);
        if (typeof n.event === 'string' && !D.events[n.event]) out.push(`${id}:場面${n.event}`);
      });
    }
    return out.join('、') || 'なし';
  }), 'なし');
  expect('賢さ：仲間みんなにあり、魔王ベルイザナは255、Lv99で255', await ev(() => {
    const keep = JSON.stringify(GAME.state);
    GAME.party.newGame();
    const out = [GAME.state.party.every(m => m.wis > 0), GAME.party.member('bell').wis, GAME.growth.baseAt('oonamuchi', 99).wis,
      Object.values(GAME.DATA.balance.TEMP_PARTY).every(t => t.wis > 0)];
    GAME.state = JSON.parse(keep); GAME.party.member('bell') && GAME.party.recalc(GAME.party.member('bell'));
    return out.join('/');
  }), 'true/255/255/true');
  expect('言霊の強さは賢さで決まる（攻める言霊も、癒やす言霊も）', await ev(() => {
    const keepInt = GAME.rng.int; GAME.rng.int = a => a;
    const run = (id, w) => {
      const st = GAME.battle.create(GAME.party.freshMembers(), ['boar'], {});
      const u = st.party.find(a => !GAME.DATA.characters[a.id].isBell); u.wis = w; u.mp = 999; u.atk = 50;
      const e = st.enemies[0]; e.hp = e.maxHp = 9999;
      if (id === 'iyashi') { u.maxHp = 999; u.hp = 1; GAME.kotodama.cast(u, id, u, st); return u.hp - 1; }
      GAME.kotodama.cast(u, id, e, st); return 9999 - e.hp;
    };
    const r = [run('hidane', 0) < run('hidane', 100), run('iyashi', 0) < run('iyashi', 100)];
    GAME.rng.int = keepInt; return r.join('/');
  }), 'true/true');
  expect('敵にも賢さがあり、状態を変える言霊の効きやすさは賢さの差で上下する（0.5〜1.5倍）', await ev(() => {
    const E = GAME.DATA.enemies, k = GAME.kotodama;
    const all = Object.values(E).every(e => e.wis > 0);
    return [all, E.nakui_ou.wis > E.dog.wis, k.statusWisMult({ wis: 255 }, { wis: 3 }), k.statusWisMult({ wis: 3 }, { wis: 255 }), k.statusWisMult({ wis: 20 }, { wis: 20 })].join('/');
  }), 'true/true/1.5/0.5/1');
  expect('賢さのない古い記録でも、読み込むと賢さが入る', await ev(() => {
    const m = JSON.parse(JSON.stringify(GAME.state.party.find(p => p.lv != null)));
    delete m.base.wis; delete m.wis; GAME.party.recalc(m); return m.wis > 0;
  }), true);
  expect('場面のデータに食い違いがない（行き先・仲間・敵・言霊・道具・呼ぶ場面・背景・曲）', await ev(() => {
    const D = GAME.DATA, out = [], looks = D.sprites.LOOKS;
    const walk = (cmds, where) => (cmds || []).forEach(c => {
      if (!c || typeof c !== 'object') return;
      const w = where + ':' + c.t;
      if (c.t === 'goto' && !D.maps[c.map]) out.push(w);
      if ((c.t === 'join' || c.t === 'leave' || c.t === 'rename' || c.t === 'learn') && !D.characters[c.id]) out.push(w);
      if (c.t === 'party' && (c.ids || []).some(id => !D.characters[id])) out.push(w);
      if (c.t === 'battle' && (c.enemies || []).some(e => !D.enemies[e])) out.push(w);
      if (c.t === 'learn' && [].concat(c.kotodama).some(k => !D.kotodama[k])) out.push(w);
      if (c.t === 'item' && !D.items[c.id]) out.push(w);
      if (c.t === 'call' && !D.events[c.id]) out.push(w);
      if (c.t === 'bg' && ((c.key && !GAME.backdrop.has(c.key)) || (c.actors || []).some(a => !looks[a.look]))) out.push(w);
      if (c.t === 'bgm' && c.name && !GAME.sound.SONGS[c.name]) out.push(w);
      walk(c.then, w); walk(c.else, w); (c.options || []).forEach(o => walk(o.then, w));
    });
    Object.entries(D.events).forEach(([id, sc]) => walk(sc, id));
    Object.entries(D.maps).forEach(([id, m]) => ['npcs', 'onEnter', 'triggers', 'spots'].forEach(k => (m[k] || []).forEach(t => { if (typeof t.event === 'string' && !D.events[t.event]) out.push(id + ':' + t.event); })));
    return out.join('、') || 'なし';
  }), 'なし');
  expect('拠点の扉は、どれも建物の中へ入れる（入口のマスに出入口がある）', await ev(() => {
    const D = GAME.DATA, out = [];
    ['minamo', 'hinatano', 'hijiri_village', 'ro_village', 'kuzu_village', 'amatsu', 'amatsu_slum'].forEach(id => {
      const m = D.maps[id];
      m.rows.forEach((r, y) => [...r].forEach((c, x) => {
        if ('dDJ'.includes(c) && !(m.warps || []).some(w => w.x === x && w.y === y)) out.push(`${id}(${x},${y})`);
      }));
    });
    return out.join('、') || 'なし';
  }), 'なし');
  {
    // クリア後のミナモで、網元の家に歩いて入り、歩いて出る
    await ev(() => { GAME.state.chapter = 13; GAME.scene.change(GAME.scenes.map('minamo', 23, 9, 'up')); }); await wait(300);
    await closeMessages();
    await hold('ArrowUp', 260); await wait(300); await closeMessages();
    const inside = await pos();
    await hold('ArrowDown', 700); await wait(300); await closeMessages();
    expect('建物に歩いて入り、歩いて出る（ミナモ 網元の家）', `${inside}→${await pos()}`, 'minamo_r1(5,7)→minamo(23,9)');
  }
  expect('目的の文は、遊んだ時間と重ならない長さ', await ev(() => {
    const R = GAME.renderer, room = 440 - R.measure('遊んだ時間 99:59') - 8;
    return GAME.DATA.objectives.filter(o => R.measure('目的：' + o.text) > room).map(o => o.text).join('、') || 'なし';
  }), 'なし');
  expect('記録の一覧の文は、一番長い場所の名前でも窓に収まる', await ev(() => {
    const R = GAME.renderer, names = Object.values(GAME.DATA.maps).map(m => m.name);
    const longest = names.sort((a, b) => R.measure(b) - R.measure(a))[0];
    return R.measure(`★クリア後 ${longest} Lv99 123:45 12/31`) + R.measure('記録1') + 40 <= 440;
  }), true);
  expect('遊んだ時間が増え、記録の一覧に章と時間が出る', await ev(() => {
    const f0 = GAME.state.playFrames;
    GAME.state.playFrames = 3600 * 75;
    const s = GAME.save.playTime(GAME.state.playFrames);
    GAME.save.write('3'); const sum = GAME.save.summary('3');
    GAME.state.playFrames = f0; localStorage.removeItem('maou_save_3');
    return [f0 > 0, s, /章|クリア後/.test(sum) && sum.includes('1:15')].join('/');
  }), 'true/1:15/true');

  // タイトルの「遊び方」
  await ev(() => GAME.scene.change(GAME.scenes.title())); await wait(300);
  for (let i = 0; i < 5; i++) await key('ArrowDown', 60);
  await key('KeyZ', 400);
  expect('タイトルの「遊び方」で操作と決まりが出る', await ev(() => `${GAME.scene.names().join('>')}/${GAME.DATA.howToPlay.length}`), 'タイトル>メッセージ/5');
  await closeMessages();

  // スマホ縦画面
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mobile.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mobile.goto(url);
  await mobile.waitForTimeout(400);
  await mobile.tap('#pad .a');
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: path.join(outDir, '11_mobile.png') });
  // スマホ横画面：ボタンは左右の余白に重なり、画面は大きいまま
  const land = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  land.on('pageerror', e => errors.push('landscape pageerror: ' + e.message));
  await land.goto(url);
  await land.waitForTimeout(400);
  await land.tap('#pad .a');
  await land.waitForTimeout(400);
  await land.screenshot({ path: path.join(outDir, '83_landscape.png') });
  const lay = await land.evaluate(() => {
    const c = document.getElementById('game').getBoundingClientRect(), d = document.querySelector('.dpad').getBoundingClientRect(), a = document.querySelector('.ab').getBoundingClientRect();
    return { canvasH: Math.round(c.height), dpadLeftOfCanvas: d.right <= c.left + 1, abRightOfCanvas: a.left >= c.right - 1 };
  });
  expect('横画面：ボタンが画面に重ならない', `${lay.canvasH >= 300}/${lay.dpadLeftOfCanvas}/${lay.abRightOfCanvas}`, 'true/true/true');

  console.log(errors.length ? 'エラー:\n' + errors.join('\n') : 'エラーなし');
  console.log(fails.length ? `失敗 ${fails.length} 件` : 'すべて合格');
  await browser.close();
  process.exit(errors.length || fails.length ? 1 : 0);
})();
