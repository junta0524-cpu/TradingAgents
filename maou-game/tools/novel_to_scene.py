# このファイルの役目：寄り道の章・前日譚・名の欠片の小説（docs/novel/ch04_5.md・plus/prequel_*.md・names.md）を、ゲームで読める場面にする道具（作る人用）。
# 小説を直したら「python3 tools/novel_to_scene.py」で js/data/story/sidestory.js を作り直す（手で書き換えない）。
# 黒い画面に、段落を一つずつ語りとして出す。章の題は見出し、場面の区切り（# **二** など）は暗転で区切る。
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ['ch01_5', 'ch02_5', 'ch03_5', 'ch04_5', 'ch05_5', 'ch06_5', 'ch07_5', 'ch08_5', 'ch11_5', 'ch12_5',
         'bangai1', 'bangai2', 'bangai3', 'bangai4', 'bangai5', 'bangai6']

def head(line):
    m = re.match(r'^#\s*\*\*(.+?)\*\*\s*$', line.strip()) or re.match(r'^#\s*(.+?)\s*$', line.strip())
    return m.group(1).strip() if m else None

PREQUELS = ['haniyasu', 'mikazuchi', 'susano', 'nakime', 'omoika', 'amatsu', 'takeru', 'oonamuchi', 'bell', 'konoha', 'kaname', 'kotoshiro', 'uzume']   # docs/novel/plus/prequel_<名>.md → side_prequel_<名>
NAME_IDS = ['isana', 'asagi', 'tomari', 'nogiku', 'fuki', 'tane', 'tsuyukusa', 'shii', 'yuzuriha', 'hagane', 'sumi', 'tatara',
            'susuki', 'nazuna', 'kuzuha', 'shiroe', 'mikage', 'uta', 'akane', 'kuroha', 'yamabuki', 'utsuho', 'yomiji', 'homura']   # docs/novel/names.md の順 → side_meishi_<id>

def read_lines(name):
    return open(os.path.join(ROOT, 'docs', 'novel', name + '.md'), encoding='utf-8').read().splitlines()

def names_chunks():
    chunks = []
    for line in read_lines('names'):
        if line.startswith('# **名の欠片'): chunks.append([line])
        elif chunks: chunks[-1].append(line)
    assert len(chunks) == len(NAME_IDS), len(chunks)
    return chunks

def scene(name, lines=None):
    lines = lines or read_lines(name)
    title = head(lines[0])
    title = re.sub(r'^名の欠片　', '', title)
    text, sub = (title.split('　', 1) + [''])[:2]
    cmds = [{'t': 'fade', 'to': 1}, {'t': 'title', 'text': text, 'sub': sub}]
    first = True
    for line in lines[1:]:
        h = head(line)
        if h is not None:
            if not first: cmds += [{'t': 'wait', 'frames': 30}]
            first = False
            continue
        line = line.strip()
        if line: cmds.append({'t': 'nar', 'text': line})
    cmds += [{'t': 'wait', 'frames': 30}, {'t': 'fade', 'to': 0}]
    return cmds

out = ['// このファイルの役目：寄り道の章（docs/novel の小説）を、ゲームで読める場面にしたもの。一覧と流す場所は js/data/sidestories.js。',
       '// 手で書き換えない：小説を直したら「python3 tools/novel_to_scene.py」で作り直す。',
       '(function () {', '  const G = window.GAME = window.GAME || {};', '  const E = G.DATA.events;']
total = 0
jobs = [('side_' + f, scene(f)) for f in FILES]
jobs += [('side_prequel_' + n, scene('plus/prequel_' + n)) for n in PREQUELS]
jobs += [('side_meishi_' + i, scene('names', c)) for i, c in zip(NAME_IDS, names_chunks())]
for sid, cmds in jobs:
    total += sum(len(c.get('text', '')) for c in cmds)
    out.append('  E.%s = %s;' % (sid, json.dumps(cmds, ensure_ascii=False)))
out += ['})();', '']
open(os.path.join(ROOT, 'js', 'data', 'story', 'sidestory.js'), 'w', encoding='utf-8').write('\n'.join(out))
print('sidestory.js:', len(jobs), 'scenes,', total, 'chars')
