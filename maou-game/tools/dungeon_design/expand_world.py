# このファイルの役目：人間界・魔界のフィールドマップ（ユーザーの描いた32×22の地図）を、縦横4倍（128×88）に広げる道具（作る人用。一度だけ流した記録）。
# 地図の形はそのまま、1マスを4×4にして、海岸線や森の縁はゆらぎで自然な形にし、道は町と町をつなぐ線として引き直す。町・城などの入口は4×4のまん中の1マス。
# 出入口・地名・名の欠片の座標を変換し、寄り道（宝箱・祠）を置く。使い方：python3 tools/dungeon_design/expand_world.py 元データ.json
import json, math, random, re, sys, os
from collections import deque

K = 4
SRC = json.load(open(sys.argv[1]))
TILES = SRC['tiles']
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')

WATER = '~'
ROAD = {'world_ningen': '-', 'world_makai': 'u'}
GROUND = {'world_ningen': '.', 'world_makai': '$'}

def solid(ch): return TILES.get(ch, {}).get('solid', False)

def smooth_noise(w, h, seed, cell=3.0):
    rnd = random.Random(seed)
    gw, gh = int(w / cell) + 3, int(h / cell) + 3
    grid = [[rnd.uniform(-1, 1) for _ in range(gw)] for _ in range(gh)]
    def f(x, y):
        gx, gy = x / cell, y / cell
        x0, y0 = int(gx), int(gy); tx, ty = gx - x0, gy - y0
        sx, sy = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        a = grid[y0][x0] + (grid[y0][x0 + 1] - grid[y0][x0]) * sx
        b = grid[y0 + 1][x0] + (grid[y0 + 1][x0 + 1] - grid[y0 + 1][x0]) * sx
        return a + (b - a) * sy
    return f

def expand(wid, seed):
    src = SRC[wid]; rows = src['rows']; H, W = len(rows), len(rows[0])
    road = ROAD[wid]; ground0 = GROUND[wid]
    warp_at = {(w['x'], w['y']): w for w in src['warps']}
    place_cells = {(x, y) for y in range(H) for x in range(W) if (x, y) in warp_at}
    is_road = lambda c: c in (road, '=')
    # 各マスの「地面」（道・入口のマスは、まわりで一番多い地面）
    def base(x, y):
        c = rows[y][x]
        if (x, y) in place_cells or is_road(c):
            cnt = {}
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H:
                        n = rows[yy][xx]
                        if (xx, yy) in place_cells or is_road(n) or n == WATER or solid(n): continue
                        cnt[n] = cnt.get(n, 0) + 1
            return max(cnt, key=cnt.get) if cnt else ground0
        return c
    B = [[base(x, y) for x in range(W)] for y in range(H)]
    FW, FH = W * K, H * K
    nx, ny = smooth_noise(FW, FH, seed, 4.0), smooth_noise(FW, FH, seed + 7, 4.0)
    mx, my = smooth_noise(FW, FH, seed + 13, 1.5), smooth_noise(FW, FH, seed + 17, 1.5)   # 細かいゆらぎ
    g = [[None] * FW for _ in range(FH)]
    for fy in range(FH):
        for fx in range(FW):
            ox, oy = nx(fx, fy) * 2.2 + mx(fx, fy) * 0.8, ny(fx, fy) * 2.2 + my(fx, fy) * 0.8
            sx = min(W - 1, max(0, int((fx + 0.5 + ox) / K)))
            sy = min(H - 1, max(0, int((fy + 0.5 + oy) / K)))
            g[fy][fx] = B[sy][sx]
    # 入口のマスの4×4は、その地面にそろえる（海に削られないように）
    for (x, y) in place_cells:
        for dy in range(K):
            for dx in range(K): g[y * K + dy][x * K + dx] = B[y][x]
    center = lambda x, y: (x * K + K // 2, y * K + K // 2)
    # 道：道・橋・入口のマスどうしを、まん中どうしの線でつなぐ
    for y in range(H):
        for x in range(W):
            c = rows[y][x]
            if not (is_road(c) or (x, y) in place_cells): continue
            for dx, dy in ((1, 0), (0, 1)):
                xx, yy = x + dx, y + dy
                if xx >= W or yy >= H: continue
                n = rows[yy][xx]
                # 入口どうしは直接つながない（道がない所は道にしない）
                if not (is_road(n) or (xx, yy) in place_cells): continue
                if (x, y) in place_cells and (xx, yy) in place_cells: continue
                (ax, ay), (bx, by) = center(x, y), center(xx, yy)
                for px in range(min(ax, bx), max(ax, bx) + 1):
                    for py in range(min(ay, by), max(ay, by) + 1):
                        if (px, py) in (center(x, y), center(xx, yy)) and ((x, y) in place_cells and (px, py) == center(x, y) or (xx, yy) in place_cells and (px, py) == center(xx, yy)):
                            continue
                        g[py][px] = '=' if g[py][px] in (WATER, '=') else road
    # 元の橋のマス：両側の陸まで、橋を通す（道でない陸どうしをつなぐ橋もある）
    for y in range(H):
        for x in range(W):
            if rows[y][x] != '=': continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < W and 0 <= yy < H) or rows[yy][xx] == WATER: continue
                (ax, ay), (bx, by) = center(x, y), center(xx, yy)
                for px in range(min(ax, bx), max(ax, bx) + 1):
                    for py in range(min(ay, by), max(ay, by) + 1):
                        if (xx, yy) in place_cells and (px, py) == (bx, by): continue
                        if g[py][px] == WATER or solid(g[py][px]): g[py][px] = '='
    # 元の橋のマスのまん中は橋に
    for y in range(H):
        for x in range(W):
            if rows[y][x] == '=':
                cx, cy = center(x, y); g[cy][cx] = '='
    # 入口のマス
    for (x, y) in place_cells:
        cx, cy = center(x, y); g[cy][cx] = rows[y][x]
    # 草地に木・荒れ地をすこし散らす（道とまん中の近くは避ける）
    rnd = random.Random(seed + 3)
    near_road = lambda px, py: any(g[py + dy][px + dx] in (road, '=') or (px + dx, py + dy) in [center(*p) for p in place_cells]
                                   for dy in (-1, 0, 1) for dx in (-1, 0, 1) if 0 <= px + dx < FW and 0 <= py + dy < FH)
    if wid == 'world_ningen':
        for fy in range(1, FH - 1):
            for fx in range(1, FW - 1):
                if g[fy][fx] == '.' and rnd.random() < 0.035 and not near_road(fx, fy): g[fy][fx] = 'T'
                elif g[fy][fx] == '.' and rnd.random() < 0.02 and not near_road(fx, fy): g[fy][fx] = 'F'
    return g, B, place_cells, center

