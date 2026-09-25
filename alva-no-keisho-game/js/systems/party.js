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
  // いまの さくせん。既定は「ひとりずつ さしずする」(自分で指図する)
  var tactic = 'manual';

  function equipDef(id) { return id ? Game.Data.Equipment[id] : null; }

  // 素の値を持つステータス。base* に装備の補正を足したものが実効値になる。
  var STATS = ['atk', 'def', 'spd', 'mag', 'luck'];
  function baseKey(stat) { return 'base' + stat.charAt(0).toUpperCase() + stat.slice(1); }

  // ---- 職 ----
  // 素の値に 職の倍率を掛ける(切り捨て)。うんのよさ には掛けない。
  function jobDef(m) { return Game.Data.Jobs[(m && m.job) || 'arinomama'] || Game.Data.Jobs.arinomama; }
  function jobMul(m, key) {
    var v = jobDef(m).mul[key];
    return v === undefined ? 1 : v;
  }
  function starFromBattles(n) {
    var star = 1;
    for (var s = 2; s <= Game.Data.JOB_MAX_STAR; s++) if (n >= Game.Data.JOB_STARS[s]) star = s;
    return star;
  }
  function jobBattles(m, jobId) { return (m.jobs && m.jobs[jobId] && m.jobs[jobId].battles) || 0; }
  function jobStar(m, jobId) { return starFromBattles(jobBattles(m, jobId || m.job)); }
  // つぎの★まで あと何回か。極めていれば null
  function battlesToNextStar(m, jobId) {
    var star = jobStar(m, jobId);
    if (star >= Game.Data.JOB_MAX_STAR) return null;
    return Game.Data.JOB_STARS[star + 1] - jobBattles(m, jobId);
  }
  // 最大HP・MPは 伸びた生の値(raw)を持ち、職の倍率を掛けて出す
  function applyJobVitals(m) {
    m.maxHp = Math.max(1, Math.floor(m.rawMaxHp * jobMul(m, 'hp')));
    m.maxMp = m.rawMaxMp > 0 ? Math.max(1, Math.floor(m.rawMaxMp * jobMul(m, 'mp'))) : 0;
    m.hp = Math.min(m.hp, m.maxHp);
    m.mp = Math.min(m.mp, m.maxMp);
  }
  function ensureJobFields(m) {
    if (!m.job || !Game.Data.Jobs[m.job]) m.job = 'arinomama';
    m.jobs = m.jobs || {};
    if (m.rawMaxHp === undefined) m.rawMaxHp = m.maxHp;
    if (m.rawMaxMp === undefined) m.rawMaxMp = m.maxMp;
  }

  // 装備込みの実効ステータスを組み直す
  function recalc(m) {
    var totals = {};
    STATS.forEach(function (stat) {
      var base = m[baseKey(stat)] || 0;
      totals[stat] = stat === 'luck' ? base : Math.floor(base * jobMul(m, stat));
    });
    Game.Data.EQUIP_SLOTS.forEach(function (slot) {
      var e = equipDef(m.equip[slot]);
      if (!e) return;
      STATS.forEach(function (stat) { totals[stat] += e[stat] || 0; });
    });
    STATS.forEach(function (stat) { m[stat] = totals[stat]; });
  }

  // 装備の「銘」をまとめる。recalc は5つの数字しか合算しないので、
  // 性質はこちらで別に集める。同じ属性の耐性は掛け算で重ねる。
  function traitsOf(m) {
    var out = { resist: {}, autoHerb: false, thorns: 0 };
    if (!m || !m.equip) return out;
    Game.Data.EQUIP_SLOTS.forEach(function (slot) {
      var e = equipDef(m.equip[slot]);
      if (!e || !e.mei) return;
      var mei = e.mei;
      if (mei.resist) {
        Object.keys(mei.resist).forEach(function (el) {
          out.resist[el] = (out.resist[el] === undefined ? 1 : out.resist[el]) * mei.resist[el];
        });
      }
      if (mei.autoHerb) out.autoHerb = true;
      if (mei.thorns) out.thorns += mei.thorns;
    });
    return out;
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
    ensureJobFields(m);
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
  // レベルで覚えた技 と 職の★で覚えた技。同じ技は ひとつにまとめる。
  // 職の技は 職を変えても残る(その職が keepSkills: false なら、就いているあいだだけ)
  function learnedSkills(m) {
    var ids = (m.skills || [])
      .filter(function (s) { return m.level >= s.level; })
      .map(function (s) { return s.id; });
    Game.Data.JOB_ORDER.forEach(function (jobId) {
      var j = Game.Data.Jobs[jobId];
      if (j.keepSkills === false && m.job !== jobId) return;
      var star = jobBattles(m, jobId) > 0 || m.job === jobId ? jobStar(m, jobId) : 0;
      j.skills.forEach(function (s) { if (star >= s.star && ids.indexOf(s.id) === -1) ids.push(s.id); });
    });
    return ids.map(function (id) { return Game.Data.Skills[id]; });
  }

  // その職に就けるか。就けないなら理由の文を返す
  function jobLockReason(m, jobId) {
    var j = Game.Data.Jobs[jobId];
    if (!j) return 'そのような 職は ない。';
    var req = j.requires;
    if (!req) return null;
    var lacking = Object.keys(req).filter(function (id) { return jobStar(m, id) < req[id] || jobBattles(m, id) === 0; });
    if (!lacking.length) return null;
    return Object.keys(req).map(function (id) { return Game.Data.Jobs[id].name; }).join('と ') +
      'を ★' + req[Object.keys(req)[0]] + 'まで 極めねば、この道は 開かれぬ。';
  }

  function changeJob(memberId, jobId) {
    var m = members[memberId];
    if (!m || jobLockReason(m, jobId)) return false;
    m.job = jobId;
    m.jobs[jobId] = m.jobs[jobId] || { battles: 0 };
    applyJobVitals(m);
    recalc(m);
    return true;
  }

  // 勝った戦いを、いまの職の修行として数える。
  // maxRank はその戦いで いちばん格の高い魔物。弱すぎれば 数えない。
  function countJobBattle(maxRank) {
    var alive = aliveList();
    var trainees = alive.filter(function (m) { return m.job && m.job !== 'arinomama'; });
    if (!trainees.length) return [];
    var avg = alive.reduce(function (s, m) { return s + m.level; }, 0) / alive.length;
    if (avg > Game.Data.jobCap(maxRank)) return ['(この辺りの 魔物では、もう 修行に ならない……)'];
    var out = [];
    trainees.forEach(function (m) {
      var before = learnedSkills(m).map(function (sk) { return sk.id; });
      var starBefore = jobStar(m, m.job);
      m.jobs[m.job] = m.jobs[m.job] || { battles: 0 };
      m.jobs[m.job].battles += 1;
      var star = jobStar(m, m.job);
      if (star === starBefore) return;
      out.push(m.name + 'の ' + jobDef(m).name + 'の 熟練度が ★' + star + 'に あがった!' +
        (star === Game.Data.JOB_MAX_STAR ? ' (極めた!)' : ''));
      learnedSkills(m).forEach(function (sk) {
        if (before.indexOf(sk.id) === -1) out.push(m.name + 'は ' + sk.name + 'を おぼえた!');
      });
    });
    return out;
  }

  // 渾身の一撃の出やすさ(職の性質で 底上げされるぶん)。0 なら 底上げなし
  function jobCritRate(m) {
    var t = jobDef(m).trait;
    if (!t || !t.crit || jobStar(m, m.job) < (t.fromStar || 1)) return 0;
    return t.crit;
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
        // 定石どおりで、レベルアップは全快させない。
        // 上がった最大値のぶんだけ、いまの値も一緒に増える。
        // (全快させると消耗が一切たまらず、宿屋も道具も使う理由が無くなる)
        // 生の値を伸ばし、職の倍率を掛けて出し直す。いまの値は 増えたぶんだけ足す
        ensureJobFields(m);
        var hpBefore = m.maxHp, mpBefore = m.maxMp;
        m.rawMaxHp += g.hp;
        if (m.rawMaxMp > 0) m.rawMaxMp += g.mp;
        applyJobVitals(m);
        m.hp = Math.min(m.maxHp, m.hp + Math.max(0, m.maxHp - hpBefore));
        m.mp = Math.min(m.maxMp, m.mp + Math.max(0, m.maxMp - mpBefore));
        m.baseAtk += g.atk; m.baseDef += g.def; m.baseSpd += g.spd;
        m.baseMag += g.mag; m.baseLuck += g.luck;
        recalc(m);
        m.expToNext = Math.round(m.expToNext * 1.35);
        messages.push(m.name + 'は レベル' + m.level + 'に あがった!');
        // 定石どおりで、上がった項目は1つずつ送る。
        // 7項目を1行に詰めると、何が伸びたのか読み取れないまま流れてしまう。
        [['さいだいHP', g.hp], ['さいだいMP', m.maxMp > 0 ? g.mp : 0],
         ['ちから', g.atk], ['みのまもり', g.def], ['すばやさ', g.spd],
         ['まりょく', g.mag], ['うんのよさ', g.luck]]
          .filter(function (p) { return p[1] > 0; })
          .forEach(function (p) { messages.push(p[0] + 'が ' + p[1] + ' あがった!'); });
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

  // 売値は買値の半額(当時のRPG の慣例)。物語上の装備は売れない。
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
  // その部位が呪われていないか。呪われた品は自分では外せない。
  function cursedAt(m, slot) {
    var def = m && m.equip[slot] ? Game.Data.Equipment[m.equip[slot]] : null;
    return def && def.cursed ? def : null;
  }
  // 呪われている者と、その部位を並べる(教会が使う)
  function cursedList() {
    var out = [];
    list().forEach(function (m) {
      Game.Data.EQUIP_SLOTS.forEach(function (slot) {
        var def = cursedAt(m, slot);
        if (def) out.push({ member: m, slot: slot, def: def });
      });
    });
    return out;
  }
  // 教会で呪いを解く。解いた品は朽ちて消える(手元には残らない)
  function liftCurse(memberId, slot) {
    var m = members[memberId];
    if (!cursedAt(m, slot)) return false;
    m.equip[slot] = null;
    recalc(m);
    return true;
  }

  function equipGear(memberId, gearId) {
    var m = members[memberId];
    var def = Game.Data.Equipment[gearId];
    if (!m || !def || !canEquip(m, gearId)) return false;
    if (cursedAt(m, def.slot)) return false;   // 呪われた品の上には着けられない
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
    if (cursedAt(m, slot)) return false;   // 自分では外せない
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
      ensureJobFields(m);
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
    traitsOf: traitsOf,
    init: init, recruit: recruit, restAll: restAll, reviveFallen: reviveFallen, revive: revive,
    list: list, aliveList: aliveList, deadList: deadList, get: get,
    isWiped: isWiped, addExp: addExp, learnedSkills: learnedSkills,
    jobOf: jobDef, jobStar: jobStar, jobBattles: jobBattles, battlesToNextStar: battlesToNextStar,
    jobLockReason: jobLockReason, changeJob: changeJob, countJobBattle: countJobBattle, jobCritRate: jobCritRate,
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
    cursedAt: cursedAt, cursedList: cursedList, liftCurse: liftCurse,
    grantGear: grantGear, grantItem: grantItem,
    moveMember: moveMember,
    tactic: function () { return tactic; },
    setTactic: function (id) { tactic = Game.Data.tacticOf(id).id; },
    serialize: serialize, deserialize: deserialize,
  };
})();
