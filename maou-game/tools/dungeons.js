// このファイルの役目：作る人用の自動チェック。寄り道のダンジョン（しかけのある5つ）を、キー操作で最後まで解いてみる。
// 道すじは、その時のマップ（開いた門・岩の位置）を読んで探す（滑る床・流れる床・ひびの床も考える）。
// 使い方：NODE_PATH=$(npm root -g) node tools/dungeons.js　（tools/check.js からも呼ぶ）
const { chromium } = require('playwright');

async function run(page, expect) {
  const wait = ms => page.waitForTimeout(ms);
  const ev = (f, a) => page.evaluate(f, a);
  const scenes = () => ev(() => GAME.scene.names().join('>'));
  const pos = () => ev(() => { const m = GAME.scene.find('マップ'); return `${m.mapId}(${m.player.x},${m.player.y})`; });
  // 落ち着くまで待つ（歩き・滑り・場面の切り替えが終わる）
  const idle = async () => {
    let last = '', same = 0;
    for (let i = 0; i < 80 && same < 3; i++) {
      await wait(50);
      const s = await ev(() => { const m = GAME.scene.find('マップ'); return GAME.scene.names().join('>') + (m ? `${m.mapId}${m.player.x},${m.player.y}${m.player.moving}` : ''); });
      if (s === last) same++; else { same = 0; last = s; }
    }
  };
  const closeMsgs = async () => { for (let i = 0; i < 12 && (await scenes()).includes('メッセージ'); i++) { await page.keyboard.press('KeyZ'); await wait(150); } };
  const KEY = { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' };
  // 1マス（滑る床なら止まるまで）動く
  const here = () => ev(() => { const m = GAME.scene.find('マップ'); return m.mapId + ':' + m.player.x + ',' + m.player.y; });
  const step = async k => {
    // 押しても動かなかったとき（キーの取りこぼし）は、もう一度だけ押す
    for (let tries = 0; tries < 2; tries++) {
      const before = await here();
      await page.keyboard.down(KEY[k]);
      for (let i = 0; i < 20; i++) { await wait(15); if (await ev(b => { const m = GAME.scene.find('マップ'); return m.player.moving || m.mapId + ':' + m.player.x + ',' + m.player.y !== b; }, before)) break; }
      await page.keyboard.up(KEY[k]);
      await idle(); await closeMsgs(); await idle();
      if ((await here()) !== before) return;
    }
  };
  const face = async k => { await page.keyboard.down(KEY[k]); await wait(20); await page.keyboard.up(KEY[k]); await wait(60); };
  // 道すじを探す（ページの中で、いまの地形から）
  const route = (tx, ty) => ev(([tx, ty]) => {
    const m = GAME.scene.find('マップ'), rows = m.rows, map = GAME.DATA.maps[m.mapId], st = m.gimmickState;
    const D = GAME.DATA.tiles;
    const wall = new Set();
    (map.chests || []).concat(map.signs || []).forEach(o => wall.add(o.x + ',' + o.y));
    (map.gimmicks || []).forEach(g => { if (['lever', 'torch', 'lantern'].includes(g.type)) wall.add(g.x + ',' + g.y); });
    st.boulders.forEach(b => wall.add(b.x + ',' + b.y));
    (map.warps || []).forEach(w => { if (!(w.x === tx && w.y === ty)) wall.add(w.x + ',' + w.y); });
    (map.npcs || []).filter(n => GAME.flags.check(n)).forEach(n => wall.add(n.x + ',' + n.y));
    const tile = (x, y) => (rows[y] && rows[y][x] != null ? D[rows[y][x]] : null);
    const solid = (x, y) => { const t = tile(x, y); return !t || t.solid || t.hurt || wall.has(x + ',' + y); };
    const DIR = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }, FL = { up: 'u', down: 'd', left: 'l', right: 'r' };
    const move = (x, y, k) => {
      let [dx, dy] = DIR[k];
      if (solid(x + dx, y + dy) && !(x + dx === tx && y + dy === ty && tile(tx, ty) && !tile(tx, ty).solid)) return null;
      x += dx; y += dy;
      for (let n = 0; n < 400; n++) {
        const t = tile(x, y);
        if (t.fall) return null;
        if (t.flow) [dx, dy] = DIR[FL[t.flow]];
        else if (!t.slide) return [x, y];
        if (solid(x + dx, y + dy)) return [x, y];
        x += dx; y += dy;
      }
      return [x, y];
    };
    const p = m.player, start = p.x + ',' + p.y, prev = { [start]: null }, q = [[p.x, p.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const k of 'udlr') {
        const n = move(x, y, k);
        if (!n) continue;
        const key = n.join(',');
        if (!(key in prev)) { prev[key] = [x + ',' + y, k]; q.push(n); }
      }
    }
    let cur = tx + ',' + ty, out = '';
    if (!(cur in prev)) return null;
    while (prev[cur]) { out = prev[cur][1] + out; cur = prev[cur][0]; }
    return out;
  }, [tx, ty]);
  const goTo = async (tx, ty, label) => {
    const r = await route(tx, ty);
    if (r == null) { expect(`${label}：道がある`, `${await pos()}→(${tx},${ty})`, '道あり'); return false; }
    for (const k of r) await step(k);
    return true;
  };
  // 調べる（確認「はい」まで）
  const examine = async dir => {
    await face(dir); await page.keyboard.press('KeyZ'); await wait(250);
    for (let i = 0; i < 12; i++) {
      const s = await scenes();
      if (s === 'マップ') break;
      await page.keyboard.press('KeyZ'); await wait(200);   // 確認は最初が「はい」
    }
    await idle();
  };
  // 番人と戦う（調べる→「戦いますか？」はい→勝つまで決定キー）
  const fight = async (dir, mapId) => {
    await ev(() => GAME.state.party.forEach(m => { m.hp = m.maxHp; m.mp = m.maxMp; m.status = {}; }));
    await face(dir); await page.keyboard.press('KeyZ'); await wait(250);
    for (let i = 0; i < 900; i++) {
      const s = await scenes();
      if (s === 'マップ' && i > 3) break;
      await page.keyboard.press('KeyZ'); await wait(s.includes('戦闘') ? 60 : 150);
    }
    await idle();
    return flag(`gm:${mapId}:nushi`);
  };
  const place = async (id, x, y, dir) => { await ev(([id, x, y, dir]) => { GAME.scene.change(GAME.scenes.map(id, x, y, dir)); }, [id, x, y, dir]); await wait(250); await closeMsgs(); await idle(); };
  const has = id => ev(id => GAME.party.count(id), id);
  const flag = f => ev(f => GAME.flags.get(f), f);

  // 準備：クリア後、オオナムチが必要な言霊を覚えている。敵は出ない
  await ev(() => {
    GAME.party.newGame(); GAME.state.chapter = 13; GAME.state.cleared = true; GAME.encounter.enabled = false;
    const o = GAME.party.member('oonamuchi');
    o.kotodama = ['katame', 'iyashi', 'kokoroshizume', 'hidane', 'miyaburi', 'ikazuchi'];
    o.maxMp = o.mp = 999;
    // 番人と戦えるだけの強さ（作戦は「うまくやって」で自動）
    while (o.lv < 99) { o.exp = GAME.DATA.balance.EXP_TABLE[o.lv + 1]; GAME.growth.checkLevelUp(o); }
    o.hp = o.maxHp; o.mp = o.maxMp = 999; GAME.state.party.forEach(m => { m.tactic = 'auto'; });
  });

  // ---- 1. 苔むした地下道 ----
  await place('hijiri_cave', 1, 2, 'up'); await step('u');
  expect('寄り道：洞窟の奥の石段から、苔むした地下道へ', await pos(), 'hijiri_deep(4,13)');
  await goTo(6, 12, '地下道'); await examine('u');
  expect('地下道：心鎮めで火の玉が静まる', await flag('gm:hijiri_deep:wisp'), true);
  await goTo(18, 4, '地下道 苔の広間'); await examine('r');
  expect('地下道：苔の広間を滑ってレバーへ→門が開く', await flag('deep_lever'), true);
  await goTo(19, 1, '地下道 宝箱'); await examine('r');
  await goTo(18, 11, '地下道 門'); 
  expect('地下道：番人（苔の大蜘蛛）を倒すと、宝の部屋へ入れる', await fight('u', 'hijiri_deep'), true);
  await goTo(20, 10, '地下道 門の奥'); await examine('u');
  await goTo(2, 5, '地下道 蔦の前'); await examine('u');
  await goTo(4, 2, '地下道 蔦の奥'); await examine('u');
  expect('地下道：門の奥と、蔦（火種で焼く）の奥の宝', `${await has('morimori_gaitou')}/${await has('kotonoha_juzu')}/${await has('kizugusuri')}`, '1/1/2');

  // ---- 2. 古い坑道 ----
  await place('ro_path', 2, 17, 'left'); await step('l');
  expect('寄り道：山道の岩陰から、古い坑道へ', await pos(), 'ro_mine(12,16)');
  for (const k of 'uuuu') await step(k);              // 岩1を押して上の穴へ
  expect('坑道：岩を押して1つ目の穴を埋める', await flag('gm:ro_mine:fill:12,11'), true);
  await goTo(9, 13, '坑道 岩2の左'); for (const k of 'rr') await step(k);
  await goTo(12, 14, '坑道 岩2の下'); for (const k of 'uuu') await step(k);
  expect('坑道：2つ目の穴も埋まり、北へ行ける', await flag('gm:ro_mine:fill:12,10'), true);
  const hp0 = await ev(() => GAME.party.member('oonamuchi').hp);
  await goTo(12, 7, '坑道 焼けた岩の広間');
  for (const k of 'uulll') await step(k);              // わざと焼けた岩を踏む
  expect('坑道：焼けた岩を踏むと体力が減る', (await ev(() => GAME.party.member('oonamuchi').hp)) < hp0, true);
  await ev(() => GAME.state.party.forEach(m => { m.hp = m.maxHp; }));
  await place('ro_mine', 16, 4, 'right');
  for (const x of [17, 18, 19]) { await step('r'); await examine('r'); }
  expect('坑道：崩れた足場を堅めで固めて渡れる', `${await flag('gm:ro_mine:gap')}/${await flag('gm:ro_mine:gap3')}`, 'true/true');
  await goTo(23, 1, '坑道 東の棟のレバー'); await examine('r');
  expect('坑道：レバーで焼けた岩の床が冷える', await flag('mine_cool'), true);
  await goTo(22, 2, '坑道 岩3の上'); for (const k of 'ddddd') await step(k);
  expect('坑道：岩を重しの床に乗せると門が開く', await flag('gm:ro_mine:plate'), true);
  await goTo(24, 14, '坑道 鍵の宝箱'); await examine('d');
  expect('坑道：鍵を手に入れる', await has('koudou_kagi'), 1);
  await goTo(5, 4, '坑道 鍵の扉'); await examine('l');
  expect('坑道：鍵で扉が開き、鍵はなくなる', `${await flag('gm:ro_mine:door')}/${await has('koudou_kagi')}`, 'true/0');
  await goTo(4, 4, '坑道 扉');
  expect('坑道：番人（岩喰らい）を倒す', await fight('l', 'ro_mine'), true);
  await goTo(2, 4, '坑道 宝物庫'); await examine('l');
  expect('坑道：天之尾羽張（宝物庫の剣）', await has('hagane_ken'), 1);
  await place('ro_mine', 17, 14, 'up'); await examine('u');
  expect('坑道：燭台に火種で火を灯す', await flag('gm:ro_mine:t2'), true);

  // ---- 3. 風の岩溝 ----
  await place('kemono_field', 30, 18, 'down'); await step('d');
  expect('寄り道：獣ノ原の岩溝から、風の岩溝へ', await pos(), 'kemono_ravine(3,15)');
  const noLever = await route(22, 1);
  expect('岩溝：レバーを倒す前は、上の通路へ行けない', noLever, null);
  await goTo(21, 14, '岩溝 レバー'); await examine('r');
  expect('岩溝：レバーで東の風が上向きに', await flag('ravine_lever'), true);
  await goTo(2, 1, '岩溝 鍵の部屋'); await examine('l');
  expect('岩溝：風の迷路を抜けて鍵', await has('iwamizo_kagi'), 1);
  await goTo(14, 1, '岩溝 扉の前'); await examine('l');
  await goTo(13, 1, '岩溝 扉');
  expect('岩溝：番人（風の大鷲）を倒す', await fight('l', 'kemono_ravine'), true);
  await goTo(10, 1, '岩溝 宝'); await examine('l');
  expect('岩溝：鍵の扉の奥で風切りの外套', await has('kazekiri_gaitou'), 1);
  await goTo(3, 15, '岩溝 帰り道');
  expect('岩溝：帰りの風に乗って入口へ戻れる', await pos(), 'kemono_ravine(3,15)');

  // ---- 4. 大穴　上層 ----
  await place('yomi_hani', 27, 16, 'right'); await step('r');
  expect('寄り道：魔界の畑の縦穴から、大穴の上層へ（クリア後）', await pos(), 'oana_jou(11,16)');
  await goTo(11, 6, '上層 氷の広間');
  expect('上層：凍った床を滑って抜ける', await pos(), 'oana_jou(11,6)');
  await goTo(10, 5, '上層 石台A');
  expect('上層：光る石台で東の島へ', await pos(), 'oana_jou(20,2)');
  await goTo(21, 3, '上層 東の宝箱'); await examine('d');
  await goTo(18, 4, '上層 石台B');
  await goTo(2, 4, '上層 西の島'); await examine('l');
  expect('上層：星見の勾玉', await has('hoshimi_magatama'), 1);
  // 灯籠：まちがえると消える
  await goTo(8, 2, '上層 西の灯籠の前'); await examine('l');
  expect('上層：灯籠を順番ちがいで灯すと消える', await ev(() => GAME.scene.find('マップ').gimmickState.seq.moon || 0), 0);
  for (const [x, y, d] of [[14, 2, 'r'], [11, 2, 'd'], [8, 2, 'l'], [11, 2, 'u']]) { await goTo(x, y, '上層 灯籠'); await examine(d); }
  expect('上層：月の道すじ（東→南→西→北）で灯すと北の門が開く', await flag('oana_moon'), true);
  await goTo(16, 1, '上層 門');
  expect('上層：番人（氷門の番人）を倒す', await fight('u', 'oana_jou'), true);
  await goTo(16, 0, '上層 下への石段');
  expect('上層：石段から中層へ', await pos(), 'oana_chuu(12,2)');

  // ---- 5. 大穴　中層 ----
  await goTo(10, 11, '中層 岩1の右'); for (const k of 'lll') await step(k);
  await goTo(6, 12, '中層 岩1の下'); for (const k of 'uu') await step(k);
  await goTo(13, 12, '中層 岩2の左'); for (const k of 'rrr') await step(k);
  await goTo(17, 13, '中層 岩2の下'); for (const k of 'uuu') await step(k);
  expect('中層：二つの重しの床に岩を乗せると、南の門が開く', `${await flag('gm:oana_chuu:p1')}/${await flag('gm:oana_chuu:p2')}`, 'true/true');
  await goTo(6, 2, '中層 偽の壁の前'); await examine('l');
  await goTo(2, 1, '中層 隠し部屋'); await examine('l');
  await goTo(18, 2, '中層 大岩の前'); await examine('r');
  await goTo(22, 4, '中層 大岩の奥'); await examine('d');
  expect('中層：見破り（偽の壁）と雷（大岩）の奥の宝', `${await has('yomiishi_ken')}/${await has('akatsuki_yoroi')}`, '1/1');
  await goTo(12, 15, '中層 門');
  expect('中層：番人（大穴の主）を倒す', await fight('d', 'oana_chuu'), true);
  await goTo(12, 16, '中層 最深部への石段');
  expect('中層：門の先の石段から、大穴の最深部へ', await pos(), 'oana_soko(12,19)');
  // ひびの床から落ちると中層へ
  await place('oana_jou', 5, 11, 'down'); await step('d'); await closeMsgs(); await idle();
  expect('上層：ひびの床を踏むと、中層へ落ちる', await pos(), 'oana_chuu(12,10)');

  // ---- 6. 黄泉の深淵（大穴の最深部の南西の石段から） ----
  await place('oana_soko', 2, 20, 'left'); await step('l');
  expect('寄り道：大穴の最深部の南西の石段から、黄泉の深淵へ', await pos(), 'yomi_fuchi1(12,2)');
  expect('上の淵：岩で穴を埋める前は、西の小部屋へ行けない', await route(1, 2), null);
  await goTo(10, 3, '上の淵 岩の右'); for (const k of 'll') await step(k);
  expect('上の淵：岩を穴へ押し込むと、西の通路を渡れる', await flag('gm:yomi_fuchi1:fill:7,3'), true);
  await goTo(1, 2, '上の淵 西の小部屋'); await examine('u');
  expect('上の淵：深淵の鍵', await has('fuchi_kagi'), 1);
  expect('上の淵：レバーを倒す前は、南の門の先へ行けない', await route(12, 15), null);
  await goTo(19, 3, '上の淵 焼けた岩の手前'); for (const k of 'rrru') await step(k);   // 焼けた岩を渡る（体力が減る）
  await examine('u');
  expect('上の淵：焼けた岩の奥のレバーで、南の門が開く', await flag('gm:yomi_fuchi1:lever'), true);
  for (const k of 'dlll') await step(k);   // 焼けた岩を渡って戻る
  await goTo(12, 15, '上の淵 門の先');
  expect('上の淵：番人（黄泉の大蛇）を倒す', await fight('d', 'yomi_fuchi1'), true);
  expect('上の淵：大蛇のごほうび（八塩折の甕）', await has('yashiori_kame'), 1);
  await goTo(12, 16, '上の淵 下への石段');
  expect('上の淵：石段から底の階へ', await pos(), 'yomi_fuchi2(12,16)');
  await goTo(16, 10, '底 東の灯籠'); await examine('r');
  expect('底：灯籠を順番ちがいで灯すと消える', await ev(() => GAME.scene.find('マップ').gimmickState.seq.names || 0), 0);
  for (const [x, y, d] of [[12, 8, 'u'], [16, 10, 'r'], [12, 14, 'u'], [8, 10, 'l']]) { await goTo(x, y, '底 灯籠'); await examine(d); }
  expect('底：石碑の順（北→東→南→西）で灯すと北の門が開く', await flag('gm:yomi_fuchi2:names'), true);
  await goTo(4, 10, '底 鍵の扉の前'); await examine('l');
  expect('底：深淵の鍵で西の蔵が開き、鍵はなくなる', `${await flag('gm:yomi_fuchi2:vault')}/${await has('fuchi_kagi')}`, 'true/0');
  await goTo(2, 8, '底 蔵の宝箱'); await examine('l');
  expect('底：蔵の宝箱', await flag('chest:yomi_fuchi2:vault'), true);
  await goTo(20, 10, '底 焼けた回廊の手前'); for (const k of 'ruuuu') await step(k);   // 焼けた回廊を渡る
  await examine('r');
  expect('底：焼けた回廊の奥の宝箱', await flag('chest:yomi_fuchi2:east'), true);
  for (const k of 'ddddl') await step(k);   // 焼けた回廊を渡って戻る
  await ev(() => GAME.state.party.forEach(m => { m.hp = m.maxHp; }));
  await goTo(12, 4, '底 王の間の前');
  expect('底：番人（名喰いの王）を倒す', await fight('u', 'yomi_fuchi2'), true);
  expect('底：名喰いの王のごほうび（天之真名井の雫）', await has('manai_shizuku'), 1);
  await goTo(10, 2, '底 王の間'); await examine('u');
  expect('底：王の間の宝箱', await flag('chest:yomi_fuchi2:throne1'), true);

  // ---- 物語の道すじのダンジョンの寄り道 ----
  await place('field_minamo', 7, 26, 'up');
  await goTo(7, 22, '野原 木立の奥'); for (const k of 'll') await step(k);
  await goTo(4, 22, '野原 埋めた穴'); await examine('u');
  expect('野原：木立の岩を穴へ押し込み、宝箱（守りの玉）', await has('mamori_ishi'), 1);
  const doku0 = await has('dokukeshi');   // 道中の戦いで落とすこともあるので、増えた数で見る
  await place('hijiri_path', 5, 2, 'left'); await examine('l');
  await place('hijiri_path', 4, 2, 'left'); await examine('l');
  await place('hijiri_path', 9, 18, 'left'); await examine('l');
  await step('l'); await examine('l');
  expect('森の道：火の玉（心鎮め）と蔦（火種）が守る宝箱', `${await flag('gm:hijiri_path:wisp')}/${await flag('gm:hijiri_path:vine')}/${(await has('dokukeshi')) - doku0}`, 'true/true/1');
  await place('ro_path', 22, 13, 'up'); const hpR = await ev(() => GAME.party.member('oonamuchi').hp);
  await step('u'); await step('u'); await examine('u');
  expect('山道：焼けた岩を渡って宝箱（体力が減る）', `${(await ev(() => GAME.party.member('oonamuchi').hp)) < hpR}/${await flag('chest:ro_path:crag')}`, 'true/true');
  await ev(() => GAME.state.party.forEach(m => { m.hp = m.maxHp; }));
  await place('kemono_field', 29, 8, 'up'); await step('u');
  expect('獣ノ原：上へ吹く風に乗る', await pos(), 'kemono_field(29,3)');
  await examine('u');
  expect('獣ノ原：風の上の宝箱', await flag('chest:kemono_field:shrub'), true);
  await step('l');
  expect('獣ノ原：わきの風で吹き下ろされて出られる', await pos(), 'kemono_field(28,8)');
  await place('tsukuyomi_yashiro', 10, 13, 'up');
  for (const [x, y, d] of [[3, 9, 'l'], [12, 11, 'd'], [18, 9, 'r']]) { await goTo(x, y, '社 灯籠'); await examine(d); }
  expect('ツクヨミの社：三つの灯籠（西→真ん中→東）で南西の門が開く', await flag('tsuku_moon'), true);
  await goTo(2, 12, '社 門の前'); await goTo(2, 13, '社 門'); await examine('l');
  expect('ツクヨミの社：門の奥の宝箱', await flag('chest:tsukuyomi_yashiro:moon'), true);
  await place('oana_soko', 23, 1, 'right'); await examine('r');
  await goTo(22, 19, '最深部 南東の蔵'); await examine('r');
  expect('大穴の最深部：北東のレバーで南東の蔵が開く', `${await flag('soko_vault')}/${await flag('chest:oana_soko:deep2')}`, 'true/true');
  await ev(() => { GAME.encounter.enabled = true; });
}

module.exports = { run };

if (require.main === module) {
  (async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    const errors = [], fails = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html'));
    await page.waitForTimeout(400);
    const expect = (label, got, want) => {
      const ok = got === want;
      console.log(`${ok ? 'OK ' : 'NG '} ${label}: ${got}${ok ? '' : '（期待：' + want + '）'}`);
      if (!ok) fails.push(label);
    };
    await run(page, expect);
    console.log(errors.length ? 'エラー：' + errors.join(' / ') : 'エラーなし');
    console.log(fails.length ? `失敗 ${fails.length} 件` : 'すべて合格');
    await browser.close();
    process.exit(fails.length || errors.length ? 1 : 0);
  })();
}
