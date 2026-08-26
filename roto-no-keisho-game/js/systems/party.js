// パーティ状態管理 ― Data.Characters を元にした実行時ステータス(HP増減・経験値・所持品)
var Game = window.Game || {};
Game.Party = (function () {
  var members = {};
  var order = [];
  var inventory = [];
  var gold = 60;

  function init() {
    order = Game.Data.PARTY_ORDER.slice();
    members = {};
    order.forEach(function (id) {
      var base = Game.Data.Characters[id];
      members[id] = JSON.parse(JSON.stringify(base));
    });
    inventory = Game.Data.START_INVENTORY.map(function (it) { return { id: it.id, count: it.count }; });
    gold = 60;
  }

  function list() { return order.map(function (id) { return members[id]; }); }
  function get(id) { return members[id]; }

  function isWiped() {
    return list().every(function (m) { return m.hp <= 0; });
  }

  function addExp(id, exp) {
    var m = members[id];
    m.exp += exp;
    var leveledUp = false;
    while (m.exp >= m.expToNext) {
      m.exp -= m.expToNext;
      m.level += 1;
      m.maxHp += 6; m.hp = m.maxHp;
      m.maxMp += 1; m.mp = m.maxMp;
      m.atk += 2; m.def += 1; m.spd += 1;
      m.expToNext = Math.round(m.expToNext * 1.35);
      leveledUp = true;
    }
    return leveledUp;
  }

  function findItem(id) { return inventory.find(function (it) { return it.id === id; }); }
  function useItem(itemId, targetId) {
    var entry = findItem(itemId);
    if (!entry || entry.count <= 0) return false;
    var def = Game.Data.Items[itemId];
    var target = members[targetId];
    if (def.kind === 'heal_hp') {
      target.hp = Math.min(target.maxHp, target.hp + def.power);
    } else if (def.kind === 'cure') {
      target.status = null;
    }
    entry.count -= 1;
    return true;
  }

  return {
    init: init, list: list, get: get, isWiped: isWiped, addExp: addExp,
    inventory: function () { return inventory; },
    useItem: useItem,
    gold: function () { return gold; },
    addGold: function (n) { gold += n; },
  };
})();
