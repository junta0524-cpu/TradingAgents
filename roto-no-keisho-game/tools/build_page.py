# -*- coding: utf-8 -*-
import json
pr = json.load(open('prompts.json')); P, LABEL, PATH = pr['P'], pr['LABEL'], pr['PATH']
S = json.load(open('sections.json'))
TIER = {'early':'序盤','mid':'中盤','late':'終盤'}

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def row(key, cells):
    """最後の列に必ずコピーボタンを置く"""
    tds = ''.join(cells)
    return ('<tr>' + tds + '<td class="act"><button type="button" class="cbtn" '
            'data-k="%s">コピー</button></td></tr>' % key)

def bulk(keys, label):
    return ('<button type="button" class="bulk" data-ks="%s">%s(%d本)</button>'
            % (','.join(keys), label, len(keys)))

# ---- 各セクションの表 ----
tile_rows = ''
for k in S['tiles']:
    m = S['tilemeta'][k]
    tile_rows += row(k, [
        '<td class="glyph">%s</td>' % esc(m['ch']),
        '<td>%s</td>' % esc(m['use']),
        '<td><span class="sw" style="background:%s"></span><code>%s</code></td>' % (m['color'], m['color']),
        '<td><code>%s</code></td>' % PATH[k],
    ])

char_rows = ''
for k in S['chars']:
    char_rows += row(k, [
        '<td><strong>%s</strong></td>' % esc(LABEL[k]),
        '<td class="pri">%s</td>' % S['charmeta'][k]['pri'],
        '<td><code>%s</code></td>' % PATH[k],
    ])

walk_rows = ''
for cid, cname in S['walkchars']:
    wkeys = [cid + '_walk_' + d[0] for d in S['walkdirs']]
    walk_rows += ('<tr class="grp"><th colspan="3"><span class="gname">' + esc(cname) + '</span>'
                  '<span class="grule">3枚そろって1人ぶん</span></th>'
                  '<td class="act">' + bulk(wkeys, 'この人物') + '</td></tr>')
    for d in S['walkdirs']:
        k = cid + '_walk_' + d[0]
        walk_rows += row(k, [
            '<td>' + esc(d[1]) + '</td>',
            '<td><code>' + PATH[k] + '</code></td>',
            '<td></td>',
        ])

npc_rows = ''
for k in S['npcs']:
    npc_rows += row(k, ['<td>%s</td>' % esc(LABEL[k]), '<td><code>%s</code></td>' % PATH[k]])

boss_rows = ''
for k in S['bosses']:
    boss_rows += row(k, [
        '<td><strong>%s</strong></td>' % esc(LABEL[k]),
        '<td>%s</td>' % esc(S['bossmeta'][k]['place']),
        '<td><code>%s</code></td>' % PATH[k],
    ])

mob_rows = ''
for grp, keys in S['mobgroups'].items():
    mob_rows += ('<tr class="grp"><th colspan="4"><span class="gname">%s</span>'
                 '<span class="grule">%s</span></th>'
                 '<td class="act">%s</td></tr>'
                 % (esc(grp), esc(S['grouprule'][grp]), bulk(keys, 'この種族')))
    for k in keys:
        mob_rows += row(k, [
            '<td>%s</td>' % esc(LABEL[k]),
            '<td class="tier">%s</td>' % TIER[S['mobtier'][k]],
            '<td><code>%s</code></td>' % PATH[k],
            '<td></td>',
        ])

bg_rows = ''
for k in S['bgs']:
    bg_rows += row(k, [
        '<td>%s</td>' % esc(S['bgmeta'][k]['place']),
        '<td><code>%s</code></td>' % PATH[k],
    ])

ALL = S['tiles'] + S['chars'] + S['walk'] + S['npcs'] + S['bosses'] + \
      [k for ks in S['mobgroups'].values() for k in ks] + S['bgs']
PRIORITY_A = S['tiles'] + ['rota','elrode','celestia','garai'] + S['bosses']

