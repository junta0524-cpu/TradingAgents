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
- 作戦：`js/systems/ai.js`（うまくやって／ぜんぶ指示する。ほかはフェーズ10）。ベルと臨時の仲間は最初「うまくやって」。
- 敵の行動はラウンドの最初に決める（`planEnemies`、先読みで見える）。敵の言霊は `G.DATA.kotodamaEnemy`。
- デバッグのフェーズ番号は `js/core/debug.js` の CURRENT_PHASE（フェーズを進めたら上げる）。
- `js/data/`：データ。`GAME.DATA` の下に入れる。
- 画面は内部 480×320。`GAME.renderer` が整数倍で拡大表示（画面が480より狭いときだけ縮小）。
- 入力は `GAME.input.pressed('ok')` のように命令名で読む。命令名：up/down/left/right/ok/cancel/fast/debug。
- 場面は `GAME.scene.change / push / pop`。上に積んだ場面ほど手前に描かれ、操作は一番上だけが受け取る。
- 動作確認：`node tools/check.js`（Playwright＋Chromiumで index.html を開き、エラーがないか確かめて画面写真を撮る）。
