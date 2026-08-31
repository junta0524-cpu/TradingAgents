from typer.testing import CliRunner

from youtube_summarizer.cli import app
from youtube_summarizer.models import VideoMetadata, VideoSummary

runner = CliRunner()

METADATA = VideoMetadata(
    video_id="abc12345678",
    url="https://www.youtube.com/watch?v=abc12345678",
    title="Test Video",
    channel="Test Channel",
    view_count=100,
)

SUMMARY = VideoSummary(
    metadata=METADATA,
    transcript="transcript text",
    summary="summary text",
    key_points=["point one"],
    view_count_reasoning="reasoning text",
)


def test_cli_summarize_writes_report_to_output(monkeypatch, tmp_path):
    monkeypatch.setattr("youtube_summarizer.cli.extract_video_id", lambda url: METADATA.video_id)
    monkeypatch.setattr("youtube_summarizer.cli.fetch_metadata", lambda video_id: METADATA)
    monkeypatch.setattr("youtube_summarizer.cli.fetch_transcript", lambda video_id, languages: "transcript text")
    monkeypatch.setattr(
        "youtube_summarizer.cli.summarize_video",
        lambda metadata, transcript, provider, model: SUMMARY,
    )

    output_path = tmp_path / "report.md"
    result = runner.invoke(app, [METADATA.url, "--output", str(output_path)])

    assert result.exit_code == 0, result.output
    assert output_path.exists()
    content = output_path.read_text(encoding="utf-8")
    assert "summary text" in content
    assert "point one" in content


def test_cli_summarize_reports_errors(monkeypatch):
    from youtube_summarizer.errors import VideoFetchError

    def _raise(url):
        raise VideoFetchError("bad url")

    monkeypatch.setattr("youtube_summarizer.cli.extract_video_id", _raise)

    result = runner.invoke(app, ["not-a-video"])

    assert result.exit_code == 1
    assert "エラー" in result.output
