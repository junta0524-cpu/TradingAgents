# -*- coding: utf-8 -*-
u"""通し試験 ― 序章から終章まで、キー操作だけで歩いて 物語を最後まで進める。

・移動は矢印キーを押し続けて1マスずつ(Shift でダッシュ)。道は BFS で探す
・人には 隣に立って向き直り、決定キーで話す
・「魔物を あと N体」は、その段で戦ってよい場所(段の舞台、大陸を行く段なら大陸)でだけ、
  そこの出現表から ふつうの遭遇と同じ道筋で戦いを起こして片づける
・仲間は倒れないよう 数値を底上げする(ここで見たいのは 進行が詰まらないこと)
・関係のない入口・出口・ボス床・店は 踏まない

詰まったら その時点の様子を出して 失敗で終わる。
"""
import sys, time
from collections import deque
from playwright.sync_api import sync_playwright
from common import Checks, launch, ev, new_game

KEY = {"up": "ArrowUp", "down": "ArrowDown", "left": "ArrowLeft", "right": "ArrowRight"}
DXY = {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}
SHOPS = set("SWIHP")
MAX_SECONDS = 2100

c = Checks()


def state(pg):
    return ev(pg, """() => {
      var S = Game.Story.__state(), st = S.stage, m = Game.Field.currentMap(), p = Game.Field.playerPos();
      return {
        finished: Game.Story.isFinished(), title: Game.Story.currentTitle(),
        dialogue: Game.Dialogue.isActive(), choice: Game.Choice.isOpen(),
        battle: Game.Battle.isActive(), shop: Game.Shop.isOpen(), menu: Game.Menu.isOpen(),
        map: m && m.id, x: p.x, y: p.y, tiles: m && m.tiles,
        npcAt: (m && m.npcAt) || {}, entranceAt: (m && m.entranceAt) || {},
        stage: st ? { map: st.map, type: st.type, to: st.to || null } : null,
        talk: st ? Game.Story.__needTalk() : [], defeat: st ? Game.Story.__needDefeat() : 0,
        light: st ? Game.Story.__needLight() : 0,
        table: Game.Field.__table() || null, moonFull: Game.Moon.isFull(),
        goal: Game.Story.currentGoal(),
      };
    }""")


def god(pg):
    ev(pg, """() => { Game.Party.list().forEach(function (m) {
      m.maxHp = Math.max(m.maxHp, 999); m.hp = m.maxHp; m.maxMp = Math.max(m.maxMp, 99); m.mp = m.maxMp;
      m.atk = 999; m.def = 999; m.spd = 999; m.status = null; }); }""")


def walkable(s, x, y, targets, shops_ok=False):
    tiles = s["tiles"]
    if y < 0 or y >= len(tiles) or x < 0 or x >= len(tiles[y]):
        return False
    t = tiles[y][x]
    if (x, y) in targets:
        return True
    if t in "#XY~^NK":
        return False
    if t in "ECB":
        return False      # 目当てでない 入口・出口・ボス床は 踏まない
    if t in SHOPS and not shops_ok:
        return False
    if t == "O" and not s["moonFull"]:
        return False
    return True


def bfs(s, goals, targets, shops_ok=False):
    start = (s["x"], s["y"])
    goals = set(goals)
    if start in goals:
        return []
    prev = {start: None}
    q = deque([start])
    while q:
        cur = q.popleft()
        for d, (dx, dy) in DXY.items():
            nx, ny = cur[0] + dx, cur[1] + dy
            if (nx, ny) in prev or not walkable(s, nx, ny, targets, shops_ok):
                continue
            prev[(nx, ny)] = (cur, d)
            if (nx, ny) in goals:
                path, node = [], (nx, ny)
                while prev[node]:
                    node, dd = prev[node][0], prev[node][1]
                    path.append(dd)
                return path[::-1]
            q.append((nx, ny))
    return None


def tiles_of(s, chars):
    out = []
    for y, row in enumerate(s["tiles"]):
        for x, t in enumerate(row):
            if t in chars:
                out.append((x, y))
    return out


def step(pg, d):
    before = ev(pg, "() => { var p = Game.Field.playerPos(); return [p.x, p.y]; }")
    pg.keyboard.down("Shift")
    pg.keyboard.down(KEY[d])
    for _ in range(30):
        pg.wait_for_timeout(15)
        now = ev(pg, """() => { var p = Game.Field.playerPos();
          return [p.x, p.y, Game.Dialogue.isActive() || Game.Battle.isActive() || Game.Shop.isOpen() || Game.Choice.isOpen()]; }""")
        if now[:2] != before or now[2]:
            break
    pg.keyboard.up(KEY[d])
    pg.keyboard.up("Shift")
    pg.wait_for_timeout(30)


def face_and_talk(pg, d):
    # 人に向かって押すと その場で振り向く。向いたら 決定キー
    pg.keyboard.press(KEY[d])
    pg.wait_for_timeout(120)
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(120)


def fight_here(pg):
    ev(pg, """() => { var t = Game.Data.EncounterTables[Game.Field.__table()];
      if (t && t.length) Game.Field.__encounter([t[0].id]); }""")
    pg.wait_for_timeout(100)


