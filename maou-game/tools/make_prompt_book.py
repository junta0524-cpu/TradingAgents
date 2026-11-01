# このファイルの役目：イラスト作りのプロンプトを、1つのデータから「完全版の文書（md）」と「コピーボタン付きのページ（html）」に作る道具（作る人用）。
# 絵が増えたら、下の ITEMS を直して「python3 tools/make_prompt_book.py」を流す。出力：docs/イラスト生成プロンプト_完全版.md と .html
import html, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

STYLE_CHAR = ("16-bit era Japanese RPG pixel art, crisp hard-edged pixels, no anti-aliasing, no blur, limited palette of about 24 colors, "
              "clean dark outline, soft cel shading with 2-3 tones per color. Japanese-mythology (Kojiki) inspired fantasy. "
              "Solid flat magenta (#FF00FF) background, no text, no border, no watermark.")
STYLE_BG = ("16-bit era Japanese RPG pixel art background, crisp hard-edged pixels, no anti-aliasing, limited palette of about 32 colors, "
            "painterly dithering, Japanese-mythology (Kojiki) inspired fantasy world, wide 3:2 landscape, no characters, no text, no watermark.")
REF = "Match the exact pixel art style, palette softness, outline thickness and shading of the attached reference image."
FACE = ("Bust-up character portrait (head and shoulders), facing slightly to the left, 1:1 square. Keep the whole head inside the frame with some space above it. "
        "The background is plain solid flat magenta only: no glow, aura, lines or effects in the background.")
BODY = ("Full-body battle sprite, facing the viewer, centered, whole body visible with a margin on every side, 1:1 square. "
        "The background is plain solid flat magenta only: no glow, aura, strings, lines or effects touching the background.")

