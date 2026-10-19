# このファイルの役目：assets/ の絵（敵・顔・背景）を、ゲームで読める js/data/art.js にまとめ直す道具（作る人用）。
# fetch を使わないため、PNG を data URI の文字にして入れる。絵を足したら「python3 tools/art_build.py」を流す。
import base64, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# 話し手の名前 → 顔の絵（assets/faces/<id>.png）
FACE_NAMES = {'オオナムチ': 'oonamuchi', 'ベル': 'bell', 'ベルイザナ': 'bell_true', 'スクナ': 'sukuna', 'コノハ': 'konoha', 'カナメ': 'kaname', 'コトシロ': 'kotoshiro', 'ウズメ': 'uzume', 'ヒエダ': 'hieda', 'クシナダ': 'kushinada', 'イシコリドメ': 'ishikoridome', 'サルタヒコ': 'sarutahiko', 'ユウ': 'yuu', 'タケル': 'takeru', 'アマツ王': 'amatsu'}

def uris(folder):
    d = os.path.join(ROOT, 'assets', folder)
    out = {}
    for f in sorted(os.listdir(d)):
        if f.endswith('.png'):
            out[f[:-4]] = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
    return out

L = ["// このファイルの役目：Gemini で作ったドット絵（assets/ の PNG）を、ゲームで読めるように文字にして入れておく所（fetch を使わないため）。",
     "// enemies：敵の id ごとの絵（64×64、背景は透明。js/core/sprite.js の drawEnemy）。faces：顔グラ（64×64。会話の窓の左、js/core/message.js）。backgrounds：場面の背景（480×320。js/core/backdrop.js）。battles：戦いの背景（480×232。js/scenes/battle.js）。faceNames：話し手の名前 → 顔。",
     "// 手で書き換えない：assets/ に絵を入れて「python3 tools/art_build.py」で作り直す。",
     "(function () {", "  const G = window.GAME = window.GAME || {};", "  G.DATA = G.DATA || {};", "  G.DATA.art = {"]
for key, folder in (('enemies', 'enemies'), ('faces', 'faces'), ('backgrounds', 'backgrounds'), ('battles', 'battle')):
    L.append(f"    {key}: {{")
    for k, v in uris(folder).items(): L.append(f"      {k}: '{v}',")
    L.append("    },")
L.append("    faceNames: { " + ", ".join(f"'{n}': '{i}'" for n, i in FACE_NAMES.items()) + " },")
L += ["  };", "})();"]
open(os.path.join(ROOT, 'js', 'data', 'art.js'), 'w').write('\n'.join(L) + '\n')
print('art.js:', sum(len(x) for x in L), 'bytes')
