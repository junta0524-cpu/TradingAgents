# -*- coding: utf-8 -*-
u"""大陸をひとつ作る ― 「大陸図」の配置を、そのまま歩ける地形に落とす。

手で64×48の絵を打つと、直したいたびに全部数え直すことになるので、
ここで組み立てて js/data/world.js に書き出す。乱数は種を固定してあるので、
何度走らせても同じ大陸が出る。

地形:
  ~ 海   ^ 山   # 深い森(通れない)   , 森(通れる・よく出る)
  . 草原   = 街道(あまり出ない)   _ 荒地
拠点は大陸図どおり ―― タルドームを真ん中に、東へヴァルデリア、
北へセルマリア、西へシルヴァブルクの三方へ道が伸びる。
"""
import io, math, os, random

W, H = 64, 48
SEA, MOUNT, THICKET, FOREST, PLAIN, ROAD, WASTE = '~', '^', '#', ',', '.', '=', '_'

rnd = random.Random(20260925)   # 種を固定。同じ大陸が何度でも出る

grid = [[SEA] * W for _ in range(H)]

# ---- 1. 大陸の輪郭 ----
# いくつかの塊を重ねて、ひとつづきの陸地にする。
# 端に少しゆらぎを足して、定規で引いたような海岸線にしない。
BLOBS = [
    (32, 26, 22, 15),   # 中央(タルドーム一帯)
    (49, 22, 13, 10),   # 東(ヴァルデリア)
    (34, 10, 14, 10),   # 北(セルマリア・蒼穹平原)
    (13, 25, 11, 10),   # 西(シルヴァブルク)
    (9,  34,  8,  8),   # 南西(断崖・氏族村)
    (42, 33, 10,  7),   # 南東(湿地帯)
]
noise = [[rnd.random() for _ in range(W)] for _ in range(H)]
for y in range(H):
    for x in range(W):
        v = -9.0     # どの塊からも遠ければ海。0 から始めると全面が陸になる
        for (cx, cy, rx, ry) in BLOBS:
            d = ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2
            v = max(v, 1.0 - d)
        if v + (noise[y][x] - 0.5) * 0.5 > 0:
            grid[y][x] = PLAIN

# 海岸をならす。まわり9マスのうち5マス以上が陸なら陸、そうでなければ海。
# これを数回かけると、ぽつぽつした岩礁が消えて、線としての海岸になる。
def smooth(times):
    global grid
    for _ in range(times):
        nxt = [row[:] for row in grid]
        for y in range(H):
            for x in range(W):
                n = 0
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        gx, gy = x + dx, y + dy
                        if 0 <= gx < W and 0 <= gy < H:
                            if grid[gy][gx] != SEA: n += 1
                        else:
                            n += 0   # 画面の外は海あつかい
                nxt[y][x] = PLAIN if n >= 5 else SEA
        grid = nxt
smooth(4)

# いちばん大きな陸だけ残す。離れ小島があると、行けない場所が生まれる
def keep_largest_land():
    seen = [[False] * W for _ in range(H)]
    best = []
    for y0 in range(H):
        for x0 in range(W):
            if seen[y0][x0] or grid[y0][x0] == SEA: continue
            comp, q = [], [(x0, y0)]
            seen[y0][x0] = True
            while q:
                x, y = q.pop()
                comp.append((x, y))
                for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                    gx, gy = x + dx, y + dy
                    if 0 <= gx < W and 0 <= gy < H and not seen[gy][gx] and grid[gy][gx] != SEA:
                        seen[gy][gx] = True; q.append((gx, gy))
            if len(comp) > len(best): best = comp
    keep = set(best)
    for y in range(H):
        for x in range(W):
            if grid[y][x] != SEA and (x, y) not in keep:
                grid[y][x] = SEA
    return len(best)
keep_largest_land()

# ---- 2. 山脈 ----
# 三方の道を「わざわざ回り込む」ものにするための仕切り。
def ridge(x0, y0, x1, y1, thick):
    steps = max(abs(x1 - x0), abs(y1 - y0))
    wob = 0
    for i in range(steps + 1):
        t = i / float(steps)
        # 定規で引いた壁にしないために、1マスぶんの揺らぎを持たせて蛇行させる
        wob += rnd.choice((-1, 0, 0, 1))
        wob = max(-2, min(2, wob))
        cx = int(round(x0 + (x1 - x0) * t))
        cy = int(round(y0 + (y1 - y0) * t)) + (wob if abs(x1 - x0) >= abs(y1 - y0) else 0)
        cx += (wob if abs(x1 - x0) < abs(y1 - y0) else 0)
        for dy in range(-thick, thick + 1):
            for dx in range(-thick, thick + 1):
                if abs(dx) + abs(dy) > thick + 1: continue
                x, y = cx + dx, cy + dy
                if 0 <= x < W and 0 <= y < H and grid[y][x] != SEA:
                    if rnd.random() < 0.82:
                        grid[y][x] = MOUNT

