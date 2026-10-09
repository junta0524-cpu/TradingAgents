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
  await key('KeyZ'); await key('KeyX');
  expect('メニューを閉じる', await scenes(), 'マップ');

  // デバッグ：マップへ移動・フラグ一覧
  await key('F1', 200); await key('KeyZ', 200);
  await shot('09_debug_maps');
  await key('ArrowDown'); await key('ArrowDown'); await key('KeyZ', 400);
  expect('デバッグでマップ移動', await pos(), 'field_minamo(20,3)');
  await key('F1', 200);
  for (let i = 0; i < 5; i++) await key('ArrowDown', 60);
  await key('KeyZ', 200);
  await shot('10_debug_flags');
  await key('KeyZ', 200);   // 一番上のフラグを切り替え
  await key('KeyX'); await key('KeyX');

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