def where_npc(s, npc_id):
    for k, v in s["npcAt"].items():
        if v == npc_id:
            x, y = k.split(",")
            return int(x), int(y)
    return None


def entrance_of(s_world, map_id):
    for k, v in s_world["entranceAt"].items():
        if v.get("to") == map_id:
            x, y = k.split(",")
            return int(x), int(y)
    return None


def plan(pg, s):
    u"""いま何を目指すか。(目的地の集合, 踏んでよい特別なマス, 着いたらすること) を返す"""
    st = s["stage"]
    here = s["map"]
    if st is None:
        return None
    exits = set(tiles_of(s, "C"))
    # 大陸を行く段
    if st["type"] == "travel":
        if here != "world":
            return exits, exits, None
        if s["defeat"] > 0 and s["table"]:
            return "fight", None, None
        e = entrance_of(s, st["to"])
        return {e}, {e}, None
    # 段の舞台の外
    if here != st["map"]:
        if here == "world":
            e = entrance_of(s, st["map"])
            return {e}, {e}, None
        return exits, exits, None
    # 段の舞台の中
    if s["talk"]:
        for npc in s["talk"]:
            pos = where_npc(s, npc)
            if not pos:
                continue
            goals = {}
            for d, (dx, dy) in DXY.items():
                # 人の隣の マスから、人のほうを向く
                goals[(pos[0] - dx, pos[1] - dy)] = d
            return set(goals), set(), ("talk", goals)
        return None
    if s["light"] > 0:
        lights = set(tiles_of(s, "L"))
        return lights, lights, None
    if s["defeat"] > 0:
        return "fight", None, None
    if st["type"] == "boss":
        b = set(tiles_of(s, "B"))
        return b, b, None
    return exits, exits, None


def main():
    t0 = time.time()
    with sync_playwright() as p:
        b, pg = launch(p, c)
        new_game(pg)
        # 道中の遭遇は切る。戦いは 段が求めるぶんだけ こちらから起こす
        ev(pg, "() => { Game.Settings.encounterScale = function () { return 0; }; }")
        titles, last_title = [], None
        stall, last_sig, n = 0, None, 0
        finished = False
        while True:
            n += 1
            if time.time() - t0 > MAX_SECONDS:
                c.check(u"時間内に 終わる", False, u"%d秒" % MAX_SECONDS)
                break
            s = state(pg)
            if s["title"] != last_title:
                last_title = s["title"]
                if s["title"]:
                    titles.append(s["title"])
                    print(u"[%4d] %s" % (n, s["title"]))
                    sys.stdout.flush()
            if s["finished"]:
                finished = True
                break
            if s["dialogue"] or s["choice"] or s["battle"]:
                pg.keyboard.press("Enter")
                pg.wait_for_timeout(35)
                continue
            if s["shop"] or s["menu"]:
                pg.keyboard.press("Escape")
                pg.wait_for_timeout(60)
                continue
            god(pg)
            sig = (s["title"], s["map"], s["x"], s["y"], len(s["talk"]), s["defeat"], s["light"], s["stage"] and s["stage"]["map"])
            stall = stall + 1 if sig == last_sig else 0
            last_sig = sig
            if stall > 40:
                c.check(u"詰まらない", False, u"%s @%s(%d,%d) 目的=%s" % (s["title"], s["map"], s["x"], s["y"], s["goal"]))
                pg.screenshot(path="/tmp/alva_autopilot_stall.png")
                break
            pl = plan(pg, s)
            if pl is None:
                pg.keyboard.press("Enter")
                pg.wait_for_timeout(60)
                continue
            goals, targets, action = pl
            if goals == "fight":
                fight_here(pg)
                continue
            if action and action[0] == "talk" and (s["x"], s["y"]) in action[1]:
                face_and_talk(pg, action[1][(s["x"], s["y"])])
                continue
            path = bfs(s, goals, targets or set())
            if path is None:
                # 店の前を 通るしかない町もある。踏めば店が開くが、閉じて先へ行く
                path = bfs(s, goals, targets or set(), shops_ok=True)
            if path is None:
                c.check(u"目的地へ 道がある", False, u"%s @%s(%d,%d) 目的=%s" % (s["title"], s["map"], s["x"], s["y"], s["goal"]))
                pg.screenshot(path="/tmp/alva_autopilot_nopath.png")
                break
            if not path:
                # 目的のマスに立っているのに 何も起きない ―― 一歩出て 踏み直す
                for d in DXY:
                    dx, dy = DXY[d]
                    if walkable(s, s["x"] + dx, s["y"] + dy, set()):
                        step(pg, d)
                        break
                continue
            step(pg, path[0])
        b.close()
        print(u"\n通った章: %d" % len(titles))
        c.check(u"物語を 最後まで 進められた", finished and ev_finished(titles))
        c.check(u"序章から終章まで 16章すべてを 通った", len([t for t in titles if u"章" in t]) >= 16, len(titles))
        print(u"所要: %d秒" % (time.time() - t0))
    c.finish()


def ev_finished(titles):
    return any(u"終章" in t for t in titles)


if __name__ == "__main__":
    main()