# 各項目：id, 名前, 役・場面, ファイル名, 文、（話す回数など）
FACES_NAMED = [
 ('hina', 'ヒナ', '貧民区の少女。ミオの娘（8.5章・番外編三）', 'face_hina.png', 43,
  "A small human girl of about six. Big, round, clear eyes looking straight ahead, soft black hair tied in two short bunches, a thin but rosy face. A patched, faded homespun top in muted brown and cream. She holds a tiny unglazed clay pot with a small green sprout. Shy, hopeful expression, eyes a little teary."),
 ('hisame', 'ヒサメ', '若い鬼の看守（2.5章）', 'face_hisame.png', 38,
  "A young oni (demon) prison guard in his early twenties. Short unkempt black hair, two short ivory horns, reddish-brown skin, amber-yellow eyes, an earnest, nervous expression with a slight frown. A plain dark guard's tunic with a studded leather vest. The end of a thick iron club rests on his shoulder."),
 ('hal', 'ハル', '耳の先が尖った少年（ひなた野・番外編六）', 'face_hal.png', 34,
  "A thin boy of about eleven with slightly pointed elf-blood ears, tousled brown hair and large honest brown eyes, a few freckles. A worn hemp tunic in muted green-brown with a thin scarf. A shy, earnest expression, as if reading something precious."),
 ('isana', 'イサナ', 'ミナモの港の老人（4.5章）', 'face_isana.png', 34,
  "An elderly fisherman. Hunched shoulders, thinning white hair and a short white beard, deep smile lines around kind eyes. Faded indigo work clothes with a rope slung over one shoulder. His outline is faintly translucent and faded at the edges, as if people had forgotten his name, but his eyes are warm."),
 ('yuzuriha', 'ユズリハ', '老いたエルフの語り部（5.5章・番外編六）', 'face_yuzuriha.png', 29,
  "An old elf woman storyteller. Long silver-white hair in a loose braid with a small yuzuriha leaf ornament, long pointed ears, eyes gently closed as if singing an old song. Both hands rest on a wooden walking staff in front of her. Soft layered robes in green and cream with simple leaf embroidery. Serene, wise, slightly sorrowful."),
 ('yashiro', '社守', 'タカマの丘の社守（8.5章・番外編一・三）', 'face_yashiro.png', 23,
  "An elderly human shrine keeper, gender-neutral gentle face, short grey hair under a plain white-and-pale-blue cap, calm tired eyes with soft wrinkles. Pale blue and white shrine robes with a rope sash. Holds a short straw broom. Quiet, patient expression."),
 ('yatsuka', 'ヤツカ', '残党の将。老いた将軍（番外編二・四・六）', 'face_yatsuka.png', 20,
  "An old general of a fallen king's army, about sixty. Weathered face with a scar over one eyebrow, close-cropped grey hair and a grey mustache. Worn white armor with faded gold trim and a white armband. His eyes are empty and glassy as if brainwashed, yet his posture is still proud. Stern, hollow expression."),
 ('mio', 'ミオ', '貧民区の母。ヒナの母（8.5章・番外編三）', 'face_mio.png', 19,
  "A human woman of about thirty, thin and tired but warm. Brown hair tied back under a simple cloth, a faded apron over plain clothes, a small gentle smile with worried eyes. Muted blue-grey and cream colors."),
 ('minato', 'ミナト', '王の使者（5章）', 'face_minato.png', 18,
  "A human court envoy of about thirty-five. Smooth pale face, neatly combed soft brown hair, a gentle, perfectly polite smile that does not reach his eyes. Neat white court robes with a blue sash and a white armband. Calm, persuasive, slightly unsettling."),
 ('misaki', 'ミサキ', 'ゴロウの娘（番外編四）', 'face_misaki.png', 17,
  "A girl of twelve from a northern mountain village. Scruffy short black hair with a faded cloth ribbon, a small plum blossom petal stuck in her hair, bright stubborn eyes, a scratch on her cheek. Patched, much-mended clothes in brown and grey. Brave, a little defiant expression."),
 ('tomari', 'トマリ', 'ミナモの荷運び（4.5章）', 'face_tomari.png', 16,
  "A cheerful young porter of about nineteen at a harbor town. Sun-tanned skin, messy black hair under a knotted towel headband, sleeves rolled up, a salt-stained sleeveless work shirt. A quick, talkative grin. Muted indigo and sand colors."),
 ('asagi', 'アサギ', 'ミナモの漁師の娘（4.5章・番外編三）', 'face_asagi.png', 8,
  "A young fisherman's daughter of about twenty. Hair tied up in a faded blue cloth, rosy windburned cheeks, a loud, warm, stubborn smile. A salt-stained work smock in indigo and white, a net rope over one shoulder."),
 ('fuji', 'フジ', '坑夫の寡婦。カイの母（6.5章）', 'face_fuji.png', 13,
  "A middle-aged miner's widow of about forty-five. Grey-streaked dark hair in a tight bun, a strong tired face with kind eyes, a faded apron over a patched dress. Soot-dusted hands wipe on the apron. Quiet strength."),
 ('kai', 'カイ', '坑夫の息子（6.5章）', 'face_kai.png', 12,
  "A tall, thin young man of about seventeen, a miner's son. Short dark messy hair, soot smudges on his cheek, bright eyes that look like his mother's when he smiles. A rough work shirt with rolled sleeves. Hesitant, hopeful smile."),
 ('seki', 'セキ', '弓兵（番外編二・四）', 'face_seki.png', 13,
  "A young archer of twenty-two from a northern mountain village. Short brown hair, a lean, hollow-cheeked face, vacant eyes slowly clearing. A plain soldier's tunic with a white armband and a leather quiver strap across the chest. Dazed, gentle expression."),
 ('nagi', 'ナギ', '薬師（番外編二・四）', 'face_nagi.png', 11,
  "A young herbalist of twenty-two from a northern mountain village, boyhood friend of the archer Seki. Soft light-brown hair, a gentle thin face, kind eyes. A plain tunic with a white armband and a small herb pouch at the chest. Tired, kind expression."),
 ('yone', 'ヨネ', 'ゴロウの妻。ミサキの母（番外編四）', 'face_yone.png', 11,
  "A woman of about thirty-five in a northern mountain village. Dark hair tied back with a cloth, a patched work dress, a worn face with a smile that is half tears. Warm, quiet, tired eyes."),
]

