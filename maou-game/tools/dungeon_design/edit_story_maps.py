# このファイルの役目：作る人用の記録。物語の道すじのダンジョンに寄り道のしかけを入れたときに、一度だけ流したスクリプト（もう入っているので、流し直さない）。
# 同じ形で別のマップに足すときの見本。
# 物語の道すじのダンジョンに、寄り道のしかけを足す（道すじそのものは変えない）
import re, json
ROOT = '/home/user/TradingAgents/maou-game/js/data/maps/'

def read(m): return open(ROOT + m + '.js', encoding='utf-8').read()
def write(m, s): open(ROOT + m + '.js', 'w', encoding='utf-8').write(s)

def setch(s, x, y, ch, expect=None):
    a = s.index('rows: ['); b = s.index('\n    ],', a)
    lines = s[a:b].split('\n')
    idx = [i for i, l in enumerate(lines) if re.match(r"\s*'.*',?\s*(//.*)?$", l)]
    l = lines[idx[y]]; q = l.index("'") + 1
    if expect is not None: assert l[q + x] in expect, (x, y, l[q + x])
    lines[idx[y]] = l[:q + x] + ch + l[q + x + 1:]
    return s[:a] + '\n'.join(lines) + s[b:]

def js(o): return json.dumps(o, ensure_ascii=False).replace('"', "'")

def add_before_chests(s, key, items, comment):
    body = '\n'.join(f'      {js(o)},' for o in items)
    block = f"    // {comment}\n    {key}: [\n{body}\n    ],\n"
    i = s.index('    chests: [')
    return s[:i] + block + s[i:]

def append_to(s, key, items):
    # 既にある key: [ ... ] の最後に足す
    i = s.index(f'    {key}: [')
    j = s.index('[', i) + 1
    body = ''.join(f'\n      {js(o)},' for o in items)
    return s[:j] + body + s[j:]

def add_chest(s, o):
    i = s.index('    chests: [') + len('    chests: [')
    return s[:i] + f'\n      {js(o)},' + s[i:]

def set_signs(s, items):
    if '    signs: [],' in s:
        return s.replace('    signs: [],', '    signs: [\n' + '\n'.join(f'      {js(o)},' for o in items) + '\n    ],', 1)
    return append_to(s, 'signs', items)

# ---- 1. ミナモ周辺の野原（4章）：木立の奥の岩と穴 ----
s = read('field_minamo')
for y in range(21, 25):
    for x in range(4, 8): s = setch(s, x, y, '.', 'T')
s = setch(s, 7, 25, '.', 'T')
s = setch(s, 5, 21, 'T', '.')
s = setch(s, 4, 22, '穴', '.')
s = s.replace("    chests: [", "    fillCh: '.',   // 岩で埋めた穴は草地になる\n    chests: [", 1)
s = add_before_chests(s, 'gimmicks', [{'type': 'boulder', 'id': 'grove_rock', 'x': 6, 'y': 22}],
                      'しかけ（js/systems/gimmick.js）：南西の木立の奥。岩を穴へ押し込むと、宝箱へ届く')
s = add_chest(s, {'id': 'stones', 'x': 4, 'y': 21, 'item': 'mamori_ishi'})
s = set_signs(s, [{'x': 8, 'y': 26, 'text': '木立の奥に、大きな岩が見える。押せば動きそうだ。'}])
write('field_minamo', s)

# ---- 2. 聖の森の道（5章）：迷い火（心鎮め）と蔦（火種）が守る宝箱 ----
s = read('hijiri_path')
s = setch(s, 3, 3, 'T', ',')
s = setch(s, 7, 19, 'T', ',')
s = add_before_chests(s, 'gimmicks', [
    {'type': 'seal', 'id': 'wisp', 'x': 4, 'y': 2, 'ch': '霊', 'need': 'kokoroshizume',
     'text': '青白い火の玉が、宝箱のそばで荒ぶっている。', 'done': '火の玉は静まり、ふっと消えていった。'},
    {'type': 'seal', 'id': 'vine', 'x': 8, 'y': 18, 'ch': '蔦', 'need': 'hidane',
     'text': '太い蔦が、木の根元を覆っている。火があれば……。', 'done': '蔦は、ぱちぱちと音を立てて燃え落ちた。'},
], 'しかけ（js/systems/gimmick.js）：北西の宝箱は心鎮め、南西の宝箱は火種（6章で覚える）で開く')
write('hijiri_path', s)

