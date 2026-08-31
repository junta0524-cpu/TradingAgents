# x_uranai_automation

X（旧Twitter）占いアカウントの自動投稿・スケジューリング・収益化トラッキングツール。TradingAgentsの金融トレーディング機能とは独立したモジュールで、`tradingagents.llm_clients`（マルチプロバイダLLM抽象化）だけを再利用しています。

## セットアップ

```bash
pip install ".[x_automation]"
cp .env.example .env   # LLMプロバイダのAPIキー、X_API_* を設定
```

`X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` は X Developer Portal の対象アプリ「Keys and tokens」ページで発行される OAuth 1.0a User Context の資格情報です。未設定でも `generate-day` や `post-day`（`--live` なし＝dry-run）は動作します。

タロットカード画像を生成するには日本語対応フォントが必要です：

```bash
sudo apt-get install -y fonts-noto-cjk   # Debian/Ubuntu。GitHub Actionsワークフローにも組み込み済み
```

フォントが別の場所にある場合は `X_AUTOMATION_CJK_FONT` でパスを指定してください。

## 使い方

```bash
# 今日の投稿案を生成して確認するだけ（投稿はしない）
python -m x_uranai_automation.cli generate-day --provider openai --model gpt-5.4-mini

# dry-run で投稿フローを通しで確認(実際には送信しない)
python -m x_uranai_automation.cli post-day

# 実際にXへ投稿
python -m x_uranai_automation.cli post-day --live

# 1枠だけ投稿(スケジューラーからの呼び出し用。0=メイン枠, 1・2=タロット1枚引き)
python -m x_uranai_automation.cli post-slot --slot-index 0 --live

# 収益化ファネルのイベントを記録(プロフィールリンククリック数、LINE登録数など)
python -m x_uranai_automation.cli log-funnel line_registration --count 3

# 集計を確認
python -m x_uranai_automation.cli stats
```

投稿ログは `~/.x_uranai_automation/posts.jsonl`、ファネルイベントは `~/.x_uranai_automation/funnel.jsonl` に追記されます。

## 毎日の自動投稿(GitHub Actions)

`.github/workflows/x_uranai_daily.yml` で、`scheduler.DEFAULT_SLOTS`(7:30/12:00/21:30 JST)の3枠それぞれに合わせてcronが発火し、`post-slot`で1枠ずつ投稿します。サーバー不要・無料で運用できます。

**セットアップ手順**

1. GitHubリポジトリの Settings > Secrets and variables > Actions で以下を登録
   - Secrets: `OPENAI_API_KEY`(または使うLLMプロバイダのキー)、`X_API_KEY`、`X_API_SECRET`、`X_ACCESS_TOKEN`、`X_ACCESS_TOKEN_SECRET`
   - Variables: `X_AUTOMATION_LIVE` を `true` に設定(**未設定・false のうちはdry-runのまま**。ログで生成内容を確認してから有効化することを推奨)
2. リポジトリの Actions タブでワークフローを有効化
3. 動作確認は Actions > "X Uranai Daily Posting" > "Run workflow" で手動実行できる(`slot_index`を指定)

OpenAI以外のLLMプロバイダを使う場合は、ワークフロー内の `pip install` 行と `X_AUTOMATION_LLM_PROVIDER` / `X_AUTOMATION_LLM_MODEL` 環境変数(`post-slot`の`--provider`/`--model`が読む)を合わせて変更してください。

## 構成

| モジュール | 役割 |
|---|---|
| `persona.py` | アカウントの人格設定、12星座データ、タロット大アルカナ22枚 |
| `templates.py` | バズりやすい投稿フォーマットごとのプロンプト |
| `content_generator.py` | LLMで本文を生成し、コンプライアンスチェックを通す |
| `compliance.py` | 景品表示法上の断定表現（「絶対当たる」等）を検出・拒否 |
| `image_generator.py` | タロットカード風のブランド画像をPillowで生成（外部API不要） |
| `x_client.py` | X API v2への投稿クライアント（OAuth 1.0a、画像アップロード対応、dry-run既定） |
| `scheduler.py` | 曜日ローテーションで1日の投稿枠を組み立てる |
| `analytics.py` | 投稿ログ・収益化ファネルイベントの記録と集計 |
| `cli.py` | 上記を束ねるコマンド群 |

## 自動化にあたって必要なこと

- **X Developer Portalでの申請とAPI利用枠**：無料枠は投稿数が少ないため、本格運用ならBasic/Proプランを検討する
- **自動化であることの明示**：完全自動投稿はスパム判定・凍結のリスクがあるため、Xの自動化ポリシーに沿って運用する（人間によるレビューを挟む運用が無難）
- **コンプライアンス**：景品表示法（「絶対当たる」等の断定表現の禁止）、有料サービスへ誘導する場合は特定商取引法の表記
- **コンテンツパイプライン**：ペルソナ・世界観の固定、画像（`image_generator.py`でタロットカード風ビジュアルを自動生成）、投稿スケジュール
- **分析基盤**：Xアナリティクス、この`analytics.py`によるファネル計測

## バズる投稿パターン（占いジャンル）

| 型 | 実装 | 特徴 |
|---|---|---|
| 12星座ランキング | `templates.ranking` | 自分の星座を探させる導線でリプ・保存率が高い |
| 今日の1枚(タロット) | `templates.tarot_pull` | シンプルで毎日回せる。`image_generator.py`が自動でカード画像を添付 |
| 参加型診断 | `templates.diagnosis` | リプ・引用RTを誘発し、フォロー外にも伸びやすい |
| 要注意ランキング | `templates.caution_ranking` | 保存・シェアされやすいが、煽りすぎない前向きな締めが必須 |
| スレッド深掘り | `templates.thread` | タロット1枚引き→解説→アドバイスの3連投で滞在時間を伸ばす |
| 天体イベント便乗 | `templates.trend_event` | 満月・水星逆行など、タイミング投稿でインプレッションが伸びる |

投稿時間は通勤前(7:30)・昼休み(12:00)・夜(21:30)の3枠が既定（`scheduler.DEFAULT_SLOTS`）。曜日ごとのフォーマットは `templates.WEEKDAY_ROTATION` で変更できる。

## 収益化の仕組み

- **X本体**：X Premium加入＋クリエイター収益分配プログラム、サブスクリプション機能、チップ
- **外部誘導**：プロフィールリンク→公式LINE登録→個別鑑定(有料)、note/Brainでの鑑定コンテンツ販売、ココナラ等での鑑定出品、パワーストーン等のアフィリエイト、有料オンラインサロン
- ファネルの各段階（リンククリック→LINE登録→鑑定購入）は `analytics.log_funnel_event` で記録し、`stats`コマンドで転換率を追える
