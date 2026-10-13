# このファイルの役目：作る人用。寄り道のダンジョン5つの設計（記号の並び）から js/data/maps/<id>.js を書き出す。
# 使い方：python3 tools/dungeon_design/gen_dungeons.py　（書き出したあと tools/dungeons.js で解けるか確かめる）
import json, sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from slide_solve import Canvas, conv, reach, path
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..') + '/'

def js(v): return json.dumps(v, ensure_ascii=False)

def find(D, ch):
    return [(x, y) for y, r in enumerate(D) for x, c in enumerate(r) if c == ch]

def write_map(mid, head, D, table, props):
    rows = conv(D, table)
    for r in rows: assert len(r) == len(rows[0]), (mid, r)
    L = []
    L.append(f"// このファイルの役目：マップ「{props['name']}」のデータ。{head[0]}")
    L.append(f"// {head[1]}")
    L.append("// しかけ（gimmicks）の動きは js/systems/gimmick.js。設計と解き方の確かめは tools/check.js。")
    L.append("(function () {\n  const G = window.GAME = window.GAME || {};\n  G.DATA = G.DATA || {};\n  G.DATA.maps = G.DATA.maps || {};\n")
    L.append(f"  G.DATA.maps.{mid} = {{")
    for k in ['name', 'outside', 'start', 'battleBg', 'tint', 'dark', 'fillCh', 'fallTo', 'encounter']:
        if k in props: L.append(f"    {k}: {js(props[k])},")
    L.append("    rows: [")
    for r in rows: L.append(f"      {js(r)},")
    L.append("    ],")
    for k in ['flagTiles', 'warps', 'gimmicks', 'chests', 'signs', 'spots', 'npcs']:
        v = props.get(k, [])
        if not v: L.append(f"    {k}: [],"); continue
        L.append(f"    {k}: [")
        for o in v: L.append(f"      {js(o)},")
        L.append("    ],")
    L.append("  };\n})();\n")
    open(ROOT + f'js/data/maps/{mid}.js', 'w', encoding='utf-8').write('\n'.join(L).replace('"', "'").replace("\\'", "’"))
    return rows