COMMON = """これから、ドット絵のゲーム素材をいくつか作ってもらいます。
この会話の間は、以下のルールを常に守ってください。

【目指す絵柄】
スーパーファミコン期(1990年代前半)のドラゴンクエストのドット絵です。
アイロンビーズで組めるくらい、1ドットが四角くはっきりしていて、粒の大きさが揃っている。
「ドット絵風のイラスト」ではなく「本物のドット絵」を描いてください。

1. 指定されたドット数の絵を、1ドットを正方形ブロックとして拡大したサイズで描く。
   (例: 32×32のドット絵なら、1ドット=32pxとして1024×1024で描く)
   1ドットの中で色が変わらないこと。にじみ・ぼかし・グラデーション・半透明は使わない。
2. 色はひとつの素材につき3つまで ―― 基本色・影色・明色。中間色を足してなめらかにしない。
   画像全体で12〜16色に収める。色は濁らせず、はっきりした色を使う。光源は常に左上。
3. 輪郭は、その部位の色をぐっと暗くした色の1ドット線。いちばん暗い色でも
   #202020〜#302820 くらいの、わずかに色みの残る暗色にし、純粋な黒(#000000)は使わない。
   腕と胴、髪と顔のように、隣り合う部位の境目にも入れる。
4. 人物は2頭身。頭(髪を含む)が全身のおよそ45〜50%。首は描かない。
   手足は太さ2〜3ドットで指は描かず、胴は太く、肩幅は頭とほぼ同じ。
5. 髪(または兜・帽子)はひとつの塊として、顔の左右へ1〜3ドット張り出させる。
   この張り出した輪郭だけで誰なのか分かるように、人物ごとに形をはっきり変える。
6. 目はふたつ。ひとつにつき幅1ドット・高さ2ドットの縦長の暗色で、あいだは明るい肌色を1〜2ドット。
   白目・瞳孔・まつげ・眉・鼻は描かない。口は描いても1ドット。
   目は、髪に隠れていない"見えている顔"の縦のまんなかに置く。
7. この大きさでつぶれるものは最初から描かない ―― 爪、歯、耳の形、髪の一本一本、
   鎧の留め金、布の皺、刺繍、瞳のハイライト、頬の赤み、傷跡。
   残すのはシルエット・髪の色・服の色・持ち物の形の4つだけ。
8. 背景は透過ではなく、純粋なマゼンタ #FF00FF のベタ塗り。この色は被写体には絶対に使わない。
9. 1回につき1体(1枚)だけ描く。複数のポーズ・向き・キャラクターを並べない。
10. 画像の中に文字やロゴを入れない。

以降、私が渡す指示ごとに1枚ずつ描いてください。まず「了解」とだけ返してください。"""

WORKFLOW = """(1体目が気に入ったあと、2体目以降に貼るテキスト)

さきほどの絵柄・色数・頭身・線の太さ・目の描き方に完全に合わせて、次の1枚を描いてください。
同じシリーズの素材なので、絵柄がぶれると使えません。
サイズと背景マゼンタのルールも、さきほどと同じままにしてください。

【今回描くもの】
《ここに次の素材のプロンプトを貼る》"""