ridge(26, 18, 40, 17, 1)   # 中央と北を分ける尾根
ridge(22, 26, 22, 34, 1)   # 中央と西を分ける尾根
ridge(44, 20, 45, 30, 1)   # 中央と東を分ける尾根
ridge(14, 31, 20, 36, 1)   # 断崖

# ---- 3. 森 ----
def blob(cx, cy, r, ch, density):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r: continue
            x, y = cx + dx, cy + dy
            if 0 <= x < W and 0 <= y < H and grid[y][x] == PLAIN:
                if rnd.random() < density:
                    grid[y][x] = ch

for (cx, cy, r) in [(28, 30, 5), (38, 24, 4), (20, 22, 4), (46, 16, 4),
                    (33, 16, 3), (12, 29, 3), (52, 28, 4), (40, 36, 4)]:
    blob(cx, cy, r, FOREST, 0.72)
for (cx, cy, r) in [(30, 34, 3), (48, 12, 2), (17, 19, 2)]:
    blob(cx, cy, r, THICKET, 0.6)
for (cx, cy, r) in [(8, 36, 4), (44, 34, 4)]:
    blob(cx, cy, r, WASTE, 0.8)

# ---- 4. 拠点 ----
# 大陸図の配置そのまま。id はゲーム内のマップIDに合わせる。
# 記号は 城 / 街 / 村 / 塔 / 洞 / 陣 / 渦 で描き分ける。
# ぜんぶ「門」だと、大陸の上でどれが町でどれがダンジョンか分からない。
SITES = [
    ('tardome',                  32, 27, u'タルドーム',           u'城'),
    ('valderia_town',            51, 22, u'ヴァルデリア',         u'城'),
    ('selmaria_town',            34,  9, u'学院都市セルマリア',   u'街'),
    ('silvabruk_town',           12, 25, u'シルヴァブルク',       u'城'),
    ('cliff_village',             9, 34, u'断崖の氏族村',         u'村'),
    ('ogre_camp',                42, 27, u'はぐれオーガの野営地', u'陣'),
    ('azure_tower',              36,  4, u'蒼穹の塔',             u'塔'),
    ('academy_altar',            31, 12, u'学院地下祭壇',         u'洞'),
    ('abyss_depth',               6, 38, u'業の底',               u'洞'),
    ('forbidden_ritual_chamber', 38, 12, u'禁呪暴走空間',         u'渦'),
]

# 拠点の足もとは必ず陸にし、まわりを平らにならしておく
for (sid, x, y, name, glyph) in SITES:
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            gx, gy = x + dx, y + dy
            if 0 <= gx < W and 0 <= gy < H:
                grid[gy][gx] = PLAIN

# ---- 5. 街道 ----
# 拠点どうしを結ぶ。山は道のぶんだけ切り通す ―― 通れない大陸にしないため。
def leg(x, y, tx, ty):
    u"""横 → 縦 の順に1本ぶん引く。角がひとつできる"""
    while x != tx:
        x += 1 if tx > x else -1
        if grid[y][x] != ROAD: grid[y][x] = ROAD
    while y != ty:
        y += 1 if ty > y else -1
        if grid[y][x] != ROAD: grid[y][x] = ROAD
    return x, y

def carve(x0, y0, x1, y1):
    u"""拠点どうしを結ぶ。途中に揺らした中継点を挟んで、
    定規で引いたような一直線にしない ―― 地図は折れているほうが地図に見える。"""
    n = 2 if max(abs(x1 - x0), abs(y1 - y0)) > 12 else 1
    pts = []
    for i in range(1, n + 1):
        t = i / float(n + 1)
        mx = int(round(x0 + (x1 - x0) * t)) + rnd.randint(-3, 3)
        my = int(round(y0 + (y1 - y0) * t)) + rnd.randint(-3, 3)
        pts.append((max(1, min(W - 2, mx)), max(1, min(H - 2, my))))
    pts.append((x1, y1))
    x, y = x0, y0
    for (tx, ty) in pts:
        x, y = leg(x, y, tx, ty)

ROADS = [
    ('tardome', 'ogre_camp'), ('ogre_camp', 'valderia_town'),
    ('tardome', 'academy_altar'), ('academy_altar', 'selmaria_town'),
    ('selmaria_town', 'azure_tower'), ('selmaria_town', 'forbidden_ritual_chamber'),
    ('tardome', 'silvabruk_town'), ('silvabruk_town', 'cliff_village'),
    ('cliff_village', 'abyss_depth'),
]
pos = dict((s[0], (s[1], s[2])) for s in SITES)
for a, b in ROADS:
    carve(pos[a][0], pos[a][1], pos[b][0], pos[b][1])

