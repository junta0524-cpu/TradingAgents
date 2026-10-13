# CLAUDE.md — 『魔王が仲間になりたそうな顔でこちらを見ている』

全体の仕様は `docs/仕様書.md`（ユーザー提供の原文）。作業前に必ず読むこと。
小説本文（セリフの元）は `docs/novel/`。セリフはここから取り、書き換えない。

## 絶対に守ること（要約）

- `index.html` をダブルクリックで遊べる。サーバー不要。`type="module"`・`fetch()` 禁止。外部ライブラリ禁止。
- 全体の入れ物は `window.GAME` 1つ。`<script src>` は `index.html` に読み込み順で並べる。
- 会話・敵・言霊・マップなどは `js/data/`、数値は `js/data/balance.js` に書く。
- 既存RPGの固有名詞・セリフ・画像・音楽は使わない。
- 物語の核：ベルは死なない守り手（ベル以外が倒れたらゲームオーバー）／敵は洗脳された善人／「名の剥奪」に「名呼び」で対抗。
- セリフはユーザー提供の文章を優先し、勝手に書き換えない。
- F1でデバッグメニュー（仕様書 第13章）。
- 各ファイルの先頭に日本語で「このファイルの役目」を2〜3行。

## 進め方

- 1フェーズずつ。終わったら止まって「できたこと／確認の手順／気になった点」を専門用語なしで報告し、ユーザーの「OK」を待つ。
- ユーザーはリフォーム業界の職人。確認は「〇〇キーを押して△△になればOK」の形で書く。
- フェーズ終了ごとにgitで記録する。
- あいまいな点は案を2つ出して選んでもらう。小さなことは遊びやすさ優先で決めてよい。

## 構成メモ（実装で決めたこと）