html = """<title>画素譜</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700;800&family=Noto+Serif+JP:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>
  :root{
    --parchment:#ece7da; --surface:#f7f3e9; --border:#cbbfa0;
    --text:#241f18; --text-muted:#6b6354;
    --gold:#96702a; --crimson:#8a3230;
    --code-bg:#232838; --code-text:#e2ddcd; --code-border:#3a4055;
    --shadow:0 1px 2px rgba(36,31,24,.06),0 4px 16px rgba(36,31,24,.06);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --parchment:#171b2b; --surface:#1f2438; --border:#333b57;
      --text:#e9e2cf; --text-muted:#a49b86;
      --gold:#d4af5a; --crimson:#d3807d;
      --code-bg:#121623; --code-text:#d8d2c0; --code-border:#333b57;
      --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.35);
    }
  }
  :root[data-theme="dark"]{
    --parchment:#171b2b; --surface:#1f2438; --border:#333b57;
    --text:#e9e2cf; --text-muted:#a49b86;
    --gold:#d4af5a; --crimson:#d3807d;
    --code-bg:#121623; --code-text:#d8d2c0; --code-border:#333b57;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.35);
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{margin:0;background:var(--parchment);color:var(--text);
    font-family:"Noto Serif JP","Shippori Mincho B1",serif;line-height:1.85;-webkit-font-smoothing:antialiased;}
  ::selection{background:var(--gold);color:var(--parchment);}
  code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}

  .catbar{position:sticky;top:0;z-index:5;
    background:color-mix(in srgb, var(--parchment) 92%, transparent);
    backdrop-filter:blur(6px);border-bottom:1px solid var(--border);
    padding:.7rem 1.2rem;overflow-x:auto;white-space:nowrap;}
  .catbar a{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.76rem;
    color:var(--text-muted);text-decoration:none;padding:.3rem .7rem;margin-right:.3rem;
    border:1px solid var(--border);border-radius:999px;display:inline-block;}
  .catbar a:hover,.catbar a:focus-visible{color:var(--text);border-color:var(--gold);}

  main{max-width:940px;margin:0 auto;padding:0 1.4rem 6rem;}
  .titleblock{padding:3.6rem 0 2.2rem;border-bottom:1px solid var(--border);margin-bottom:2rem;max-width:640px;}
  .eyebrow{font-family:"Zen Kaku Gothic New",sans-serif;letter-spacing:.14em;font-size:.72rem;color:var(--gold);display:block;margin-bottom:.9rem;}
  h1{font-family:"Shippori Mincho B1",serif;font-weight:800;font-size:clamp(2.1rem,5vw,2.9rem);line-height:1.3;margin:0 0 .5rem;text-wrap:balance;}
  .subtitle{font-family:"Zen Kaku Gothic New",sans-serif;color:var(--text-muted);font-size:.95rem;margin:0 0 1.4rem;}
  .titleblock p{color:var(--text-muted);font-size:.95rem;max-width:58ch;margin:0;}

  h2{font-family:"Shippori Mincho B1",serif;font-weight:700;font-size:1.5rem;
    margin:3.4rem 0 .4rem;padding-top:1.6rem;border-top:1px solid var(--border);scroll-margin-top:4rem;}
  h2 .n{color:var(--gold);font-size:.9rem;font-family:"Zen Kaku Gothic New",sans-serif;letter-spacing:.1em;display:block;margin-bottom:.2rem;}
  h3{font-family:"Shippori Mincho B1",serif;font-weight:700;font-size:1.08rem;margin:2rem 0 .6rem;}
  p{font-size:.93rem;}
  .lead{color:var(--text-muted);font-size:.92rem;max-width:64ch;}

  table{width:100%;border-collapse:collapse;margin:.8rem 0 .4rem;font-size:.84rem;}
  .scroll{overflow-x:auto;}
  th,td{text-align:left;padding:.45rem .7rem;border-bottom:1px solid var(--border);vertical-align:middle;line-height:1.6;}
  thead th{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.72rem;letter-spacing:.1em;
    color:var(--text-muted);border-bottom:1px solid var(--text-muted);white-space:nowrap;}
  td code{font-size:.76rem;color:var(--text-muted);white-space:nowrap;}
  td.glyph{font-family:ui-monospace,monospace;font-size:.9rem;text-align:center;width:2.4rem;color:var(--gold);}
  td.tier,td.pri{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.76rem;color:var(--text-muted);white-space:nowrap;}
  td.act{text-align:right;white-space:nowrap;width:1%;}
  .sw{display:inline-block;width:.8rem;height:.8rem;border:1px solid var(--border);border-radius:2px;margin-right:.35rem;vertical-align:-1px;}
  tr.grp th{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.78rem;color:var(--text);
    background:var(--surface);padding-top:.8rem;padding-bottom:.6rem;}
  tr.grp .gname{color:var(--gold);margin-right:.8rem;}
  tr.grp .grule{color:var(--text-muted);font-size:.74rem;}
  tr.grp td.act{background:var(--surface);}

  .cbtn,.bulk{font-family:"Zen Kaku Gothic New",sans-serif;cursor:pointer;
    background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:3px;}
  .cbtn{font-size:.72rem;padding:.22rem .65rem;}
  .bulk{font-size:.76rem;padding:.35rem .9rem;}
  .cbtn:hover,.bulk:hover,.cbtn:focus-visible,.bulk:focus-visible{border-color:var(--gold);color:var(--gold);}
  .cbtn.done,.bulk.done{border-color:var(--gold);color:var(--gold);}
  .bulkbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:1rem 0 .2rem;}
  .bulkbar .hint{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.74rem;color:var(--text-muted);}

  .prompt{margin:1.2rem 0;border:1px solid var(--code-border);border-radius:5px;overflow:hidden;background:var(--code-bg);}
  .prompt-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;
    padding:.5rem .8rem;border-bottom:1px solid var(--code-border);}
  .pname{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.82rem;color:var(--gold);}
  .prompt-head button{font-family:"Zen Kaku Gothic New",sans-serif;font-size:.72rem;cursor:pointer;
    background:transparent;border:1px solid var(--code-border);color:var(--code-text);padding:.25rem .7rem;border-radius:3px;}
  .prompt-head button:hover,.prompt-head button:focus-visible{border-color:var(--gold);color:var(--gold);}
  .prompt pre{margin:0;padding:.9rem 1rem;color:var(--code-text);font-size:.78rem;line-height:1.75;
    white-space:pre-wrap;word-break:break-word;}

  .callout{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--gold);
    border-radius:4px;padding:1.1rem 1.3rem;margin:1.4rem 0;box-shadow:var(--shadow);}
  .callout h3{margin-top:0;}
  .callout p:last-child{margin-bottom:0;}
  ol.steps{padding-left:1.2rem;margin:.6rem 0;}
  ol.steps li{margin-bottom:.5rem;font-size:.9rem;}
  a{color:var(--gold);}
  :focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
  footer{margin-top:4rem;padding-top:1.6rem;border-top:1px solid var(--border);
    font-family:"Zen Kaku Gothic New",sans-serif;font-size:.78rem;color:var(--text-muted);}
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto;}}
  @media (max-width:560px){ td,th{padding:.4rem .45rem;} .prompt pre{font-size:.74rem;} }
</style>

<nav class="catbar">
  <a href="#top">TOP</a><a href="#start">はじめに貼る</a><a href="#sum">必要枚数</a>
  <a href="#tiles">タイル</a><a href="#chars">キャラ</a><a href="#walk">歩行アニメ</a><a href="#npc">町の人</a>
  <a href="#boss">ボス</a><a href="#mons">雑魚</a><a href="#bg">背景</a><a href="#deliver">納品</a>
</nav>

<main id="top">
  <div class="titleblock">
    <span class="eyebrow">ロトの継承 ― 画像素材仕様</span>
    <h1>画素譜</h1>
    <p class="subtitle">Geminiにそのまま貼れる、110本のドット絵プロンプト</p>
    <p>ボタンを押すとプロンプトが丸ごとコピーされます。<strong>ルールも寸法も各プロンプトの中に書き込んであるので、1本ずつ単独で貼って使えます</strong>。書き換える箇所はありません。</p>
  </div>

  <h2 id="start"><span class="n">01</span>まずGeminiに貼るもの</h2>
  <p class="lead">各プロンプトは単独で完結していますが、<strong>会話の最初にこれを1回貼っておくと絵柄が安定します</strong>。貼ったら「了解」とだけ返ってくるので、そのあと素材のプロンプトを1本ずつ流してください。</p>
  <div class="prompt"><div class="prompt-head"><span class="pname">共通ルール ― 会話のはじめに1回だけ</span>
    <button type="button" class="cbtn" data-k="__common">コピー</button></div>
    <pre>""" + esc(COMMON) + """</pre></div>
  <div class="prompt"><div class="prompt-head"><span class="pname">2枚目以降 ― 絵柄を揃えたいとき</span>
    <button type="button" class="cbtn" data-k="__workflow">コピー</button></div>
    <pre>""" + esc(WORKFLOW) + """</pre></div>
  <div class="callout">
    <h3>出てきた画像はそのまま送ってください</h3>
    <p>1024×1024のような大きいままで構いません。<strong>ニアレストネイバーでの縮小、マゼンタの透過抜き、パレット整理、ゲームへの組み込みはこちらで処理します</strong>。1枚届いた時点で組み込めるので、全部揃うのを待つ必要もありません。</p>
  </div>

  <h2 id="sum"><span class="n">02</span>必要枚数 ― 全110枚</h2>
  <div class="bulkbar">
    """ + bulk(PRIORITY_A, 'まず要る分だけコピー') + """
    """ + bulk(ALL, '全部コピー') + """
    <span class="hint">まとめてコピーすると、素材ごとに区切り線と納品ファイル名が付いた形で入ります</span>
  </div>
  <div class="scroll">
  <table>
    <thead><tr><th>区分</th><th>枚数</th><th>1枚の寸法</th><th>優先</th><th>無いとどうなるか</th></tr></thead>
    <tbody>
      <tr><td>マップのタイル</td><td>17</td><td>32×32</td><td>A</td><td>いまは色のべた塗り。ここが一番印象を変える</td></tr>
      <tr><td>パーティ4人(立ち絵)</td><td>4</td><td>32×32</td><td>A</td><td>いまは金色の丸ひとつ</td></tr>
      <tr><td>歩行アニメ(4人×3向き)</td><td>12</td><td>96×48</td><td>A</td><td>隊列は組むが、全員つっ立ったまま滑る</td></tr>
      <tr><td>ボス</td><td>5</td><td>160×160</td><td>A</td><td>いまは赤い丸。章の山場なので優先</td></tr>
      <tr><td>その他の人物</td><td>12</td><td>32×32</td><td>B</td><td>町の人は紫の四角と字だけ</td></tr>
      <tr><td>雑魚モンスター</td><td>54</td><td>96×96</td><td>B</td><td>いまは茶色の丸。種族代表9体だけでも可</td></tr>
      <tr><td>背景・タイトル</td><td>6</td><td>640×480</td><td>C</td><td>無くても成立する</td></tr>
    </tbody>
  </table>
  </div>

  <h2 id="tiles"><span class="n">03</span>マップのタイル ― 17枚</h2>
  <p class="lead">すべて32×32。マップは32pxの升目で敷き詰めるので、<strong>四辺どこで繋いでも継ぎ目が見えないこと</strong>を各プロンプトで指定してあります。色は今の画面の色をそのまま指定値に入れてあります。</p>
  <div class="bulkbar">""" + bulk(S['tiles'], 'タイル17枚をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>記号</th><th>用途</th><th>指定色</th><th>納品ファイル名</th><th></th></tr></thead>
    <tbody>""" + tile_rows + """</tbody>
  </table>
  </div>

  <h2 id="chars"><span class="n">04</span>キャラのドット絵 ― 8枚</h2>
  <p class="lead">キャラの枠は<strong>32×48ドット</strong>(ゲームがそのまま使う寸法です)。
そのうち人物は<strong>下から30〜34ドット</strong>で、上は余白。<strong>頭身は2頭身</strong>。32ドットに入るのはシルエット・髪の色・服の色・持ち物の形の4つだけなので、人物の記述は群像譜の外見から<strong>この4つに絞り直して</strong>あります(「頬の刀傷」「片眼鏡」のような細部は、この大きさでは汚れにしかならないので落としました)。</p>
  <div class="callout">
    <h3>まずは正面1枚で絵柄を決めてください</h3>
    <p>正面向き1枚があればそのまま組み込めます。<strong>歩行アニメも実装済み</strong>なので、
    絵柄が決まったあとに <a href="#walk">歩行シート</a>(前・後ろ・横の3枚 × 4人 = 12枚)を出してもらえれば、
    そのまま歩き出します。先に1枚で絵柄を確定してから広げるのが無駄がありません。</p>
  </div>
  <div class="bulkbar">""" + bulk(S['chars'], 'キャラ8枚をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>人物</th><th>優先</th><th>納品ファイル名</th><th></th></tr></thead>
    <tbody>""" + char_rows + """</tbody>
  </table>
  </div>

  <h2 id="walk"><span class="n">05</span>歩行アニメ ― 12枚(パーティ4人ぶん)</h2>
  <p class="lead">仲間は先頭のあとを1マスずつ辿って隊列で歩きます。<strong>その歩行アニメ用のシートです。</strong>1枚に3コマ(左足 / 立ち / 右足)を横一列に並べた <strong>96×48ドット</strong>。</p>
  <div class="callout">
    <h3>向きは3枚でいい ― 左向きは反転して使います</h3>
    <p>前・後ろ・横の3枚だけ描いてもらえれば、<strong>左向きは横向きの絵をこちらで左右反転して</strong>使います。4方向ぶん描く必要はありません。そのぶん、横向きの絵は<strong>持ち物を右手側に</strong>描いてください(反転すると左手に移ります)。</p>
  </div>
  <div class="callout">
    <h3>受け取る側はもう用意できています</h3>
    <p>コードは<strong>すでに歩行シートを探しに行く状態</strong>です。<code>chars/rota_walk_down.png</code> のように置けば、その人物のその向きだけ歩き出します。まだ無い向きは今の立ち絵のまま表示されるので、<strong>1枚ずつ、好きな順で足せます</strong>。</p>
  </div>
  <div class="bulkbar">""" + bulk(S['walk'], '歩行シート12枚をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>向き</th><th>納品ファイル名</th><th></th><th></th></tr></thead>
    <tbody>""" + walk_rows + """</tbody>
  </table>
  </div>

  <h2 id="npc"><span class="n">06</span>町の人 ― 8枚</h2>
  <p class="lead">名前のない人々。個体差より「役どころが一目でわかること」を優先する指示にしてあります。</p>
  <div class="bulkbar">""" + bulk(S['npcs'], '町の人8枚をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>役</th><th>納品ファイル名</th><th></th></tr></thead>
    <tbody>""" + npc_rows + """</tbody>
  </table>
  </div>

  <h2 id="boss"><span class="n">07</span>ボス ― 5体</h2>
  <p class="lead">160×160。雑魚とは明らかに格が違う密度で、というのは各プロンプトに書いてあります。</p>
  <div class="bulkbar">""" + bulk(S['bosses'], 'ボス5体をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>ボス</th><th>登場する場所</th><th>納品ファイル名</th><th></th></tr></thead>
    <tbody>""" + boss_rows + """</tbody>
  </table>
  </div>

  <h2 id="mons"><span class="n">08</span>雑魚モンスター ― 54体</h2>
  <p class="lead">96×96。9種族×6体で、<strong>種族ごとの描き方が各プロンプトに埋め込んであります</strong>。種族単位でまとめてコピーできるようにしてあるので、1種族ずつ流すのが揃えやすいです。急ぐなら各種族の1体目だけ描いて、同族は色違いで凌ぐ手もあります。</p>
  <div class="bulkbar">""" + bulk([k for ks in S['mobgroups'].values() for k in ks], '雑魚54体をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>名前</th><th>登場</th><th>納品ファイル名</th><th></th><th></th></tr></thead>
    <tbody>""" + mob_rows + """</tbody>
  </table>
  </div>

  <h2 id="bg"><span class="n">09</span>背景 ― 6枚</h2>
  <p class="lead">640×480。戦闘背景は画面下3分の1が窓で隠れること、中央上寄りに敵が立つことをプロンプトに入れてあります。</p>
  <div class="bulkbar">""" + bulk(S['bgs'], '背景6枚をまとめて') + """</div>
  <div class="scroll">
  <table>
    <thead><tr><th>使う場所</th><th>納品ファイル名</th><th></th></tr></thead>
    <tbody>""" + bg_rows + """</tbody>
  </table>
  </div>

  <h2 id="deliver"><span class="n">10</span>納品の形</h2>
  <p class="lead">ファイル名はゲーム内部のIDに合わせてあります。この名前で送ってもらえれば自動で当たります。名前が違っても、どの素材か分かれば直せます。</p>
  <div class="prompt"><div class="prompt-head"><span class="pname">フォルダ構成</span>
    <button type="button" class="cbtn" data-k="__dir">コピー</button></div>
    <pre>roto-no-keisho-game/assets/
  tiles/      tile_grass.png  tile_road.png  …  (17枚, 32×32)
  chars/      rota.png  elrode.png  celestia.png  garai.png  npc_*.png  (16枚, 32×32)
  monsters/   chibi_slime.png  …  galoz.png  …  (59枚, 96×96 / ボスのみ160×160)
  bg/         battle_*.png  title.png  (6枚, 640×480)</pre></div>
  <p>用意できたものは絵に、まだのものは今の色面のまま ― という混在で動くようにします。順番も自由です。</p>

  <footer>
    画素譜 ― 『ロトの継承』画像素材仕様(オリジナル二次創作構想) / ドラゴンクエストシリーズの世界観に着想を得たファン制作物です。
  </footer>
</main>

<script id="prompt-data" type="application/json">__DATA__</script>
<script>
(function(){
  var D = JSON.parse(document.getElementById('prompt-data').textContent);
  var P = D.P, LABEL = D.LABEL, PATH = D.PATH;

  function textFor(key){
    if (P[key]) return P[key];
    return (document.querySelector('[data-k="' + key + '"]')
      .closest('.prompt').querySelector('pre').textContent);
  }
  function joined(keys){
    return keys.map(function(k){
      return '────────────────────────────\\n■ ' + LABEL[k] + '   →  ' + PATH[k] +
             '\\n────────────────────────────\\n' + P[k];
    }).join('\\n\\n');
  }
  function flash(btn, msg){
    var o = btn.dataset.label || btn.textContent;
    btn.dataset.label = o;
    btn.textContent = msg;
    btn.classList.add('done');
    setTimeout(function(){ btn.textContent = o; btn.classList.remove('done'); }, 1700);
  }
  function put(text, btn, msg){
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ flash(btn, msg); })
        .catch(function(){ fallback(text, btn); });
    } else { fallback(text, btn); }
  }
  // クリップボードが使えない環境では、選択状態にして手動コピーへ逃がす
  function fallback(text, btn){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    flash(btn, ok ? 'コピーしました' : 'コピーできません');
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-k],[data-ks]');
    if (!b) return;
    if (b.dataset.ks) {
      var keys = b.dataset.ks.split(',');
      put(joined(keys), b, keys.length + '本コピーしました');
    } else {
      put(textFor(b.dataset.k), b, 'コピーしました');
    }
  });
})();
</script>
"""

html = html.replace('__DATA__', json.dumps({'P':P,'LABEL':LABEL,'PATH':PATH}, ensure_ascii=False))
open('gaso-fu.html','w',encoding='utf-8').write(html)
print('written; prompts:', len(P), '| all keys:', len(ALL))
