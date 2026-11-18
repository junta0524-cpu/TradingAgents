# このファイルの役目：Gemini で作った背景のドット絵を、ゲームの画面の大きさ（480×320）に縮める道具（作る人用。ゲーム本体では使わない）。
# 3:2 になるようにまん中を切り出してから縮め、96色にそろえる（ファイルを小さくするため）。使い方：python3 tools/art_bg.py 元.jpg 先.png [元2 先2 …]
# 戦いの背景は「--battle」を先に付ける：480×232（戦闘画面の上の、敵が立つ所）。縦は下寄り（地面が多く入るように）で切り出す。
import sys
from PIL import Image
def proc(src, dst, w=480, h=320, colors=96, anchor=0.5):
    im = Image.open(src).convert('RGB'); W, H = im.size
    if W * h > H * w: cw = H * w // h; im = im.crop(((W - cw) // 2, 0, (W - cw) // 2 + cw, H))
    else: ch = W * h // w; y0 = int((H - ch) * anchor); im = im.crop((0, y0, W, y0 + ch))
    im = im.resize((w, h), Image.BOX).quantize(colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    im.save(dst, optimize=True)
args = sys.argv[1:]
battle = bool(args) and args[0] == '--battle'
if battle: args = args[1:]
for s, d in zip(args[0::2], args[1::2]):
    if battle: proc(s, d, 480, 232, anchor=0.7)
    else: proc(s, d)
