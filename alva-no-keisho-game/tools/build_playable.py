# -*- coding: utf-8 -*-
u"""遊べる一枚ページを組み立てる。

tools/playable_shell.html の /* GAME */ の位置に、絵(data: URI)と
index.html が読む順のスクリプトをすべて流し込む。

  python3 tools/build_playable.py 出力先.html
"""
import base64, json, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(out):
    shell = open(os.path.join(ROOT, 'tools', 'playable_shell.html'), encoding='utf-8').read()
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    scripts = re.findall(r'<script src="([^"]+)"></script>', html)
    assets = {}
    adir = os.path.join(ROOT, 'assets')
    for d, _, files in os.walk(adir):
        for f in sorted(files):
            if f.startswith('.'):
                continue
            p = os.path.join(d, f)
            mime = mimetypes.guess_type(p)[0] or 'application/octet-stream'
            data = base64.b64encode(open(p, 'rb').read()).decode('ascii')
            assets[os.path.relpath(p, adir).replace(os.sep, '/')] = 'data:%s;base64,%s' % (mime, data)
    parts = ['window.__INLINE_ASSETS__ = %s;\n' % json.dumps(assets, ensure_ascii=False)]
    for src in scripts:
        code = open(os.path.join(ROOT, src), encoding='utf-8').read()
        # 流し込んだ先で </script> が閉じタグと取り違えられないように
        parts.append('\n/* ===== %s ===== */\n%s' % (src, code.replace('</script>', '<\\/script>')))
    page = shell.replace('/* GAME */\n', ''.join(parts) + '\n', 1)
    open(out, 'w', encoding='utf-8').write(page)
    print(u'%s  (%d KB, スクリプト %d本, 絵 %d枚)' % (out, len(page.encode('utf-8')) // 1024, len(scripts), len(assets)))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'alva-playable.html')