FACES_ROLE = [
 ('uketsuke', '受付の女', 'ミナモのギルドの受付（26回）', 'face_uketsuke.png',
  "A guild receptionist, a woman of about thirty with red-brown hair pinned up, a green vest over a cream blouse, a calm professional smile, a quill pen behind her ear."),
 ('hei', '白い腕章の兵', '王の兵。洗脳されている人（21回）', 'face_hei.png',
  "A common soldier of the human king's army, about twenty-five. Plain white tunic and light armor, a white armband, a spear on the shoulder. Hazy, slightly vacant eyes and a faint fixed smile, as if lulled."),
 ('gyoushou', '亜人の行商人', '塩と干し魚を売る行商人の親子（20回）', 'face_gyoushou.png',
  "A traveling peddler of a beastfolk family, a man of about forty with soft fox-like ears and a bushy tail tip visible at the edge. A big wicker basket of dried fish and salt on his back, a patched travel cloak, a worried but friendly smile."),
 ('karasu_onna', '鴉族の女', 'ヤタの鴉族（18回）', 'face_karasu_onna.png',
  "A woman of the crow tribe in the underworld, about thirty-five. Glossy black hair, a few black feathers at the temples, sharp yellow eyes, black wings folded behind her shoulders. A dark robe with a violet sash. Calm, watchful expression."),
 ('roubo', '老婆', '街や村の老婆（12回）', 'face_roubo.png',
  "A kindly old woman of about eighty, a human. White hair in a small bun, a deeply lined smiling face, a light blue headscarf, a patched shawl over a plain kimono-style robe."),
 ('tenshu', '店主', '店の主人（8回）', 'face_tenshu.png',
  "A shopkeeper of about fifty, a human man. Round friendly face, a short apron over a plain tunic, a small cloth cap, a cheerful businesslike smile."),
 ('roban', '炉番', '炉ヶ岳の炉番（8回）', 'face_roban.png',
  "A stocky furnace keeper of the mountain smithy, a bearded dwarf-like man of about fifty. Soot-darkened face, thick brown beard, a leather apron, a sweat rag around his neck, eyes squinting from the fire. Gruff but honest."),
 ('koufu', '坑夫', '鉱夫村マガネの坑夫（8回）', 'face_koufu.png',
  "A miner of about thirty, a human man. A dusty face with a headband and a small oil lamp on the forehead, a rough work shirt, strong arms, a tired but honest smile."),
 ('kanri', '官吏', '王都の官吏（7回）', 'face_kanri.png',
  "A human government official of about forty. Neat black hair, narrow eyes, a stiff composed face. A tidy white official robe with a blue sash, a white armband, a scroll in his hand."),
 ('banpei', '番兵', '関所や城の番兵（7回）', 'face_banpei.png',
  "A gate guard of about thirty, a human man. A plain white helmet with a short plume, light armor with a white armband, a halberd held upright, a stern, bored face."),
 ('kodomo', '子ども', '村の子ども（6回）', 'face_kodomo.png',
  "A small village child of about eight, gender-neutral. Round cheeks, short messy dark hair, big curious eyes, a bright cheerful grin. A plain light-colored tunic with a patch on the shoulder."),
 ('arashi_kodomo', '嵐狼の子', '嵐狼族の子ども（12回）', 'face_arashi_kodomo.png',
  "A small child of the storm-wolf tribe, about nine, with grey wolf ears and a small grey tail tip. Messy silver-grey hair, bright amber eyes, a cheeky grin showing a small fang. A scrappy fur-trimmed vest."),
]

