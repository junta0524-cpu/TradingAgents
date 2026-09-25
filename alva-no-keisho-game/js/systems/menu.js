// パーティメニュー ― フィールドで決定キーを押すと開く。
// 状態確認・どうぐ袋・装備の付け替え・たびのきろくへの記録をここから行う。
var Game = window.Game || {};
Game.Menu = (function () {
  // view:
  //   'status'     一覧(仲間 → どうぐ → きろくする)
  //   'items'      どうぐ袋
  //   'itemTarget' その道具を誰に使うか
  //   'member'     装備部位の選択
  //   'gear'       付け替える装備の選択
  //   'caster'     じゅもんを唱える人の選択
  //   'spell'      唱えるじゅもんの選択
  //   'spellTarget' そのじゅもんを誰にかけるか
  var state = { open: false, view: 'status', cursor: 0, memberIndex: 0, slotIndex: 0,
                itemIndex: 0, casterIndex: 0, spellIndex: 0, holding: -1 };

  function isOpen() { return state.open; }
  function close() { state.open = false; }
  function toggle() {
    state.open = !state.open;
    if (state.open) { state.view = 'status'; state.cursor = 0; }
  }

  function party() { return Game.Party.list(); }
  function currentMember() { return party()[state.memberIndex]; }
  function bag() { return Game.Party.inventory(); }
  function currentItem() {
    var e = bag()[state.itemIndex];
    return e ? { entry: e, def: Game.Data.Items[e.id] } : null;
  }

  // 一覧の並びは「仲間… / じゅもん / どうぐ / たびのきろくに きろくする」
  function SPELL_ROW() { return party().length; }
  function ITEM_ROW() { return party().length + 1; }
  function TACTIC_ROW() { return party().length + 2; }
  function ORDER_ROW() { return party().length + 3; }
  function SAVE_ROW() { return party().length + 4; }

  function caster() { return party()[state.casterIndex]; }

  // フィールドで唱えられる呪文(戦闘専用のものは出さない)
  function fieldSpells(member) {
    if (!member || member.hp <= 0) return [];
    return Game.Party.learnedSkills(member).filter(function (sk) {
      return sk.field && sk.mp <= member.mp;
    });
  }
  function currentSpell() { return fieldSpells(caster())[state.spellIndex] || null; }

  // その呪文を誰にかけるか。リヴァルは倒れている仲間だけ。
  function spellTargets(sk) {
    if (!sk) return [];
    if (sk.kind === 'revive') return Game.Party.deadList();
    return Game.Party.aliveList();
  }
  function spellNeedsTarget(sk) {
    return sk && (sk.kind === 'heal' || sk.kind === 'cure' || sk.kind === 'revive')
             && sk.target !== 'all_allies';
  }

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

  // 道具を使う相手。生き返らせる薬は倒れている仲間だけ、それ以外は動ける仲間だけ。
  function targetsFor(def) {
    if (!def) return [];
    if (def.kind === 'revive') return Game.Party.deadList();
    return Game.Party.aliveList();
  }

  // 相手を選ばずに使う道具(帰還の羽根など)
  function needsTarget(def) { return def && def.kind !== 'return'; }

  function listLength() {
    if (state.view === 'status') return party().length + 5;
    if (state.view === 'tactic') return Game.Data.Tactics.length;
    if (state.view === 'order') return party().length;
    if (state.view === 'caster') return party().length;
    if (state.view === 'spell') return fieldSpells(caster()).length;
    if (state.view === 'spellTarget') return spellTargets(currentSpell()).length;
    if (state.view === 'items') return bag().length;
    if (state.view === 'itemTarget') return targetsFor(currentItem() && currentItem().def).length;
    if (state.view === 'warp') return Game.Field.warpTargets().length;
    if (state.view === 'who') return 2;
    if (state.view === 'strength') return 0;
    if (state.view === 'member') return Game.Data.EQUIP_SLOTS.length;
    if (state.view === 'gear') return gearChoicesFor(currentMember(), Game.Data.EQUIP_SLOTS[state.slotIndex]).length;
    return 0;
  }

  function update() {
    if (!state.open) return;
    var len = listLength();
    // 隊列の並び替えで誰かをつかんでいる間は、上下がその人の移動になる
    if (state.view === 'order' && state.holding >= 0) {
      var d = Game.Input.wasPressed('down') ? 1 : Game.Input.wasPressed('up') ? -1 : 0;
      if (d && Game.Party.moveMember(state.holding, d)) {
        state.holding += d;
        state.cursor = state.holding;
      }
      if (!Game.Input.wasPressed('confirm') && !Game.Input.wasPressed('cancel')) return;
    } else {
      if (Game.Input.wasPressed('down')) state.cursor = len ? (state.cursor + 1) % len : 0;
      if (Game.Input.wasPressed('up')) state.cursor = len ? (state.cursor - 1 + len) % len : 0;
    }

    if (Game.Input.wasPressed('cancel')) {
      if (state.view === 'status') close();
      else if (state.view === 'items') { state.view = 'status'; state.cursor = ITEM_ROW(); }
      else if (state.view === 'tactic') { state.view = 'status'; state.cursor = TACTIC_ROW(); }
      else if (state.view === 'order') {
        // つかんだままなら まず離す。手ぶらなら一覧へ戻る
        if (state.holding >= 0) state.holding = -1;
        else { state.view = 'status'; state.cursor = ORDER_ROW(); }
      }
      else if (state.view === 'caster') { state.view = 'status'; state.cursor = SPELL_ROW(); }
      else if (state.view === 'spell') { state.view = 'caster'; state.cursor = state.casterIndex; }
      else if (state.view === 'spellTarget') { state.view = 'spell'; state.cursor = state.spellIndex; }
      else if (state.view === 'itemTarget') { state.view = 'items'; state.cursor = state.itemIndex; }
      else if (state.view === 'warp') {
        // 行き先を選ばずに戻った。羽根もMPも まだ使っていない
        if (state.warpBy === 'item') { state.view = 'items'; state.cursor = state.itemIndex; }
        else { state.view = 'spell'; state.cursor = state.spellIndex; }
      }
      else if (state.view === 'who') { state.view = 'status'; state.cursor = state.memberIndex; }
      else if (state.view === 'strength') { state.view = 'who'; state.cursor = 0; }
      else if (state.view === 'member') { state.view = 'who'; state.cursor = 1; }
      else { state.view = 'member'; state.cursor = state.slotIndex; }
      return;
    }
    if (!Game.Input.wasPressed('confirm')) return;

    if (state.view === 'status') {
      if (state.cursor === SAVE_ROW()) { doSave(); return; }
      if (state.cursor === ORDER_ROW()) { state.view = 'order'; state.cursor = 0; state.holding = -1; return; }
      if (state.cursor === TACTIC_ROW()) { state.view = 'tactic'; state.cursor = 0; return; }
      if (state.cursor === ITEM_ROW()) { state.view = 'items'; state.cursor = 0; return; }
      if (state.cursor === SPELL_ROW()) { state.view = 'caster'; state.cursor = 0; return; }
      state.memberIndex = state.cursor;
      state.view = 'who';
      state.cursor = 0;
    } else if (state.view === 'warp') {
      var dest = Game.Field.warpTargets()[state.cursor];
      if (!dest) return;
      doWarp(dest);
    } else if (state.view === 'who') {
      state.view = state.cursor === 0 ? 'strength' : 'member';
      state.cursor = 0;
    } else if (state.view === 'strength') {
      state.view = 'who'; state.cursor = 0;
    } else if (state.view === 'order') {
      // つかむ → 上下で動かす → もう一度押して置く
      state.holding = state.holding === state.cursor ? -1 : state.cursor;
    } else if (state.view === 'tactic') {
      Game.Party.setTactic(Game.Data.Tactics[state.cursor].id);
      state.view = 'status';
      state.cursor = TACTIC_ROW();
    } else if (state.view === 'items') {
      if (bag().length === 0) return;
      state.itemIndex = state.cursor;
      var picked = currentItem();
      if (!needsTarget(picked.def)) { useOnField(picked); return; }
      if (targetsFor(picked.def).length === 0) {
        Game.Dialogue.show('いま ' + picked.def.name + 'を つかう相手が いない。');
        close();
        return;
      }
      state.view = 'itemTarget';
      state.cursor = 0;
    } else if (state.view === 'itemTarget') {
      var item = currentItem();
      var target = targetsFor(item.def)[state.cursor];
      if (!item || !target) return;
      var msg = Game.Party.useItem(item.entry.id, target.id);
      close();
      Game.Dialogue.show(target.name + 'に ' + item.def.name + 'を つかった! ' + (msg || ''));
    } else if (state.view === 'caster') {
      state.casterIndex = state.cursor;
      if (fieldSpells(caster()).length === 0) {
        var who = caster();
        close();
        Game.Dialogue.show(who.name + 'が いま となえられる じゅもんは ない。');
        return;
      }
      state.view = 'spell';
      state.cursor = 0;
    } else if (state.view === 'spell') {
      state.spellIndex = state.cursor;
      var sk = currentSpell();
      if (!sk) return;
      if (!spellNeedsTarget(sk)) { castField(sk, null); return; }
      if (spellTargets(sk).length === 0) {
        close();
        Game.Dialogue.show('いま ' + sk.name + 'を かける相手が いない。');
        return;
      }
      state.view = 'spellTarget';
      state.cursor = 0;
    } else if (state.view === 'spellTarget') {
      var sk2 = currentSpell();
      castField(sk2, spellTargets(sk2)[state.cursor]);
    } else if (state.view === 'member') {
      state.slotIndex = state.cursor;
      state.view = 'gear';
      state.cursor = 0;
    } else if (state.view === 'gear') {
      var slot = Game.Data.EQUIP_SLOTS[state.slotIndex];
      var m2 = currentMember();
      // 呪われた品は自分では外せない。何が起きているのかを その場で伝える
      var stuck = Game.Party.cursedAt(m2, slot);
      if (stuck) {
        close();
        Game.Dialogue.show(m2.name + 'の ' + stuck.name + 'は 手から 離れない!', function () {
          Game.Dialogue.show('教会で 呪いを といてもらうしかない。');
        });
        return;
      }
      var choices = gearChoicesFor(m2, slot);
      var pick = choices[state.cursor];
      if (pick) {
        if (pick.id === null) Game.Party.unequipSlot(m2.id, slot);
        else {
          var newDef = Game.Data.Equipment[pick.id];
          Game.Party.equipGear(m2.id, pick.id);
          // 呪われた品だと、着けた瞬間に分かる
          if (newDef.cursed) {
            close();
            Game.Dialogue.show(m2.name + 'は ' + newDef.name + 'を 身につけた。', function () {
              Game.Dialogue.show(newDef.curse || '……呪われている!', function () {
                Game.Audio.play('wipe');
                Game.Dialogue.show('もう 自分では 外せない。');
              });
            });
            return;
          }
        }
      }
      state.view = 'member';
      state.cursor = state.slotIndex;
    }
  }

  // フィールドで呪文を唱える。戦闘の外なので、ここで直接効果を出す。
  function castField(sk, target) {
    var m = caster();
    if (!m || m.mp < sk.mp) { close(); Game.Dialogue.show('MPが たりない。'); return; }
    if (sk.effect === 'warp') { openWarp('spell'); return; }
    m.mp -= sk.mp;
    var say = m.name + 'は ' + sk.name + 'を となえた!';
    var result = '';

    if (sk.kind === 'heal') {
      var list = sk.target === 'all_allies' ? Game.Party.aliveList() : [target];
      var names = [];
      list.forEach(function (t) {
        if (!t || t.hp <= 0) return;
        var heal = sk.power + Math.floor((t === m ? m.mag : m.mag) * 0.5);
        var before = t.hp;
        t.hp = Math.min(t.maxHp, t.hp + heal);
        names.push(t.name + 'の HPが ' + (t.hp - before) + ' かいふくした');
      });
      result = names.join('。 ');
    } else if (sk.kind === 'cure') {
      result = Game.Party.cure(target, sk.cures || []) || 'しかし なにも おこらなかった';
    } else if (sk.kind === 'revive') {
      if (Math.random() > (sk.chance || 0.5)) {
        result = 'しかし ' + target.name + 'は 生きかえらなかった';
      } else {
        target.hp = Math.max(1, Math.round(target.maxHp * (sk.power || 0.5)));
        target.status = null;
        result = target.name + 'は 生きかえった!';
      }
    } else if (sk.kind === 'field') {
      if (sk.effect === 'exit') {
        // エクセは洞窟や塔の中からだけ。外で唱えても何も起こらない
        result = Game.Field.escapeDungeon()
          ? '光に つつまれ、外へ 抜け出した。'
          : 'しかし なにも おこらなかった。';
      } else if (sk.effect === 'ward_steps') {
        Game.Field.wardSteps(sk.power || 100);
        result = '弱い魔物が よってこなくなった。';
      }
    } else {
      // 補助・弱体は戦闘の外では意味がない
      result = 'しかし なにも おこらなかった';
    }
    close();
    Game.Dialogue.show(say, function () { Game.Dialogue.show(result); });
  }

  // 帰還の羽根 ― 一度訪れた町へ ひとっとび。行き先を選んでから羽根を使う
  function useOnField(picked) {
    if (picked.def.kind === 'return') { openWarp('item'); return; }
  }

  // ---- ひとっとび(リガル / 帰還の羽根) ----
  // 行き先の一覧を開く。飛べない場所・行き先が無いときは、何も払わずに理由を言う
  function openWarp(by) {
    if (!Game.Field.canWarp()) {
      close();
      Game.Dialogue.show(by === 'item'
        ? '羽根を 空へ かざした! しかし 天井に 頭を ぶつけた。'
        : 'しかし 天井に 頭を ぶつけた!');
      return;
    }
    if (Game.Field.warpTargets().length === 0) {
      close();
      Game.Dialogue.show('まだ どこへも 飛んでいけない。(一度 入った町へ 飛べる)');
      return;
    }
    state.warpBy = by;
    state.view = 'warp';
    state.cursor = 0;
  }

  // 行き先が決まってから、はじめて羽根を使い、MPを払う
  function doWarp(dest) {
    var say;
    if (state.warpBy === 'item') {
      var picked = currentItem();
      if (!picked) { close(); return; }
      Game.Party.consumeItem(picked.entry.id);
      say = picked.def.name + 'を 空へ かざした!';
    } else {
      var m = caster(), sk = currentSpell();
      if (!m || !sk || m.mp < sk.mp) { close(); Game.Dialogue.show('MPが たりない。'); return; }
      m.mp -= sk.mp;
      say = m.name + 'は ' + sk.name + 'を となえた!';
    }
    close();
    Game.Fx.fade(10, 6);
    Game.Field.warpTo(dest.id);
    Game.Audio.play('spell');
    Game.Dialogue.show(say, function () {
      Game.Dialogue.show('ひとっとびで ' + dest.name + 'の 門前に 降り立った。');
    });
  }

  function doSave() {
    close();
    Game.Dialogue.show(Game.Save.save()
      ? 'たびのきろくに きろくした。'
      : 'このブラウザでは きろくを のこせないようだ……');
  }

  // 道具の効き目を一行で説明する
  function itemEffectText(def) {
    if (def.kind === 'heal_hp') return 'HPを ' + def.power + ' かいふく';
    if (def.kind === 'heal_mp') return 'MPを ' + def.power + ' かいふく';
    if (def.kind === 'revive') return 'たおれた仲間を いきかえらせる';
    if (def.kind === 'ward') return 'つぎの状態異常を 一度だけ 防ぐ';
    if (def.kind === 'return') return '一度 入った町へ ひとっとび';
    if (def.kind === 'cure') {
      return (def.cures || []).map(function (c) { return Game.Data.Statuses[c].name; }).join('・') + 'を なおす';
    }
    return '';
  }

  function draw(ctx, W, H) {
    if (!state.open) return;
    // 背後のフィールドを暗く落として、数値を読みやすくする
    ctx.fillStyle = 'rgba(8,10,18,0.72)';
    ctx.fillRect(0, 0, W, H);
    // 仲間4人ぶんの状態と、じゅもん/どうぐ/さくせん/ならびかえ/きろく の5行が入る高さ
    var x = 20, y = 18, w = W - 40, h = H - 34;
    Game.Renderer.drawPanel(ctx, x, y, w, h);

    if (state.view === 'status') drawStatus(ctx, x, y, w, h);
    else if (state.view === 'tactic') drawTactics(ctx, x, y, w, h);
    else if (state.view === 'order') drawOrder(ctx, x, y, w, h);
    else if (state.view === 'caster') drawCaster(ctx, x, y, w, h);
    else if (state.view === 'spell') drawSpells(ctx, x, y, w, h);
    else if (state.view === 'spellTarget') drawSpellTargets(ctx, x, y, w, h);
    else if (state.view === 'items') drawItems(ctx, x, y, w, h);
    else if (state.view === 'itemTarget') drawItemTargets(ctx, x, y, w, h);
    else if (state.view === 'warp') drawWarp(ctx, x, y, w, h);
    else if (state.view === 'who') drawWho(ctx, x, y, w, h);
    else if (state.view === 'strength') drawStrength(ctx, x, y, w, h);
    else if (state.view === 'member') drawMember(ctx, x, y, w, h);
    else drawGearChoices(ctx, x, y, w, h);

    Game.Renderer.drawText(ctx, 'しょじきん ' + Game.Party.gold() + 'G', x + w - 16, y + h - 12,
      { size: 12, align: 'right', color: '#a49b86' });
  }

  function drawStatus(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, Game.Story.currentTitle(), x + 16, y + 22, { size: 13, color: '#d4af5a' });
    party().forEach(function (m, i) {
      var ly = y + 48 + i * 54;
      var prefix = i === state.cursor ? '▶ ' : '　';
      var st = Game.Party.statusOf(m);
      Game.Renderer.drawText(ctx, prefix + m.name + '  Lv' + m.level, x + 16, ly,
        { size: 14, color: m.hp <= 0 ? '#6b6354' : '#ece7da' });
      if (st) Game.Renderer.drawText(ctx, '[' + st.name + ']', x + 190, ly, { size: 12, color: st.color });
      Game.Renderer.drawText(ctx, 'HP', x + 16, ly + 20, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 44, ly + 12, 104, 8, m.hp / m.maxHp, '#5fae5f');
      Game.Renderer.drawText(ctx, m.hp + '/' + m.maxHp, x + 154, ly + 20, { size: 11, color: '#a49b86' });
      Game.Renderer.drawText(ctx, 'MP', x + 206, ly + 20, { size: 11, color: '#a49b86' });
      Game.Renderer.drawBar(ctx, x + 232, ly + 12, 60, 8, m.maxMp ? m.mp / m.maxMp : 0, '#5c8ecf');
      Game.Renderer.drawText(ctx, m.mp + '/' + m.maxMp, x + 298, ly + 20, { size: 11, color: '#a49b86' });
      // この手のRPG風に、こうげき・しゅび・すばやさ・まりょく・うんのよさ をすべて出す
      Game.Renderer.drawText(ctx, 'こうげき ' + m.atk + '   しゅび ' + m.def + '   すばやさ ' + m.spd,
        x + 340, ly + 4, { size: 11, color: '#a49b86' });
      Game.Renderer.drawText(ctx, 'まりょく ' + m.mag + '   うんのよさ ' + m.luck,
        x + 340, ly + 20, { size: 11, color: '#a49b86' });
      Game.Renderer.drawText(ctx, 'つぎのレベルまで あと ' + Math.max(0, m.expToNext - m.exp),
        x + 340, ly + 36, { size: 11, color: '#6b6354' });
    });

    var rowY = y + 60 + party().length * 54;
    var spellSelected = state.cursor === SPELL_ROW();
    Game.Renderer.drawText(ctx, (spellSelected ? '▶ ' : '　') + 'じゅもん', x + 16, rowY,
      { size: 14, color: spellSelected ? '#d4af5a' : '#ece7da' });
    var castable = party().reduce(function (n, m) { return n + fieldSpells(m).length; }, 0);
    Game.Renderer.drawText(ctx, castable + ' つ となえられる', x + 190, rowY, { size: 12, color: '#a49b86' });

    var itemSelected = state.cursor === ITEM_ROW();
    Game.Renderer.drawText(ctx, (itemSelected ? '▶ ' : '　') + 'どうぐ', x + 16, rowY + 26,
      { size: 14, color: itemSelected ? '#d4af5a' : '#ece7da' });
    Game.Renderer.drawText(ctx, bag().length + ' しゅるい', x + 190, rowY + 26, { size: 12, color: '#a49b86' });

    var tacticSelected = state.cursor === TACTIC_ROW();
    Game.Renderer.drawText(ctx, (tacticSelected ? '▶ ' : '　') + 'さくせん', x + 16, rowY + 52,
      { size: 14, color: tacticSelected ? '#d4af5a' : '#ece7da' });
    Game.Renderer.drawText(ctx, Game.Data.tacticOf(Game.Party.tactic()).name, x + 190, rowY + 52,
      { size: 12, color: '#a49b86' });

    var orderSelected = state.cursor === ORDER_ROW();
    Game.Renderer.drawText(ctx, (orderSelected ? '▶ ' : '　') + 'ならびかえ', x + 16, rowY + 78,
      { size: 14, color: orderSelected ? '#d4af5a' : '#ece7da' });
    Game.Renderer.drawText(ctx, '前の者ほど 狙われる', x + 190, rowY + 78, { size: 12, color: '#a49b86' });

    var saveSelected = state.cursor === SAVE_ROW();
    Game.Renderer.drawText(ctx, (saveSelected ? '▶ ' : '　') + 'たびのきろくに きろくする', x + 16, rowY + 104,
      { size: 14, color: saveSelected ? '#d4af5a' : '#ece7da' });
    Game.Renderer.drawText(ctx, 'Z: えらぶ    X: とじる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawOrder(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, 'ならびかえ', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, '前に立つ者ほど 狙われます。歩くときの隊列も この順です。',
      x + 16, y + 46, { size: 12, color: '#a49b86' });
    var ROW = ['さきあたま', '二番手', '三番手', 'しんがり'];
    party().forEach(function (m, i) {
      var ly = y + 90 + i * 34;
      var sel = i === state.cursor;
      var held = i === state.holding;
      Game.Renderer.drawText(ctx, (held ? '≡ ' : sel ? '▶ ' : '　') + ROW[i] + '  ' + m.name, x + 16, ly,
        { size: 14, color: held ? '#d4af5a' : (sel ? '#ece7da' : '#a49b86') });
      Game.Renderer.drawText(ctx, 'HP ' + m.hp + '/' + m.maxHp + '   しゅび ' + m.def,
        x + 260, ly, { size: 12, color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, state.holding >= 0
      ? '↑↓ で動かす    Z: ここに置く'
      : 'Z: つかむ    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawTactics(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, 'さくせん', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, '「ひとりずつ さしずする」以外を選ぶと、戦闘では自分たちで動きます。',
      x + 16, y + 46, { size: 12, color: '#a49b86' });
    var now = Game.Party.tactic();
    Game.Data.Tactics.forEach(function (t, i) {
      var ly = y + 86 + i * 32;
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + (t.id === now ? '● ' : '　') + t.name, x + 16, ly,
        { size: 14, color: sel ? '#d4af5a' : '#ece7da' });
      Game.Renderer.drawText(ctx, t.note, x + 260, ly, { size: 12, color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, 'Z: きめる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawCaster(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, 'だれが となえる?', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    party().forEach(function (m, i) {
      var ly = y + 60 + i * 30;
      var sel = i === state.cursor;
      var n = fieldSpells(m).length;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + m.name, x + 16, ly,
        { size: 14, color: m.hp <= 0 ? '#6b6354' : (sel ? '#d4af5a' : '#ece7da') });
      Game.Renderer.drawText(ctx, 'MP ' + m.mp + '/' + m.maxMp, x + 190, ly, { size: 12, color: '#a49b86' });
      Game.Renderer.drawText(ctx, n ? (n + ' つ となえられる') : 'となえられない',
        x + 300, ly, { size: 12, color: n ? '#a49b86' : '#6b6354' });
    });
    Game.Renderer.drawText(ctx, 'Z: えらぶ    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawSpells(ctx, x, y, w, h) {
    var m = caster();
    Game.Renderer.drawText(ctx, m.name + ' の じゅもん', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, 'MP ' + m.mp + '/' + m.maxMp, x + w - 16, y + 22,
      { size: 12, align: 'right', color: '#a49b86' });
    var list = fieldSpells(m);
    if (list.length === 0) {
      Game.Renderer.drawText(ctx, 'いま となえられる じゅもんは ない。', x + 16, y + 60, { size: 13, color: '#a49b86' });
    }
    list.slice(0, 9).forEach(function (sk, i) {
      var ly = y + 60 + i * 26;
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + sk.name, x + 16, ly,
        { size: 13, color: sel ? '#d4af5a' : '#ece7da' });
      Game.Renderer.drawText(ctx, 'MP' + sk.mp, x + 200, ly, { size: 12, color: '#a49b86' });
      Game.Renderer.drawText(ctx, spellNote(sk), x + 260, ly, { size: 11, color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, 'Z: となえる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function spellNote(sk) {
    if (sk.kind === 'heal') return sk.target === 'all_allies' ? '全員のHPを かいふく' : 'HPを かいふく';
    if (sk.kind === 'cure') return (sk.cures || []).map(function (c) { return Game.Data.Statuses[c].name; }).join('・') + 'を なおす';
    if (sk.kind === 'revive') return 'たおれた仲間を 生きかえらせる';
    if (sk.kind === 'field') {
      if (sk.effect === 'exit') return '洞窟や塔から 外へ 抜け出す';
      if (sk.effect === 'warp') return '一度 入った町へ ひとっとび';
      return '弱い魔物が よってこなくなる';
    }
    return '';
  }

  // 行き先の一覧。訪れた順に並ぶ
  function drawWarp(ctx, x, y, w, h) {
    var head = state.warpBy === 'item' ? '帰還の羽根 ― どこへ 飛ぶ?' : 'リガル ― どこへ 飛ぶ?';
    Game.Renderer.drawText(ctx, head, x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Field.warpTargets().forEach(function (d, i) {
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + d.name, x + 16, y + 60 + i * 30,
        { size: 14, color: sel ? '#d4af5a' : '#ece7da' });
    });
    Game.Renderer.drawText(ctx, 'Z: とぶ    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawSpellTargets(ctx, x, y, w, h) {
    var sk = currentSpell();
    if (!sk) return;
    Game.Renderer.drawText(ctx, sk.name + ' を だれに?', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    spellTargets(sk).forEach(function (m, i) {
      var ly = y + 60 + i * 30;
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + m.name, x + 16, ly,
        { size: 14, color: sel ? '#d4af5a' : '#ece7da' });
      Game.Renderer.drawText(ctx, 'HP ' + m.hp + '/' + m.maxHp, x + 190, ly, { size: 12, color: '#a49b86' });
      var st = Game.Party.statusOf(m);
      if (st) Game.Renderer.drawText(ctx, '[' + st.name + ']', x + 380, ly, { size: 12, color: st.color });
    });
    Game.Renderer.drawText(ctx, 'Z: きめる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawItems(ctx, x, y, w, h) {
    Game.Renderer.drawText(ctx, 'どうぐ袋', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    var items = bag();
    if (items.length === 0) {
      Game.Renderer.drawText(ctx, 'なにも もっていない。', x + 16, y + 60, { size: 13, color: '#a49b86' });
    }
    items.slice(0, 10).forEach(function (it, i) {
      var def = Game.Data.Items[it.id];
      var ly = y + 56 + i * 24;
      var selected = i === state.cursor;
      Game.Renderer.drawText(ctx, (selected ? '▶ ' : '　') + def.name, x + 16, ly,
        { size: 13, color: selected ? '#d4af5a' : '#ece7da' });
      Game.Renderer.drawText(ctx, 'x' + it.count, x + 210, ly, { size: 12, color: '#a49b86' });
      Game.Renderer.drawText(ctx, itemEffectText(def), x + 260, ly, { size: 11, color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, 'Z: つかう    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawItemTargets(ctx, x, y, w, h) {
    var item = currentItem();
    if (!item) return;
    Game.Renderer.drawText(ctx, item.def.name + ' を だれに?', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    targetsFor(item.def).forEach(function (m, i) {
      var ly = y + 60 + i * 30;
      var selected = i === state.cursor;
      Game.Renderer.drawText(ctx, (selected ? '▶ ' : '　') + m.name, x + 16, ly,
        { size: 14, color: selected ? '#d4af5a' : '#ece7da' });
      Game.Renderer.drawText(ctx, 'HP ' + m.hp + '/' + m.maxHp + '   MP ' + m.mp + '/' + m.maxMp,
        x + 190, ly, { size: 12, color: '#a49b86' });
      var st = Game.Party.statusOf(m);
      if (st) Game.Renderer.drawText(ctx, '[' + st.name + ']', x + 380, ly, { size: 12, color: st.color });
    });
    Game.Renderer.drawText(ctx, 'Z: きめる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function statLine(m) {
    return 'こうげき ' + m.atk + '  しゅび ' + m.def + '  すばやさ ' + m.spd +
      '  まりょく ' + m.mag + '  うん ' + m.luck;
  }

  // 仲間を選んだあとの2択。この手のRPGの「つよさ / そうび」
  function drawWho(ctx, x, y, w, h) {
    var m = currentMember();
    Game.Renderer.drawText(ctx, m.name, x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, m.title || '', x + w - 16, y + 22,
      { size: 12, align: 'right', color: '#a49b86' });
    ['つよさ', 'そうび'].forEach(function (label, i) {
      var sel = i === state.cursor;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + label, x + 24, y + 70 + i * 26,
        { size: 14, color: sel ? '#d4af5a' : '#ece7da' });
    });
    Game.Renderer.drawText(ctx, 'Z: えらぶ    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  // つよさ ― レベル・経験値・素の値と装備ぶんの内訳・覚えた呪文・装備の銘。
  // これまで、この一式を見る場所がどこにも無かった。
  function drawStrength(ctx, x, y, w, h) {
    var m = currentMember();
    Game.Renderer.drawText(ctx, m.name + ' の つよさ', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, 'レベル ' + m.level, x + w - 16, y + 22,
      { size: 13, align: 'right', color: '#ece7da' });

    var ly = y + 50;
    Game.Renderer.drawText(ctx, 'HP ' + m.hp + '/' + m.maxHp, x + 16, ly, { size: 13 });
    if (m.maxMp > 0) Game.Renderer.drawText(ctx, 'MP ' + m.mp + '/' + m.maxMp, x + 150, ly, { size: 13 });
    Game.Renderer.drawText(ctx, 'つぎのレベルまで ' + m.expToNext, x + w - 16, ly,
      { size: 12, align: 'right', color: '#a49b86' });

    // 素の値と、装備で足された分を分けて見せる
    var STATS = [['こうげき', 'atk', 'baseAtk'], ['みのまもり', 'def', 'baseDef'],
                 ['すばやさ', 'spd', 'baseSpd'], ['まりょく', 'mag', 'baseMag'],
                 ['うんのよさ', 'luck', 'baseLuck']];
    STATS.forEach(function (row, i) {
      var yy = y + 82 + i * 21;
      var base = m[row[2]] || 0, total = m[row[1]] || 0, gear = total - base;
      Game.Renderer.drawText(ctx, row[0], x + 16, yy, { size: 13, color: '#a49b86' });
      Game.Renderer.drawText(ctx, String(total), x + 150, yy, { size: 13, align: 'right' });
      if (gear !== 0) {
        Game.Renderer.drawText(ctx, (gear > 0 ? '(+' : '(') + gear + ')', x + 158, yy,
          { size: 11, color: gear > 0 ? '#5fae5f' : '#d3807d' });
      }
    });

    // 覚えている呪文・特技
    var skills = Game.Party.learnedSkills(m).map(function (sk) { return sk.name; });
    Game.Renderer.drawText(ctx, 'おぼえた じゅもん・とくぎ', x + 240, y + 82,
      { size: 12, color: '#a49b86' });
    if (skills.length === 0) {
      Game.Renderer.drawText(ctx, '―', x + 240, y + 104, { size: 12, color: '#6b6354' });
    } else {
      skills.forEach(function (name, i) {
        Game.Renderer.drawText(ctx, name, x + 240 + (i % 2) * 110, y + 104 + Math.floor(i / 2) * 19,
          { size: 12 });
      });
    }

    // 装備の銘。数字に出ない性質なので、ここで読めるようにしておく
    var notes = [];
    Game.Data.EQUIP_SLOTS.forEach(function (slot) {
      var e = m.equip[slot] && Game.Data.Equipment[m.equip[slot]];
      if (e && e.mei && e.mei.note) notes.push(e.name + ' … ' + e.mei.note);
    });
    if (notes.length) {
      Game.Renderer.drawText(ctx, '銘', x + 16, y + h - 58, { size: 12, color: '#d4af5a' });
      notes.slice(0, 2).forEach(function (t, i) {
        Game.Renderer.drawText(ctx, t, x + 40, y + h - 58 + i * 18, { size: 11, color: '#a49b86' });
      });
    }
    Game.Renderer.drawText(ctx, 'X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawMember(ctx, x, y, w, h) {
    var m = currentMember();
    Game.Renderer.drawText(ctx, m.name + ' の そうび', x + 16, y + 22, { size: 15, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, statLine(m), x + 16, y + 44, { size: 12, color: '#a49b86' });
    Game.Data.EQUIP_SLOTS.forEach(function (slot, i) {
      var ly = y + 80 + i * 26;
      var prefix = i === state.cursor ? '▶ ' : '　';
      var cursed = Game.Party.cursedAt(m, slot);
      var equipped = m.equip[slot] ? Game.Data.Equipment[m.equip[slot]].name : '―';
      if (cursed) equipped = '† ' + equipped;
      var wearable = slotIsWearable(m, slot);
      Game.Renderer.drawText(ctx, prefix + Game.Data.SLOT_LABELS[slot], x + 16, ly,
        { size: 13, color: wearable ? '#ece7da' : '#6b6354' });
      Game.Renderer.drawText(ctx, equipped, x + 200, ly,
        { size: 13, color: cursed ? '#d3807d' : (wearable ? '#ece7da' : '#6b6354') });
    });
    Game.Renderer.drawText(ctx, 'Z: つけかえる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  function drawGearChoices(ctx, x, y, w, h) {
    var m = currentMember();
    var slot = Game.Data.EQUIP_SLOTS[state.slotIndex];
    var choices = gearChoicesFor(m, slot);
    Game.Renderer.drawText(ctx, m.name + ' の ' + Game.Data.SLOT_LABELS[slot], x + 16, y + 22,
      { size: 15, color: '#d4af5a' });
    var now = m.equip[slot] ? Game.Data.Equipment[m.equip[slot]] : null;
    Game.Renderer.drawText(ctx, 'いま: ' + (now ? now.name : '―'), x + w - 16, y + 22,
      { size: 12, align: 'right', color: '#a49b86' });
    Game.Renderer.drawText(ctx, statLine(m), x + 16, y + 44, { size: 12, color: '#a49b86' });

    if (choices.length === 0) {
      Game.Renderer.drawText(ctx, 'つけられる そうびが ない', x + 16, y + 80, { size: 13, color: '#a49b86' });
    }
    choices.slice(0, 9).forEach(function (c, i) {
      var ly = y + 80 + i * 24;
      var prefix = i === state.cursor ? '▶ ' : '　';
      if (c.id === null) {
        Game.Renderer.drawText(ctx, prefix + c.label, x + 16, ly, { size: 13, color: '#a49b86' });
        return;
      }
      var parts = [];
      Game.Data.GEAR_STATS.forEach(function (s) {
        if (c.def[s.key]) parts.push(s.label + '+' + c.def[s.key]);
      });
      Game.Renderer.drawText(ctx, prefix + c.def.name + (c.count > 1 ? ' x' + c.count : ''), x + 16, ly, { size: 13 });
      Game.Renderer.drawText(ctx, parts.join(' '), x + w - 16, ly, { size: 12, align: 'right', color: '#a49b86' });
    });
    Game.Renderer.drawText(ctx, 'Z: きめる    X: もどる', x + 16, y + h - 12, { size: 12, color: '#6b6354' });
  }

  return {
    toggle: toggle, isOpen: isOpen, close: close, update: update, draw: draw,
    // 検証用: いま選んでいる人がフィールドで唱えられる呪文
    __spells: function () { return fieldSpells(caster()).map(function (s) { return s.name; }); },
  };
})();
