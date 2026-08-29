# -*- coding: utf-8 -*-
"""生成画像 → ゲーム用スプライト。マゼンタ抜き・切り詰め・縮小・色数整理まで。"""
from PIL import Image
import numpy as np, os, sys

U = "/root/.claude/uploads/c8bfb8ca-f344-5633-9fc3-06e6b7bb1467/"

def magenta_mask(a, tol=80):
    r, g, b = a[:,:,0].astype(int), a[:,:,1].astype(int), a[:,:,2].astype(int)
    # 赤と青が高く緑が低い = マゼンタ。JPEG のにじみを見込んで広めに取る
    return (r > 255-tol) & (b > 255-tol) & (g < 110)

def load_rgba(path):
    im = Image.open(path).convert("RGB")
    a = np.array(im)
    m = magenta_mask(a)
    rgba = np.dstack([a, np.where(m, 0, 255).astype(np.uint8)])
    return Image.fromarray(rgba, "RGBA"), m

def trim(img, mask):
    """マゼンタでない部分の外接矩形まで切り詰める"""
    ys, xs = np.where(~mask)
    if len(xs) == 0: return img
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max())+1, int(ys.max())+1))

def despill(img):
    """JPEG のにじみで縁に残るマゼンタを、隣の不透明な色で塗り替える"""
    a = np.array(img).astype(int)
    rgb, al = a[:,:,:3], a[:,:,3]
    edge = (al > 0) & (rgb[:,:,0] > 150) & (rgb[:,:,2] > 150) & (rgb[:,:,1] < 120)
    a[edge, 3] = 0
    return Image.fromarray(a.astype(np.uint8), "RGBA")

def shrink(img, w, h):
    """面積平均で縮小し、半端な半透明を切り捨てて輪郭を立てる"""
    small = img.resize((w, h), Image.BOX)
    a = np.array(small)
    a[:,:,3] = np.where(a[:,:,3] >= 128, 255, 0)
    return Image.fromarray(a, "RGBA")

def quantize(img, colors=24):
    """色数を落としてドット絵らしい面にする(透明部分は保持)"""
    a = np.array(img)
    alpha = a[:,:,3].copy()
    rgb = Image.fromarray(a[:,:,:3], "RGB").quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")
    out = np.dstack([np.array(rgb), alpha])
    return Image.fromarray(out, "RGBA")

def make_tile(path, size=32):
    img, m = load_rgba(path)
    img = trim(img, m)                       # 外周のマゼンタ枠を落とす
    img = img.convert("RGB").resize((size, size), Image.BOX)
    return quantize(img.convert("RGBA"), 16)

def make_sprite(path, w, h):
    """枠ごと素直に縮小する。

    以前は「不透明部分の外接矩形で切り出して、縦を h いっぱいに引き伸ばす」
    という処理だった。これだと 2頭身で描いてもらった絵が縦に1.5倍に伸びて
    3頭身になり、しかも縮小の倍率が半端になってドットの格子が壊れていた。
    いまはプロンプト側で 32×48ドットの枠ごと描いてもらうので、枠のまま落とす。
    """
    img, m = load_rgba(path)
    img = despill(img)
    # 送られてきた絵がすでに w:h の枠で描かれていれば、そのまま縮めるのが正解。
    # 頭上の余白も指示どおりの位置に残る。
    if abs(img.width / img.height - w / h) < 0.02:
        return quantize(shrink(img, w, h), 24)
    # 枠がずれている絵だけ、比率を保ったまま入れて下寄せする
    sc = min(img.width / w, img.height / h)
    img = shrink(img, max(1, round(img.width / sc)), max(1, round(img.height / sc)))
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(img, ((w - img.width) // 2, h - img.height), img)
    return quantize(canvas, 24)

def make_walk_sheet(path, frames=3, w=32, h=48):
    """歩行シート。3コマを横に並べたまま 96×48 に落とす。

    ゲーム側(renderer.js drawSprite)は img.width/frames で1コマを切り出し、
    それを 32×48 に描くので、コマの縦横比を 2:3 に保ったまま渡す必要がある。
    """
    img, m = load_rgba(path)
    img = despill(img)
    fw = img.width // frames
    out = Image.new("RGBA", (w * frames, h), (0, 0, 0, 0))
    for i in range(frames):
        cell = img.crop((i * fw, 0, (i + 1) * fw, img.height))
        out.paste(shrink(cell, w, h), (i * w, 0))
    return quantize(out, 24)

def zoom(img, f=8):
    return img.resize((img.width*f, img.height*f), Image.NEAREST)

TILES = [("tile_grass","762d18d3-image.jpg"), ("tile_road","816fc95b-image.jpg")]
CHARS = [("rota","de5a3ae3-image.jpg"), ("elrode","59a77a55-image.jpg"),
         ("celestia","74dd9a06-image.jpg"), ("garai","44d84937-image.jpg"),
         ("npc_king","95ed5946-image.jpg")]

os.makedirs("out32", exist_ok=True); os.makedirs("out48", exist_ok=True)
sheet_rows = []
for name, f in TILES:
    for size, d in ((32,"out32"), (48,"out48")):
        t = make_tile(U+f, size); t.save("%s/%s.png" % (d, name))
    print("tile ok:", name)

for name, f in CHARS:
    for (w,h,d) in ((32,32,"out32"), (32,48,"out48")):
        s = make_sprite(U+f, w, h); s.save("%s/%s.png" % (d, name))
    print("char ok:", name)

# 見比べ用の一枚絵をつくる
def contact(dirname, items, cellw, cellh, path):
    f = 6
    W = len(items)*(cellw*f+10)+10
    H = cellh*f+10
    sheet = Image.new("RGB", (W, H), (24,28,44))
    x = 10
    for n in items:
        im = Image.open("%s/%s.png" % (dirname, n)).convert("RGBA")
        bg = Image.new("RGBA", im.size, (60,70,95,255)); bg.alpha_composite(im)
        sheet.paste(zoom(bg.convert("RGB"), f), (x, 5)); x += cellw*f+10
    sheet.save(path)

contact("out32", ["tile_grass","tile_road","rota","elrode","celestia","garai","npc_king"], 32, 32, "cmp32.png")
contact("out48", ["rota","elrode","celestia","garai","npc_king"], 32, 48, "cmp48.png")
print("done")
