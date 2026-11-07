# このファイルの役目：docs/novel の小説（本編・寄り道の章・四天王編・番外編）を、1枚の読み物サイト（HTML）にまとめる道具。
# 使い方：python3 tools/build_novel_site.py　→ docs/小説サイト.html ができる（公開用のページはこの中身をそのまま使う）。
# メモ・改訂前の版（*_memo.md・ch01_old.md など）は入れない。文章は書き換えない（見出しの飾り記号だけ取る）。
import json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
NOV = os.path.join(ROOT, 'docs', 'novel')
ORDER = [
 ('本編　第一部', '黄泉の大地で、魔王は迎え撃つ', ['ch01', 'ch02', 'ch03']),
 ('本編　第二部', '名を隠して、人の世へ', ['ch04', 'ch05', 'ch06', 'ch07']),
 ('本編　第三部', '白い都から、最後の橋まで', ['ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'epilogue']),
 ('寄り道の章', '本編の章のあいだにある、もう一つの時間（第一・五章は第一章のあと、という具合）', ['ch01_5', 'ch02_5', 'ch03_5', 'ch04_5', 'ch05_5', 'ch06_5', 'ch07_5', 'ch08_5', 'ch11_5', 'ch12_5']),
 ('番外編', 'エピローグのあとの物語（順番に読むのをおすすめします）', ['bangai1', 'bangai2', 'bangai3', 'bangai4', 'bangai5', 'bangai6']),
]
TRACKS = [['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','epilogue'],
          ['ch01_5','ch02_5','ch03_5','ch04_5','ch05_5','ch06_5','ch07_5','ch08_5','ch11_5','ch12_5'],
          ['bangai1','bangai2','bangai3','bangai4','bangai5','bangai6']]
HEAD = re.compile(r'^(第[^　]+章|四天王編|番外編[一二三四五六七八九十]|エピローグ)　(.+)$')
NUM = re.compile(r'^[一二三四五六七八九十]+$')
def clean(s):
    s = re.sub(r'^#+\s*', '', s.strip()); s = s.replace('**', '').replace('*', '')
    return s.strip()
def parse(fid):
    lines = open(os.path.join(NOV, fid + '.md'), encoding='utf8').read().split('\n')
    title = None; secs = [{'h': None, 'p': []}]
    for ln in lines:
        t = clean(ln)
        if not t: continue
        if title is None:
            title = re.sub(r'（[^）]*版）', '', t).strip(); continue
        if NUM.match(t): secs.append({'h': t, 'p': []}); continue
        secs[-1]['p'].append(t)
    secs = [s for s in secs if s['p'] or s['h']]
    m = HEAD.match(title)
    if not m: sys.exit('見出しが読めない: ' + fid + ' ' + title)
    chars = sum(len(p) for s in secs for p in s['p'])
    return dict(id=fid, label=m.group(1), title=m.group(2), chars=chars, sections=secs)
# 名の欠片の24人の短編（docs/novel/names.md。「# **名の欠片　名前　題**」で始まる24編）
NAME_IDS = ['isana', 'asagi', 'tomari', 'nogiku', 'fuki', 'tane', 'tsuyukusa', 'shii', 'yuzuriha', 'hagane', 'sumi', 'tatara',
            'susuki', 'nazuna', 'kuzuha', 'shiroe', 'mikage', 'uta', 'akane', 'kuroha', 'yamabuki', 'utsuho', 'yomiji', 'homura']
def parse_names():
    items = []; cur = None
    for ln in open(os.path.join(NOV, 'names.md'), encoding='utf8').read().split('\n'):
        t = clean(ln)
        if not t: continue
        m = re.match(r'^名の欠片　(\S+)　(.+)$', t)
        if m:
            cur = dict(label=m.group(1), title=m.group(2), sections=[{'h': None, 'p': []}]); items.append(cur); continue
        if cur is not None: cur['sections'][0]['p'].append(t)
    if len(items) != len(NAME_IDS): sys.exit('名の欠片の編数が合わない: %d' % len(items))
    for it, i in zip(items, NAME_IDS):
        it['id'] = 'meishi_' + i; it['chars'] = sum(len(p) for p in it['sections'][0]['p'])
    return items
groups = []
for name, note, ids in ORDER:
    groups.append(dict(name=name, note=note, items=[parse(i) for i in ids]))
groups.append(dict(name='名の欠片の二十四人', note='名を呼ばれなくなる前の、それぞれの一日。本編・寄り道の章で出会う人たちの、もう少し前の話', items=parse_names()))
TRACKS.append(['meishi_' + i for i in NAME_IDS])
# 試作（docs/novel/plus/。ユーザーが読んで決めるまでの試し読み。本編の原文は書き換えない）
def parse_plus(fn, fid, label, title):
    lines = open(os.path.join(NOV, 'plus', fn), encoding='utf8').read().split('\n')
    secs = [{'h': None, 'p': []}]; first = True
    for ln in lines:
        t = clean(ln)
        if not t: continue
        if first: first = False; continue
        if NUM.match(t): secs.append({'h': t, 'p': []}); continue
        secs[-1]['p'].append(t)
    secs = [x for x in secs if x['p'] or x['h']]
    return dict(id=fid, label=label, title=title, chars=sum(len(q) for x in secs for q in x['p']), sections=secs)
groups.append(dict(name='試作（読んで決めるための試し読み）', note='本編の加筆と前日譚の、見本です。気に入ったら、同じ形で全体に広げます', items=[
    parse_plus('ch01_plus.md', 'plus_ch01', '第一章（加筆）', '黄泉の大地、焼ける'),
    parse_plus('ch02_plus.md', 'plus_ch02', '第二章（加筆）', '静かなる迎撃'),
    parse_plus('ch03_plus.md', 'plus_ch03', '第三章（加筆）', '問うても答えぬ者'),
    parse_plus('ch04_plus.md', 'plus_ch04', '第四章（加筆）', '同じ受付の前で'),
    parse_plus('ch05_plus.md', 'plus_ch05', '第五章（加筆）', '中立という名の森'),
    parse_plus('ch06_plus.md', 'plus_ch06', '第六章（加筆）', '炉の火は消えず'),
    parse_plus('ch07_plus.md', 'plus_ch07', '第七章（加筆）', '井戸の水を、皆で'),
    parse_plus('ch08_plus.md', 'plus_ch08', '第八章（加筆）', '白い都の、静かな夜'),
    parse_plus('ch09_plus.md', 'plus_ch09', '第九章（加筆）', '削られた名'),
    parse_plus('ch10_plus.md', 'plus_ch10', '第十章（加筆）', 'それでも、俺の知っているベルだ'),
    parse_plus('ch11_plus.md', 'plus_ch11', '第十一章（加筆）', '受けきる者'),
    parse_plus('ch12_plus.md', 'plus_ch12', '第十二章（加筆）', '名を呼ぶ者'),
    parse_plus('epilogue_plus.md', 'plus_epilogue', 'エピローグ（加筆）', '橋の上で'),
    parse_plus('prequel_haniyasu.md', 'plus_haniyasu', '前日譚', 'ハニヤス　最初の一株'),
    parse_plus('prequel_mikazuchi.md', 'plus_mikazuchi', '前日譚', 'ミカヅチ　受けきった日'),
    parse_plus('prequel_susano.md', 'plus_susano', '前日譚', 'スサノ　手の形'),
    parse_plus('prequel_nakime.md', 'plus_nakime', '前日譚', 'ナキメ　底の見えない人'),
    parse_plus('prequel_omoika.md', 'plus_omoika', '前日譚', 'オモイカ　十四の名'),
    parse_plus('prequel_amatsu.md', 'plus_amatsu', '前日譚', 'アマツ王　穏やかな始まり'),
    parse_plus('prequel_takeru.md', 'plus_takeru', '前日譚', 'タケル　胸にあるもの'),
    parse_plus('prequel_oonamuchi.md', 'plus_oonamuchi', '前日譚', 'オオナムチ　同じ井戸の水'),
    parse_plus('prequel_bell.md', 'plus_bell', '前日譚', 'ベルイザナ　宮の書庫'),
    parse_plus('prequel_konoha.md', 'plus_konoha', '前日譚', 'コノハ　半分の耳'),
    parse_plus('prequel_kaname.md', 'plus_kaname', '前日譚', 'カナメ　火床の夜明け'),
    parse_plus('prequel_kotoshiro.md', 'plus_kotoshiro', '前日譚', 'コトシロ　目利きの帳面'),
    parse_plus('prequel_uzume.md', 'plus_uzume', '前日譚', 'ウズメ　杭を抜く朝'),
    parse_plus('prequel_hieda.md', 'plus_hieda', '前日譚', 'ヒエダ　糸の見える目'),
    parse_plus('prequel_kunado.md', 'plus_kunado', '前日譚', 'クナド　足音のない道'),
    parse_plus('prequel_sukuna.md', 'plus_sukuna', '前日譚', 'スクナ　袋の口')]))
TRACKS.append(['plus_ch01', 'plus_ch02', 'plus_ch03', 'plus_ch04', 'plus_ch05', 'plus_ch06', 'plus_ch07', 'plus_ch08', 'plus_ch09', 'plus_ch10', 'plus_ch11', 'plus_ch12', 'plus_epilogue', 'plus_haniyasu', 'plus_mikazuchi', 'plus_susano', 'plus_nakime', 'plus_omoika', 'plus_amatsu', 'plus_takeru', 'plus_oonamuchi', 'plus_bell', 'plus_konoha', 'plus_kaname', 'plus_kotoshiro', 'plus_uzume', 'plus_hieda', 'plus_kunado', 'plus_sukuna'])
data = json.dumps(dict(groups=groups, tracks=TRACKS), ensure_ascii=False).replace('</', '<\\/')
tpl = open(os.path.join(ROOT, 'tools', 'novel_site', 'template.html'), encoding='utf8').read()
out = os.path.join(ROOT, 'docs', '小説サイト.html')
open(out, 'w', encoding='utf8').write(tpl.replace('__DATA__', data))
print(out, sum(c['chars'] for g in groups for c in g['items']), '字', sum(len(g['items']) for g in groups), '編')