# 道が海の上を通ってしまった場所は、橋ではなく陸にする(歩ける大陸にする)
# carve が SEA も ROAD に変えているので、その周りも陸として均す
for y in range(H):
    for x in range(W):
        if grid[y][x] != ROAD: continue
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                gx, gy = x + dx, y + dy
                if 0 <= gx < W and 0 <= gy < H and grid[gy][gx] == SEA:
                    grid[gy][gx] = PLAIN

# ---- 6. 拠点の入口を置く ----
SLOT = '0123456789'
entrances = {}
for i, (sid, x, y, name, glyph) in enumerate(SITES):
    grid[y][x] = SLOT[i]
    entrances[SLOT[i]] = {'to': sid, 'name': name, 'glyph': glyph}

# ---- 7. 地域。どの魔物が出るかは、既にある出現表をそのまま使う ----
REGIONS = [
    {'x': 24, 'y': 20, 'w': 22, 'h': 14, 'table': 'east_road',   'name': u'中原'},
    {'x': 40, 'y': 18, 'w': 24, 'h': 18, 'table': 'east_road',   'name': u'東方街道'},
    {'x': 24, 'y':  0, 'w': 24, 'h': 20, 'table': 'azure_plain', 'name': u'蒼穹平原'},
    {'x':  0, 'y': 18, 'w': 24, 'h': 30, 'table': 'cliff_road',  'name': u'断崖の道'},
]

# ---- 8. 検算: タルドームから すべての拠点へ歩いて行けるか ----
# 大陸がひとつでも、山や深い森で分断されていれば行けない拠点が出る。
# ここで気づかないと、通しプレイの途中で詰む。
BLOCK = (SEA, MOUNT, THICKET)
def reachable_from(sx, sy):
    seen = set([(sx, sy)])
    q = [(sx, sy)]
    while q:
        x, y = q.pop()
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            gx, gy = x + dx, y + dy
            if not (0 <= gx < W and 0 <= gy < H): continue
            if (gx, gy) in seen or grid[gy][gx] in BLOCK: continue
            seen.add((gx, gy)); q.append((gx, gy))
    return seen

home = pos['tardome']
reach = reachable_from(home[0], home[1])
missing = [(sid, x, y) for (sid, x, y, nm, gl) in SITES if (x, y) not in reach]
if missing:
    for sid, x, y in missing:
        print(u'  !! %s (%d,%d) へ歩いて行けない' % (sid, x, y))
    raise SystemExit(u'分断された大陸になっている')
print(u'検算: %d拠点すべてへ歩いて行ける (歩ける陸 %d マス)' % (len(SITES), len(reach)))

def emit():
    art = [''.join(row) for row in grid]
    out = []
    out.append(u'// 大陸 ― tools/build_world.py が組み立てたものを そのまま貼っている。')
    out.append(u'// 手で直さず、あちらを走らせ直すこと(種を固定してあるので同じ大陸が出る)。')
    out.append(u'// 拠点の入口は 0〜9 の数字で置いてあり、entrances でマップIDに読み替える。')
    out.append(u'var Game = window.Game || {};')
    out.append(u'Game.Data = Game.Data || {};')
    out.append(u'Game.Data.WorldDef = {')
    out.append(u"  id: 'world', name: '%s', kind: 'field', startX: %d, startY: %d," % (u'オルヴァルド大陸', SITES[0][1], SITES[0][2] + 1))
    out.append(u"  encounterTable: 'east_road',")
    out.append(u"  church: '%s'," % u'タルドームの教会')
    out.append(u'  entrances: {')
    for k in sorted(entrances):
        e = entrances[k]
        out.append(u"    '%s': { to: '%s', name: '%s', glyph: '%s' }," % (k, e['to'], e['name'], e['glyph']))
    out.append(u'  },')
    out.append(u'  regions: [')
    for r in REGIONS:
        out.append(u"    { x: %d, y: %d, w: %d, h: %d, table: '%s', name: '%s' },"
                   % (r['x'], r['y'], r['w'], r['h'], r['table'], r['name']))
    out.append(u'  ],')
    out.append(u'  art: [')
    for row in art:
        out.append(u"    '%s'," % row)
    out.append(u'  ],')
    out.append(u'};')
    out.append(u'')
    return u'\n'.join(out)

dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'data', 'world.js')
io.open(dest, 'w', encoding='utf-8').write(emit())

land = sum(1 for row in grid for c in row if c != SEA)
print(u'%d×%d  陸 %d マス (%.0f%%)' % (W, H, land, 100.0 * land / (W * H)))
counts = {}
for row in grid:
    for c in row:
        counts[c] = counts.get(c, 0) + 1
print(u'  ' + u'  '.join(u'%s:%d' % (k, counts[k]) for k in sorted(counts)))
print(u'書き出した: %s' % os.path.normpath(dest))
for row in grid:
    print(u'  ' + u''.join(row))