- `js/core/`：土台（入力・描画・ウィンドウ・メッセージ・場面管理・乱数・デバッグ・起動）
- `js/scenes/`：各画面（title / map / fieldmenu）。仕様書の構成にない追加フォルダ。
- マップ：`js/data/maps/*.js` に文字の並び（rows）で書く。文字の意味は `js/data/tiles.js`。人（npcs）・宝箱（chests）・立て札（signs）・出入口（warps）も同じファイルに書く。新しいマップは index.html に1行足す。
- 絵：マス目は `js/core/tileset.js`、人物は `js/data/sprites.js` の型紙＋色。宝箱のフラグ名は `chest:マップ名:宝箱名`。
- セリフの「（仮）」は、小説の文章が届いたら差し替える。
- 戦闘：計算は `js/systems/battle.js`（画面と分離。自動100回戦闘も同じ計算を使う）、画面は `js/scenes/battle.js`。敵は `js/data/enemies.js`、出る場所はマップの `encounter`。お金は「銅貨」（`G.state.copper`）。
- ゲームオーバー：ベル以外が倒れると、一番新しい記録（自動・記録1〜3のうち）へ戻る。敵の出ない場所に入るたび、宿屋に泊まるたびに自動保存。
- セーブ：`js/core/save.js`（localStorage、`maou_save_auto/1/2/3`、version 付き）。形式を変えたら VERSION を上げる。
- 言霊：一覧は `js/data/kotodama.js`（仕様書の全54個）。効き目の処理は `js/systems/kotodama.js`（戦闘・移動中で共通）。`phase` が今のフェーズより大きいものは灰色。
- 成長：`js/systems/growth.js`、表は balance.js の GROWTH/EXP_TABLE。ベルは fixed（レベルなし）。経験値はベル以外で分ける。
- 装備・道具：`js/data/items.js`、値段は balance.js の PRICES。お店は `js/data/shops.js`、町の人に `shop:` / `inn: true`。
- 一覧から選ばせるときは `G.ui.choose(items, opts, onSelect)`、はい/いいえは `G.ui.confirm`。
- 状態異常：`js/systems/status.js`（名前は `js/data/status.js`、数字は balance.js の STATUS）。毒だけ戦闘後も残る。移動中の毒は1で止まる。
- 仲間：最大4人。臨時の仲間は「その土地の間だけ同行」（ユーザー決定）。`G.party.join/leave/setTemps`。強さは balance.js の TEMP_PARTY。
- 作戦：`js/systems/ai.js` の STYLE 表（うまくやって／どんどん攻めて／回復まかせた／MP節約で／いのち優先／ぜんぶ指示する）。ベルと臨時の仲間は最初「うまくやって」。
- 敵の行動はラウンドの最初に決める（`planEnemies`、先読みで見える）。敵の言霊は `G.DATA.kotodamaEnemy`。
- 阻害ゲージ：`js/systems/inhibit.js`（`G.state.inhibit`、数字は balance.js の INHIBIT）。ベルの言霊・本気・致命傷の阻止で減る。マップの `detection`（0〜3）で1歩ごとに減る。ゼロで `G.scenes.exposure`。宿屋で半分まで戻る。
- 守り手：仲間への致命の一撃を、ベルが1戦に1度だけ止める（`applyDamage` が文を返す）。AIのベルは力を使わない。
- 蹂躙戦闘：`js/scenes/rampage.js`、場面は `js/data/rampage.js`（ch10 止める・打ち払う／free）。結果は `G.state.vars.rampage_<key>`。2章はユーザーの指示で、ふつうの戦闘（`battle` の `erase: true`＝倒した兵は「消える」）に変えた。
- 別行動：`G.state.split`（null／'away'／'watch'）。`G.party.active()` がベル以外になる。マップの先頭は `G.party.leader()`。
- 物語：場面は `js/data/story/`（`chapters.js` に章の一覧、`ch01.js` などに場面）。流すしくみは `js/systems/event.js`（命令の一覧は先頭のコメント）、章をまたぐのは `js/systems/story.js`。背景の絵は `js/core/backdrop.js`。
- 章の状態：`G.state.chapter`、`G.state.disguised`（4〜9章の偽名中だけ阻害ゲージが動く）、`G.state.resume`（つづきから遊ぶとき最初に流す場面。章の頭だけ入れる）。場面の途中は自動保存しない。
- マップのしかけ：人の `event`／`doneFlag`、出る条件 `if`／`unless`／`chapter`（`G.flags.check`）、マップの `onEnter`・`triggers`・`spots`、出入口の `requires`／`blockedText`、`tint`。
- 言伝：ことだまから唱えると `G.DATA.kotozute` の、その場所の場面が流れる。
- 1〜3章のベルは名前「ベルイザナ」・見た目 `bell_true`、4章から「ベル」（章の頭の `rename`）。
- 第二部（4〜7章）：章ごとに「道（敵が出る）＋集落」。ミナモ→ひなた野（4）、聖の森（5）、炉ヶ岳（6）、獣ノ原・葛の里（7）。章の頭はその土地の入口から始まる。
- 物語の戦い：場面の `battle` 命令（逃げられない）。`hook(st)` でラウンドの終わりにセリフ（`{type:'talk'}`）や習得を差し込める（4章の野犬戦）。戦いの前に `save` しておくと、倒れたときそこからやり直し。
- 言霊の習得は場面の `learn`。オオナムチは最初は言霊なし（4章で堅め・癒やし、5章で心鎮め、6章で火種）。
- 臨時の仲間は場面の `join`／`leave`（その土地の間だけ）。7章の夜の井戸は `state: { split: 'watch' }` でベルが見守る。
- デバッグで章へ飛ぶと、`chapters.js` の `prep`（レベル・言霊・銅貨）にそろえる。
- 選択肢は場面の `choice`（5章の「心を保つ選択」。頷いた回数は `G.state.vars.ch5_nod`）。
- マップの `flagTiles`（フラグで変わるマス。7章の抜け道）、`battleBg`（戦いの背景：field/forest/mountain/wild/night）、`spots` の `member`（その仲間がいるときだけ）。
- 第三部（8〜12章・エピローグ）：天津京（8・9章、宿の主人で昼夜を切り替え、夜だけ貧民区）、やすらぎの院（9章、見張りの `patrol`／`sight`／`caught`）、10章は場面＋蹂躙ch10＋追手の戦い、11章は魔界の拠点（角ヶ原・嵐ヶ峰・聖域で修行、順番自由）、12章は砦の場面とエピローグ。
- 戦いの追加：`training`（手合わせ。負けてもやり直しにならない。勝ったかは `last_battle_won`）、hook で `st.forceWin`、`chant`（12章の王戦の詠唱ゲージ）。
- 9章の祈り：場面の `pillar`（覚えた言霊の数で光り方が変わる。合計は `G.state.vars.prayer`）。五柱目は `choice` の `disabled`。
- 途中でやり直す長い章は、`resume` を途中の場面（`ch10_escape`／`ch11_takeru`／`ch12_battle`）に変えてから `save` する。
- クリアすると `G.state.cleared = true` の記録が自動の枠に残り、タイトルへ戻る（クリア後はフェーズ9）。
- 出入口の `when`（同じマスでも章で行き先が変わる。宮の西の扉：3章は牢、11章は聖域）。条件の `all: [...]`（全部のフラグ）。
- クリア後（`chapter: 13`、`G.state.cleared`）：場面は `js/data/story/postgame.js`。師（守＝ハニヤス、攻＝ミカヅチ、再生＝ナキメ、知＝ナキメの裏修行／ツクヨミの社／ベルとの特訓）の手合わせで、balance.js の `POSTGAME.TEACH` の順に言霊を教わる（場面の `teach`）。四系統が `POSTGAME.SYSTEM_REQ` に届くとクナドが大穴の最深部（`oana_soko`）へ。試練の扉で天の声の6問 → 調和の光、ベルとの最終手合わせ → まことの名、ミカヅチから任意の大軍戦。
- クリア後の戦い：仲間が倒れても、ラウンドの終わりまでに起こせば続く（ベルのAIが「生き返し」を使う）。戦いのあとは体力1で起き上がる。レベル上限は99（Lv99でカンスト。能力は体力・MP 999、ほかは255が上限＝`recalc` で頭打ち）。
- 条件の `knows`（オオナムチがその言霊を覚えていること）。場面の `msgfn`／`stop`。
- デバッグのフェーズ番号は `js/core/debug.js` の CURRENT_PHASE（フェーズを進めたら上げる）。
- `js/data/`：データ。`GAME.DATA` の下に入れる。
- 画面は内部 480×320。`GAME.renderer` が整数倍で拡大表示（画面が480より狭いときだけ縮小）。
- 入力は `GAME.input.pressed('ok')` のように命令名で読む。命令名：up/down/left/right/ok/cancel/fast/debug。
- 場面は `GAME.scene.change / push / pop`。上に積んだ場面ほど手前に描かれ、操作は一番上だけが受け取る。
- 動作確認：`node tools/check.js`（Playwright＋Chromiumで index.html を開き、エラーがないか確かめて画面写真を撮る）。
- 音（フェーズ10）：`js/core/sound.js`（Web Audio で波形から鳴らす。外部の音源なし）。効果音 `G.sound.se('ok')`、曲 `G.sound.bgm('field')`。曲はこのゲームのための短い旋律（`SONGS`）。マップの `bgm`、場面の `bgm` 命令、戦闘・蹂躙・タイトルで切り替え、戦闘のあとは元の曲に戻る。ブラウザの決まりで最初の操作まで鳴らない。
- 設定（フェーズ10）：`js/scenes/settings.js`（文字の速さ／敵の出やすさ ふつう・少なめ／音の入・切）。タイトルとメニューから開く。`G.settings` に入り localStorage に保存。
- スマホ：縦画面は下にボタン、横画面はボタンを画面の左右に重ねる（css の横向き用の指定）。「早」ボタンで会話の早送り。
- 大事なもの：道具の `type: 'key'`（売れない。`read` があれば持ち物から読める）。2章の書きかけの手紙 `kakikake_tegami`。
- 12章の名呼び：オオナムチのレベルが balance.js の `NAYOBI_LV` より低いと、三度目にクナドが手を貸す（フラグ `nayobi_assist`）。小説に場面がないので、セリフは足さず（　）の注記だけ。
- 四すくみ：`js/data/tribes.js`（種族と相性）、`js/systems/affinity.js`（倍率）。敵の `tribe`。ベル以外の仲間は、唱えた言霊の系統で「構え」（`stance`、戦いの頭で消える）が決まり、攻めるときも受けるときも balance.js の `AFFINITY` 倍。相性の表示は11章で教わったあと（フラグ `train_susa`）。
- ベルの強さ（ユーザー決定）：魔王ベルイザナはカンスト（balance.js の `BELL_TRUE`）。4〜9章の冒険者ベル（`G.state.disguised`）は「その章の推奨レベル（balance.js の `REC_LV`）＋`BELL_OVER`(10)」のオオナムチと同じ強さ（MPは99）。`G.party.recalc` が disguised を見て切り替え、場面の `state` 命令で disguised か chapter を変えると計算し直す（正体を現すと満タン）。
- 解像度：`js/core/renderer.js` が canvas の中身を「表示の拡大率×画面の細かさ（devicePixelRatio）」の整数倍で描く（`G.renderer.res`、最大6倍）。座標は480×320のまま、`setTransform` で拡大。canvas を直接読み書きする処理（getImageData など）を足すときは注意。
- 魔王ベルイザナの攻撃（ユーザー決定）：2章だけの特別仕様で、ベルの「こうげき」は敵全体へ balance.js の `BELL_TRUE_HITS`（2）回（`BELL_TRUE_HITS_CHAPTER`）。ほかの章はふつうの1回攻撃。2章はベルを「ぜんぶ指示する」にして操作させ、終わったら元に戻す。
- 2章のタケル（`takeru_ch2`）：人間界最強（体力600・攻撃230・守り200・素早さ240）。敵の `hits: 2`（1ターンに2回打つ）、`spare: true`（体力が1から下がらない）。hook で体力1になったら勝ち。11章の `takeru_b` は別の数字。
- フィールドマップ（ユーザーのデザイン「人間界と魔界の地図」のゲーム用フィールドどおり）：`world_ningen`（人間界）・`world_makai`（魔界）。32×22マス、1マスが一つの土地。物語の町は小説の名前で置き（ユーザー決定：章立ては小説のまま）、出入口の `requires` の `chapterFrom`／`chapterTo` で、その章から入れる。ほかの地名はユーザーの地図の名前で、マップの `places`（立つと左上に名前）だけ。敵は `encounter.byChapter`（章ごとの組）。人間界へは野原（field_minamo）の西・聖の森の道の南・炉ヶ岳の山道の南・獣ノ原の西・天津京の南から出る。魔界へは11章とクリア後だけ、土蜘蛛族の畑の南から出る。マスは tiles.js の「フィールドマップ」の欄。
- ゲーム版の資料の統一（ユーザー決定：ボリュームのある方＝今のゲームに統一）：`docs/game_version_unified/`（CLAUDE.md・characters.js・maps.js）が今のゲームに合わせた統一版。資料から取り入れたのは、クリア後に大穴で両世界を行き来（出入口の `chapterAlso: 13`）、レベル上限99、地名の由来（`places` の `note`）。元の資料：「ゲーム版」の設計（Google ドライブの CLAUDE.md https://drive.google.com/file/d/15LD_LCrw_0jdL7R3IKuQnwSQKyuAizCf ／ characters.js https://drive.google.com/file/d/1pgpffeR3lut_ADAz3wgoUuRk4yZNNQ_8 ／ maps.js https://drive.google.com/file/d/1X_tZtrUa-0TnnCsOKkvs5VUmE3arxNTk ）。章立て・仲間・地名・手加減システムが今のゲーム（小説）と違う。フィールドマップの地名の位置は maps.js の places に合わせた。
- クリア後のやりこみ：フィールドの `encounter.byChapter[13]` を `{ byLevel: [{ from, groups }] }` にして、オオナムチのレベルで強い敵（`zantou` 残党の将・`orochi` 黄泉の大蛇・`nakui_ou` 名喰いの王。enemies_post.js）が出る。魔界のフィールドの城・村・町は地面が魔界の色のマス（`<` `>` `@`）。
- 認識阻害の見え方（仕様書 7-1）：偽名の間（4〜9章）、場面にオオナムチがいないと、ベルの姿がうっすら揺らいで描かれる（`G.inhibit.impression`、濃さは balance.js の `INHIBIT.FADE_ALPHA`／`FADE_SWAY`）。オオナムチがいればくっきり。
- 文字の大きさ（設定）：`G.settings.textSize`（normal／large）。large のとき会話の窓だけ文字が balance.js の `TEXT_SIZE_LARGE`（16）になり、窓が少し高くなる（`js/core/message.js`）。`G.renderer.text/measure/wrap` は最後の引数で文字の大きさを指定できる。マップでも、偽名の間にオオナムチと一緒にいないベルは薄く描く。
- 1章の話し手（ユーザー決定）：「三倍で済むなら安いものだ」はベルイザナ、「何を――」はオモイカ。「行ってください、どうか――」は小説で「誰の手だったか、分からない」なので名前なしのまま。6章でコトシロが仲間になるのは仕様書（商人・鑑定の加入）どおり。
