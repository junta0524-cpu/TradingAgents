# このファイルの役目：小説の加筆版（docs/novel/plus/ch0X_plus.md）で足した地の文を、ゲームの場面データ（js/data/story/ch0X.js）にも入れる道具（作る人用）。
# やり方：加筆版で足された段落ごとに、すぐ前の「元の文」を目印にして、場面データの同じ文（N(...)／S(...)）の直後に N('足した文') を差し込む。
# 目印がゲームの場面にない所（ゲームでは省いた文の後ろ）は、入れずに数だけ報告する。何度流しても、同じ文は二重に入らない。
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAIRS = [('ch01', 'ch01_plus'), ('ch02', 'ch02_plus'), ('ch03', 'ch03_plus'), ('ch04', 'ch04_pilot'), ('ch06', 'ch06_plus'), ('ch09', 'ch09_plus'), ('ch10', 'ch10_plus'), ('ch11', 'ch11_plus'), ('ch12', 'ch12_plus')]

def lines(path):
    out = []
    for l in open(path, encoding='utf-8').read().split('\n'):
        t = re.sub(r'^#+\s*', '', l.strip()).replace('**', '')
        if t: out.append(t)
    return out

def jsq(s): return s.replace('\\', '\\\\').replace("'", "\\'")

total_in = total_skip = 0
for orig_name, plus_name in PAIRS:
    orig = lines(os.path.join(ROOT, 'docs', 'novel', orig_name + '.md'))[1:]
    plus = lines(os.path.join(ROOT, 'docs', 'novel', 'plus', plus_name + '.md'))[1:]
    oset = set(orig)
    adds = []   # (直前の元の文, 足した文)
    prev = None
    for t in plus:
        if t in oset: prev = t
        else: adds.append((prev, t))
    groups = []   # 同じ目印に続けて足した文は、順番どおりまとめて差し込む
    for anchor, text in adds:
        if groups and groups[-1][0] == anchor: groups[-1][1].append(text)
        else: groups.append((anchor, [text]))
    path = os.path.join(ROOT, 'js', 'data', 'story', orig_name + '.js')
    src = open(path, encoding='utf-8').read()
    ins = skip = 0
    for anchor, texts in groups:
        texts = [('（' + t[1:-1] + '）') if t.startswith('(') and t.endswith(')') else t for t in texts]
        texts = [t for t in texts if "N('" + jsq(t) + "')" not in src]   # もう入っている文は入れない
        if not texts: continue
        if anchor is None: skip += len(texts); continue
        a = jsq(anchor)
        m = re.search(r"^([ \t]*)(?:N|S\([^,]+,)\s*\(?'" + re.escape(a) + r"'\)?,?[^\n]*\n", src, re.M) or re.search(r"^([ \t]*)[^\n]*'" + re.escape(a) + r"'[^\n]*\n", src, re.M)
        if not m: skip += len(texts); continue
        block = ''.join(m.group(1) + "N('" + jsq(t) + "'),\n" for t in texts)
        src = src[:m.end()] + block + src[m.end():]
        ins += len(texts)
    open(path, 'w', encoding='utf-8').write(src)
    print(orig_name, '足した文', len(adds), '→ 入れた', ins, '／目印なしで見送り', skip)
    total_in += ins; total_skip += skip
print('合計 入れた', total_in, '見送り', total_skip)
