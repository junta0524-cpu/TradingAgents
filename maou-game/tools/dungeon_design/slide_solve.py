# このファイルの役目：作る人用。ダンジョンの設計を助ける道具（滑る床・流れる床の行き先を調べる、設計の記号をマスの文字に変える）。
# ゲーム本体では使わない。gen_dungeons.py から読む。
import sys
from collections import deque
SOLID = set('R#門蔦霊崩偽扉杭黒mTi穴Gt ')
SLIDE = set('滑氷')
FLOW = {'↑': (0, -1), '↓': (0, 1), '←': (-1, 0), '→': (1, 0)}
D = {'u': (0, -1), 'd': (0, 1), 'l': (-1, 0), 'r': (1, 0)}

def solid(rows, x, y, extra):
    if y < 0 or y >= len(rows) or x < 0 or x >= len(rows[y]): return True
    return rows[y][x] in SOLID or (x, y) in extra

def move(rows, x, y, d, extra):
    dx, dy = d
    nx, ny = x + dx, y + dy
    if solid(rows, nx, ny, extra): return None
    x, y = nx, ny
    seen = 0
    while True:
        c = rows[y][x]
        if c == '落': return None   # ひびの床を踏む＝落ちる（その手は使えない）
        if c in FLOW: dx, dy = FLOW[c]
        elif c not in SLIDE: return (x, y)
        nx, ny = x + dx, y + dy
        if solid(rows, nx, ny, extra): return (x, y)
        x, y = nx, ny
        seen += 1
        if seen > 500: return (x, y)

def reach(rows, start, extra=frozenset()):
    q = deque([start]); prev = {start: None}
    while q:
        p = q.popleft()
        for k, d in D.items():
            n = move(rows, p[0], p[1], d, extra)
            if n and n not in prev:
                prev[n] = (p, k); q.append(n)
    return prev

def path(prev, goal):
    if goal not in prev: return None
    out = []
    while prev[goal]:
        p, k = prev[goal]; out.append(k); goal = p
    return ''.join(reversed(out))

def show(rows, prev, marks=()):
    for y, r in enumerate(rows):
        print(''.join('*' if (x, y) in marks else ('o' if (x, y) in prev and r[x] not in SLIDE and r[x] not in FLOW else ('·' if r[x] in SLIDE else r[x])) for x in range(len(r))))

# 設計用の記号 → マスの文字
def conv(design, table):
    return [''.join(table.get(c, c) for c in r) for r in design]

class Canvas:
    def __init__(self, w, h, wall='#'):
        self.g = [[wall] * w for _ in range(h)]
    def box(self, x0, y0, x1, y1, ch='.'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.g[y][x] = ch
        return self
    def put(self, x, y, ch): self.g[y][x] = ch; return self
    def rows(self): return [''.join(r) for r in self.g]
