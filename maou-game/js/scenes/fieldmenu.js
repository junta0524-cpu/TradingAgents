// このファイルの役目：マップでXキーを押すと開くメニュー。
// もちもの（使う）／ことだま（唱える）／そうび（付け替え）／さくせん（AI）／つよさ／セーブ（記録）／せってい／けんぶん（見聞録）／いらい（寄り道の依頼）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const hpColor = p => (p.hp <= 0 ? '#ff5050' : (p.hp < p.maxHp / 4 ? '#ffa040' : '#fff'));

  // 右側に、仲間の体力を小さく出す
  function drawPartyMini() {
    const r = G.renderer, party = G.state.party;
    G.ui.drawWindow(322, 8, 150, 14 + party.length * 34);
    party.forEach((p, i) => {
      const y = 15 + i * 34;
      r.text(p.name + (p.lv ? ` Lv${p.lv}` : ''), 332, y, '#ffd866');
      const tg = G.status.tags(p);
      if (tg) r.text(tg, 462, y, '#9f6', 'right');
      r.text(`HP ${p.hp}/${p.maxHp}`, 332, y + 16, hpColor(p));
      r.text(`MP ${p.mp}`, 462, y + 16, hpColor(p), 'right');
    });
  }

  // 仲間を選ぶ（filter に合う人だけ選べる）
  function pickMember(title, filter, onPick) {
    const party = G.state.party;
    const first = Math.max(0, party.findIndex(p => !filter || filter(p)));   // 選べる人にカーソルを置く
    G.ui.choose(party.map(p => ({ label: p.name, disabled: filter && !filter(p) })),
      { x: 136, y: 8, w: 160, title, name: '仲間を選ぶ', extra: drawPartyMini, index: first }, i => onPick(party[i]));
  }

  // カーソルを合わせた言霊・品の説明（画面の下の窓）
  function drawDesc(text) {
    if (!text) return;
    const r = G.renderer, lh = r.large() ? 18 : 16;
    G.ui.drawWindow(8, 250, 464, 62);
    r.wrap(text, 440).slice(0, 3).forEach((l, i) => r.text(l, 20, 258 + i * lh, '#cfe'));
  }

  // 効き目の相手を選んで使う（ally は1人、allies は全員）
  function useOn(targetType, onTargets) {
    if (targetType === 'allies' || targetType === 'self') { onTargets(null); return; }
    pickMember('だれに', p => p.hp > 0, p => onTargets(p));
  }

  // ---- もちもの ----
  function itemsMenu() {
    const build = () => G.state.items.map(s => {
      const d = G.DATA.items[s.id];
      return { label: d.name, note: '×' + s.count };
    });
    if (!G.state.items.length) { G.message.show('何も持っていない。'); return; }
    G.ui.choose(build(), {
      x: 136, y: 8, w: 180, title: `もちもの　銅貨${G.state.copper}枚`, rows: 11, stay: true, refresh: build, name: 'もちもの',
      extra: menu => { drawPartyMini(); const s = G.state.items[menu.index]; if (s) drawDesc(G.kenbun.itemText(G.DATA.items[s.id])); },
    }, i => {
      const s = G.state.items[i];
      if (!s) return;
      const d = G.DATA.items[s.id];
      if (d.read) { G.message.show(d.read().join('\n')); return; }
      if (d.type !== 'use' || d.use === 'battle') { G.message.show(d.desc || d.name); return; }
      pickMember(`${d.name}をだれに`, p => p.hp > 0, target => {
        const ev = G.kotodama.useItem(target, s.id, target, null);
        G.message.show(ev.filter(e => e.type === 'msg').map(e => e.text).join('\n'));
      });
    });
  }

  // ---- ことだま ----
  function kotodamaMenu() {
    pickMember('だれが唱えますか', p => p.kotodama && p.kotodama.length, caster => {
      const build = () => caster.kotodama.map(id => {
        const k = G.DATA.kotodama[id], sys = G.DATA.kotodamaSystems[k.sys];
        const ok = G.kotodama.usableIn(k, 'field');
        return {
          label: `${sys.short} ${k.name}`,
          note: ok ? `MP${k.mp}` : (G.kotodama.usableIn(k, 'battle') ? '戦闘用' : (k.phase ? `フェーズ${k.phase}` : '—')),
          disabled: !ok || caster.mp < k.mp,
        };
      });
      G.ui.choose(build(), {
        x: 8, y: 8, w: 300, rows: 11, stay: true, refresh: build, name: 'ことだま',
        title: `${caster.name}の言霊（MP ${caster.mp}/${caster.maxMp}）`,
        extra: menu => { drawPartyMini(); drawDesc(G.kenbun.skillText(G.DATA.kotodama[caster.kotodama[menu.index]])); },
        onDisabled: i => {
          const k = G.DATA.kotodama[caster.kotodama[i]];
          G.message.show(G.kotodama.usableIn(k, 'field') ? 'MPが足りない。'
            : G.kotodama.usableIn(k, 'battle') ? `${k.name}は、戦いの中で使う言霊だ。`
              : `${k.name}は、まだ使えない（${k.phase ? 'フェーズ' + k.phase + 'で作ります' : '物語の中で使います'}）。`);
        },
      }, i => {
        const id = caster.kotodama[i], k = G.DATA.kotodama[id];
        // 言伝：その場に用意された物語の場面があれば、メニューを閉じて流す
        if (k.effect.kind === 'story') {
          const ev = G.story.kotozute();
          if (!ev) { G.message.show('いまは、言葉を届ける相手がいない。'); return; }
          while (G.scene.top() && G.scene.top().name !== 'マップ') G.scene.pop();
          G.event.run(ev);
          return;
        }
        useOn(k.target, target => {
          const ev = G.kotodama.cast(caster, id, target, null);
          const lines = ev.filter(e => e.type === 'msg').map(e => e.text);
          // ベルが唱えると、移動中でも阻害ゲージが減る
          if (G.DATA.characters[caster.id].isBell && lines.some(t => t.endsWith('を唱えた！'))) {
            if (G.inhibit.drain(G.inhibit.kotodamaCost(k))) {
              G.message.show(lines.join('\n'), () => G.scene.change(G.scenes.exposure()));
              return;
            }
          }
          G.message.show(lines.join('\n'));
        });
      });
    });
  }

  // 装備を替えたときの強さの変化を描く（いまの装備 → 選んでいる品）
  function drawCompare(m, slot, id) {
    const r = G.renderer, tmp = JSON.parse(JSON.stringify(m));
    tmp.equip[slot] = id; G.party.recalc(tmp);
    G.ui.drawWindow(8, 192, 464, 86);
    const rows = [['攻撃', 'atk'], ['守備', 'def'], ['素早さ', 'agi'], ['賢さ', 'wis'], ['最大HP', 'maxHp'], ['最大MP', 'maxMp']];
    rows.forEach(([n, k], i) => {
      const x = 20 + (i % 3) * 150, y = 200 + Math.floor(i / 3) * 18, a = m[k], b = tmp[k];
      r.text(`${n} ${a}→`, x, y, '#ccc');
      r.text(String(b), x + r.measure(`${n} ${a}→`) + 2, y, b > a ? '#7f7' : b < a ? '#f77' : '#fff');
    });
    const it = G.DATA.items[id];
    const text = it ? [G.equipEffects(it), it.desc].filter(Boolean).join('　') : '外すと、何も身につけない。';
    r.wrap(text, 440).slice(0, 2).forEach((l, i) => r.text(l, 20, 238 + i * 18, '#ffd866'));
  }

  // ---- そうび ----
  function equipMenu() {
    pickMember('だれの装備を変えますか', p => p.lv != null, m => {
      const slots = G.party.SLOTS;
      const build = () => slots.map(s => {
        const it = G.DATA.items[m.equip[s]];
        return { label: G.party.SLOT_NAMES[s], note: it ? it.name : '（なし）' };
      });
      G.ui.choose(build(), {
        x: 8, y: 8, w: 300, title: `${m.name}の装備`, stay: true, refresh: build, name: 'そうび',
        extra: () => {
          G.ui.drawWindow(8, 100, 300, 60);
          G.renderer.text(`攻撃 ${m.atk}　守備 ${m.def}`, 20, 108, '#fff');
          G.renderer.text(`素早さ ${m.agi}　賢さ ${m.wis}`, 20, 124, '#fff');
          G.renderer.text(`HP ${m.hp}/${m.maxHp}　MP ${m.mp}/${m.maxMp}`, 20, 140, hpColor(m));
        },
      }, si => {
        const slot = slots[si];
        const candidates = G.state.items.filter(s => G.DATA.items[s.id].type === slot && G.party.canEquip(m, s.id)).map(s => s.id);
        const options = candidates.map(id => {
          const it = G.DATA.items[id];
          return { label: it.name, note: G.equipNote(it) };
        });
        if (m.equip[slot]) options.push({ label: 'はずす' });
        if (!options.length) { G.message.show(`${G.party.SLOT_NAMES[slot]}にできる物を持っていない。`); return; }
        G.ui.choose(options, {
          x: 136, y: 40, w: 240, title: `${G.party.SLOT_NAMES[slot]}を選ぶ`, name: '装備を選ぶ', rows: 6,
          // 選んでいる品に替えたら、強さがどう変わるか（上がる＝緑、下がる＝赤）と、特別な効き目
          extra: menu => drawCompare(m, slot, candidates[menu.index] || null),
        }, oi => {
          const id = candidates[oi] || null;
          G.party.equip(m, slot, id);
        });
      });
    });
  }

  // ---- さくせん ----
  function tacticMenu() {
    pickMember('だれの作戦を変えますか', null, m => {
      const T = G.ai.TACTICS;
      G.ui.choose(T.map(t => ({ label: t.name, note: t.id === m.tactic ? '←いま' : '' })), {
        x: 136, y: 56, w: 240, title: `${m.name}の作戦`, name: '作戦を選ぶ', index: Math.max(0, T.findIndex(t => t.id === m.tactic)),
        // 選んでいる作戦の説明（道具はどの作戦でも使わない）
        extra: menu => {
          const DESC = {
            auto: '自分で考えて、回復・治療・攻撃をする',
            manual: '毎ターン、こちらでコマンドを選ぶ',
            attack: '攻めの言霊を惜しまず使う。回復は本当に危ないときだけ',
            heal: '早めに回復し、状態異常も治す。攻めの言霊は使わない',
            save: 'MPをなるべく使わない。回復は危ないときに安い言霊で',
            life: '体力が半分を切ったら回復。自分が危なければ身を守る',
          };
          G.ui.drawWindow(8, 256, 464, 40);
          G.renderer.text(DESC[T[menu.index].id] + '（道具は使わない）', 20, 268, '#ccc');
        },
      }, i => { m.tactic = T[i].id; G.message.show(`${m.name}の作戦を「${T[i].name}」にした。`); });
    });
  }

  // ---- つよさ ----（3人以上のときは2列に並べる）
  function createStatusScene() {
    return {
      name: 'つよさ',
      update() {
        if (G.input.pressed('ok') || G.input.pressed('cancel')) G.scene.pop();
      },
      draw() {
        const r = G.renderer, party = G.state.party, two = party.length > 2;
        const cw = two ? 232 : 464, ch = two ? 150 : 100;
        party.forEach((p, i) => {
          const x = 8 + (two ? (i % 2) * 232 : 0), y0 = 8 + (two ? Math.floor(i / 2) : i) * (ch + 2);
          G.ui.drawWindow(x, y0, cw, ch);
          const y = y0 + 10, L = x + 12, R = x + cw - 12;
          r.text(p.name + (p.lv ? `　Lv ${p.lv}` : (G.DATA.characters[p.id].isBell ? '　（力を抑えている）' : '　（臨時の仲間）')), L, y, '#ffd866');
          const next = G.growth.toNext(p);
          const expText = p.lv ? `経験値 ${p.exp}` + (next != null ? `（次まで ${next}）` : '') : '';
          const tactic = (G.ai.TACTICS.find(t => t.id === p.tactic) || {}).name || '';
          const tg = G.status.tags(p);
          const lines = [
            [`HP ${p.hp}/${p.maxHp}　MP ${p.mp}/${p.maxMp}`, hpColor(p)],
            ...(two ? [[`攻撃 ${p.atk}　守備 ${p.def}`, '#fff'], [`素早さ ${p.agi}　賢さ ${p.wis}`, '#fff']]
              : [[`攻撃 ${p.atk}　守備 ${p.def}　素早さ ${p.agi}　賢さ ${p.wis}`, '#fff']]),
            [`作戦：${tactic}${tg ? '　状態：' + tg : ''}`, '#ccc'],
            [`言霊：${(p.kotodama || []).length}個`, '#ccc'],
          ];
          const eq = G.party.SLOTS.map(s => G.DATA.items[p.equip[s]]).filter(Boolean).map(it => it.name).join('・');
          if (eq) lines.push([`装備：${eq}`, '#ccc']);
          if (two) { if (expText) lines.push([expText, '#aaa']); }
          else if (expText) r.text(expText, R, y, '#aaa', 'right');
          lines.forEach((l, k) => r.text(l[0], L, y + 16 + k * 16, l[1]));
        });
      },
    };
  }

  // ---- セーブ ----
  function saveMenu() {
    const slots = ['1', '2', '3'];
    const build = () => slots.map(s => ({ label: G.save.slotName(s), note: G.save.summary(s) }));
    G.ui.choose(build(), { x: 8, y: 8, w: 464, title: 'どこに記録しますか', name: 'セーブ' }, i => {
      const slot = slots[i];
      const doSave = () => {
        const ok = G.save.write(slot);
        G.message.show(ok ? `${G.save.slotName(slot)}に記録しました。`
          : 'このブラウザでは記録を残せないようです。ページを閉じると消えます。');
      };
      if (G.save.read(slot)) G.ui.confirm(`${G.save.slotName(slot)}に上書きしますか？`, doSave);
      else doSave();
    });
  }

  const ITEMS = [
    { label: 'もちもの', run: itemsMenu },
    { label: 'ことだま', run: kotodamaMenu },
    { label: 'そうび', run: equipMenu },
    { label: 'さくせん', run: tacticMenu },
    { label: 'つよさ', run: () => G.scene.push(createStatusScene()) },
    { label: 'セーブ', run: saveMenu },
    { label: 'せってい', run: () => G.scenes.openSettings() },
    { label: 'けんぶん', run: () => G.scene.push(G.scenes.kenbun()) },   // 見聞録（敵・言霊・品の図鑑）
    { label: 'いらい', run: () => G.scenes.openRequestList() },   // 受けている寄り道の依頼
    { label: 'とじる' },
  ];

  let lastIndex = 0;   // 前に選んだ項目にカーソルを置く（「とじる」で閉じたときは先頭へ）
  G.scenes.fieldMenu = function () {
    const menu = new G.ui.Menu(ITEMS.map(i => ({ label: i.label })), { x: 8, y: 8, w: 120, index: G.settings.cursorMemory === false ? 0 : lastIndex });
    return {
      name: 'メニュー',
      update() {
        const res = menu.update();
        if (!res) return;
        const it = ITEMS[res.index];
        if (res.type === 'cancel') { G.scene.pop(); return; }
        if (!it.run) { lastIndex = 0; G.scene.pop(); return; }   // 「とじる」で閉じたら、次は先頭から
        lastIndex = res.index;
        it.run();
      },
      draw() {
        menu.draw(); drawPartyMini();
        // メニューの下：銅貨と、目を覚まさせた人の数（js/systems/battle.js の tryAwaken）
        const rr = G.renderer, lh = menu.lineH, wy = menu.y + menu.h + 4, woke = G.state.awakened || 0, picked = G.names.picked();
        const rows = [[`銅貨 ${G.state.copper}枚`, '#fff']];
        if (woke) rows.push([`目覚め ${woke}人`, '#fff4c0']);
        if (picked) rows.push([`名を返す ${G.names.returned()}/${G.names.list().length}`, '#cfe']);   // 名の欠片：返した数
        G.ui.drawWindow(8, wy, 120, 14 + lh * rows.length);
        rows.forEach(([t, c], i) => rr.text(t, 18, wy + 7 + lh * i, c, 'left', null, 100));
        // いまの目的（js/data/objectives.js）
        const goal = G.objective && G.objective();
        const r = G.renderer;
        G.ui.drawWindow(8, 280, 464, 32);
        const time = '遊んだ時間 ' + G.save.playTime(G.state.playFrames);
        // 文字を大きくしたときは、目的の文を横に縮めて遊んだ時間と重ならないようにする
        if (goal) r.text('目的：' + goal, 20, 290, '#ffd866', 'left', null, 440 - r.measure(time) - 8);
        r.text(time, 460, 290, '#ccc', 'right');
      },
    };
  };
})();