BATTLE = [
 ('oonamuchi_t', 'オオナムチ（四天王編で戦う相手）', '四天王編で、ハニヤスたちが手合わせする相手。③魔界の修行の姿（全身）', 'enemy_oonamuchi_t.png',
  "A young adventurer-hero in a fighting stance, full body, holding a worn old short dagger with a small flame resting on the blade. Spiky brown hair tied back with red beads and a black feather. Brown cloak with a patch and a grey fur collar (a gift of the storm-wolf tribe), leather armor, a red oni-forged gauntlet on one arm, a violet-dyed sash. Focused, calm expression."),
 ('morigumo', '森蜘蛛', '5.5章の敵。苔の大蜘蛛より小さい普通の蜘蛛', 'enemy_morigumo.png',
  "A forest spider, small and fast, dark green body with pale moss-colored spots and long thin legs, glowing yellow eyes, lurking in a leafy forest mood."),
 ('tsuta', '絡み蔦', '仕掛けの敵。蔦の化け物', 'enemy_tsuta.png',
  "A monster made of tangled thick green vines with thorns, a rough face-like hollow in the knot at its center with two dim glowing eyes, vine tendrils reaching out. Dark green and brown."),
]

BACKGROUNDS = [
 ('balcony', '宮の露台（10回）', '黄泉津の宮の露台。夜', 'bg_balcony.png',
  "A stone balcony of the underworld palace at night: a worn stone railing, carved pillars, a deep red sky with a pale crimson moon, a view over dark underworld fields with tiny lantern lights far below."),
 ('scorched_after', '根の洲、数か月後（8回）', '焼け跡に緑が戻り始めた朝', 'bg_scorched_after.png',
  "The same burned plains months later at early morning: black earth with the first thin green shoots and grass, a few charred roots, a hoe leaning against a small mound, a soft pale pink dawn sky. Quiet and hopeful."),
 ('attic', '屋根裏（7回）', '王都の隠れた部屋。人間界の白〜青の調子', 'bg_attic.png',
  "A small attic room in a human royal city: slanted wooden beams, a single small round window with pale blue light, a table with scattered papers and a candle, dust in the air. Cool white and blue tones, secretive and quiet."),
 ('lodging', '宿の部屋（6回）', '旅の宿の一室。夜', 'bg_lodging.png',
  "A simple traveler's inn room at night: wooden floor with a rolled futon in the corner, a paper lantern glowing warm orange, a small window showing a dark blue night sky, a low table with a teapot."),
 ('village_day', '葛の里の昼（4回）', '井戸のある村の広場。昼', 'bg_village_day.png',
  "A small hill village square by day: a stone well in the middle, thatched wooden houses, drying laundry, green hills behind, a bright pale blue sky. Warm, peaceful, beastfolk village mood."),
 ('corridor', '大穴の縁の回廊（3回）', '大穴の縁の石の回廊。夕暮れ', 'bg_corridor.png',
  "A long stone corridor along the rim of a huge chasm: round arches open to a dark bottomless pit on one side, worn stone floor, a dim red twilight sky, cold and lonely."),
 ('prison', '牢（3回）', '黄泉津の宮の牢', 'bg_prison.png',
  "A stone prison cell in the underworld palace: thick iron bars in front, a tiny barred window high on the wall with dim red light, straw on the floor, a flickering torch, damp stone walls."),
 ('forest_night', '月夜の森の道（3回）', '月明かりの森の道', 'bg_forest_night.png',
  "A forest path in bright moonlight: tall dark trees, silver-blue light falling through the leaves onto a winding dirt path, faint mist near the ground, calm and mysterious."),
 ('safehouse', '隠れ家（3回）', '王都の裏路地の隠れ家', 'bg_safehouse.png',
  "A hidden safehouse in a back alley of a human city: a small dim room with shuttered windows, a table with stacked papers and a single candle, a worn rug, long shadows. Cool blue-grey tones."),
 ('festival', '祝賀の夜の天津京（3回）', '白い王都の祝賀の夜', 'bg_festival.png',
  "A grand white-stone plaza of a human royal city at night during a festival: countless paper lanterns hung overhead glowing warm white, white stone pavement, white banners, a bright but eerily perfect mood."),
 ('road', '街道（2回）', '人間界の街道', 'bg_road.png',
  "A dirt highway between green fields in the human world: a small stone road marker, distant blue hills, a clear pale blue sky, wind in the grass. Open and calm."),
 ('hall', '会談の間（2回）', '大穴の縁に建てた会談の間', 'bg_hall.png',
  "A neutral meeting hall of white stone built at the edge of a great chasm: a long plain table with chairs on both sides, tall windows with pale light, bare walls, a solemn and tense mood."),
 ('sunset', '夕暮れの丘（2回）', '街道ぞいの小さな丘。夕暮れ', 'bg_sunset.png',
  "A small grassy hill beside a road at sunset: a warm orange and pink sky, long soft shadows, a tall quiet sky to the south, a lone small tree. Peaceful and a little lonely."),
 ('stage', '祝賀の壇上（1回）', '王都の祝賀の壇上', 'bg_stage.png',
  "A celebration platform in a white city: a raised white stage with white and gold banners, bright light from above, a vast crowd far below shown only as soft blurred shapes. Dazzling and slightly cold."),
 ('trial', '試練の窪み（1回）', '大穴の最深部。調和の光が灯る窪み', 'bg_trial.png',
  "A dark ancient stone chamber with a shallow round hollow in the floor, glowing with a light that is neither white nor gold but all colors merged into one, soft rainbow-like glow on old carved walls and an ancient door behind."),
]

