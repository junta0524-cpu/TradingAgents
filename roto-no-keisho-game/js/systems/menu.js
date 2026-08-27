// パーティメニュー ― フィールドで決定キーを押すと開く。状態確認と装備の付け替えを行う。
var Game = window.Game || {};
Game.Menu = (function () {
  // view: 'status'(一覧) / 'member'(装備部位の選択) / 'gear'(付け替える装備の選択)
  var state = { open: false, view: 'status', cursor: 0, memberIndex: 0, slotIndex: 0 };

  function isOpen() { return state.open; }
  function close() { state.open = false; }
  function toggle() {
    state.open = !state.open;
    if (state.open) { state.view = 'status'; state.cursor = 0; }
  }

  function party() { return Game.Party.list(); }
  function currentMember() { return party()[state.memberIndex]; }

  // そのキャラがその部位に何か装備できるか(杖使いは盾を持てない、など)
  function slotIsWearable(member, slot) {
    var kinds = member.equipKinds || [];
    return Object.keys(Game.Data.Equipment).some(function (gid) {
      var g = Game.Data.Equipment[gid];
      return g.slot === slot && kinds.indexOf(g.kind) !== -1;
    });
  }

  // その部位に付け替えられる、手持ちの装備
  function gearChoicesFor(member, slot) {
    var out = [];
    Game.Party.gearBag().forEach(function (it) {
      var def = Game.Data.Equipment[it.id];
      if (def.slot !== slot || !Game.Party.canEquip(member, it.id)) return;
      out.push({ id: it.id, def: def, count: it.count });
    });
    if (member.equip[slot]) out.push({ id: null, def: null, label: '(はずす)' });
    return out;
  }

  function listLength() {
    // 一覧の最後の行は「ぼうけんのしょに きろくする」
    if (state.view === 'status') return party().length + 1;
    if (state.view === 'member') return Game.Data.EQUIP_SLOTS.length;
    if (state.view === 'gear') return gearChoicesFor(currentMember(), Game.Data.EQUIP_SLOTS[state.slotIndex]).length;
    return 0;
  }

  function update() {
    if (!state.open) return;
    var len = listLength();
    if (Game.Input.wasPressed('down')) state.cursor = len ? (state.cursor + 1) % len : 0;
    if (Game.Input.wasPressed('up')) state.cursor = len ? (state.cursor - 1 + len) % len : 0;

    if (Game.Input.wasPressed('cancel')) {
      if (state.view === 'status') close();
      else if (state.view === 'member') { state.view = 'status'; state.cursor = state.memberIndex; }
      else { state.view = 'member'; state.cursor = state.slotIndex; }
      return;
    }
    if (!Game.Input.wasPressed('confirm')) return;

    if (state.view === 'status') {
      if (state.cursor >= party().length) { doSave(); return; }
      state.memberIndex = state.cursor;
      state.view = 'member';
      state.cursor = 0;
    } else if (state.view === 'member') {
      state.slotIndex = state.cursor;
      state.view = 'gear';
      state.cursor = 0;
    } else if (state.view === 'gear') {
      var slot = Game.Data.EQUIP_SLOTS[state.slotIndex];
      var choices = gearChoicesFor(currentMember(), slot);
      var pick = choices[state.cursor];
      if (pick) {
        if (pick.id === null) Game.Party.unequipSlot(currentMember().id, slot);
        else Game.Party.equipGear(currentMember().id, pick.id);
      }
      state.view = 'member';
      state.cursor = state.slotIndex;
    }
  }

  function doSave() {
    close();
    Game.Dialogue.show(Game.Save.save()
      ? 'ぼうけんのしょに きろくした。'
      : 'このブラウザでは きろくを のこせないようだ……');
  }

  function draw(ctx, W, H) {
    if (!state.open) return;
    // 背後のフィールドを暗く落として、数値を読みやすくする
    ctx.fillStyle = 'rgba(8,10,18,0.72)';
    ctx.fillRect(0, 0, W, H);
    var x = 24, y = 40, w = W - 48, h = 300;
    Game.Renderer.drawPanel(ctx, x, y, w, h);

    if (state.view === 'status') drawStatus(ctx, x, y, w, h);
    else if (state.view === 'member') drawMember(ctx, x, y, w, h);
    else drawGearChoices(ctx, x, y, w, h);

    Game.Renderer.drawText(ctx, 'しょじきん ' + Game.Party.gold() + 'G', x + w - 16, y + h - 14,
      { size: 12, align: 'right', color: '#a49b86' });
  }

  function drawStatus(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, Game.Story.currentTitle(), x + 16, y + 24, { size: 13, color: '#d4af5a' });
    party().forEach(function (m, i) {
      var ly = y + 54 + i * 58;
      var prefix = i === state.cursor ? '▶ ' : '　';
      var st = Game.Party.statusOf(m);
      Game.Renderer.drawText(ctx, prefix + m.name + '  Lv' + m.level, x + 16, ly,
        { size: 14, color: m.hp <= 0 ? '#6b6354' : '#ece7da' });
      if (st) Game.Renderer.drawText(ctx, '[' + st.name + ']', x + 200, ly, { size: 12, color: st.color });
      Game.Renderer.drawText(ctx, 'HP', x + 16, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 44, ly + 14, 110, 8, m.hp / m.maxHp, '#5fae5f');
      Game.Renderer.drawText(ctx, m.hp + '/' + m.maxHp, x + 162, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawText(ctx, 'MP', x + 216, ly + 22, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 244, ly + 14, 70, 8, m.maxMp ? m.mp / m.maxMp : 0, '#5c8ecf');
      Game.Renderer.drawText(ctx, 'こうげき ' + m.atk + '  しゅび ' + m.def + '  すばやさ ' + m.spd,
        x + 340, ly + 22, { size: 11, color: '#a49b86' });
    });
    var saveRow = y + 54 + party().length * 58;
    var savePrefix = state.cursor >= party().length ? '▶ ' : '　';
    Game.Renderer.drawText(ctx, savePrefix + 'ぼうけんのしょに きろくする', x + 16, saveRow,
      { size: 14, color: state.cursor >= party().length ? '#d4af5a' : '#ece7da' });
    Game.Renderer.drawText(ctx, 'Z: えらぶ    X: とじる', x + 16, y + h - 14, { size: 12, color: '#6b6354' });
  }

  function drawMember(ctx, x, y, w, h) {
    var m = currentMember();
    Game.Renderer.drawText(ctx, m.name + ' の そうび', x + 16, y + 24, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, 'こうげき ' + m.atk + '   しゅび ' + m.def + '   すばやさ ' + m.spd,
      x + w - 16, y + 24, { size: 12, align: 'right', color: '#a49b86' });
    Game.Data.EQUIP_SLOTS.forEach(function (slot, i) {
      var ly = y + 62 + i * 26;
      var prefix = i === state.cursor ? '▶ ' : '　';
      var equipped = m.equip[slot] ? Game.Data.Equipment[m.equip[slot]].name : '―';
      var wearable = slotIsWearable(m, slot);
      Game.Renderer.drawText(ctx, prefix + Game.Data.SLOT_LABELS[slot], x + 16, ly,
        { size: 13, color: wearable ? '#ece7da' : '#6b6354' });
      Game.Renderer.drawText(ctx, equipped, x + 200, ly, { size: 13, color: wearable ? '#ece7da' : '#6b6354' });
    });
    Game.Renderer.drawText(ctx, 'Z: つけかえる    X: もどる', x + 16, y + h - 14, { size: 12, color: '#6b6354' });
  }

  function drawGearChoices(ctx, x, y, w, h) {
    var m = currentMember();
    var slot = Game.Data.EQUIP_SLOTS[state.slotIndex];
    var choices = gearChoicesFor(m, slot);
    Game.Renderer.drawText(ctx, m.name + ' の ' + Game.Data.SLOT_LABELS[slot], x + 16, y + 24,
      { size: 15, color: '#d4af5a' });
    var now = m.equip[slot] ? Game.Data.Equipment[m.equip[slot]] : null;
    Game.Renderer.drawText(ctx, 'いま: ' + (now ? now.name : '―'), x + w - 16, y + 24,
      { size: 12, align: 'right', color: '#a49b86' });

    if (choices.length === 0) {
      Game.Renderer.drawText(ctx, 'つけられる そうびが ない', x + 16, y + 64, { size: 13, color: '#a49b86' });
    }
    choices.slice(0, 8).forEach(function (c, i) {
      var ly = y + 64 + i * 24;
      var prefix = i === state.cursor ? '▶ ' : '　';
      if (c.id === null) {
        Game.Renderer.drawText(ctx, prefix + c.label, x + 16, ly, { size: 13, color: '#a49b86' });
        return;
      }
      var parts = [];
      if (c.def.atk) parts.push('攻+' + c.def.atk);
      if (c.def.def) parts.push('守+' + c.def.def);
      if (c.def.spd) parts.push('速+' + c.def.spd);
      Game.Renderer.drawText(ctx, prefix + c.def.name + (c.count > 1 ? ' x' + c.count : ''), x + 16, ly, { size: 13 });
      Game.Renderer.drawText(ctx, parts.join(' '), x + w - 16, ly, { size: 12, align: 'right', color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, 'Z: きめる    X: もどる', x + 16, y + h - 14, { size: 12, color: '#6b6354' });
  }

  return { toggle: toggle, isOpen: isOpen, close: close, update: update, draw: draw };
})();