def walkable(ch, warps_fine, x, y):
    return not solid(ch) and (x, y) not in warps_fine

def bfs(g, starts, warps_fine):
    H, W = len(g), len(g[0]); seen = set(starts); q = deque(starts)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx_, ny_ = x + dx, y + dy
            if 0 <= nx_ < W and 0 <= ny_ < H and (nx_, ny_) not in seen and walkable(g[ny_][nx_], warps_fine, nx_, ny_):
                seen.add((nx_, ny_)); q.append((nx_, ny_))
    return seen

import heapq
def repair(wid, g, places, center):
    """入口に本土から歩いて行けないとき、いちばん近い道を通す（海は橋、山は道にする）"""
    H, W = len(g), len(g[0]); warps_fine = {center(x, y) for (x, y) in places}
    walk = lambda x, y: not solid(g[y][x]) and (x, y) not in warps_fine
    def comps():
        lab = {}; sizes = []
        for y in range(H):
            for x in range(W):
                if walk(x, y) and (x, y) not in lab:
                    i = len(sizes); q = deque([(x, y)]); lab[(x, y)] = i; n = 0
                    while q:
                        a, b = q.popleft(); n += 1
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            c, d = a + dx, b + dy
                            if 0 <= c < W and 0 <= d < H and (c, d) not in lab and walk(c, d): lab[(c, d)] = i; q.append((c, d))
                    sizes.append(n)
        return lab, sizes
    road = ROAD[wid]
    for _ in range(40):
        lab, sizes = comps(); main = max(range(len(sizes)), key=lambda i: sizes[i])
        lonely = [p for p in places if not any(lab.get((center(*p)[0] + dx, center(*p)[1] + dy)) == main for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        if not lonely: return
        sx, sy = center(*lonely[0])
        # 入口のとなりから、本土まで（海は5、山は8、陸は1）
        dist = {(sx, sy): 0}; prev = {}; pq = [(0, sx, sy)]; goal = None
        while pq:
            d0, x, y = heapq.heappop(pq)
            if lab.get((x, y)) == main: goal = (x, y); break
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                c, e = x + dx, y + dy
                if not (0 <= c < W and 0 <= e < H) or (c, e) in warps_fine: continue
                ch = g[e][c]; cost = 1 if walk(c, e) else (5 if ch == WATER else 8)
                if d0 + cost < dist.get((c, e), 1e9): dist[(c, e)] = d0 + cost; prev[(c, e)] = (x, y); heapq.heappush(pq, (d0 + cost, c, e))
        p = goal
        while p and p != (sx, sy):
            x, y = p
            if g[y][x] == WATER: g[y][x] = '='
            elif solid(g[y][x]): g[y][x] = road
            p = prev.get(p)

out = {}
for wid, seed in (('world_ningen', 11), ('world_makai', 23)):
    g, B, places, center = expand(wid, seed)
    repair(wid, g, places, center)
    out[wid] = dict(g=g, center=center, places=places)

def conv_land(wid, tx, ty):
    """古い地図の着く所（入口のとなり）→ 新しい地図の着く所"""
    src = SRC[wid]; center = out[wid]['center']
    for w in src['warps']:
        dx, dy = tx - w['x'], ty - w['y']
        if abs(dx) + abs(dy) == 1:
            cx, cy = center(w['x'], w['y']); return cx + dx, cy + dy
    cx, cy = center(tx, ty); return cx, cy

json.dump({wid: {'rows': [''.join(r) for r in out[wid]['g']]} for wid in out} | {
    'conv': {wid: {f"{w['x']},{w['y']}": list(out[wid]['center'](w['x'], w['y'])) for w in SRC[wid]['warps']} for wid in out}},
    open(os.path.join(os.path.dirname(sys.argv[1]), 'worlds_new.json'), 'w'), ensure_ascii=False)
print('ok', {k: (len(v['g'][0]), len(v['g'])) for k, v in out.items()})