DONE = {
 '顔（会話の窓）': 'オオナムチ（4段階）、ベル、ベルイザナ、スクナ、コノハ、カナメ、コトシロ、ウズメ、ヒエダ、クシナダ、イシコリドメ、サルタヒコ、ユウ、タケル（怒った顔・穏やかな顔）、アマツ王（ほほえみ・本性）、ミカヅチ、スサノ、ナキメ、ハニヤス、オモイカ、クナド',
 '戦いの敵': '普通の敵55種類すべて、ボス・番人（苔の大蜘蛛・岩喰らい・風の大鷲・氷門の番人・大穴の主・黄泉の大蛇・名喰いの王・残党の将）、四天王・ベル・ベルイザナ・タケル・アマツ王の戦闘絵、冒険者ベル（力解放版は用意だけ）',
 '場面の背景': 'scorched・palace・fields・hirasaka・roundtable・fortress・temple・sanatorium・well_night・workshop・forest_day・city・harvest（13枚）',
 '戦いの背景': 'field・forest・mountain・wild・night、throne・oni_arena・storm_crag・feather_hall・hani_terrace（10枚）',
}

TIPS = [
 '背景は、マゼンタ（#FF00FF）一色にする。光・オーラ・糸・線・影を背景に描かせない（切り抜きが汚くなり、絵が小さくなる）。',
 '顔は1:1。頭のてっぺんの上に少し余白、肩まで入れる。体の大きい人は上半身で止める。',
 '全身の戦闘絵は1:1。足先まで全部入れ、まわりに余白をとる。',
 'できている絵を1枚添付して貼ると、絵柄がそろう（顔には顔、背景には背景の絵を添える）。各プロンプトの最後の「Match the exact pixel art style…」の1行が、その合図。1枚目で基準が無いときは、その行を消してよい。',
 '文字・枠・署名が入ったら、「文字や記号を消して」と頼む。背景がマゼンタでなかったら「背景をマゼンタ一色にして」と頼む。',
 '手直しは同じ会話で言葉で頼む（「髪をもっと黒く」「角を2本に」など）。',
 'できた絵は、ファイル名を添えてチャットに貼る。縮小・色の整理・背景の透明化・ゲームへの取り込みは、こちらでやる。',
]

def full(kind, text):
    if kind == 'face': return '\n\n'.join([STYLE_CHAR, FACE, text, REF])
    if kind == 'body': return '\n\n'.join([STYLE_CHAR, BODY, text, REF])
    return '\n\n'.join([STYLE_BG, text, REF])

def tier(n):
    return '最優先' if n >= 29 else '次に' if n >= 11 else 'そのあと'

GROUPS = []
GROUPS.append(dict(key='named', title='顔グラ：名前のある人', note='会話の窓の左に出す顔。話す回数の多い順。1:1。', items=[
    dict(id=i, name=n, role=r, file=f, tag=f'{c}回・{tier(c)}', prompt=full('face', t)) for i, n, r, f, c, t in FACES_NAMED]))