# ===================== 1. 苔むした地下道（聖の森の洞窟の奥。5章から） =====================
c = Canvas(22, 16)
c.box(1, 12, 20, 14).box(1, 9, 4, 11)
c.put(4, 14, 'S')
c.box(6, 8, 6, 11).put(6, 11, 'w')
c.box(6, 1, 17, 7, 's')
for (x, y) in [(8,2),(11,3),(13,1),(7,6),(15,5),(9,5),(14,7),(16,2),(12,6),(10,1)]: c.put(x, y, '#')
c.put(12, 4, '.'); c.box(18, 4, 19, 4).put(19, 4, 'L')
c.box(18, 1, 20, 2).put(20, 1, 'C')
c.box(16, 9, 20, 10).box(16, 11, 20, 11, '#').put(18, 11, 'g').put(20, 9, 'C')
c.box(1, 1, 4, 3).box(1, 5, 4, 7).put(2, 4, 'v').put(4, 1, 'C')
c.box(2, 8, 2, 8)
D1 = c.rows()
write_map('hijiri_deep', ('聖の森の洞窟の奥（寄り道）。苔の滑る広間・荒ぶる火の玉（心鎮め）・蔦（火種）・レバーと門。',
                          '火種は6章で覚えるので、蔦の奥の部屋は6章より後に戻ってくると開く。'),
  D1, {'.': 'z', '#': 'R', 's': '滑', 'w': 'z', 'v': 'z', 'g': '門', 'S': 'S', 'L': 'z', 'C': 'z'}, {
  'name': '苔むした地下道', 'outside': '#000', 'start': {'x': 4, 'y': 13, 'dir': 'up'}, 'battleBg': 'forest',
  'tint': 'rgba(0,30,10,0.25)',
  'encounter': {'steps': [14, 24], 'groups': [['morigumo'], ['morigumo', 'onibi'], ['tsuta'], ['tsuta', 'tsuta'], ['onibi', 'onibi'], ['fox', 'morigumo']]},
  'flagTiles': [{'x': 18, 'y': 11, 'ch': 'z', 'if': 'deep_lever'}],
  'warps': [{'x': 4, 'y': 14, 'to': 'hijiri_cave', 'tx': 1, 'ty': 2, 'dir': 'down'}],
  'gimmicks': [
    {'type': 'seal', 'id': 'wisp', 'x': 6, 'y': 11, 'ch': '霊', 'need': 'kokoroshizume',
     'text': '青白い火の玉が、通路の前で荒ぶっている。近づけない。', 'done': '火の玉は静まり、ふっと消えていった。'},
    {'type': 'seal', 'id': 'vine', 'x': 2, 'y': 4, 'ch': '蔦', 'need': 'hidane',
     'text': '太い蔦が、幾重にも絡み合って道をふさいでいる。火があれば……。', 'done': '蔦は、ぱちぱちと音を立てて燃え落ちた。'},
    {'type': 'lever', 'id': 'lever', 'x': 19, 'y': 4, 'flag': 'deep_lever', 'once': True,
     'text': '苔に埋もれたレバーを倒した。遠くで、門の上がる音がした。', 'doneText': 'レバーは、倒れたままだ。'},
  ],
  'chests': [
    {'id': 'moss', 'x': 20, 'y': 1, 'item': 'kizugusuri', 'count': 2},
    {'id': 'gate', 'x': 20, 'y': 9, 'item': 'morimori_gaitou'},
    {'id': 'vine', 'x': 4, 'y': 1, 'item': 'kotonoha_juzu'},
  ],
  'signs': [{'x': 8, 'y': 14, 'text': '岩に刻まれた文字がある。\n「苔はよく滑る。止まれるのは、乾いた岩の上だけ」'}],
})

