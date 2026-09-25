# -*- coding: utf-8 -*-
u"""職業と習熟★:倍率・レベルアップ・★と技・技の引き継ぎ・修行の上限・上級職・会心・保存・さだめの祠"""
from playwright.sync_api import sync_playwright
from common import Checks, launch, ev, skip_dialogue, new_game, log_dialogue

c = Checks()
with sync_playwright() as p:
    b, pg = launch(p, c)
    new_game(pg)

    print(u"[データ]")
    r = ev(pg, """() => {
      var bad = [];
      Game.Data.JOB_ORDER.forEach(function (id) {
        var j = Game.Data.Jobs[id];
        if (!j) { bad.push('no job ' + id); return; }
        j.skills.forEach(function (s) { if (!Game.Data.Skills[s.id]) bad.push(id + ':' + s.id); });
      });
      Object.keys(Game.Data.Jobs).forEach(function (id) { if (Game.Data.JOB_ORDER.indexOf(id) < 0) bad.push('order ' + id); });
      return bad; }""")
    c.check(u"職の技は すべて 技の表にある / 並びに抜けがない", not r, r)

    print(u"[倍率]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      var before = { atk: a.atk, def: a.def, spd: a.spd, mag: a.mag, luck: a.luck, maxHp: a.maxHp, maxMp: a.maxMp };
      var gearAtk = a.atk - a.baseAtk;
      Game.Party.changeJob('alva', 'tsurugi');
      var t = { atk: a.atk, spd: a.spd, luck: a.luck, maxHp: a.maxHp, maxMp: a.maxMp,
                expAtk: Math.floor(a.baseAtk * 1.1) + gearAtk, expHp: Math.floor(a.rawMaxHp * 1.1),
                expMp: Math.max(1, Math.floor(a.rawMaxMp * 0.4)) };
      Game.Party.changeJob('alva', 'arinomama');
      var back = { atk: a.atk, def: a.def, spd: a.spd, mag: a.mag, luck: a.luck, maxHp: a.maxHp, maxMp: a.maxMp };
      return { before: before, t: t, back: back }; }""")
    t = r["t"]
    c.check(u"つるぎ士: こうげき = 素の値×1.1(切り捨て)+装備", t["atk"] == t["expAtk"], (t["atk"], t["expAtk"]))
    c.check(u"つるぎ士: 最大HP ×1.1、最大MP ×0.4", t["maxHp"] == t["expHp"] and t["maxMp"] == t["expMp"], t)
    c.check(u"つるぎ士: すばやさは下がり、うんのよさは そのまま", t["spd"] < r["before"]["spd"] and t["luck"] == r["before"]["luck"])
    c.check(u"ありのままに戻すと 数値が もとどおり", r["back"] == r["before"], (r["before"], r["back"]))

    print(u"[職に就いたまま レベルが上がる]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      Game.Party.changeJob('alva', 'majinai');
      a.hp = a.maxHp;
      Game.Party.addExp(5000);
      var ok = a.maxHp === Math.max(1, Math.floor(a.rawMaxHp * 0.6)) && a.hp <= a.maxHp;
      Game.Party.changeJob('alva', 'arinomama');
      return { ok: ok, lv: a.level, raw: a.rawMaxHp, max: a.maxHp, hp: a.hp }; }""")
    c.check(u"伸びるのは生の値。まじない師のあいだは その ×0.6 が最大HP", r["ok"], r)
    c.check(u"ありのままに戻ると 最大HPは 生の値", r["max"] == r["raw"], r)

    print(u"[★と技]")
    ev(pg, "() => { Game.Party.list().forEach(function (m) { m.level = 5; }); }")
    r = ev(pg, """() => {
      Game.Party.changeJob('alva', 'tsurugi');
      var msgs = [];
      for (var i = 0; i < 4; i++) msgs = msgs.concat(Game.Party.countJobBattle(3));
      var a = Game.Party.get('alva');
      var has = Game.Party.learnedSkills(a).some(function (s) { return s.id === 'makko_giri'; });
      Game.Party.changeJob('alva', 'majinai');
      var kept = Game.Party.learnedSkills(a).some(function (s) { return s.id === 'makko_giri'; });
      return { star: Game.Party.jobStar(a, 'tsurugi'), msgs: msgs, has: has, kept: kept,
               left: Game.Party.battlesToNextStar(a, 'tsurugi') }; }""")
    print(u"   ", r["msgs"])
    c.check(u"4戦で ★2", r["star"] == 2, r["star"])
    c.check(u"★が上がった知らせと、覚えた技の知らせが出る",
            any(u"★2に あがった" in m for m in r["msgs"]) and any(u"まっこう斬りを おぼえた" in m for m in r["msgs"]), r["msgs"])
    c.check(u"まっこう斬りを使える", r["has"])
    c.check(u"まじない師に変えても まっこう斬りは 残る", r["kept"])
    c.check(u"つぎの★(★3=9戦)まで あと5戦", r["left"] == 5, r["left"])

    print(u"[修行の上限]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      var before = Game.Party.jobBattles(a, 'majinai');
      a.level = 40;
      var msgs = Game.Party.countJobBattle(1);
      var after = Game.Party.jobBattles(a, 'majinai');
      a.level = 5;
      return { before: before, after: after, msgs: msgs }; }""")
    c.check(u"弱すぎる相手では 数えず、「修行に ならない」と出る",
            r["before"] == r["after"] and any(u"修行に ならない" in m for m in r["msgs"]), r)

    print(u"[上級職]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      var lockedAtFirst = !!Game.Party.jobLockReason(a, 'mahoroba');
      var refused = !Game.Party.changeJob('alva', 'mahoroba');
      Game.Party.changeJob('alva', 'tsurugi'); for (var i = 0; i < 30; i++) Game.Party.countJobBattle(5);
      var stillLocked = !!Game.Party.jobLockReason(a, 'mahoroba');
      Game.Party.changeJob('alva', 'majinai'); for (var j = 0; j < 30; j++) Game.Party.countJobBattle(5);
      var open = !Game.Party.jobLockReason(a, 'mahoroba');
      var took = Game.Party.changeJob('alva', 'mahoroba');
      return { lockedAtFirst: lockedAtFirst, refused: refused, stillLocked: stillLocked, open: open, took: took,
               reason: Game.Party.jobLockReason(Game.Party.get('alva'), 'arinomama') }; }""")
    c.check(u"はじめは まほろば剣士に 就けない", r["lockedAtFirst"] and r["refused"])
    c.check(u"つるぎ士だけ ★5 では まだ", r["stillLocked"])
    c.check(u"つるぎ士と まじない師を ★5 で 就ける", r["open"] and r["took"])

    print(u"[こぶし士の会心]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      Game.Party.changeJob('alva', 'kobushi');
      var at1 = Game.Party.jobCritRate(a);
      for (var i = 0; i < 9; i++) Game.Party.countJobBattle(5);
      var at3 = Game.Party.jobCritRate(a);
      Game.Party.changeJob('alva', 'tsurugi');
      var other = Game.Party.jobCritRate(a);
      return [at1, at3, other]; }""")
    c.check(u"★1では なし、★3から 1/16、職を離れると 働かない", r == [0, 1 / 16.0, 0], r)

    print(u"[保存と読み込み]")
    r = ev(pg, """() => {
      var a = Game.Party.get('alva');
      var before = JSON.stringify([a.job, a.jobs, a.atk, a.maxHp, a.maxMp, Game.Party.learnedSkills(a).length]);
      var data = JSON.parse(JSON.stringify(Game.Party.serialize()));
      Game.Party.init();
      Game.Party.deserialize(data);
      a = Game.Party.get('alva');
      var after = JSON.stringify([a.job, a.jobs, a.atk, a.maxHp, a.maxMp, Game.Party.learnedSkills(a).length]);
      // 職の入っていない 古いセーブ
      var old = JSON.parse(JSON.stringify(data));
      delete old.members.alva.job; delete old.members.alva.jobs; delete old.members.alva.rawMaxHp; delete old.members.alva.rawMaxMp;
      Game.Party.deserialize(old);
      var o = Game.Party.get('alva');
      return { same: before === after, before: before, after: after,
               old: [o.job, o.rawMaxHp === o.maxHp] }; }""")
    c.check(u"職・職ごとの戦闘回数・数値が 保存をまたいで 残る", r["same"], (r["before"], r["after"]))
    c.check(u"職の無い古いセーブは ありのままで 読める", r["old"] == ["arinomama", True], r["old"])

    print(u"[さだめの祠 ― 学院都市で 歩いて入る]")
    ev(pg, "() => { Game.Party.init(); }")
    skip_dialogue(pg)
    ev(pg, "() => { Game.Field.enterFrom('selmaria_town'); Game.Field.setPosition(17, 1); }")
    pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(250); pg.keyboard.up("ArrowRight"); pg.wait_for_timeout(200)
    c.check(u"祠のマスを踏むと 祠が開く", ev(pg, "() => Game.Shop.isOpen()"),
            ev(pg, "() => [Game.Field.playerPos().x, Game.Field.playerPos().y]"))
    skip_dialogue(pg)
    log_dialogue(pg)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(100)          # アルヴァを選ぶ
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(60)       # ありのまま → つるぎ士
    pg.screenshot(path="/tmp/alva_shrine.png")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
    skip_dialogue(pg)
    job = ev(pg, "() => Game.Party.get('alva').job")
    c.check(u"祠で つるぎ士に なれる", job == "tsurugi", job)
    c.check(u"「アルヴァは つるぎ士に なった!」と出る", any(u"つるぎ士に なった" in l for l in ev(pg, "() => window.__log")))
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(40)
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(40)
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(40)
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(40)       # まほろば剣士
    pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
    log = ev(pg, "() => window.__log")
    c.check(u"まほろば剣士は 条件を告げて 断られる", ev(pg, "() => Game.Party.get('alva').job") == "tsurugi"
            and any(u"極めねば" in l for l in log), log[-1:])
    skip_dialogue(pg)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(60)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(60)
    c.check(u"X で 祠を出られる", not ev(pg, "() => Game.Shop.isOpen()"))

    print(u"[本物の戦闘で ★が数えられる]")
    started = 0
    for _ in range(4):
        ev(pg, "() => { var a = Game.Party.get('alva'); a.atk = 999; a.def = 999; a.hp = a.maxHp; }")
        ev(pg, "() => Game.Field.__encounter(['ishi_no_bannin'])"); pg.wait_for_timeout(150)
        started += 1 if ev(pg, "() => Game.Battle.isActive()") else 0
        quiet = 0
        for _ in range(300):
            busy = ev(pg, "() => Game.Battle.isActive() || Game.Dialogue.isActive()")
            quiet = 0 if busy else quiet + 1
            if quiet >= 5: break
            pg.keyboard.press("Enter"); pg.wait_for_timeout(35)
    print(u"   始まった戦い:", started)
    r = ev(pg, "() => [Game.Party.jobBattles(Game.Party.get('alva'), 'tsurugi'), Game.Party.jobStar(Game.Party.get('alva'), 'tsurugi')]")
    c.check(u"4回勝って ★2(つるぎ士)", r == [4, 2], r)
    log = ev(pg, "() => window.__log")
    c.check(u"戦いのあとに ★の知らせが出る", any(u"熟練度が ★2" in l for l in log))

    print(u"[メニューの表示]")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(80)
    pg.screenshot(path="/tmp/alva_job_menu.png")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(60); pg.keyboard.press("Enter"); pg.wait_for_timeout(80)
    pg.screenshot(path="/tmp/alva_job_strength.png")
    pg.keyboard.press("Escape"); pg.keyboard.press("Escape"); pg.keyboard.press("Escape"); pg.wait_for_timeout(60)
    b.close()
c.finish()