GROUPS.append(dict(key='role', title='顔グラ：役の人', note='名前のない町の人。役ごとに1枚ずつ作れば、同じ役の人みんなで使える。', items=[
    dict(id=i, name=n, role=r, file=f, tag='役の人', prompt=full('face', t)) for i, n, r, f, t in FACES_ROLE]))
GROUPS.append(dict(key='battle', title='戦いの絵', note='戦闘画面の敵。全身、1:1。', items=[
    dict(id=i, name=n, role=r, file=f, tag='戦い', prompt=full('body', t)) for i, n, r, f, t in BATTLE]))
GROUPS.append(dict(key='bg', title='場面の背景', note='会話だけの場面の1枚絵。横長3:2。いまは手描きの簡単な絵で代わりに出している。()内は場面で使う回数。', items=[
    dict(id=i, name=n, role=r, file=f, tag='背景', prompt=full('bg', t)) for i, n, r, f, t in BACKGROUNDS]))

TOTAL = sum(len(g['items']) for g in GROUPS)

def build_md():
    L = ['# イラスト生成プロンプト 完全版（現時点）', '',
         f'これから作る絵は全部で **{TOTAL}枚**。各項目の文は、そのまま貼れる完成形（共通の絵柄＋構図＋その絵の文＋「基準の絵に合わせる」の1行）。',
         'スマホでコピーしやすいページ版：`docs/イラスト生成プロンプト_完全版.html`（公開ページは作業の報告に書いたリンク）。',
         '最初に作った第1弾〜第3弾の文は `docs/イラスト生成プロンプト.md` にある（できている絵の作り直し用）。', '',
         '## 1. できている絵', '']
    L += [f'- **{k}**：{v}' for k, v in DONE.items()]
    L += ['', '## 2. 失敗しないコツ', ''] + [f'{i+1}. {t}' for i, t in enumerate(TIPS)]
    L += ['', '## 3. 共通の文（各項目には、すでに入れてある）', '', '**顔・敵用**', '```', STYLE_CHAR, '```', '**背景用**', '```', STYLE_BG, '```',
          '**基準の絵に合わせる1行（2枚目から）**', '```', REF, '```']
    n = 4
    for g in GROUPS:
        L += ['', f'## {n}. {g["title"]}（{len(g["items"])}枚）', '', g['note'], '']
        for it in g['items']:
            L += [f'### {it["name"]}　`{it["file"]}`', f'{it["role"]}　／　{it["tag"]}', '```', it['prompt'], '```', '']
        n += 1
    return '\n'.join(L).rstrip('\n') + '\n'

def build_html():
    data = json.dumps(dict(groups=GROUPS, done=DONE, tips=TIPS, style_char=STYLE_CHAR, style_bg=STYLE_BG, ref=REF, total=TOTAL), ensure_ascii=False)
    data = data.replace('</', '<\\/')
    return HTML.replace('/*DATA*/', data).replace('__TOTAL__', str(TOTAL))