# ===================== 2. 古い坑道（炉ヶ岳の山道の脇。6章から） =====================
c = Canvas(26, 19)
c.box(7, 12, 17, 16).put(12, 17, 'O')
c.box(12, 8, 12, 11).put(12, 11, 'h').put(12, 10, 'h')
c.put(12, 14, 'b').put(10, 13, 'b')
c.box(5, 3, 17, 7, 'H')
for (x, y) in [(12,7),(12,6),(11,6),(10,6),(10,5),(9,5),(8,5),(8,4),(7,4),(14,6),(15,6),(15,5),(16,5),(16,4)]: c.put(x, y, '.')
c.put(4, 4, 'K'); c.box(1, 2, 3, 6).put(1, 4, 'C').put(3, 2, 'C')
c.box(18, 4, 20, 4, 'X')
c.box(21, 1, 24, 9)
c.put(22, 3, 'b').put(22, 8, 'P').put(23, 9, 'g')
c.box(23, 10, 24, 15).put(24, 15, 'C')
c.put(21, 6, '#').put(24, 5, '#').put(24, 1, 'L').put(21, 9, '#').put(22, 9, '#').put(24, 9, '#')
D2 = c.rows()
hot = find(D2, 'H')
write_map('ro_mine', ('炉ヶ岳の山道の脇の古い坑道（寄り道）。岩で穴を埋める・焼けた岩の床・崩れた足場（堅め）・重しの床と門・鍵の扉・暗闇と燭台。',
                      '東の棟のレバーを倒すと、焼けた岩の床が冷える（flagTiles）。岩は入り直すと元の場所に戻る。'),
  D2, {'.': '坑', '#': '杭', 'H': '熱', 'O': 'O', 'h': '穴', 'b': '坑', 'P': '坑', 'g': '門', 'K': '坑', 'X': '橋', 'L': '坑', 'C': '坑'}, {
  'name': '古い坑道', 'outside': '#000', 'start': {'x': 12, 'y': 16, 'dir': 'up'}, 'battleBg': 'mountain',
  'dark': True, 'fillCh': '坑',
  'encounter': {'steps': [14, 24], 'groups': [['iwatokage'], ['hinezumi', 'hinezumi'], ['iwatokage', 'hinezumi'], ['hinezumi', 'hinezumi', 'hinezumi'], ['iwatokage', 'iwatokage']]},
  'flagTiles': [{'x': 23, 'y': 9, 'ch': '坑', 'if': 'gm:ro_mine:plate'}] + [{'x': x, 'y': y, 'ch': '坑', 'if': 'mine_cool'} for (x, y) in hot],
  'warps': [{'x': 12, 'y': 17, 'to': 'ro_path', 'tx': 2, 'ty': 17, 'dir': 'right'}],
  'gimmicks': [
    {'type': 'boulder', 'id': 'b1', 'x': 12, 'y': 14},
    {'type': 'boulder', 'id': 'b2', 'x': 10, 'y': 13},
    {'type': 'boulder', 'id': 'b3', 'x': 22, 'y': 3},
    {'type': 'plate', 'id': 'plate', 'x': 22, 'y': 8, 'text': '岩の重みで床が沈んだ。ゴトリ、と門の上がる音がした。'},
    {'type': 'seal', 'id': 'gap', 'x': 18, 'y': 4, 'ch': '崩', 'need': 'katame',
     'text': '足場が崩れて、向こう側へ渡れない。崩れかけた土を、固められれば……。', 'done': '崩れかけた土が、石のように固まった。渡れそうだ。'},
    {'type': 'seal', 'id': 'gap2', 'x': 19, 'y': 4, 'ch': '崩', 'need': 'katame',
     'text': '足場が崩れて、向こう側へ渡れない。崩れかけた土を、固められれば……。', 'done': '崩れかけた土が、石のように固まった。渡れそうだ。'},
    {'type': 'seal', 'id': 'gap3', 'x': 20, 'y': 4, 'ch': '崩', 'need': 'katame',
     'text': '足場が崩れて、向こう側へ渡れない。崩れかけた土を、固められれば……。', 'done': '崩れかけた土が、石のように固まった。渡れそうだ。'},
    {'type': 'lock', 'id': 'door', 'x': 4, 'y': 4, 'ch': '扉', 'key': 'koudou_kagi', 'text': '古い鉄の扉だ。鍵がかかっている。'},
    {'type': 'lever', 'id': 'cool', 'x': 24, 'y': 1, 'flag': 'mine_cool', 'once': True,
     'text': 'レバーを倒すと、地下水の流れる音がした。焼けた岩の床が、みるみる冷えていく。', 'doneText': '地下水が、静かに流れている。'},
    {'type': 'torch', 'id': 't1', 'x': 7, 'y': 13, 'lit': True},
    {'type': 'torch', 'id': 't2', 'x': 17, 'y': 13},
    {'type': 'torch', 'id': 't3', 'x': 5, 'y': 3},
    {'type': 'torch', 'id': 't4', 'x': 21, 'y': 1},
    {'type': 'torch', 'id': 't5', 'x': 23, 'y': 13},
  ],
  'chests': [
    {'id': 'key', 'x': 24, 'y': 15, 'item': 'koudou_kagi'},
    {'id': 'blade', 'x': 1, 'y': 4, 'item': 'hagane_ken'},
    {'id': 'ore', 'x': 3, 'y': 2, 'copper': 300},
  ],
  'signs': [{'x': 8, 'y': 16, 'text': '古い立て札だ。\n「岩は穴へ、重しは床へ。岩が動かなくなったら、いちど坑道の外へ出よ」'}],
})

