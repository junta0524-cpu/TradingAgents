# このファイルの役目：Gemini で作った顔グラ（バストアップ）を、会話の窓の顔（64×64）に縮める道具（作る人用。ゲーム本体では使わない）。
# 使い方：python3 tools/art_face.py 元.jpg 先.png key|keep …（key＝まわりの一色の背景を透明にする／keep＝背景ごと使う）
import sys, numpy as np
from PIL import Image
from collections import deque
def face(src, dst, mode, size=64, colors=64, tol=90):
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); H, W = a.shape[:2]
    alpha = np.full((H, W), 255, np.uint8)
    if mode == 'key':
        ref = np.median(np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3)]), axis=0)
        seen = np.zeros((H, W), bool); q = deque()
        for x in range(W): q.append((0, x))
        for y in range(H): q.append((y, 0)); q.append((y, W - 1))
        while q:
            y, x = q.popleft()
            if y < 0 or x < 0 or y >= H or x >= W or seen[y, x]: continue
            if np.abs(a[y, x] - ref).sum() > tol: continue
            seen[y, x] = True; q.extend(((y+1, x), (y-1, x), (y, x+1), (y, x-1)))
        alpha[seen] = 0
    img = Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), 'RGBA')
    sm = img.convert('RGBa').resize((size, size), Image.BOX).convert('RGBA')
    arr = np.asarray(sm).copy(); op = arr[..., 3] >= 110
    if mode == 'key':   # 縁に残ったマゼンタのにじみを消す
        r, g, b = (arr[..., k].astype(int) for k in range(3))
        op &= ~((g < 0.65 * np.minimum(r, b)) & (r > 100) & (b > 80))
    rgb = Image.fromarray(arr[..., :3]).quantize(colors, method=Image.Quantize.FASTOCTREE).convert('RGB')
    Image.fromarray(np.dstack([np.asarray(rgb), np.where(op, 255, 0).astype(np.uint8)]), 'RGBA').save(dst)
if __name__ == '__main__':
    args = sys.argv[1:]
    for i in range(0, len(args), 3): face(args[i], args[i + 1], args[i + 2])
