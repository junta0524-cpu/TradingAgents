# このファイルの役目：寄り道の拠点15か所に、道具屋と武具屋の建物（戸と部屋）を足す（ユーザー依頼：各拠点に武器屋・道具屋、拠点限定の品）。
# 一度だけ流した記録。外のマップに建物の絵を書き込み、出入口を足し、部屋は js/data/maps/rooms_shops3.js に書き出す。
# 品ぞろえは js/data/shops.js（手で書く）。check.js が、戸・人・出口に歩いて届くか確かめる。
import re, json, sys

MAPS = 'js/data/maps/'
# (拠点, 建物の左上x, 上y, 絵の行, 店のid, 店の名前, 店の人の見た目, ひと言)
NEW = [
  ('chibiki', 5, 8, ['GGG', 'GDG'], 'chibiki_dougu', 'チビキ岩の道具屋', 'wolfkid', '「見張りの交代のときに、薬を買いに来る者が多い」'),
  ('chibiki', 13, 8, ['GGG', 'GDG'], 'chibiki_bugu', 'チビキ岩の武具屋', 'oni', '「岩を削った鎧だ。王様の役に立つなら、うれしい」'),
  ('hirasaka', 6, 10, ['GGG', 'GDG'], 'hirasaka_dougu', 'ヒラサカの道具屋', 'beastwoman', '「坂を上る人も下る人も、ここで一息つくのよ」'),
  ('hirasaka', 17, 10, ['GGG', 'GDG'], 'hirasaka_bugu', 'ヒラサカの武具屋', 'oni', '「坂の桃の木は、悪いものを寄せつけないという」'),
  ('inasa', 15, 7, ['YYY', '#D#'], 'inasa_dougu', 'イナサの道具屋', 'sailor', '「海松の汁は、船乗りの朝の一杯さ」'),
  ('iwakura', 8, 11, ['^^^^', '##D#'], 'iwakura_dougu', '城下の道具屋', 'merchant', '「兵糧丸は、城の兵に納める残りだよ」'),
  ('iwayato', 9, 3, None, 'iwayato_dougu', 'イワヤトの道具屋', 'crow', '「岩屋の奥でともす灯は、暗い道の助けになる」'),
  ('iwayato', 12, 3, None, 'iwayato_bugu', 'イワヤトの武具屋', 'elder', '「鏡は、岩屋の者が代々磨いてきたものだ」'),
  ('kukunochi', 1, 5, ['UUU', 'UUU', 'UJU'], 'kukunochi_bugu', 'ククノチの武具屋', 'elf', '「楠の杖は、森の古い木が倒れたときにだけ削るのです」'),
  ('magane', 14, 6, ['XXXX', 'XXDX'], 'magane_bugu', 'マガネの武具屋', 'dwarf', '「鶴嘴も、鍛え直せば立派な打ち物になる」'),
  ('mizuho', 15, 9, ['222', '1D1'], 'mizuho_dougu', '離宮の道具商人', 'merchant', '「甘露は、離宮の奥でしか作れないのですよ」'),
  ('nezumi', 7, 3, None, 'nezumi_dougu', '抜け穴の道具屋', 'tsuchi', '「この穴の土は、火から身を守ってくれる」'),
  ('nezumi', 10, 3, None, 'nezumi_bugu', '抜け穴の武具屋', 'beastwoman', '「鳴鏑の羽は、鼠の子らが拾ってくるの」'),
  ('ohabari', 18, 9, ['GGGG', 'GGDG'], 'ohabari_dougu', 'オハバリの道具屋', 'oni', '「戦の前の神酒は、鬼の決まりだ」'),
  ('takama', 1, 6, ['YYY', '#D#'], 'takama_dougu', 'タカマの道具屋', 'villager', '「清めの塩は、社守さまが清めてくださったものです」'),
  ('takama', 18, 6, ['YYY', '#D#'], 'takama_bugu', 'タカマの武具屋', 'elder', '「丘の上でも、身を守る物は要るからのう」'),
  ('ukihashi', 22, 1, ['YYY', '#D#'], 'ukihashi_dougu', 'ウキハシの道具屋', 'oldwoman', '「関所の前で倒れる旅人に、気付け薬を飲ませてきたのさ」'),
  ('yachimata', 14, 11, ['YYY', '#D#'], 'yachimata_bugu', 'ヤチマタの武具屋', 'villager', '「旅の人には、脚絆がいちばん売れるよ」'),
  ('yata', 5, 6, ['GGG', 'GDG'], 'yata_dougu', '鴉族の道具市', 'crow', '「眠り羽の香は、崖の巣を守るためのものだ」'),
  ('yominohara', 2, 5, ['GGGG', 'GGDG'], 'yominohara_dougu', 'ヨミノハラの道具屋', 'oldwoman', '「泉の水は、汲んだその日がいちばん効くよ」'),
  ('yominohara', 17, 5, ['GGGG', 'GGDG'], 'yominohara_bugu', 'ヨミノハラの武具屋', 'wolfkid', '「黒い石の釧は、毒を寄せつけないんだ」'),
]
# 洞窟の拠点は、岩の壁に戸を切る（左の岩・戸・右の岩）
CAVE = ['黒', 'D', '黒']