HTML = '''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>イラスト・プロンプト完全版</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet">
<style>
/* 設計：スマホで1項目ずつコピーする道具。上に使い方と共通の文、下に4つの束。印色はマゼンタ（背景に使う色）。 */
:root {
  --bg: #f1f3f7; --card: #ffffff; --ink: #1c2330; --sub: #5a6577; --line: #d9dee8; --accent: #c0158f; --accent-ink: #ffffff; --ok: #1f7a4d;
  --code: #eef1f6;
  --display: "Zen Maru Gothic", "Noto Sans JP", sans-serif; --body: "Noto Sans JP", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #12151c; --card: #1b2030; --ink: #e8ecf4; --sub: #9aa5ba; --line: #2c3448; --accent: #ff5fc8; --accent-ink: #1a0b14; --ok: #5fd09a; --code: #151a27; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #12151c; --card: #1b2030; --ink: #e8ecf4; --sub: #9aa5ba; --line: #2c3448; --accent: #ff5fc8; --accent-ink: #1a0b14; --ok: #5fd09a; --code: #151a27; color-scheme: dark; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--body); line-height: 1.7; }
.wrap { max-width: 760px; margin: 0 auto; padding: 20px 16px 80px; display: flex; flex-direction: column; gap: 20px; }
h1 { font-family: var(--display); font-size: 1.6rem; margin: 0; text-wrap: balance; }
h2 { font-family: var(--display); font-size: 1.2rem; margin: 0 0 4px; text-wrap: balance; }
p { margin: 0; }
.lead { color: var(--sub); }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
.tile { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }
.tile b { display: block; font-size: 1.5rem; font-family: var(--display); font-variant-numeric: tabular-nums; }
.tile span { color: var(--sub); font-size: .8rem; }
.panel { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.panel ol { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 4px; }
nav { position: sticky; top: 0; z-index: 5; background: var(--bg); padding: 8px 0; display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
nav a { text-decoration: none; color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; font-size: .85rem; }
nav a:focus-visible, button:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
section { display: flex; flex-direction: column; gap: 10px; scroll-margin-top: 56px; }
.item { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.item.done { border-left-color: var(--ok); opacity: .72; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.name { font-weight: 700; font-size: 1.05rem; }
.role { color: var(--sub); font-size: .85rem; }
.meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: .78rem; }
.pill { background: var(--code); border: 1px solid var(--line); border-radius: 999px; padding: 1px 9px; }
code.file { background: var(--code); border-radius: 6px; padding: 1px 7px; font-size: .78rem; }
pre { margin: 0; background: var(--code); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font: .78rem/1.6 ui-monospace, "SF Mono", Menlo, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 9.5em; overflow: auto; }
pre.open { max-height: none; }
.row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
button { font: inherit; font-size: .9rem; cursor: pointer; border-radius: 8px; border: 1px solid var(--line); background: var(--card); color: var(--ink); padding: 8px 14px; min-height: 40px; }
button.copy { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); font-weight: 700; }
button.copy.ok { background: var(--ok); border-color: var(--ok); color: #fff; }
label.chk { display: inline-flex; gap: 6px; align-items: center; font-size: .85rem; min-height: 40px; }
details { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 8px 14px; }
summary { cursor: pointer; font-weight: 700; padding: 4px 0; }
dl { margin: 6px 0 4px; display: grid; gap: 6px; }
dt { font-weight: 700; font-size: .85rem; }
dd { margin: 0; color: var(--sub); font-size: .85rem; }
.prog { color: var(--sub); font-size: .85rem; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>イラスト・プロンプト完全版</h1>
    <p class="lead">『魔王が仲間になりたそうな顔でこちらを見ている』に、これから足す絵のプロンプトを、そのまま貼れる形でまとめました。1枚ずつ「コピー」を押して、Geminiに貼ってください。</p>
  </header>
  <div class="tiles" id="tiles"></div>

  <details open>
    <summary>使い方と、失敗しないコツ</summary>
    <ol id="tips"></ol>
  </details>
  <details>
    <summary>共通の文（各プロンプトには、すでに入っています）</summary>
    <div class="panel" style="border:0;padding:6px 0 0" id="common"></div>
  </details>
  <details>
    <summary>もうできている絵</summary>
    <dl id="done"></dl>
  </details>

  <nav id="nav" aria-label="絵の種類"></nav>
  <div id="groups" style="display:flex;flex-direction:column;gap:28px"></div>
</div>
<script>
const DATA = /*DATA*/;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, attrs, ...kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => { if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v); }); kids.forEach(k => e.append(k)); return e; };
const store = { get(k) { try { return JSON.parse(localStorage.getItem('prompt-book-done') || '{}')[k]; } catch (e) { return undefined; } },
  set(k, v) { try { const o = JSON.parse(localStorage.getItem('prompt-book-done') || '{}'); o[k] = v; localStorage.setItem('prompt-book-done', JSON.stringify(o)); } catch (e) {} } };

async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const ta = el('textarea', { 'aria-hidden': 'true' }); ta.value = text; ta.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove();
  }
  const old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
  btn.textContent = ok ? 'コピーしました' : '長押しでコピーしてください'; btn.classList.toggle('ok', ok);
  if (!ok) { const pre = btn.closest('.item, .panel').querySelector('pre'); if (pre) { pre.classList.add('open'); const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
  setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1800);
}

function progress() {
  let done = 0, total = 0;
  DATA.groups.forEach(g => g.items.forEach(it => { total++; if (store.get(it.id)) done++; }));
  const g = $('#prog'); if (g) g.textContent = `作った ${done} / ${total}`;
  document.querySelectorAll('.tile[data-g]').forEach(t => { const grp = DATA.groups.find(x => x.key === t.dataset.g); const n = grp.items.filter(it => store.get(it.id)).length; t.querySelector('span').textContent = `${grp.title.replace('顔グラ：', '顔：')}　作った ${n}`; });
}

(function init() {
  const tiles = $('#tiles');
  tiles.append(el('div', { class: 'tile' }, el('b', { text: String(DATA.total) }), el('span', { text: 'これから作る絵' })));
  DATA.groups.forEach(g => tiles.append(el('div', { class: 'tile', 'data-g': g.key }, el('b', { text: String(g.items.length) }), el('span', { text: g.title }))));
  DATA.tips.forEach(t => $('#tips').append(el('li', { text: t })));
  const common = $('#common');
  [['顔・敵用の絵柄', DATA.style_char], ['背景用の絵柄', DATA.style_bg], ['基準の絵に合わせる1行（2枚目から）', DATA.ref]].forEach(([t, v]) => {
    const box = el('div', { class: 'panel' }, el('div', { class: 'name', text: t }), el('pre', { text: v }), el('div', { class: 'row' }, (() => { const b = el('button', { class: 'copy', type: 'button', text: 'コピー' }); b.addEventListener('click', () => copyText(v, b)); return b; })()));
    common.append(box);
  });
  Object.entries(DATA.done).forEach(([k, v]) => { $('#done').append(el('dt', { text: k }), el('dd', { text: v })); });
  const nav = $('#nav'); nav.append(el('span', { class: 'prog', id: 'prog', style: 'align-self:center;margin-right:4px' }));
  const host = $('#groups');
  DATA.groups.forEach(g => {
    nav.append(el('a', { href: '#' + g.key, text: `${g.title.replace('顔グラ：', '顔：')}（${g.items.length}）` }));
    const sec = el('section', { id: g.key }, el('div', {}, el('h2', { text: g.title }), el('p', { class: 'lead', text: g.note })));
    g.items.forEach(it => {
      const card = el('div', { class: 'item' + (store.get(it.id) ? ' done' : '') });
      const chk = el('input', { type: 'checkbox', id: 'c-' + it.id }); chk.checked = !!store.get(it.id);
      chk.addEventListener('change', () => { store.set(it.id, chk.checked); card.classList.toggle('done', chk.checked); progress(); });
      const copy = el('button', { class: 'copy', type: 'button', text: 'コピー' }); copy.addEventListener('click', () => copyText(it.prompt, copy));
      const more = el('button', { type: 'button', text: '全文を見る' }); const pre = el('pre', { text: it.prompt });
      more.addEventListener('click', () => { const o = pre.classList.toggle('open'); more.textContent = o ? 'たたむ' : '全文を見る'; });
      card.append(
        el('div', { class: 'head' }, el('div', {}, el('div', { class: 'name', text: it.name }), el('div', { class: 'role', text: it.role })),
          el('div', { class: 'meta' }, el('span', { class: 'pill', text: it.tag }), el('code', { class: 'file', text: it.file }))),
        pre,
        el('div', { class: 'row' }, copy, more, el('label', { class: 'chk', for: 'c-' + it.id }, chk, document.createTextNode('作った'))));
      sec.append(card);
    });
    host.append(sec);
  });
  progress();
})();
</script>
</body>
</html>
'''

if __name__ == '__main__':
    d = os.path.join(ROOT, 'docs')
    with open(os.path.join(d, 'イラスト生成プロンプト_完全版.md'), 'w', encoding='utf-8') as f: f.write(build_md())
    with open(os.path.join(d, 'イラスト生成プロンプト_完全版.html'), 'w', encoding='utf-8') as f: f.write(build_html())
    print('items', TOTAL)
