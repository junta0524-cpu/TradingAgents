# YouTube Summarizer

YouTube動画のURL(または動画ID)から、以下をまとめて生成するツールです。

- **文字起こし** — 動画の字幕(手動 or 自動生成)から取得した全文テキスト
- **要約** — 動画全体の要約
- **要点** — 箇条書きの要点リスト
- **再生回数の理由** — タイトル・構成・話題性・チャンネル平均との比較・サムネイルの見た目
  などをもとにした、再生回数が伸びた理由の考察

TradingAgents本体(株式トレーディング機能)とは独立したスタンドアロンのモジュールです。
既存の `tradingagents.llm_clients` (Anthropic / OpenAI / Google / Azure / Bedrock など)
を要約エンジンとして再利用しています。

## セットアップ

```bash
# CLIのみ
pip install -e ".[youtube]"

# ブラウザ版アプリも使う場合
pip install -e ".[youtube,web]"
```

要約に使うLLMプロバイダのAPIキー(例: `ANTHROPIC_API_KEY`)を環境変数に設定してください。

## 使い方

### ブラウザ版アプリ

```bash
youtube-summarizer-web
```

起動すると `http://127.0.0.1:5000` でローカルWebアプリが立ち上がります。ブラウザで開いて
URLを入力し「要約する」を押すだけで、文字起こし・要約・要点・再生回数の理由(チャンネル
平均との比較・サムネイル分析込み)が画面に表示され、Markdownとしてダウンロードもできます。

`PORT` 環境変数でポートを変更できます(例: `PORT=8080 youtube-summarizer-web`)。
`python -m youtube_summarizer.webapp` でも同じように起動できます。

これはローカル/個人利用を想定した最小構成のアプリで、認証やレート制限はありません。
インターネットに公開する場合は、リバースプロキシでの認証追加などの対策を行ってください。

### CLI

```bash
youtube-summarizer "https://www.youtube.com/watch?v=XXXXXXXXXXX"

# Markdownファイルに保存
youtube-summarizer "https://youtu.be/XXXXXXXXXXX" -o report.md

# プロバイダ・モデル・文字起こしの優先言語を指定
youtube-summarizer "XXXXXXXXXXX" --provider openai --model gpt-5 --languages en,ja

# チャンネル平均比較・サムネイル分析を無効化(非対応モデルを使う場合など)
youtube-summarizer "XXXXXXXXXXX" --no-channel-comparison --no-thumbnail
```

`python -m youtube_summarizer.cli` でも同じコマンドを実行できます。

### Pythonから利用

```python
from youtube_summarizer import (
    extract_video_id,
    fetch_metadata,
    fetch_transcript,
    fetch_channel_stats,
    fetch_thumbnail,
    summarize_video,
    render_markdown,
)

video_id = extract_video_id("https://www.youtube.com/watch?v=XXXXXXXXXXX")
metadata = fetch_metadata(video_id)
transcript = fetch_transcript(video_id, languages=["ja", "en"])

# 任意: チャンネル直近動画の平均再生回数と比較
channel_stats = None
if metadata.channel_url:
    channel_stats = fetch_channel_stats(metadata.channel_url, exclude_video_id=video_id)

# 任意: サムネイル画像の視覚的な訴求力もLLMに考察させる(画像対応モデルが必要)
thumbnail_bytes = thumbnail_mime = None
if metadata.thumbnail_url:
    thumbnail_bytes, thumbnail_mime = fetch_thumbnail(metadata.thumbnail_url)

result = summarize_video(
    metadata,
    transcript,
    provider="anthropic",
    model="claude-sonnet-5",
    channel_stats=channel_stats,
    thumbnail=thumbnail_bytes,
    thumbnail_mime_type=thumbnail_mime or "image/jpeg",
)

print(render_markdown(result))
```

## 機能の詳細

### チャンネル平均との比較

`fetch_channel_stats` はチャンネルの「動画」タブから直近N本(デフォルト15本、
`--channel-sample-size` / `sample_size` で変更可)の再生回数を取得して平均を計算します。
「再生回数の理由」には、本動画の再生回数がチャンネル平均の何倍かという定量的な根拠が
加わります。チャンネル情報が取得できない場合は自動的にスキップされます(CLIでは警告を
表示して処理を継続します)。

### サムネイル画像の見た目分析

`fetch_thumbnail` はサムネイル画像をダウンロードし、`summarize_video` が画像対応モデル
(Claude Sonnet 5 など)にテキストと一緒に渡します。配色・文字の視認性・表情やインパクト
といった視覚的な訴求力も「再生回数の理由」の考察に含まれます。画像入力に対応していない
プロバイダ/モデルを使う場合は `--no-thumbnail` で無効化してください。

## 注意事項

- 字幕(手動または自動生成)が存在しない動画は文字起こしを取得できません。
- 「再生回数の理由」はメタデータ・文字起こし・(あれば)チャンネル平均比較やサムネイルから
  導き出したLLMによる考察であり、断定的な事実ではありません。
- メタデータ・チャンネル統計取得は yt-dlp、文字起こし取得は youtube-transcript-api を
  使用しており、どちらもYouTube側のAPI変更や地域制限の影響を受ける可能性があります。
- サムネイル画像を含める場合、画像入力に対応したモデル/プロバイダを指定してください。
