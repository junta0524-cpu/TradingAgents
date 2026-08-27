// パーティ状態管理 ― 実行時ステータス(HP/MP・経験値)、所持品、装備、所持金をまとめて扱う。
// atk/def/spd は「素の値(base*) + 装備の補正」で、装備を変えるたびに recalc() で組み直す。
var Game = window.Game || {};
Game.Party = (function () {
  var members = {};
  var order = [];
  var inventory = [];  // 消耗品 [{id, count}]
  var gear = [];       // 所持している装備 [{id, count}](装備中のものは含まない)
  var gold = 60;

  function equipDef(id) { return id ? Game.Data.Equipment[id] : null; }

  // 装備込みの実効ステータスを組み直す
  function recalc(m) {
    var atk = m.baseAtk, def = m.baseDef, spd = m.baseSpd;
    Game.Data.EQUIP_SLOTS.forEach(function (slot) {
      var e = equipDef(m.equip[slot]);
      if (!e) return;
      atk += e.atk || 0;
      def += e.def || 0;
      spd += e.spd || 0;
    });
    m.atk = atk; m.def = def; m.spd = spd;
  }

  function spawn(id) {
    var base = Game.Data.Characters[id];
    var m = JSON.parse(JSON.stringify(base));
    m.baseAtk = base.atk; m.baseDef = base.def; m.baseSpd = base.spd;
    m.equip = m.equip || {};
    recalc(m);
    return m;
  }

  function init() {
    order = Game.Data.PARTY_ORDER.slice();
    members = {};
    order.forEach(function (id) { members[id] = spawn(id); });
    inventory = Game.Data.START_INVENTORY.map(function (it) { return { id: it.id, count: it.count }; });
    gear = [];
    gold = 60;
  }

  function recruit(id) {
    if (order.indexOf(id) !== -1) return;
    members[id] = spawn(id);
    order.push(id);
  }

  function list() { return order.map(function (id) { return members[id]; }); }
  function aliveList() { return list().filter(function (m) { return m.hp > 0; }); }
  function deadList() { return list().filter(function (m) { return m.hp <= 0; }); }
  function get(id) { return members[id]; }
  function isWiped() { return list().every(function (m) { return m.hp <= 0; }); }

  // 章の区切りや宿屋での休息。HP/MPを全快させ、状態異常も解け、倒れた仲間も立ち上がる。
  function restAll() {
    list().forEach(function (m) {
      m.hp = m.maxHp;
      m.mp = m.maxMp;
      m.guarding = false;
      m.status = null;
      m.ward = false;
    });
  }

  // ---- 状態異常 ----
  function statusOf(m) { return m.status ? Game.Data.Statuses[m.status] : null; }

  // 状態異常をかける。護符を持っていれば一度だけ弾く。すでに同じ異常なら重ねがけしない。
  // 戻り値は表示用のメッセージ(何も起きなければ null)。
  function inflict(m, statusId) {
    if (m.hp <= 0 || m.status === statusId) return null;
    var def = Game.Data.Statuses[statusId];
    if (!def) return null;
    if (m.ward) {
      m.ward = false;
      return m.name + 'は 加護に まもられた!';
    }
    m.status = statusId;
    return m.name + def.onInflict;
  }

  function cure(m, statusIds) {
    if (!m.status || statusIds.indexOf(m.status) === -1) return null;
    var def = Game.Data.Statuses[m.status];
    m.status = null;
    return m.name + def.onCure;
  }

  function cureAll(m) { return cure(m, Game.Data.CURE_ALL); }

  // 戦闘が終わったとき、毒以外の状態異常は自然に解ける
  function clearTemporaryStatuses() {
    list().forEach(function (m) {
      m.guarding = false;
      if (m.status && !Game.Data.Statuses[m.status].persists) m.status = null;
    });
  }

  // 教会での蘇生。HPを半分まで戻して復帰させる。
  function revive(id) {
    var m = members[id];
    if (!m || m.hp > 0) return false;
    m.hp = Math.max(1, Math.floor(m.maxHp / 2));
    m.status = null; // 祈りは毒も清める
    return true;
  }

  // そのレベルで使える技だけを返す(まだ覚えていない技は出さない)
  function learnedSkills(m) {
    return (m.skills || [])
      .filter(function (s) { return m.level >= s.level; })
      .map(function (s) { return Game.Data.Skills[s.id]; });
  }

  function addExp(exp) {
    var messages = [];
    aliveList().forEach(function (m) {
      m.exp += exp;
      while (m.exp >= m.expToNext) {
        m.exp -= m.expToNext;
        var before = m.level;
        m.level += 1;
        m.maxHp += 6; m.hp = m.maxHp;
        if (m.maxMp > 0) { m.maxMp += 2; m.mp = m.maxMp; }
        m.baseAtk += 2; m.baseDef += 1; m.baseSpd += 1;
        recalc(m);
        m.expToNext = Math.round(m.expToNext * 1.35);
        messages.push(m.name + 'は レベル' + m.level + 'に あがった!');
        // このレベルで新しく覚えた技を告げる
        (m.skills || []).forEach(function (s) {
          if (s.level > before && s.level <= m.level) {
            messages.push(m.name + 'は ' + Game.Data.Skills[s.id].name + 'を おぼえた!');
          }
        });
      }
    });
    return messages;
  }

  // ---- 所持品 ----
  function stackAdd(bag, id, n) {
    var e = bag.find(function (it) { return it.id === id; });
    if (e) e.count += n; else bag.push({ id: id, count: n });
  }
  function stackRemove(bag, id, n) {
    var e = bag.find(function (it) { return it.id === id; });
    if (!e || e.count < n) return false;
    e.count -= n;
    if (e.count <= 0) bag.splice(bag.indexOf(e), 1);
    return true;
  }

  function applyItemEffect(def, target) {
    if (def.kind === 'heal_hp') {
      target.hp = Math.min(target.maxHp, target.hp + def.power);
      return 'HPが かいふくした';
    }
    if (def.kind === 'heal_mp') {
      target.mp = Math.min(target.maxMp, target.mp + def.power);
      return 'MPが かいふくした';
    }
    if (def.kind === 'revive') {
      target.hp = Math.max(1, Math.floor(target.maxHp * def.power));
      target.status = null;
      return 'いきかえった!';
    }
    if (def.kind === 'cure') {
      var msg = cure(target, def.cures || []);
      return msg || 'しかし なにも おこらなかった';
    }
    if (def.kind === 'ward') {
      target.ward = true;
      return target.name + 'は 加護に つつまれた';
    }
    return '';
  }

  function useItem(itemId, targetId) {
    var e = inventory.find(function (it) { return it.id === itemId; });
    if (!e || e.count <= 0) return null;
    var msg = applyItemEffect(Game.Data.Items[itemId], members[targetId]);
    stackRemove(inventory, itemId, 1);
    return msg;
  }

  // ---- 売買 ----
  function canAfford(price) { return gold >= price; }

  function buyItem(itemId) {
    var def = Game.Data.Items[itemId];
    if (!def || !canAfford(def.price)) return false;
    gold -= def.price;
    stackAdd(inventory, itemId, 1);
    return true;
  }

  function buyGear(gearId) {
    var def = Game.Data.Equipment[gearId];
    if (!def || def.story || !canAfford(def.price)) return false;
    gold -= def.price;
    stackAdd(gear, gearId, 1);
    return true;
  }

  // 売値は買値の半額(DQ の慣例)。物語上の装備は売れない。
  function sellPriceOf(def) { return Math.floor((def.price || 0) / 2); }

  function sellItem(itemId) {
    var def = Game.Data.Items[itemId];
    if (!def || !stackRemove(inventory, itemId, 1)) return 0;
    var p = sellPriceOf(def);
    gold += p;
    return p;
  }

  function sellGear(gearId) {
    var def = Game.Data.Equipment[gearId];
    if (!def || def.story || !stackRemove(gear, gearId, 1)) return 0;
    var p = sellPriceOf(def);
    gold += p;
    return p;
  }

  // ---- 装備 ----
  function canEquip(m, gearId) {
    var def = Game.Data.Equipment[gearId];
    if (!def) return false;
    return (m.equipKinds || []).indexOf(def.kind) !== -1;
  }

  // 手持ちの装備を身につける。今つけていたものは手持ちに戻る。
  function equipGear(memberId, gearId) {
    var m = members[memberId];
    var def = Game.Data.Equipment[gearId];
    if (!m || !def || !canEquip(m, gearId)) return false;
    if (!stackRemove(gear, gearId, 1)) return false;
    var prev = m.equip[def.slot];
    if (prev) stackAdd(gear, prev, 1);
    m.equip[def.slot] = gearId;
    recalc(m);
    return true;
  }

  function unequipSlot(memberId, slot) {
    var m = members[memberId];
    if (!m || !m.equip[slot]) return false;
    stackAdd(gear, m.equip[slot], 1);
    m.equip[slot] = null;
    recalc(m);
    return true;
  }

  // 物語の褒賞など、店を介さず直接手に入る装備
  function grantGear(gearId) { stackAdd(gear, gearId, 1); }
  // 宝箱の中身など、代金を払わずに受け取る道具
  function grantItem(itemId, n) { stackAdd(inventory, itemId, n || 1); }

  // ---- セーブ/ロード ----
  function serialize() {
    return { order: order, members: members, inventory: inventory, gear: gear, gold: gold };
  }

  function deserialize(data) {
    if (!data) return false;
    order = data.order.slice();
    members = {};
    order.forEach(function (id) {
      var m = JSON.parse(JSON.stringify(data.members[id]));
      // 古いセーブや欠けた項目があっても壊れないよう、足りない値は今の定義から補う
      var base = Game.Data.Characters[id] || {};
      if (m.baseAtk === undefined) m.baseAtk = base.atk;
      if (m.baseDef === undefined) m.baseDef = base.def;
      if (m.baseSpd === undefined) m.baseSpd = base.spd;
      m.equip = m.equip || {};
      m.guarding = false;
      members[id] = m;
      recalc(m);
    });
    inventory = (data.inventory || []).map(function (it) { return { id: it.id, count: it.count }; });
    gear = (data.gear || []).map(function (it) { return { id: it.id, count: it.count }; });
    gold = data.gold || 0;
    return true;
  }

  return {
    init: init, recruit: recruit, restAll: restAll, revive: revive,
    list: list, aliveList: aliveList, deadList: deadList, get: get,
    isWiped: isWiped, addExp: addExp, learnedSkills: learnedSkills,
    statusOf: statusOf, inflict: inflict, cure: cure, cureAll: cureAll,
    clearTemporaryStatuses: clearTemporaryStatuses,
    inventory: function () { return inventory; },
    gearBag: function () { return gear; },
    useItem: useItem,
    gold: function () { return gold; },
    addGold: function (n) { gold += n; },
    spend: function (n) { if (gold < n) return false; gold -= n; return true; },
    canAfford: canAfford,
    buyItem: buyItem, buyGear: buyGear,
    sellItem: sellItem, sellGear: sellGear, sellPriceOf: sellPriceOf,
    canEquip: canEquip, equipGear: equipGear, unequipSlot: unequipSlot,
    grantGear: grantGear, grantItem: grantItem,
    serialize: serialize, deserialize: deserialize,
  };
})();
