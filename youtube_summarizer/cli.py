from pathlib import Path

import typer
from rich.console import Console
from rich.markdown import Markdown

from .errors import YouTubeSummarizerError
from .fetcher import extract_video_id, fetch_metadata, fetch_transcript
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
) -> None:
    """指定したYouTube動画を要約する。"""
    try:
        video_id = extract_video_id(url)
        lang_list = [lang.strip() for lang in languages.split(",") if lang.strip()]

        console.print(f"[bold]動画情報を取得中...[/bold] ({video_id})")
        metadata = fetch_metadata(video_id)

        console.print("[bold]文字起こしを取得中...[/bold]")
        transcript = fetch_transcript(video_id, lang_list)

        console.print("[bold]要約を生成中...[/bold]")
        result = summarize_video(metadata, transcript, provider=provider, model=model)
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