# ===================== 3. 風の岩溝（獣ノ原の南東。7章から） =====================
def build3(lever):
    c = Canvas(24, 17)
    c.box(1, 12, 6, 15).put(3, 16, 'O')
    c.box(1, 10, 1, 11)
    c.box(2, 9, 21, 9, '>').put(1, 9, '.').put(22, 9, '.')
    c.box(20, 10, 22, 14).put(22, 14, 'L')
    c.box(2, 11, 19, 11, '<')
    c.box(22, 2, 22, 8, '^' if lever else 'v').put(22, 1, '.')
    c.box(14, 1, 21, 1)
    c.put(13, 1, 'K'); c.box(9, 1, 12, 1).put(9, 1, 'C')
    c.put(16, 2, '.')
    c.box(3, 3, 20, 7, '.')
    for (x, y, ch) in [(16,3,'v'),(16,4,'v'),(16,5,'v'),(16,6,'v'),(13,7,'<'),(12,7,'<'),(11,7,'<'),
                       (9,6,'^'),(9,5,'^'),(9,4,'^'),(6,3,'>'),(7,3,'>'),(4,7,'^'),(4,6,'^'),(4,5,'^'),
                       (19,4,'<'),(18,4,'<'),(12,3,'v'),(12,4,'v')]:
        c.put(x, y, ch)
    for (x, y) in [(17,7),(14,5),(10,3),(5,4),(6,6),(11,5),(20,6),(15,3),(3,6)]: c.put(x, y, '#')
    c.put(10, 8, 'v')
    c.box(1, 1, 3, 1).put(3, 2, '.').put(1, 1, 'C')
    return c.rows()
D3 = build3(0)
FL = {'>': '→', '<': '←', '^': '↑', 'v': '↓'}
t3 = {'.': 'e', '#': 'R', 'O': 'O', 'L': 'e', 'C': 'e', 'K': 'e'}; t3.update(FL)
write_map('kemono_ravine', ('獣ノ原の南東の岩溝（寄り道）。吹き抜ける風に流される床・風向きを変えるレバー・鍵の扉。',
                            '右下のレバーで、東の縦の風が下向きから上向きに変わる（flagTiles）。帰り道は西へ流れる風。'),
  D3, t3, {
  'name': '風の岩溝', 'outside': '#3a3020', 'start': {'x': 3, 'y': 15, 'dir': 'up'}, 'battleBg': 'wild',
  'encounter': {'steps': [12, 22], 'groups': [['arano_ookami'], ['oosasori'], ['arano_ookami', 'oosasori'], ['oosasori', 'oosasori'], ['arano_ookami', 'arano_ookami']]},
  'flagTiles': [{'x': 22, 'y': y, 'ch': '↑', 'if': 'ravine_lever'} for y in range(2, 9)],
  'warps': [{'x': 3, 'y': 16, 'to': 'kemono_field', 'tx': 30, 'ty': 18, 'dir': 'up'}],
  'gimmicks': [
    {'type': 'lever', 'id': 'wind', 'x': 22, 'y': 14, 'flag': 'ravine_lever',
     'text': '古いレバーを動かした。岩溝の奥で、風の向きが変わる音がした。'},
    {'type': 'lock', 'id': 'door', 'x': 13, 'y': 1, 'ch': '扉', 'key': 'iwamizo_kagi', 'text': '岩をくりぬいた扉だ。鍵がかかっている。'},
  ],
  'chests': [
    {'id': 'key', 'x': 1, 'y': 1, 'item': 'iwamizo_kagi'},
    {'id': 'cloak', 'x': 9, 'y': 1, 'item': 'kazekiri_gaitou'},
  ],
  'signs': [{'x': 5, 'y': 12, 'text': '風化した石碑がある。\n「谷を渡る風は、番人の仕掛けで向きを変える。風に逆らうな。風を選べ」'}],
})

