# このファイルの役目：小説（加筆版 docs/novel/plus/chNN_plus.md）の地の文のうち、ゲームの場面データ（js/data/story/chNN.js）にまだ無い文を、N('…') で差し込む道具（作る人用。ゲームでは読み込まない）。
# やり方：加筆版の各行について、ゲームの場面にあるか（記号を除いて一致、または4文字の並びが75%以上重なる）を調べ、無い行を「すぐ前にある行」のあとに順番どおり差し込む。
# 目印にできるのは、N(...)／S(...)で一行が閉じている行だけ（途中の行には入れない）。もう入っている文は二重に入れない。何度流しても同じ結果になる。
import os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def norm(t): return re.sub(r"[\s、。，．,.・―ー…！？!?「」『』（）()　\-–—\"'’‘“”]", "", t)
def jsq(s): return s.replace('\\', '\\\\').replace("'", "\\'")
def grams(n): return set(n[i:i+4] for i in range(len(n) - 3))
CH = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','epilogue']
SIMPLE = re.compile(r"^(\s*)(?:N|S\([^)]*?\))\s*\(?'.*'\)?,\s*$")   # 一行で閉じた N('…'), / S(BELL, '…'),
def closed(line):
    return SIMPLE.match(line) and line.count('(') == line.count(')') and line.count('{') == line.count('}')
total_in = total_skip = 0
for ch in CH:
    path = os.path.join(ROOT, 'js', 'data', 'story', ch + '.js')
    src = open(path, encoding='utf-8').read().split('\n')
    plus = [re.sub(r'^#+\s*', '', l.strip()).replace('**', '') for l in open(os.path.join(ROOT, 'docs', 'novel', 'plus', ch + '_plus.md'), encoding='utf-8').read().split('\n')[1:]]
    plus = [l for l in plus if l]
    # 全場面データ（他のファイルにある文も「ある」とみなす）
    allsrc = ''
    for f in glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True):
        if not f.endswith('art.js'): allsrc += open(f, encoding='utf-8').read()
    nall = norm(allsrc); gall = grams(nall)
    lnorm = [norm(l) for l in src]
    lgram = [grams(x) if len(x) > 3 else set() for x in lnorm]
    def locate(n):
        """この行がある（またはほぼある）場面データの行番号。無ければ None"""
        for i, x in enumerate(lnorm):
            if n and n in x and closed(src[i]): return i
        for i, x in enumerate(lnorm):
            if n and n in x: return -1   # ある（ただし目印にできない行）
        g = grams(n)
        if not g: return -1
        best, bi = 0, None
        for i, gg in enumerate(lgram):
            if gg:
                r = len(g & gg) / len(g)
                if r > best: best, bi = r, i
        if best >= 0.75: return bi if closed(src[bi]) else -1
        return None
    ins = {}; anchor = None; n_in = n_skip = 0
    existing = '\n'.join(src)
    for t in plus:
        t = ('（' + t[1:-1] + '）') if t.startswith('(') and t.endswith(')') else t
        n = norm(t)
        if len(n) < 4: continue
        pos = locate(n)
        if pos is not None:
            if pos >= 0: anchor = pos
            continue
        # 他のファイルにある文は入れない
        if n in nall: continue
        g = grams(n)
        if g and len(g & gall) / len(g) >= 0.75: continue
        if "N('" + jsq(t) + "')" in existing: continue
        if anchor is None: n_skip += 1; continue
        ins.setdefault(anchor, []).append(t); n_in += 1
    out = []
    for i, l in enumerate(src):
        out.append(l)
        if i in ins:
            ind = SIMPLE.match(l).group(1)
            for t in ins[i]: out.append(ind + "N('" + jsq(t) + "'),")
    open(path, 'w', encoding='utf-8').write('\n'.join(out))
    print(ch, '入れた', n_in, '／先頭で目印なし', n_skip)
    total_in += n_in; total_skip += n_skip
print('合計 入れた', total_in, '見送り', total_skip)
