# -*- coding: utf-8 -*-
u"""ブラウザ検証の共通部品。

ゲームの置き場で `python3 -m http.server 8794` を立ててから走らせる。
  ALVA_URL     … 開くページ(既定 http://127.0.0.1:8794/index.html)
  ALVA_CHROME  … 使うChromium(既定は この環境に入っているもの。無ければ playwright の既定)
"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get("ALVA_URL", "http://127.0.0.1:8794/index.html")
CHROME = os.environ.get("ALVA_CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")


class Checks(object):
    def __init__(self):
        self.ok = []
        self.errs = []

    def check(self, label, cond, detail=""):
        print((u"  OK  " if cond else u"  NG  ") + label + (u"  " + str(detail) if detail != "" else u""))
        self.ok.append(bool(cond))

    def finish(self):
        print(u"\nエラー:", self.errs if self.errs else u"なし")
        print(u"\n%d / %d 通過" % (sum(self.ok), len(self.ok)))
        if not all(self.ok) or self.errs:
            raise SystemExit(1)


def launch(p, checks=None):
    kw = {"executable_path": CHROME} if os.path.exists(CHROME) else {}
    b = p.chromium.launch(**kw)
    pg = b.new_page(viewport={"width": 700, "height": 620})
    if checks is not None:
        pg.on("pageerror", lambda e: checks.errs.append(str(e)))
    return b, pg


def ev(pg, js, arg=None):
    return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)


def skip_dialogue(pg, limit=200):
    for _ in range(limit):
        if not ev(pg, "() => Game.Dialogue.isActive()"):
            return
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(40)


def new_game(pg):
    u"""セーブを消して はじめから。序章の最初の会話を送り終えたところで返す"""
    pg.goto(URL)
    pg.wait_for_timeout(600)
    ev(pg, "() => { try { localStorage.clear(); } catch (e) {} }")
    pg.reload()
    pg.wait_for_timeout(400)
    pg.locator("#game-canvas").click()
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(500)
    skip_dialogue(pg)


def log_dialogue(pg):
    u"""以後に出た文を window.__log に ためる"""
    ev(pg, """() => { window.__log = []; var orig = Game.Dialogue.show;
        Game.Dialogue.show = function (t, cb) { window.__log.push(String(t)); return orig.call(Game.Dialogue, t, cb); }; }""")