# ===================== 4. 大穴　上層（クリア後） =====================
def build4():
    blocks = [(11, 10), (6, 11), (12, 11), (19, 10), (10, 8), (19, 8), (11, 9), (8, 10), (21, 11), (6, 10), (17, 10), (14, 12)]
    cracks = [(20, 10), (20, 8), (5, 12), (14, 9), (8, 8)]
    c = Canvas(24, 18)
    c.box(1, 14, 22, 16).put(11, 17, 'S')
    c.box(2, 8, 21, 12, 'i')
    c.put(11, 13, '.')
    for (x, y) in blocks: c.put(x, y, '#')
    for (x, y) in cracks: c.put(x, y, 'f')
    c.put(11, 7, '.')
    c.box(10, 5, 12, 6)
    c.put(10, 5, 'A'); c.box(18, 2, 21, 4); c.box(1, 2, 4, 4)
    c.put(18, 4, 'B'); c.put(4, 4, 'Q')
    c.box(5, 2, 5, 2).box(6, 1, 16, 3)
    c.put(16, 1, 'g').put(16, 0, 'D')
    return c.rows()
D4 = build4()
write_map('oana_jou', ('魔界の畑の縦穴から下りる、大穴の上層（クリア後の寄り道）。凍った床・ひびの床（落ちると中層へ）・光る石台・灯籠を順に灯す謎。',
                       '灯籠の順は、東の島の石碑の言葉（月の道すじ：東→南→西→北）。'),
  D4, {'.': '闇', '#': '黒', 'i': '氷', 'f': '落', 'S': 'S', 'D': 'S', 'A': '台', 'B': '台', 'Q': '台', 'g': '門'}, {
  'name': '大穴　上層', 'outside': '#000', 'start': {'x': 11, 'y': 16, 'dir': 'up'}, 'battleBg': 'night',
  'tint': 'rgba(40,0,60,0.2)',
  'fallTo': {'map': 'oana_chuu', 'x': 12, 'y': 10, 'dir': 'down', 'text': '足もとの氷が割れた！　まっさかさまに落ちていく――'},
  'encounter': {'steps': [12, 20], 'groups': [['kage_oni'], ['yomi_hebi'], ['na_kui', 'na_kui'], ['kage_oni', 'na_kui']]},
  'flagTiles': [{'x': 16, 'y': 1, 'ch': '闇', 'if': 'oana_moon'}],
  'warps': [
    {'x': 11, 'y': 17, 'to': 'yomi_hani', 'tx': 27, 'ty': 16, 'dir': 'left'},
    {'x': 10, 'y': 5, 'to': 'oana_jou', 'tx': 20, 'ty': 2, 'dir': 'down'},
    {'x': 18, 'y': 4, 'to': 'oana_jou', 'tx': 2, 'ty': 2, 'dir': 'down'},
    {'x': 4, 'y': 4, 'to': 'oana_jou', 'tx': 11, 'ty': 6, 'dir': 'up'},
    {'x': 16, 'y': 0, 'to': 'oana_chuu', 'tx': 12, 'ty': 2, 'dir': 'down'},
  ],
  'gimmicks': [
    {'type': 'sequence', 'id': 'moon', 'flag': 'oana_moon',
     'done': '四つの灯籠に、月の色の火が入った。北の門が、音もなく開いた。',
     'wrong': '灯りが、ふっと一度に消えた。月の道すじと、ちがうらしい。'},
    {'type': 'lantern', 'seq': 'moon', 'order': 0, 'x': 15, 'y': 2},
    {'type': 'lantern', 'seq': 'moon', 'order': 1, 'x': 11, 'y': 3},
    {'type': 'lantern', 'seq': 'moon', 'order': 2, 'x': 7, 'y': 2},
    {'type': 'lantern', 'seq': 'moon', 'order': 3, 'x': 11, 'y': 1},
  ],
  'chests': [
    {'id': 'east', 'x': 21, 'y': 4, 'copper': 800},
    {'id': 'west', 'x': 1, 'y': 4, 'item': 'hoshimi_magatama'},
  ],
  'signs': [
    {'x': 21, 'y': 2, 'text': '古い石碑がある。\n「月は東に生まれ、南を渡り、西に沈み、北の闇に眠る」'},
    {'x': 9, 'y': 15, 'text': '石碑がある。\n「氷の上では止まれない。ひびを踏めば、下の階まで落ちる」'},
  ],
})

