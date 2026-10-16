# このファイルの役目：Gemini で作ったドット絵（マゼンタの背景）を、ゲームの大きさに縮める道具（作る人用。ゲーム本体では使わない）。
# 背景を透明にし、絵の部分だけ切り出して正方形にし、64×64へ縮めて64色にそろえる。使い方：python3 tools/art_proc.py 元.jpg 先.png [元2 先2 …]
import sys, numpy as np
from PIL import Image
def proc(src, dst, size=64, colors=64):
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int)
    r, g, b = a[...,0], a[...,1], a[...,2]
    bg = (g < 0.6 * np.minimum(r, b)) & (r > 110) & (b > 90) & (np.abs(r - b) < 90)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    rgba = np.dstack([a.astype(np.uint8), alpha]); img = Image.fromarray(rgba, 'RGBA')
    ys, xs = np.where(~bg); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1; s = max(w, h)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(img.crop((x0, y0, x1 + 1, y1 + 1)), ((s - w) // 2, s - h))
    sm = sq.convert('RGBa').resize((size, size), Image.BOX).convert('RGBA')
    arr = np.asarray(sm).copy(); op = arr[...,3] >= 110
    rgb = Image.fromarray(arr[...,:3]).quantize(colors, method=Image.Quantize.FASTOCTREE).convert('RGB')
    out = np.dstack([np.asarray(rgb), np.where(op, 255, 0).astype(np.uint8)])
    Image.fromarray(out, 'RGBA').save(dst)
for s, d in zip(sys.argv[1::2], sys.argv[2::2]): proc(s, d)
