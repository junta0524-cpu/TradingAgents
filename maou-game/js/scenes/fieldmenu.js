// このファイルの役目：マップでXキーを押すと開くメニュー。
// もちもの（使う）／ことだま（唱える）／そうび（付け替え）／つよさ／セーブ（記録）。
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
      x: 136, y: 8, w: 180, title: `もちもの　銅貨${G.state.copper}枚`, rows: 12, stay: true, refresh: build, name: 'もちもの',
      extra: drawPartyMini,
    }, i => {
      const s = G.state.items[i];
      if (!s) return;
      const d = G.DATA.items[s.id];
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
        x: 8, y: 8, w: 300, rows: 13, stay: true, refresh: build, name: 'ことだま',
        title: `${caster.name}の言霊（MP ${caster.mp}/${caster.maxMp}）`,
        extra: drawPartyMini,
        onDisabled: i => {
          const k = G.DATA.kotodama[caster.kotodama[i]];
          G.message.show(G.kotodama.usableIn(k, 'field') ? 'MPが足りない。'
            : G.kotodama.usableIn(k, 'battle') ? `${k.name}は、戦いの中で使う言霊だ。`
              : `${k.name}は、まだ使えない（${k.phase ? 'フェーズ' + k.phase + 'で作ります' : '物語の中で使います'}）。`);
        },
      }, i => {
        const id = caster.kotodama[i], k = G.DATA.kotodama[id];
        useOn(k.target, target => {
          const ev = G.kotodama.cast(caster, id, target, null);
          G.message.show(ev.filter(e => e.type === 'msg').map(e => e.text).join('\n'));
        });
      });
    });
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
          G.ui.drawWindow(8, 100, 300, 44);
          G.renderer.text(`攻撃 ${m.atk}　守備 ${m.def}　素早さ ${m.agi}`, 20, 108, '#fff');
          G.renderer.text(`HP ${m.hp}/${m.maxHp}　MP ${m.mp}/${m.maxMp}`, 20, 124, hpColor(m));
        },
      }, si => {
        const slot = slots[si];
        const candidates = G.state.items.filter(s => G.DATA.items[s.id].type === slot && G.party.canEquip(m, s.id)).map(s => s.id);
        const options = candidates.map(id => {
          const it = G.DATA.items[id];
          const stat = it.atk ? `攻+${it.atk}` : it.def ? `守+${it.def}` : it.agi ? `速+${it.agi}` : '';
          return { label: it.name, note: stat };
        });
        if (m.equip[slot]) options.push({ label: 'はずす' });
        if (!options.length) { G.message.show(`${G.party.SLOT_NAMES[slot]}にできる物を持っていない。`); return; }
        G.ui.choose(options, { x: 136, y: 56, w: 240, title: `${G.party.SLOT_NAMES[slot]}を選ぶ`, name: '装備を選ぶ' }, oi => {
          const id = candidates[oi] || null;
          G.party.equip(m, slot, id);
        });
      });
    });
  }

  // ---- つよさ ----
  function createStatusScene() {
    return {
      name: 'つよさ',
      update() {
        if (G.input.pressed('ok') || G.input.pressed('cancel')) G.scene.pop();
      },
      draw() {
        const r = G.renderer, party = G.state.party;
        G.ui.drawWindow(8, 8, 464, 24 + party.length * 88);
        party.forEach((p, i) => {
          const y = 18 + i * 88;
          r.text(p.name + (p.lv ? `　レベル ${p.lv}` : '　（力を抑えている）'), 22, y, '#ffd866');
          const next = G.growth.toNext(p);
          r.text(p.lv ? `経験値 ${p.exp}` + (next != null ? `（次まで ${next}）` : '') : '', 458, y, '#aaa', 'right');
          r.text(`HP ${p.hp}/${p.maxHp}　MP ${p.mp}/${p.maxMp}`, 22, y + 16, hpColor(p));
          r.text(`攻撃 ${p.atk}　守備 ${p.def}　素早さ ${p.agi}`, 22, y + 32, '#fff');
          const eq = G.party.SLOTS.map(s => G.DATA.items[p.equip[s]]).filter(Boolean).map(it => it.name).join('・');
          r.text(`装備：${eq || 'なし'}`, 22, y + 48, '#ccc');
          r.text(`言霊：${(p.kotodama || []).length}個`, 22, y + 64, '#ccc');
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
    { label: 'つよさ', run: () => G.scene.push(createStatusScene()) },
    { label: 'セーブ', run: saveMenu },
    { label: 'とじる' },
  ];

  G.scenes.fieldMenu = function () {
    const menu = new G.ui.Menu(ITEMS.map(i => ({ label: i.label })), { x: 8, y: 8, w: 120 });
    return {
      name: 'メニュー',
      update() {
        const res = menu.update();
        if (!res) return;
        const it = ITEMS[res.index];
        if (res.type === 'cancel' || !it.run) { G.scene.pop(); return; }
        it.run();
      },
      draw() { menu.draw(); drawPartyMini(); },
    };
  };
})();
