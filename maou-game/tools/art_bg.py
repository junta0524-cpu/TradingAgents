# このファイルの役目：Gemini で作った背景のドット絵を、ゲームの画面の大きさ（480×320）に縮める道具（作る人用。ゲーム本体では使わない）。
# 3:2 になるようにまん中を切り出してから縮め、96色にそろえる（ファイルを小さくするため）。使い方：python3 tools/art_bg.py 元.jpg 先.png [元2 先2 …]
import sys
from PIL import Image
def proc(src, dst, w=480, h=320, colors=96):
    im = Image.open(src).convert('RGB'); W, H = im.size
    if W * h > H * w: cw = H * w // h; im = im.crop(((W - cw) // 2, 0, (W - cw) // 2 + cw, H))
    else: ch = W * h // w; im = im.crop((0, (H - ch) // 2, W, (H - ch) // 2 + ch))
    im = im.resize((w, h), Image.BOX).quantize(colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    im.save(dst, optimize=True)
for s, d in zip(sys.argv[1::2], sys.argv[2::2]): proc(s, d)
