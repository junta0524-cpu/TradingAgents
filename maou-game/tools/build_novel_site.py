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
groups = []
for name, note, ids in ORDER:
    groups.append(dict(name=name, note=note, items=[parse(i) for i in ids]))
data = json.dumps(dict(groups=groups, tracks=TRACKS), ensure_ascii=False).replace('</', '<\\/')
tpl = open(os.path.join(ROOT, 'tools', 'novel_site', 'template.html'), encoding='utf8').read()
out = os.path.join(ROOT, 'docs', '小説サイト.html')
open(out, 'w', encoding='utf8').write(tpl.replace('__DATA__', data))
print(out, sum(c['chars'] for g in groups for c in g['items']), '字', sum(len(g['items']) for g in groups), '編')
