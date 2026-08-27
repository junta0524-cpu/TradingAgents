// パーティ状態管理 ― Data.Characters を元にした実行時ステータス(HP増減・経験値・所持品・仲間加入)
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

  function recruit(id) {
    if (order.indexOf(id) !== -1) return;
    var base = Game.Data.Characters[id];
    members[id] = JSON.parse(JSON.stringify(base));
    order.push(id);
  }

  // 章の区切りでの休息。HP/MPを全快させ、倒れた仲間も立ち上がる。
  // (この作品には宿屋・教会が無いため、ここが唯一の全体回復ポイントになる)
  function restAll() {
    list().forEach(function (m) {
      m.hp = m.maxHp;
      m.mp = m.maxMp;
      m.guarding = false;
    });
  }

  function list() { return order.map(function (id) { return members[id]; }); }
  function aliveList() { return list().filter(function (m) { return m.hp > 0; }); }
  function get(id) { return members[id]; }
  function isWiped() { return list().every(function (m) { return m.hp <= 0; }); }

  function addExp(exp) {
    var leveledNames = [];
    aliveList().forEach(function (m) {
      m.exp += exp;
      while (m.exp >= m.expToNext) {
        m.exp -= m.expToNext;
        m.level += 1;
        m.maxHp += 6; m.hp = m.maxHp;
        if (m.maxMp > 0) { m.maxMp += 2; m.mp = m.maxMp; }
        m.atk += 2; m.def += 1; m.spd += 1;
        m.expToNext = Math.round(m.expToNext * 1.35);
        leveledNames.push(m.name + 'は レベル' + m.level + 'に あがった!');
      }
    });
    return leveledNames;
  }

  function findItem(id) { return inventory.find(function (it) { return it.id === id; }); }

  // kind に応じて回復対象へ効果を適用する。戻り値はメッセージ用の説明文字列。
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
      return 'いきかえった!';
    }
    if (def.kind === 'cure' || def.kind === 'cure_undead' || def.kind === 'ward') {
      return 'すこし らくになったようだ';
    }
    return '';
  }

  function useItem(itemId, targetId) {
    var entry = findItem(itemId);
    if (!entry || entry.count <= 0) return null;
    var def = Game.Data.Items[itemId];
    var target = members[targetId];
    var msg = applyItemEffect(def, target);
    entry.count -= 1;
    return msg;
  }

  return {
    init: init, recruit: recruit, restAll: restAll,
    list: list, aliveList: aliveList, get: get, isWiped: isWiped, addExp: addExp,
    inventory: function () { return inventory; },
    useItem: useItem,
    gold: function () { return gold; },
    addGold: function (n) { gold += n; },
  };
})();
