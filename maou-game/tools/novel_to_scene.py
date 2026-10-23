# このファイルの役目：寄り道の章の小説（docs/novel/ch04_5.md など）を、ゲームで読める場面にする道具（作る人用）。
# 小説を直したら「python3 tools/novel_to_scene.py」で js/data/story/sidestory.js を作り直す（手で書き換えない）。
# 黒い画面に、段落を一つずつ語りとして出す。章の題は見出し、場面の区切り（# **二** など）は暗転で区切る。
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ['ch01_5', 'ch02_5', 'ch03_5', 'ch04_5', 'ch05_5', 'ch06_5', 'ch07_5', 'ch08_5', 'ch11_5', 'ch12_5',
         'bangai1', 'bangai2', 'bangai3', 'bangai4', 'bangai5', 'bangai6']

def head(line):
    m = re.match(r'^#\s*\*\*(.+?)\*\*\s*$', line.strip()) or re.match(r'^#\s*(.+?)\s*$', line.strip())
    return m.group(1).strip() if m else None

def scene(name):
    lines = open(os.path.join(ROOT, 'docs', 'novel', name + '.md'), encoding='utf-8').read().splitlines()
    title = head(lines[0])
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
for f in FILES:
    cmds = scene(f)
    total += sum(len(c.get('text', '')) for c in cmds)
    out.append('  E.side_%s = %s;' % (f, json.dumps(cmds, ensure_ascii=False)))
out += ['})();', '']
open(os.path.join(ROOT, 'js', 'data', 'story', 'sidestory.js'), 'w', encoding='utf-8').write('\n'.join(out))
print('sidestory.js:', len(FILES), 'scenes,', total, 'chars')
