# このファイルの役目：expand_world.py で広げた地図（worlds_new.json）を、ゲームのファイルに書き込む道具（作る人用。一度だけ流した記録）。
# 地図の文字の並び・出入口・地名・名の欠片の座標を新しい地図に変え、ほかのマップから地図へ出る所（着く所）も変える。
# 広い地図の寄り道（宝箱・体力が戻る祠）を、道や町から離れた森・荒れ地の奥に置く。使い方：python3 apply_world.py 元データ.json 新しい地図.json
import json, re, sys, os, random
from collections import deque

SRC = json.load(open(sys.argv[1])); NEW = json.load(open(sys.argv[2]))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
MAPS = os.path.join(ROOT, 'js', 'data', 'maps')
TILES = SRC['tiles']; K = 4
SHRINE = {'world_ningen': '祠', 'world_makai': '廟'}
solid = lambda ch: ch in SHRINE.values() or TILES.get(ch, {}).get('solid', False)
center = lambda x, y: (x * K + K // 2, y * K + K // 2)
D4 = ((1, 0), (-1, 0), (0, 1), (0, -1))

def conv_land(wid, tx, ty):
    for w in SRC[wid]['warps']:
        dx, dy = tx - w['x'], ty - w['y']
        if abs(dx) + abs(dy) == 1:
            cx, cy = center(w['x'], w['y']); return cx + dx, cy + dy
    return center(tx, ty)

def walkable(wid, x, y, rows, warps):
    return 0 <= y < len(rows) and 0 <= x < len(rows[0]) and not solid(rows[y][x]) and (x, y) not in warps

def nearest_walk(wid, x, y, rows, warps):
    q = deque([(x, y)]); seen = {(x, y)}
    while q:
        a, b = q.popleft()
        if walkable(wid, a, b, rows, warps): return a, b
        for dx, dy in D4:
            c = (a + dx, b + dy)
            if c not in seen and 0 <= c[0] < len(rows[0]) and 0 <= c[1] < len(rows): seen.add(c); q.append(c)

# ---- 寄り道の置き場所 ----
CHESTS = {
    'world_ningen': [('copper', 150), 'mamori_ishi', ('kizugusuri', 3), 'hayate_obi', ('dokukeshi', 3), 'chikara_ude', ('mezamashi', 2), 'inochi_ishi', ('copper', 300), 'kokoro_kagami'],
    'world_makai': [('kizugusuri', 5), ('mezamashi', 3), ('copper', 400), 'kokoro_kagami', 'inochi_ishi', 'inori_houi', ('copper', 800)],
}
SHRINES = {'world_ningen': 4, 'world_makai': 3}
SHRINE_TEXT = {
    'world_ningen': '（草に埋もれた、古い祠だ。手を合わせると、体の疲れがすうっと抜けていった）',
    'world_makai': '（焼け残った小さな廟だ。手を合わせると、体の疲れがすうっと抜けていった）',
}

result = {}
for wid in ('world_ningen', 'world_makai'):
    rows = [list(r) for r in NEW[wid]['rows']]
    H, W = len(rows), len(rows[0])
    warps = {center(w['x'], w['y']) for w in SRC[wid]['warps']}
    road = {'-', 'u', '='}
    # 本土（いちばん大きな陸）
    start = conv_land(wid, SRC[wid]['start']['x'], SRC[wid]['start']['y'])
    def comp(s):
        seen = {s}; q = deque([s])
        while q:
            a, b = q.popleft()
            for dx, dy in D4:
                c = (a + dx, b + dy)
                if c not in seen and walkable(wid, c[0], c[1], rows, warps): seen.add(c); q.append(c)
        return seen
    main = comp(nearest_walk(wid, *start, rows, warps))
    # 道・入口からの距離
    dist = {}; q = deque()
    for y in range(H):
        for x in range(W):
            if rows[y][x] in road or (x, y) in warps: dist[(x, y)] = 0; q.append((x, y))
    while q:
        a, b = q.popleft()
        for dx, dy in D4:
            c = (a + dx, b + dy)
            if 0 <= c[0] < W and 0 <= c[1] < H and c not in dist: dist[c] = dist[(a, b)] + 1; q.append(c)
    open8 = lambda x, y: all(walkable(wid, x + dx, y + dy, rows, warps) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
    cands = sorted([p for p in main if dist.get(p, 0) >= 6 and open8(*p)], key=lambda p: -dist[p])
    rnd = random.Random(5 if wid == 'world_ningen' else 9); rnd.shuffle(cands)
    cands.sort(key=lambda p: -min(dist[p], 14))
    picked = []
    need = len(CHESTS[wid]) + SHRINES[wid]
    for p in cands:
        if all(abs(p[0] - o[0]) + abs(p[1] - o[1]) >= 16 for o in picked): picked.append(p)
        if len(picked) == need: break
    assert len(picked) == need, (wid, len(picked))
    chests, spots = [], []
    for i, p in enumerate(picked[:SHRINES[wid]]):
        rows[p[1]][p[0]] = SHRINE[wid]
        spots.append({'x': p[0], 'y': p[1], 'heal': True, 'text': SHRINE_TEXT[wid]})
    for i, (p, it) in enumerate(zip(picked[SHRINES[wid]:], CHESTS[wid])):
        c = {'id': f'field{i + 1}', 'x': p[0], 'y': p[1]}
        if isinstance(it, tuple) and it[0] == 'copper': c['copper'] = it[1]
        elif isinstance(it, tuple): c['item'], c['count'] = it
        else: c['item'] = it
        chests.append(c)
    result[wid] = dict(rows=[''.join(r) for r in rows], chests=chests, spots=spots, warps=warps)

# ---- 地図のファイルを書き換える ----
def js(v): return json.dumps(v, ensure_ascii=False)
for wid in ('world_ningen', 'world_makai'):
    p = os.path.join(MAPS, wid + '.js'); s = open(p).read()
    r = result[wid]
    a = s.index('    rows: ['); b = s.index('    ],', a) + len('    ],')
    s = s[:a] + '    rows: [\n' + ''.join(f"      '{row}',\n" for row in r['rows']) + '    ],' + s[b:]
    for w in SRC[wid]['warps']:   # 出入口
        cx, cy = center(w['x'], w['y'])
        s, n = re.subn(r"\{ x: %d, y: %d, to: '%s'" % (w['x'], w['y'], w['to']), "{ x: %d, y: %d, to: '%s'" % (cx, cy, w['to']), s)
        assert n >= 1, (wid, w['to'])
    # 出入口の着く所（地図から地図：大穴）
    def fix_tx(m):
        to, tx, ty = m.group(1), int(m.group(2)), int(m.group(3))
        if to.startswith('world_'):
            nx, ny = conv_land(to, tx, ty); return "to: '%s', tx: %d, ty: %d" % (to, nx, ny)
        return m.group(0)
    s = re.sub(r"to: '(world_\w+)', tx: (\d+), ty: (\d+)", fix_tx, s)
    for pl in SRC[wid]['places']:   # 地名
        cx, cy = center(pl['x'], pl['y'])
        s, n = re.subn(r"\{ x: %d, y: %d, name: " % (pl['x'], pl['y']), "{ x: %d, y: %d, name: " % (cx, cy), s)
    sx, sy = conv_land(wid, SRC[wid]['start']['x'], SRC[wid]['start']['y'])
    s = re.sub(r"start: \{ x: \d+, y: \d+,", "start: { x: %d, y: %d," % (sx, sy), s, count=1)
    s = re.sub(r"\n    spots: \[[^\]]*\],", "\n    // 広い地図の寄り道：草に埋もれた祠（調べると体力・MPが戻る）\n    spots: [\n" + ''.join(f"      {{ x: {o['x']}, y: {o['y']}, heal: true, text: {js(o['text'])} }},\n" for o in result[wid]['spots']) + "    ],", s, count=1)
    s = re.sub(r"\n    chests: \[[^\]]*\],", "\n    // 広い地図の寄り道：道や町から離れた森・荒れ地の奥の宝箱\n    chests: [\n" + ''.join("      { " + ', '.join(f"{k}: {js(v)}" for k, v in c.items()) + " },\n" for c in result[wid]['chests']) + "    ],", s, count=1)
    open(p, 'w').write(s)

# ほかのマップから地図へ出る所
for f in os.listdir(MAPS):
    if not f.endswith('.js') or f.startswith('world_'): continue
    p = os.path.join(MAPS, f); s = open(p).read()
    def rep(m):
        q = m.group(1); to, tx, ty = m.group(2), int(m.group(3)), int(m.group(4))
        nx, ny = conv_land(to, tx, ty)
        return f"to: {q}{to}{q}, tx: {nx}, ty: {ny}"
    s2 = re.sub(r"to: (['\"])(world_\w+)\1, tx: (\d+), ty: (\d+)", rep, s)
    if s2 != s: open(p, 'w').write(s2)

# 名の欠片（地図に落ちているもの）
p = os.path.join(ROOT, 'js', 'data', 'names.js'); s = open(p).read()
def repn(m):
    wid, x, y = m.group(1), int(m.group(2)), int(m.group(3))
    rows = result[wid]['rows']; nx, ny = nearest_walk(wid, *center(x, y), rows, result[wid]['warps'])
    return "at: { map: '%s', x: %d, y: %d }" % (wid, nx, ny)
s = re.sub(r"at: \{ map: '(world_\w+)', x: (\d+), y: (\d+) \}", repn, s)
open(p, 'w').write(s)
json.dump({w: {'chests': result[w]['chests'], 'spots': result[w]['spots']} for w in result}, open(os.path.join(os.path.dirname(sys.argv[2]), 'worlds_extras.json'), 'w'), ensure_ascii=False)
print('ok', {w: (len(result[w]['chests']), len(result[w]['spots'])) for w in result})
