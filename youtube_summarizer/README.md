# YouTube Summarizer

YouTube動画のURL(または動画ID)から、以下の4点をまとめて生成するツールです。

- **文字起こし** — 動画の字幕(手動 or 自動生成)から取得した全文テキスト
- **要約** — 動画全体の要約
- **要点** — 箇条書きの要点リスト
- **再生回数の理由** — タイトル・構成・話題性などをもとにした、再生回数が伸びた理由の考察

TradingAgents本体(株式トレーディング機能)とは独立したスタンドアロンのモジュールです。
既存の `tradingagents.llm_clients` (Anthropic / OpenAI / Google / Azure / Bedrock など)
を要約エンジンとして再利用しています。

## セットアップ

```bash
pip install -e ".[youtube]"
```

要約に使うLLMプロバイダのAPIキー(例: `ANTHROPIC_API_KEY`)を環境変数に設定してください。

## 使い方

### CLI

```bash
youtube-summarizer "https://www.youtube.com/watch?v=XXXXXXXXXXX"

# Markdownファイルに保存
youtube-summarizer "https://youtu.be/XXXXXXXXXXX" -o report.md

# プロバイダ・モデル・文字起こしの優先言語を指定
youtube-summarizer "XXXXXXXXXXX" --provider openai --model gpt-5 --languages en,ja
```

`python -m youtube_summarizer.cli` でも同じコマンドを実行できます。

### Pythonから利用

```python
from youtube_summarizer import (
    extract_video_id,
    fetch_metadata,
    fetch_transcript,
    summarize_video,
    render_markdown,
)

video_id = extract_video_id("https://www.youtube.com/watch?v=XXXXXXXXXXX")
metadata = fetch_metadata(video_id)
transcript = fetch_transcript(video_id, languages=["ja", "en"])
result = summarize_video(metadata, transcript, provider="anthropic", model="claude-sonnet-5")

print(render_markdown(result))
```

## 注意事項

- 字幕(手動または自動生成)が存在しない動画は文字起こしを取得できません。
- 「再生回数の理由」はメタデータと文字起こしから導き出したLLMによる考察であり、断定的な事実ではありません。
- メタデータ取得は yt-dlp、文字起こし取得は youtube-transcript-api を使用しており、
  どちらもYouTube側のAPI変更や地域制限の影響を受ける可能性があります。
