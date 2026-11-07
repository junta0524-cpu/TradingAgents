# このファイルの役目：背景が渦などで一色でないボスの立ち絵を、OpenCV の GrabCut で人物だけ切り抜く（四天王の手合わせの絵で使った）。
# 引数：元 先 x0 y0 x1 y1 台の上端y [人物の箱 x0,y0,x1,y1 | 背景の箱 bx0,y0,x1,y1 | purple | dpurple:y | orange:x ...]
# 環境変数 KEEP（残すかたまりの大きさの割合）・CLEARPURPLE（その箱の中の紫を消す）。切り抜いたあと 128×128・96色にしてassets/enemies へ。
import sys, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]
x0, y0, x1, y1, floor = map(int, sys.argv[3:8])
img = cv2.imread(src); H, W = img.shape[:2]
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
mask[y0:y1, x0:x1] = cv2.GC_PR_BGD
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
for b in sys.argv[8:]:
    if b.startswith('purple'):
        pu = (hsv[..., 0] > 120) & (hsv[..., 0] < 150) & (hsv[..., 1] > 90) & (hsv[..., 2] > 70); mask[pu & (mask != cv2.GC_FGD)] = cv2.GC_BGD; continue
    if b.startswith('orange'):
        x_max = int(b.split(':')[1])
        orr = (hsv[..., 0] < 20) & (hsv[..., 1] > 140) & (hsv[..., 2] > 150); orr[:, x_max:] = False
        mask[orr & (mask != cv2.GC_FGD)] = cv2.GC_BGD; continue
    if b.startswith('dpurple'):
        y_min = int(b.split(':')[1])
        pu = (hsv[..., 0] > 115) & (hsv[..., 0] < 155) & (hsv[..., 1] > 60) & (hsv[..., 2] > 35); pu[:y_min] = False
        mask[pu & (mask != cv2.GC_FGD)] = cv2.GC_BGD; continue
    kind = cv2.GC_BGD if b[0] == 'b' else cv2.GC_FGD
    a, b2, c, d = map(int, b.lstrip('b').split(',')); mask[b2:d, a:c] = kind
# マゼンタは必ず背景
mg = (hsv[..., 0] > 140) & (hsv[..., 0] < 165) & (hsv[..., 1] > 150) & (hsv[..., 2] > 150)
mask[mg] = cv2.GC_BGD
bgd = np.zeros((1, 65)); fgd = np.zeros((1, 65))
cv2.grabCut(img, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = ((mask == 1) | (mask == 3)).astype(np.uint8)
fg[floor:, :] = 0
n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
if n > 1:
    keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > st[1:, cv2.CC_STAT_AREA].max() * float(__import__('os').environ.get('KEEP', '0.03'))]; fg = np.isin(lab, keep).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
clr = __import__('os').environ.get('CLEARPURPLE')
if clr:
    a, b2, c, d = map(int, clr.split(','))
    pu = (hsv[..., 0] > 105) & (hsv[..., 0] < 160) & (hsv[..., 1] > 50) & (hsv[..., 2] > 30)
    sub = np.zeros_like(fg, bool); sub[b2:d, a:c] = True; fg[sub & pu] = 0
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA); rgba[..., 3] = fg * 255
cv2.imwrite(dst, rgba)
