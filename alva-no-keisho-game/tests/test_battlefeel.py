# -*- coding: utf-8 -*-
u"""戦闘の手ざわり:ダメージ式・0か1とミス・行動順の入れ替わり・変更前との差"""
from playwright.sync_api import sync_playwright
from common import Checks, launch, ev, new_game, log_dialogue, URL

c = Checks()
with sync_playwright() as p:
    b, pg = launch(p, c)
    pg.goto(URL); pg.wait_for_timeout(800)

    print(u"[ダメージの式]")
    r = ev(pg, """() => { var a=[]; for (var i=0;i<4000;i++) a.push(Game.Battle.__damageOf(40,20));
        return [Math.min.apply(null,a), Math.max.apply(null,a), a.reduce(function(s,x){return s+x;},0)/a.length]; }""")
    # 40÷2 − 20÷4 = 15 → ×2 = 30 → 7/8〜9/8 で 26.25〜33.75 → 切り捨てて 26〜33
    c.check(u"攻40・守20 は 26〜33、平均およそ30", r[0] >= 26 and r[1] <= 33 and 29 < r[2] < 31, r)
    r = ev(pg, """() => { var a=[]; for (var i=0;i<4000;i++) a.push(Game.Battle.__damageOf(40,20,1.8));
        return a.reduce(function(s,x){return s+x;},0)/a.length; }""")
    c.check(u"魔物→仲間の倍率1.8なら 平均およそ27", 26 < r < 28, round(r, 2))
    r = ev(pg, """() => { var z=0,o=0,x=0; for (var i=0;i<4000;i++){ var d=Game.Battle.__damageOf(10,40); if(d===0)z++; else if(d===1)o++; else x++; } return [z,o,x]; }""")
    c.check(u"歯が立たない(攻10・守40)と 0か1だけ、およそ半々", r[2] == 0 and 0.4 < r[0] / 4000.0 < 0.6, r)

    print(u"[行動順]")
    r = ev(pg, """() => { var n=0; for (var i=0;i<20000;i++) if (Game.Battle.__initiative(10) > Game.Battle.__initiative(20)) n++; return n/20000; }""")
    c.check(u"すばやさが倍(10と20)でも、遅いほうが先に動くことがある", 0.05 < r < 0.45, round(r, 3))
    c.check(u"それでも速いほうが先のことが多い", r < 0.45)

    print(u"[ミス! の表示 ― 本物の戦闘で]")
    new_game(pg)
    ev(pg, "() => { var a = Game.Party.list()[0]; a.atk = 1; a.hp = a.maxHp = 999; a.def = 999; }")
    log_dialogue(pg)
    ev(pg, "() => Game.Field.__encounter(['ishi_no_bannin'])"); pg.wait_for_timeout(200)
    c.check(u"戦闘が始まる", ev(pg, "() => Game.Battle.isActive()"))
    for _ in range(260):
        if not ev(pg, "() => Game.Battle.isActive()"): break
        pg.keyboard.press("Enter"); pg.wait_for_timeout(35)
    log = ev(pg, "() => window.__log")
    miss = [l for l in log if u"ミス!" in l]
    print(u"  ミスの文:", miss[:2])
    c.check(u"攻撃力1で硬い相手を殴ると「ミス! 〜に ダメージを あたえられない!」が出る",
            any(u"ダメージを あたえられない" in l for l in miss))
    c.check(u"「0 の ダメージ」とは書かない", not any(u" 0 の ダメージ" in l for l in log))

    print(u"[変更の影響 ― 実際の魔物の数値で]")
    r = ev(pg, """() => {
      function oldDmg(a, d) { return Math.max(1, a - Math.floor(d * 0.6)); }
      function newDmg(a, d, s) { var dq = a/2 - d/4; return dq < 2 ? 0.5 : dq * (s || 2); }
      var party = Object.keys(Game.Data.Characters).map(function (k) { return Game.Data.Characters[k]; });
      var dealt = [], taken = [];
      Object.keys(Game.Data.Monsters).forEach(function (id) {
        var m = Game.Data.Monsters[id];
        party.forEach(function (c) {
          // その魔物の強さに合う程度に育った仲間を想定(格1ごとに Lv+3)
          var lv = (m.rank || 1) * 3, g = c.growth || {};
          var atk = c.atk + (g.atk || 0) * lv + 10, def = c.def + (g.def || 0) * lv + 8;
          var o1 = oldDmg(atk, m.def || 0), n1 = newDmg(atk, m.def || 0);
          var o2 = oldDmg(m.atk, def), n2 = newDmg(m.atk, def, 1.8);
          if (o1 > 1) dealt.push(n1 / o1);
          if (o2 > 1) taken.push(n2 / o2);
        });
      });
      function med(a) { a.sort(function(x,y){return x-y;}); return a[Math.floor(a.length/2)]; }
      return { dealt: med(dealt), taken: med(taken) };
    }""")
    print(u"  新しい式 ÷ 古い式 の中央値:", r)
    c.check(u"与えるダメージの変化は ±15% 以内", 0.85 <= r["dealt"] <= 1.15, r["dealt"])
    c.check(u"受けるダメージの変化は ±15% 以内", 0.85 <= r["taken"] <= 1.15, r["taken"])
    b.close()
c.finish()