# ===================== 5. 大穴　中層（クリア後） =====================
c = Canvas(24, 18)
c.box(6, 1, 18, 3).put(12, 1, 'U')
c.box(12, 4, 12, 7)
c.box(4, 8, 19, 14)
for (x, y) in [(10, 9), (13, 9), (8, 13), (16, 13), (11, 12), (4, 14), (19, 14)]: c.put(x, y, '#')
c.put(12, 15, 'g').put(12, 16, 'D')
c.box(1, 1, 4, 5).put(5, 2, 'I').put(1, 1, 'C')
c.box(20, 1, 22, 5).put(19, 2, 'K').put(22, 5, 'C')
D5 = c.rows()
write_map('oana_chuu', ('大穴の中層（クリア後の寄り道）。暗闇と燭台・二つの重しの床と岩・見破りで消える偽の壁・雷で砕く大岩。',
                        '二つの床に岩を乗せると、南の門が開いて最深部への石段へ。上層のひびの床から落ちると、ここの真ん中に落ちる。'),
  D5, {'.': '闇', '#': '黒', 'U': 'S', 'D': 'S', 'g': '門', 'I': '闇', 'K': '闇', 'C': '闇'}, {
  'name': '大穴　中層', 'outside': '#000', 'start': {'x': 12, 'y': 2, 'dir': 'down'}, 'battleBg': 'night',
  'dark': True,
  'encounter': {'steps': [12, 20], 'groups': [['kage_oni'], ['yomi_hebi', 'na_kui'], ['kage_oni', 'kage_oni'], ['yomi_hebi'], ['orochi']]},
  'flagTiles': [{'x': 12, 'y': 15, 'ch': '闇', 'all': ['gm:oana_chuu:p1', 'gm:oana_chuu:p2']}],
  'warps': [
    {'x': 12, 'y': 1, 'to': 'oana_jou', 'tx': 16, 'ty': 2, 'dir': 'down'},
    {'x': 12, 'y': 16, 'to': 'oana_soko', 'tx': 12, 'ty': 19, 'dir': 'up'},
  ],
  'gimmicks': [
    {'type': 'boulder', 'id': 'b1', 'x': 9, 'y': 11},
    {'type': 'boulder', 'id': 'b2', 'x': 14, 'y': 12},
    {'type': 'plate', 'id': 'p1', 'x': 6, 'y': 9},
    {'type': 'plate', 'id': 'p2', 'x': 17, 'y': 9},
    {'type': 'seal', 'id': 'illusion', 'x': 5, 'y': 2, 'ch': '幻', 'need': 'miyaburi',
     'text': '黒い岩壁だ。……ほかの壁と、どこか手ざわりがちがう気がする。', 'done': '偽りの壁が、霧のようにほどけて消えた。'},
    {'type': 'seal', 'id': 'crag', 'x': 19, 'y': 2, 'ch': '巌', 'need': 'ikazuchi',
     'text': '道をふさぐ大岩だ。強い雷でも落とせば、砕けるかもしれない。', 'done': '雷が落ち、大岩は粉々に砕け散った。'},
    {'type': 'torch', 'id': 't1', 'x': 8, 'y': 1},
    {'type': 'torch', 'id': 't2', 'x': 16, 'y': 1},
    {'type': 'torch', 'id': 't3', 'x': 4, 'y': 9},
    {'type': 'torch', 'id': 't4', 'x': 19, 'y': 9},
    {'type': 'torch', 'id': 't5', 'x': 9, 'y': 14},
    {'type': 'torch', 'id': 't6', 'x': 15, 'y': 14},
  ],
  'chests': [
    {'id': 'illusion', 'x': 1, 'y': 1, 'item': 'yomiishi_ken'},
    {'id': 'crag', 'x': 22, 'y': 5, 'item': 'akatsuki_yoroi'},
  ],
  'signs': [{'x': 7, 'y': 2, 'text': '石碑がある。\n「二つの床に、重い岩を。岩が動かなくなったら、いちど上の階へ」'}],
})
print('ok')
