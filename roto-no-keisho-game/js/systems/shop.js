// 店・宿屋・教会 ― 街の施設タイルを踏んだときに開く画面。
// kind: 'item'(道具屋) / 'gear'(武器防具屋) / 'inn'(宿屋) / 'church'(教会)
//       'medal'(ちいさなメダルの引き換え所)
var Game = window.Game || {};
Game.Shop = (function () {
  var state = null;

  function open(kind, mapId, onClose) {
    var stock = (Game.Data.Shops[mapId] || {})[kind === 'gear' ? 'gear' : 'item'] || [];
    state = {
      kind: kind,
      mapId: mapId,
      stock: stock,
      view: (kind === 'inn' || kind === 'medal') ? kind : 'root',
      cursor: 0,
      onClose: onClose,
    };
    if (kind === 'inn') {
      var price = Game.Data.innPrice(Game.Party.list());
      Game.Dialogue.show('宿屋「ひと晩 ' + price + 'ゴールドだよ。泊まっていくかい?」');
    } else if (kind === 'church') {
      Game.Dialogue.show('神官「ようこそ。旅の記録も、倒れた方への祈りも、ここで承ります」');
    } else if (kind === 'medal') {
      var n = Game.Data.medalCount();
      Game.Dialogue.show(n
        ? '好事家「ちいさなメダルを ' + n + 'まい お持ちですな。何と 換えましょう」'
        : '好事家「わしは ちいさなメダルを 集めておってな。見つけたら 持ってきなされ」');
    }
  }

  function isOpen() { return !!state; }

  function close() {
    var cb = state.onClose;
    state = null;
    if (cb) cb();
  }

  function title() {
    return { item: 'どうぐや', gear: 'ぶきぼうぐや', inn: 'やどや',
             church: 'きょうかい', medal: 'メダルの ひきかえ所' }[state.kind];
  }

  // ---- 一覧の中身 ----
  function goodsList() {
    var isGear = state.kind === 'gear';
    return state.stock.map(function (id) {
      var def = isGear ? Game.Data.Equipment[id] : Game.Data.Items[id];
      return { id: id, def: def, price: def.price, gear: isGear };
    });
  }

  function sellList() {
    var out = [];
    Game.Party.inventory().forEach(function (it) {
      var def = Game.Data.Items[it.id];
      out.push({ id: it.id, def: def, count: it.count, price: Game.Party.sellPriceOf(def), gear: false });
    });
    Game.Party.gearBag().forEach(function (it) {
      var def = Game.Data.Equipment[it.id];
      if (def.story) return; // 物語の装備は売らない
      out.push({ id: it.id, def: def, count: it.count, price: Game.Party.sellPriceOf(def), gear: true });
    });
    return out;
  }

  function rootList() {
    // 教会は 売り買いではなく「記録」と「祈り」。
    // ぼうけんのしょがメニューの奥にしか無いと、はじめての人は見つけられない。
    if (state.kind === 'church') {
      return [
        { id: 'save',   label: 'ぼうけんのしょに きろくする' },
        { id: 'church', label: 'たおれた仲間に いのる' },
        { id: 'leave',  label: 'でていく' },
      ];
    }
    return [{ id: 'buy', label: 'かう' }, { id: 'sell', label: 'うる' }, { id: 'leave', label: 'でていく' }];
  }

  function currentList() {
    if (state.view === 'root') return rootList();
    if (state.view === 'buy') return goodsList();
    if (state.view === 'sell') return sellList();
    if (state.view === 'church') return Game.Party.deadList();
    if (state.view === 'medal') return Game.Data.MedalPrizes;
    return [];
  }

  // ---- 操作 ----
  function update() {
    if (!state) return;
    // 会話中はメッセージ送りを優先する
    var dialogueWasActive = Game.Dialogue.isActive();
    Game.Dialogue.update();
    if (dialogueWasActive) return;

    if (state.view === 'inn') { updateInn(); return; }

    var list = currentList();
    if (Game.Input.wasPressed('down')) state.cursor = list.length ? (state.cursor + 1) % list.length : 0;
    if (Game.Input.wasPressed('up')) state.cursor = list.length ? (state.cursor - 1 + list.length) % list.length : 0;

    if (Game.Input.wasPressed('cancel')) {
      if (state.view === 'root' || state.view === 'church' || state.view === 'medal') close();
      else { state.view = 'root'; state.cursor = 0; }
      return;
    }
    if (!Game.Input.wasPressed('confirm')) return;

    if (state.view === 'root') {
      var cmd = list[state.cursor].id;
      if (cmd === 'leave') { close(); return; }
      if (cmd === 'save') { doChurchSave(); return; }
      state.view = cmd; state.cursor = 0;
      return;
    }
    if (state.view === 'medal') { doTrade(list[state.cursor]); return; }
    if (state.view === 'buy') { doBuy(list[state.cursor]); return; }
    if (state.view === 'sell') { doSell(list[state.cursor]); return; }
    if (state.view === 'church') { doRevive(list[state.cursor]); return; }
  }

  function updateInn() {
    var price = Game.Data.innPrice(Game.Party.list());
    if (Game.Input.wasPressed('cancel')) { close(); return; }
    if (!Game.Input.wasPressed('confirm')) return;
    if (!Game.Party.spend(price)) {
      Game.Dialogue.show('宿屋「おや、持ち合わせが 足りないようだね」', close);
      return;
    }
    Game.Party.restAll();
    Game.Dialogue.show('ぐっすり 眠った。パーティは 全回復した!', close);
  }

  // メダルを渡して品を受け取る。払うのは金ではなく枚数。
  function doTrade(prize) {
    if (!prize) return;
    var have = Game.Data.medalCount();
    if (have < prize.cost) {
      Game.Dialogue.show('好事家「まだ ' + (prize.cost - have) + 'まい 足りませんな」');
      return;
    }
    for (var i = 0; i < prize.cost; i++) Game.Party.consumeItem('chiisana_medal');
    var name;
    if (prize.kind === 'gear') {
      Game.Party.grantGear(prize.id);
      name = Game.Data.Equipment[prize.id].name;
    } else {
      Game.Party.grantItem(prize.id, prize.count || 1);
      name = Game.Data.Items[prize.id].name + (prize.count > 1 ? ' ' + prize.count + 'つ' : '');
    }
    Game.Dialogue.show('好事家「では これを。……大事になされよ」', function () {
      Game.Dialogue.show(name + 'を 手に入れた!');
    });
  }

  function doBuy(entry) {
    if (!entry) return;
    var ok = entry.gear ? Game.Party.buyGear(entry.id) : Game.Party.buyItem(entry.id);
    if (!ok) {
      Game.Dialogue.show('ゴールドが たりない!');
      return;
    }
    Game.Dialogue.show(entry.def.name + 'を 買った!');
  }

  function doSell(entry) {
    if (!entry) return;
    var got = entry.gear ? Game.Party.sellGear(entry.id) : Game.Party.sellItem(entry.id);
    if (!got) { Game.Dialogue.show('それは 売れないようだ'); return; }
    Game.Dialogue.show(entry.def.name + 'を ' + got + 'ゴールドで 売った');
    if (state.cursor >= sellList().length) state.cursor = Math.max(0, sellList().length - 1);
  }

  // 教会での記録。ドラクエで最初に覚える手続きなので、いちばん上に置いてある。
  function doChurchSave() {
    if (Game.Save.save()) {
      Game.Dialogue.show('神官「ここまでの旅を 書き留めました」', function () {
        Game.Dialogue.show('ぼうけんのしょに きろくした。');
      });
    } else {
      Game.Dialogue.show('神官「……筆が 走りません。この地では 書き留められぬようです」');
    }
  }

  function doRevive(member) {
    if (!member) { close(); return; }
    var price = Game.Data.revivePrice(member);
    if (!Game.Party.spend(price)) {
      Game.Dialogue.show('教会「' + price + 'ゴールドが 必要なのです……」');
      return;
    }
    Game.Party.revive(member.id);
    Game.Dialogue.show(member.name + 'は 息を吹き返した!');
    state.cursor = 0;
  }

  // ---- 描画 ----
  var W_CACHE = 640, H_CACHE = 480;
  function draw(ctx, W, H) {
    if (!state) return;
    W_CACHE = W; H_CACHE = H;
    // 背後の街を暗く落として、品名と値段を読みやすくする
    ctx.fillStyle = 'rgba(8,10,18,0.72)';
    ctx.fillRect(0, 0, W, H);
    var x = 24, y = 40, w = W - 48, h = 250;
    Game.Renderer.drawPanel(ctx, x, y, w, h);
    Game.Renderer.drawText(ctx, title(), x + 16, y + 26, { size: 16, color: '#d4af5a' });
    Game.Renderer.drawText(ctx, 'しょじきん ' + Game.Party.gold() + 'G', x + w - 16, y + 26,
      { size: 13, align: 'right', color: '#a49b86' });

    if (state.view === 'inn') {
      var price = Game.Data.innPrice(Game.Party.list());
      Game.Renderer.drawText(ctx, 'ひと晩 ' + price + 'ゴールド', x + 16, y + 70, { size: 15 });
      Game.Renderer.drawText(ctx, 'Z: 泊まる    X: やめる', x + 16, y + 100, { size: 13, color: '#a49b86' });
      Game.Dialogue.draw(ctx, W, H);
      return;
    }

    if (state.view === 'medal') { drawMedals(ctx, x, y, w, h); return; }

    var list = currentList();
    if (list.length === 0) {
      var empty = state.view === 'church' ? '倒れている仲間は いません' : 'ならんでいる品は ありません';
      Game.Renderer.drawText(ctx, empty, x + 16, y + 70, { size: 14, color: '#a49b86' });
    }

    list.slice(0, 8).forEach(function (entry, i) {
      var ly = y + 62 + i * 22;
      var prefix = i === state.cursor ? '▶ ' : '　';
      if (state.view === 'root') {
        Game.Renderer.drawText(ctx, prefix + entry.label, x + 16, ly, { size: 14 });
        return;
      }
      if (state.view === 'church') {
        Game.Renderer.drawText(ctx, prefix + entry.name + '  Lv' + entry.level, x + 16, ly, { size: 14 });
        Game.Renderer.drawText(ctx, Game.Data.revivePrice(entry) + 'G', x + w - 16, ly,
          { size: 13, align: 'right', color: '#a49b86' });
        return;
      }
      // 買う / 売る
      var affordable = state.view === 'sell' || Game.Party.canAfford(entry.price);
      var label = entry.def.name + (entry.count ? ' x' + entry.count : '');
      Game.Renderer.drawText(ctx, prefix + label, x + 16, ly,
        { size: 14, color: affordable ? '#ece7da' : '#6b6354' });
      Game.Renderer.drawText(ctx, entry.price + 'G', x + w - 16, ly,
        { size: 13, align: 'right', color: affordable ? '#a49b86' : '#6b6354' });
    });

    // 選択中の装備の性能を出しておくと、買い替えの判断がしやすい
    var sel = list[state.cursor];
    if (sel && sel.def && sel.gear) {
      var LONG = { atk: 'こうげき', def: 'しゅび', spd: 'すばやさ', mag: 'まりょく', luck: 'うんのよさ' };
      var parts = [];
      Game.Data.GEAR_STATS.forEach(function (st) {
        if (sel.def[st.key]) parts.push(LONG[st.key] + ' +' + sel.def[st.key]);
      });
      Game.Renderer.drawText(ctx, Game.Data.SLOT_LABELS[sel.def.slot] + ' / ' + parts.join('  '),
        x + 16, y + h - 16, { size: 12, color: '#a49b86' });
    } else if (state.view !== 'root') {
      Game.Renderer.drawText(ctx, 'X: もどる', x + 16, y + h - 16, { size: 12, color: '#6b6354' });
    }

    Game.Dialogue.draw(ctx, W, H);
  }

  function drawMedals(ctx, x, y, w, h) {
    var have = Game.Data.medalCount();
    Game.Renderer.drawText(ctx, 'ちいさなメダル ' + have + 'まい', x + 16, y + 50,
      { size: 14, color: '#d4af5a' });
    Game.Data.MedalPrizes.forEach(function (pz, i) {
      var ly = y + 78 + i * 22;
      var sel = i === state.cursor;
      var name = pz.kind === 'gear'
        ? Game.Data.Equipment[pz.id].name
        : Game.Data.Items[pz.id].name + (pz.count > 1 ? ' x' + pz.count : '');
      var ok = have >= pz.cost;
      Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + name, x + 16, ly,
        { size: 13, color: ok ? '#ece7da' : '#6b6354' });
      Game.Renderer.drawText(ctx, pz.note, x + 200, ly,
        { size: 11, color: '#6b6354' });
      Game.Renderer.drawText(ctx, pz.cost + 'まい', x + w - 16, ly,
        { size: 12, align: 'right', color: ok ? '#a49b86' : '#6b6354' });
    });
    Game.Renderer.drawText(ctx, 'Z: ひきかえる    X: でる', x + 16, y + h - 16,
      { size: 12, color: '#6b6354' });
    Game.Dialogue.draw(ctx, W_CACHE, H_CACHE);
  }

  return { open: open, isOpen: isOpen, update: update, draw: draw };
})();
