# -*- coding: utf-8 -*-
u"""仲間との会話:メニューの「はなす」、場面ごとの台詞、倒れた仲間、台本データの抜け"""
from playwright.sync_api import sync_playwright
from common import Checks, launch, ev, skip_dialogue, new_game, log_dialogue

c = Checks()
with sync_playwright() as p:
    b, pg = launch(p, c)
    new_game(pg)
    log_dialogue(pg)

    print(u"[メニューから はなす ― ひとりのとき]")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(80)
    c.check(u"メニューが開く", ev(pg, "() => Game.Menu.isOpen()"))
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(60)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(120)
    log = ev(pg, "() => window.__log")
    c.check(u"↑ ひとつで はなす に届き、メニューが閉じて 台詞が出る",
            not ev(pg, "() => Game.Menu.isOpen()") and len(log) > 0, log[-1:])
    c.check(u"序章はひとり → アルヴァの胸の内(かっこ書き)",
            bool(log) and log[-1].startswith(u"(") and u"城" in log[-1], log[-1:])
    skip_dialogue(pg)

    print(u"[仲間がいるとき]")
    ev(pg, "() => { Game.Party.recruit('elrode'); Game.Party.recruit('celestia'); Game.Party.recruit('balga'); }")
    lines = ev(pg, "() => Game.Story.__chatLines()")
    print(u"   ", lines)
    c.check(u"仲間3人が ひとことずつ(アルヴァは話さない)",
            len(lines) == 3 and not any(l.startswith(u"アルヴァ") for l in lines))
    c.check(u"呼び名は「バルガ「…」」(将軍は つけない)", any(l.startswith(u"バルガ「") for l in lines))
    ev(pg, "() => { Game.Party.get('celestia').hp = 0; }")
    lines = ev(pg, "() => Game.Story.__chatLines()")
    c.check(u"倒れた仲間は 話さない", len(lines) == 2 and not any(l.startswith(u"セレスティア") for l in lines))
    ev(pg, "() => { Game.Party.list().forEach(function(m){ m.hp = 0; }); Game.Party.get('alva').hp = 5; }")
    lines = ev(pg, "() => Game.Story.__chatLines()")
    c.check(u"みな倒れていれば アルヴァの胸の内", len(lines) == 1 and lines[0].startswith(u"("))
    ev(pg, "() => { Game.Party.list().forEach(function(m){ m.hp = m.maxHp; }); }")

    print(u"[場面で 台詞が変わる]")
    here = ev(pg, "() => Game.Field.currentMap().id")
    first = ev(pg, "() => Game.Story.__chatLines()")
    ev(pg, "() => Game.Field.returnToWorld()"); pg.wait_for_timeout(100)
    there = ev(pg, "() => Game.Field.currentMap().id")
    second = ev(pg, "() => Game.Story.__chatLines()")
    c.check(u"城(%s)と 大陸(%s)で 台詞が ちがう" % (here, there), there == "world" and first != second, second[:1])

    print(u"[台本データの抜け]")
    r = ev(pg, """() => {
      var C = Game.Data.PartyChat, miss = [], flags = {}, badFlag = [];
      Game.Data.Chapters.forEach(function (ch, ci) {
        ch.stages.forEach(function (st, si) {
          if (!C.stages[ci + '-' + si]) miss.push(ci + '-' + si);
          [].concat(st.afterClear || []).forEach(function (q) {
            (q.options || []).forEach(function (o) { flags[o.flag] = 1; });
          });
        });
      });
      var extra = Object.keys(C.stages).filter(function (k) {
        var a = k.split('-'), ch = Game.Data.Chapters[+a[0]]; return !ch || !ch.stages[+a[1]]; });
      Object.keys(C.stages).forEach(function (k) { Object.keys(C.stages[k]).forEach(function (id) {
        var e = C.stages[k][id];
        ((e && e['if']) || []).forEach(function (r) { if (!flags[r.flag]) badFlag.push(k + ':' + r.flag); }); }); });
      return { miss: miss, extra: extra, badFlag: badFlag };
    }""")
    c.check(u"どの段にも 台詞がある", not r["miss"], r["miss"])
    c.check(u"存在しない段の台詞は無い", not r["extra"], r["extra"])
    c.check(u"分かれ道の旗の名が 実在する", not r["badFlag"], r["badFlag"])

    print(u"[4人のメニューで はなす の行が 下の案内より上にある]")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(80); pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(60)
    pg.screenshot(path="/tmp/alva_chat_menu.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(60)
    b.close()
c.finish()
