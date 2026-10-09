// このファイルの役目：作る人用の自動チェック（ゲーム本体では使わない）。
// ブラウザ（Chromium）で index.html を開き、キー操作をしてエラーが出ないか確かめ、画面写真を撮る。
// 使い方：node tools/check.js [写真の保存先フォルダ]
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

(async () => {
  const outDir = process.argv[2] || os.tmpdir();
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const shot = async name => page.screenshot({ path: path.join(outDir, name + '.png') });
  const key = async (k, wait = 150) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };
  const scenes = () => page.evaluate(() => GAME.scene.names().join(' > '));

  await page.goto(url);
  await page.waitForTimeout(400);
  await shot('01_title');
  console.log('title:', await scenes());

  // 文字の速さメニュー
  await key('ArrowDown'); await key('KeyZ');
  await shot('02_speed');
  await key('ArrowDown'); await key('ArrowDown'); await key('Enter');
  console.log('speed:', await page.evaluate(() => GAME.settings.textSpeed));
  await key('ArrowUp'); await key('Space');            // はじめから

  await page.waitForTimeout(200);
  await shot('03_message_typing');
  await key('KeyZ');                                    // 一気に表示
  await shot('04_message_full');
  for (let i = 0; i < 3; i++) { await key('KeyZ'); await key('KeyZ'); }
  await page.waitForTimeout(600);
  await shot('05_message_long');
  // Shift早送りで最後まで
  await page.keyboard.down('Shift'); await page.waitForTimeout(400);
  await shot('06_fast');
  await page.waitForTimeout(1500); await page.keyboard.up('Shift');
  console.log('after demo:', await scenes());

  // デバッグメニュー
  await key('F1');
  await shot('07_debug');
  for (let i = 0; i < 9; i++) await key('ArrowDown', 60);
  await key('KeyZ', 400);
  await shot('08_debug_rng');
  console.log('rng fixed:', await page.evaluate(() => GAME.rng.fixed));
  await key('KeyZ'); await key('KeyZ');
  await key('ArrowUp'); await key('KeyZ', 400);         // 未実装項目
  await shot('09_debug_disabled');
  await key('KeyZ'); await key('KeyZ');
  await key('F1');
  console.log('after debug:', await scenes());

  // スマホ縦画面
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mobile.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mobile.goto(url);
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: path.join(outDir, '10_mobile.png') });
  await mobile.tap('#pad .a');
  await mobile.waitForTimeout(300);
  console.log('mobile after A:', await mobile.evaluate(() => GAME.scene.names().join(' > ')));

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'エラーなし');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