def outer_block(src, base):
    m = re.search(r'G\.DATA\.maps\.%s = \{.*?rows: \[\n(.*?)\n    \],' % base, src, re.S)
    return m

rooms = []
for base in sorted(set(n[0] for n in NEW)):
    p = MAPS + 'base_%s.js' % base
    src = open(p, encoding='utf-8').read()
    m = outer_block(src, base)
    rows = json.loads('[' + m.group(1).rstrip().rstrip(',') + ']')
    rows = [list(r) for r in rows]
    warps = []
    for (b, x, y, art, sid, sname, look, talk) in NEW:
        if b != base: continue
        if art is None:   # 洞窟：(x..x+2, y) に 黒D黒、戸の下は床
            for i, c in enumerate(CAVE):
                assert rows[y][x + i] in 'z黒', (base, x + i, y, rows[y][x + i])
                rows[y][x + i] = c
            dx, dy = x + 1, y
        else:
            for j, line in enumerate(art):
                for i, c in enumerate(line):
                    rows[y + j][x + i] = c
            dy = y + len(art) - 1
            dx = x + [line.index(ch) for line in [art[-1]] for ch in 'DJ' if ch in line][0]
        below = rows[dy + 1][dx]
        assert below not in '#^XYGU黒TVmR(t', (base, dx, dy + 1, below)
        warps.append('      { x: %d, y: %d, to: "%s", tx: 5, ty: 7, dir: \'up\' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）' % (dx, dy, sid))
        rooms.append((sid, sname, look, talk, base, dx, dy + 1))
    new_rows = '\n'.join('      ' + json.dumps(''.join(r), ensure_ascii=False) + ',' for r in rows)
    src = src[:m.start(1)] + new_rows + src[m.end(1):]
    # 外のマップの warps の頭に足す
    m2 = re.search(r'(G\.DATA\.maps\.%s = \{.*?warps: \[\n)' % base, src, re.S)
    src = src[:m2.end(1)] + '\n'.join(warps) + '\n' + src[m2.end(1):]
    open(p, 'w', encoding='utf-8').write(src)

out = ['// このファイルの役目：寄り道の拠点15か所に足した、道具屋と武具屋の部屋（ユーザー依頼：各拠点に武器屋・道具屋、拠点限定の品）。',
       '// 部屋の型は店（台の向こうに店の人）。下の敷物から外へ出る。品ぞろえは js/data/shops.js。作ったのは tools/dungeon_design/base_shops.py。',
       '(function () {', '  const G = window.GAME = window.GAME || {};', '  G.DATA = G.DATA || {};', '  G.DATA.maps = G.DATA.maps || {};', '']
for (sid, sname, look, talk, base, ox, oy) in rooms:
    out += ['  G.DATA.maps.%s = {' % sid, "    name: '%s'," % sname, "    outside: '#000',", "    start: { x: 5, y: 7, dir: 'up' },", '    rows: [',
            "      ' IIIIIIIIII ',", "      ' IIIIIIIIII ',", "      ' __________ ',", "      ' __CCCCCC__ ',", "      ' __________ ',",
            "      ' k________k ',", "      ' __________ ',", "      ' __________ ',", "      '     EE     ',", '    ],', '    warps: [',
            "      { x: 5, y: 8, to: '%s', tx: %d, ty: %d, dir: 'down' }," % (base, ox, oy),
            "      { x: 6, y: 8, to: '%s', tx: %d, ty: %d, dir: 'down' }," % (base, ox, oy), '    ],', '    npcs: [',
            "      { id: '%s_keeper', look: '%s', x: 5, y: 2, dir: 'down', move: 'still', shop: '%s', talk: ['%s'] }," % (sid, look, sid, talk),
            '    ],', '    chests: [],', '    signs: [],', '  };', '']
out += ['})();', '']
open(MAPS + 'rooms_shops3.js', 'w', encoding='utf-8').write('\n'.join(out))
print(len(rooms), 'rooms')