# ---- 3. 炉ヶ岳の山道（6章）：焼けた岩に囲まれた宝箱 ----
s = read('ro_path')
for (x, y) in [(19, 9), (20, 9), (19, 10), (20, 10), (21, 10), (19, 11), (20, 11), (22, 11), (22, 12)]:
    s = setch(s, x, y, '熱', '.')
write('ro_path', s)

# ---- 4. 獣ノ原（7章）：上へ吹く風に乗って届く宝箱 ----
s = read('kemono_field')
for y in range(1, 8):
    s = setch(s, 28, y, '↓', 'e'); s = setch(s, 30, y, '↓', 'e')
for y in range(3, 8):
    s = setch(s, 29, y, '↑', 'e')
s = set_signs(s, [{'x': 27, 'y': 9, 'text': '北東の岩場から、強い風が吹き下ろしている。真ん中だけ、風が上へ吹き上げているようだ。'}])
write('kemono_field', s)

# ---- 5. ツクヨミの社（クリア後）：暗闇と燭台、三つの灯籠の謎 ----
s = read('tsukuyomi_yashiro')
s = setch(s, 1, 12, 'G', 'f'); s = setch(s, 1, 14, 'G', 'f'); s = setch(s, 2, 13, '門', 'f')
s = s.replace("    rows: [", "    dark: true,   // 暗い社。柱の燭台が灯っている\n    rows: [", 1)
s = append_to(s, 'flagTiles', [{'x': 2, 'y': 13, 'ch': 'f', 'if': 'tsuku_moon'}])
s = add_before_chests(s, 'gimmicks', [
    {'type': 'torch', 'id': 'p1', 'x': 4, 'y': 7, 'lit': True}, {'type': 'torch', 'id': 'p2', 'x': 17, 'y': 7, 'lit': True},
    {'type': 'torch', 'id': 'p3', 'x': 4, 'y': 11, 'lit': True}, {'type': 'torch', 'id': 'p4', 'x': 17, 'y': 11, 'lit': True},
    {'type': 'torch', 'id': 'c1', 'x': 1, 'y': 1}, {'type': 'torch', 'id': 'c2', 'x': 20, 'y': 1},
    {'type': 'sequence', 'id': 'tsuki', 'flag': 'tsuku_moon',
     'done': '三つの灯籠に、月の光が宿った。南西の門が、静かに開いた。', 'wrong': '灯りが、ふっと消えた。月の満ち欠けと、順がちがうらしい。'},
    {'type': 'lantern', 'seq': 'tsuki', 'order': 0, 'x': 2, 'y': 9},
    {'type': 'lantern', 'seq': 'tsuki', 'order': 1, 'x': 12, 'y': 12},
    {'type': 'lantern', 'seq': 'tsuki', 'order': 2, 'x': 19, 'y': 9},
], 'しかけ（js/systems/gimmick.js）：柱の燭台（はじめから灯っている）、隅の燭台（火種）、灯籠の謎（西→真ん中→東）')
s = set_signs(s, [{'x': 6, 'y': 14, 'text': '古い石碑がある。\n「細い月は西の空に。満ちた月は天の真ん中に。欠けゆく月は東に」'}])
write('tsukuyomi_yashiro', s)

# ---- 6. 大穴の最深部（クリア後）：レバーで開く南東の蔵 ----
s = read('oana_soko')
for (x, y) in [(21, 18), (22, 18), (23, 18), (24, 18), (21, 20)]: s = setch(s, x, y, 'R', 'z')
s = setch(s, 21, 19, '門', 'z')
s = s.replace("    spots: [", "    flagTiles: [{ x: 21, y: 19, ch: 'z', if: 'soko_vault' }],   // レバーで開く南東の蔵\n    spots: [", 1)
s = add_before_chests(s, 'gimmicks', [
    {'type': 'lever', 'id': 'vault', 'x': 24, 'y': 1, 'flag': 'soko_vault', 'once': True,
     'text': '岩に埋もれたレバーを倒した。遠く南のほうで、門の上がる音がした。', 'doneText': 'レバーは、倒れたままだ。'},
], 'しかけ（js/systems/gimmick.js）：北東の隅のレバーで、南東の蔵の門が開く')
write('oana_soko', s)
print('ok')
