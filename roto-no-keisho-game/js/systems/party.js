// パーティ状態管理 ― 実行時ステータス(HP/MP・経験値)、所持品、装備、所持金をまとめて扱う。
// こうげき/しゅび/すばやさ/まりょく/うんのよさ は「素の値(base*) + 装備の補正」で、
// 装備を変えるたびに recalc() で組み直す。
var Game = window.Game || {};
Game.Party = (function () {
  var members = {};
  var order = [];
  var inventory = [];  // 消耗品 [{id, count}]
  var gear = [];       // 所持している装備 [{id, count}](装備中のものは含まない)
  var gold = 60;
  // いまの さくせん。既定は「めいれいさせろ」(自分で指図する)
  var tactic = 'manual';

  function equipDef(id) { return id ? Game.Data.Equipment[id] : null; }

  // 素の値を持つステータス。base* に装備の補正を足したものが実効値になる。
  var STATS = ['atk', 'def', 'spd', 'mag', 'luck'];
  function baseKey(stat) { return 'base' + stat.charAt(0).toUpperCase() + stat.slice(1); }

  // 装備込みの実効ステータスを組み直す
  function recalc(m) {
    var totals = {};
    STATS.forEach(function (stat) { totals[stat] = m[baseKey(stat)] || 0; });
    Game.Data.EQUIP_SLOTS.forEach(function (slot) {
      var e = equipDef(m.equip[slot]);
      if (!e) return;
      STATS.forEach(function (stat) { totals[stat] += e[stat] || 0; });
    });
    STATS.forEach(function (stat) { m[stat] = totals[stat]; });
  }

  // レベルアップの伸び。キャラごとの growth が無ければ標準の伸びを使う。
  var DEFAULT_GROWTH = { hp: 6, mp: 2, atk: 2, def: 1, spd: 1, mag: 1, luck: 1 };
  function growthOf(m) {
    var g = (Game.Data.Characters[m.id] || {}).growth || {};
    var out = {};
    Object.keys(DEFAULT_GROWTH).forEach(function (k) {
      out[k] = g[k] === undefined ? DEFAULT_GROWTH[k] : g[k];
    });
    return out;
  }

  function spawn(id) {
    var base = Game.Data.Characters[id];
    var m = JSON.parse(JSON.stringify(base));
    STATS.forEach(function (stat) { m[baseKey(stat)] = base[stat] || 0; });
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
    tactic = 'manual';
  }

  function recruit(id) {
    if (order.indexOf(id) !== -1) return;
    members[id] = spawn(id);
    order.push(id);
  }

  function list() { return order.map(function (id) { return members[id]; }); }

  // 隊列の入れ替え。前に立つ者ほど狙われるので、並びは そのまま作戦になる。
  // 歩くときの隊列も この順に従う。
  function moveMember(index, delta) {
    var to = index + delta;
    if (index < 0 || index >= order.length || to < 0 || to >= order.length) return false;
    var tmp = order[index];
    order[index] = order[to];
    order[to] = tmp;
    return true;
  }
  function aliveList() { return list().filter(function (m) { return m.hp > 0; }); }
  function deadList() { return list().filter(function (m) { return m.hp <= 0; }); }
  function get(id) { return members[id]; }
  function isWiped() { return list().every(function (m) { return m.hp <= 0; }); }

  // 章の区切り。倒れている仲間だけを、最低限の状態で立たせる。
  // 元気な者はそのまま ― 消耗は次の章へ持ち越し、宿屋で直してもらう。
  function reviveFallen() {
    list().forEach(function (m) {
      m.guarding = false;
      if (m.hp > 0) return;
      m.hp = Math.max(1, Math.floor(m.maxHp * 0.25));
      m.mp = Math.max(m.mp, Math.floor(m.maxMp * 0.25));
      m.status = null;
      m.ward = false;
    });
  }

  // 宿屋での休息。HP/MPを全快させ、状態異常も解け、倒れた仲間も立ち上がる。
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
    // うんのよさが高いほど、状態異常そのものを弾きやすい(上限3割)
    if (Math.random() < Math.min(0.3, (m.luck || 0) * 0.01)) {
      return m.name + 'は 運よく 踏みとどまった!';
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
        var g = growthOf(m);
        // ドラクエと同じで、レベルアップは全快させない。
        // 上がった最大値のぶんだけ、いまの値も一緒に増える。
        // (全快させると消耗が一切たまらず、宿屋も道具も使う理由が無くなる)
        m.maxHp += g.hp; m.hp = Math.min(m.maxHp, m.hp + g.hp);
        if (m.maxMp > 0) { m.maxMp += g.mp; m.mp = Math.min(m.maxMp, m.mp + g.mp); }
        m.baseAtk += g.atk; m.baseDef += g.def; m.baseSpd += g.spd;
        m.baseMag += g.mag; m.baseLuck += g.luck;
        recalc(m);
        m.expToNext = Math.round(m.expToNext * 1.35);
        messages.push(m.name + 'は レベル' + m.level + 'に あがった!');
        // ドラクエのように、何がいくつ上がったのかを1行で告げる
        var gains = [['さいだいHP', g.hp], ['さいだいMP', m.maxMp > 0 ? g.mp : 0],
                     ['ちから', g.atk], ['みのまもり', g.def], ['すばやさ', g.spd],
                     ['まりょく', g.mag], ['うんのよさ', g.luck]]
          .filter(function (p) { return p[1] > 0; })
          .map(function (p) { return p[0] + 'が ' + p[1] + ' あがった'; });
        if (gains.length) messages.push(gains.join('。 ') + '!');
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
    return { order: order, members: members, inventory: inventory, gear: gear, gold: gold, tactic: tactic };
  }

  function deserialize(data) {
    if (!data) return false;
    order = data.order.slice();
    members = {};
    order.forEach(function (id) {
      var m = JSON.parse(JSON.stringify(data.members[id]));
      // 古いセーブや欠けた項目があっても壊れないよう、足りない値は今の定義から補う
      var base = Game.Data.Characters[id] || {};
      STATS.forEach(function (stat) {
        var key = baseKey(stat);
        if (m[key] === undefined) m[key] = base[stat] || 0;
      });
      m.equip = m.equip || {};
      m.guarding = false;
      members[id] = m;
      recalc(m);
    });
    inventory = (data.inventory || []).map(function (it) { return { id: it.id, count: it.count }; });
    gear = (data.gear || []).map(function (it) { return { id: it.id, count: it.count }; });
    gold = data.gold || 0;
    tactic = data.tactic || 'manual';
    return true;
  }

  return {
    init: init, recruit: recruit, restAll: restAll, reviveFallen: reviveFallen, revive: revive,
    list: list, aliveList: aliveList, deadList: deadList, get: get,
    isWiped: isWiped, addExp: addExp, learnedSkills: learnedSkills,
    statusOf: statusOf, inflict: inflict, cure: cure, cureAll: cureAll,
    clearTemporaryStatuses: clearTemporaryStatuses,
    inventory: function () { return inventory; },
    gearBag: function () { return gear; },
    useItem: useItem,
    // 相手を取らない道具(帰還の羽根など)を消費するだけの入り口
    consumeItem: function (id) { return stackRemove(inventory, id, 1); },
    gold: function () { return gold; },
    addGold: function (n) { gold += n; },
    spend: function (n) { if (gold < n) return false; gold -= n; return true; },
    canAfford: canAfford,
    buyItem: buyItem, buyGear: buyGear,
    sellItem: sellItem, sellGear: sellGear, sellPriceOf: sellPriceOf,
    canEquip: canEquip, equipGear: equipGear, unequipSlot: unequipSlot,
    grantGear: grantGear, grantItem: grantItem,
    moveMember: moveMember,
    tactic: function () { return tactic; },
    setTactic: function (id) { tactic = Game.Data.tacticOf(id).id; },
    serialize: serialize, deserialize: deserialize,
  };
})();
