from pathlib import Path

import typer
from rich.console import Console
from rich.markdown import Markdown

from .errors import YouTubeSummarizerError
from .fetcher import (
    extract_video_id,
    fetch_channel_stats,
    fetch_metadata,
    fetch_thumbnail,
    fetch_transcript,
)
from .report import render_markdown
from .summarizer import summarize_video

app = typer.Typer(
    name="youtube-summarizer",
    help="YouTube動画の文字起こし・要約・要点・再生回数が伸びた理由をまとめます。",
    add_completion=False,
)
console = Console()


@app.command()
def summarize(
    url: str = typer.Argument(..., help="YouTube動画のURLまたは動画ID"),
    provider: str = typer.Option("anthropic", help="要約に使うLLMプロバイダ"),
    model: str = typer.Option("claude-sonnet-5", help="要約に使うモデル名"),
    languages: str = typer.Option("ja,en", help="文字起こしの優先言語(カンマ区切り)"),
    output: str | None = typer.Option(
        None, "--output", "-o", help="Markdownレポートの保存先(未指定なら標準出力に表示)"
    ),
    include_transcript: bool = typer.Option(
        True, help="レポートに全文文字起こしを含めるか"
    ),
    channel_comparison: bool = typer.Option(
        True, help="チャンネル直近動画の平均再生回数と比較するか"
    ),
    channel_sample_size: int = typer.Option(
        15, help="チャンネル平均を計算する対象の直近動画本数"
    ),
    thumbnail: bool = typer.Option(
        True,
        help="サムネイル画像を取得しLLMに渡して視覚的な訴求力も考察させるか"
        "(画像入力に対応したモデル/プロバイダが必要)",
    ),
) -> None:
    """指定したYouTube動画を要約する。"""
    try:
        video_id = extract_video_id(url)
        lang_list = [lang.strip() for lang in languages.split(",") if lang.strip()]

        console.print(f"[bold]動画情報を取得中...[/bold] ({video_id})")
        metadata = fetch_metadata(video_id)

        console.print("[bold]文字起こしを取得中...[/bold]")
        transcript = fetch_transcript(video_id, lang_list)

        channel_stats = None
        if channel_comparison and metadata.channel_url:
            console.print("[bold]チャンネル平均再生回数を取得中...[/bold]")
            try:
                channel_stats = fetch_channel_stats(
                    metadata.channel_url, exclude_video_id=video_id, sample_size=channel_sample_size
                )
            except YouTubeSummarizerError as exc:
                console.print(f"[yellow]チャンネル平均の取得をスキップしました:[/yellow] {exc}")

        thumbnail_bytes, thumbnail_mime_type = None, "image/jpeg"
        if thumbnail and metadata.thumbnail_url:
            console.print("[bold]サムネイル画像を取得中...[/bold]")
            try:
                thumbnail_bytes, thumbnail_mime_type = fetch_thumbnail(metadata.thumbnail_url)
            except YouTubeSummarizerError as exc:
                console.print(f"[yellow]サムネイル画像の取得をスキップしました:[/yellow] {exc}")

        console.print("[bold]要約を生成中...[/bold]")
        result = summarize_video(
            metadata,
            transcript,
            provider=provider,
            model=model,
            channel_stats=channel_stats,
            thumbnail=thumbnail_bytes,
            thumbnail_mime_type=thumbnail_mime_type,
        )
    except YouTubeSummarizerError as exc:
        console.print(f"[bold red]エラー:[/bold red] {exc}")
        raise typer.Exit(code=1) from exc

    report = render_markdown(result, include_transcript=include_transcript)

    if output:
        output_path = Path(output)
        output_path.write_text(report, encoding="utf-8")
        console.print(f"[bold green]レポートを保存しました:[/bold green] {output_path}")
    else:
        console.print(Markdown(report))


if __name__ == "__main__":
    app()
