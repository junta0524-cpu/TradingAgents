from typer.testing import CliRunner

from youtube_summarizer.cli import app
from youtube_summarizer.errors import VideoFetchError
from youtube_summarizer.models import ChannelStats, VideoMetadata, VideoSummary

runner = CliRunner()

METADATA = VideoMetadata(
    video_id="abc12345678",
    url="https://www.youtube.com/watch?v=abc12345678",
    title="Test Video",
    channel="Test Channel",
    channel_url="https://www.youtube.com/@testchannel",
    view_count=100,
    thumbnail_url="https://example.com/thumb.jpg",
)

SUMMARY = VideoSummary(
    metadata=METADATA,
    transcript="transcript text",
    summary="summary text",
    key_points=["point one"],
    view_count_reasoning="reasoning text",
)


def _patch_pipeline(monkeypatch, *, summarize_video_fn=None, fetch_channel_stats_fn=None, fetch_thumbnail_fn=None):
    monkeypatch.setattr("youtube_summarizer.cli.extract_video_id", lambda url: METADATA.video_id)
    monkeypatch.setattr("youtube_summarizer.cli.fetch_metadata", lambda video_id: METADATA)
    monkeypatch.setattr("youtube_summarizer.cli.fetch_transcript", lambda video_id, languages: "transcript text")
    monkeypatch.setattr(
        "youtube_summarizer.cli.summarize_video",
        summarize_video_fn or (lambda metadata, transcript, **kwargs: SUMMARY),
    )
    monkeypatch.setattr(
        "youtube_summarizer.cli.fetch_channel_stats",
        fetch_channel_stats_fn or (lambda channel_url, **kwargs: ChannelStats("Test Channel", 5, 50.0)),
    )
    monkeypatch.setattr(
        "youtube_summarizer.cli.fetch_thumbnail",
        fetch_thumbnail_fn or (lambda thumbnail_url: (b"fakeimage", "image/jpeg")),
    )


def test_cli_summarize_writes_report_to_output(monkeypatch, tmp_path):
    _patch_pipeline(monkeypatch)

    output_path = tmp_path / "report.md"
    result = runner.invoke(app, [METADATA.url, "--output", str(output_path)])

    assert result.exit_code == 0, result.output
    assert output_path.exists()
    content = output_path.read_text(encoding="utf-8")
    assert "summary text" in content
    assert "point one" in content


def test_cli_passes_channel_stats_and_thumbnail_to_summarizer(monkeypatch, tmp_path):
    calls = {}

    def fake_summarize_video(metadata, transcript, **kwargs):
        calls.update(kwargs)
        return SUMMARY

    _patch_pipeline(monkeypatch, summarize_video_fn=fake_summarize_video)

    output_path = tmp_path / "report.md"
    result = runner.invoke(app, [METADATA.url, "--output", str(output_path)])

    assert result.exit_code == 0, result.output
    assert calls["channel_stats"] == ChannelStats("Test Channel", 5, 50.0)
    assert calls["thumbnail"] == b"fakeimage"
    assert calls["thumbnail_mime_type"] == "image/jpeg"


def test_cli_can_disable_channel_comparison_and_thumbnail(monkeypatch, tmp_path):
    calls = {}

    def fake_summarize_video(metadata, transcript, **kwargs):
        calls.update(kwargs)
        return SUMMARY

    channel_stats_called = []
    thumbnail_called = []

    _patch_pipeline(
        monkeypatch,
        summarize_video_fn=fake_summarize_video,
        fetch_channel_stats_fn=lambda channel_url, **kwargs: channel_stats_called.append(1) or ChannelStats("c", 1, 1.0),
        fetch_thumbnail_fn=lambda thumbnail_url: thumbnail_called.append(1) or (b"x", "image/jpeg"),
    )

    output_path = tmp_path / "report.md"
    result = runner.invoke(
        app,
        [
            METADATA.url,
            "--output",
            str(output_path),
            "--no-channel-comparison",
            "--no-thumbnail",
        ],
    )

    assert result.exit_code == 0, result.output
    assert not channel_stats_called
    assert not thumbnail_called
    assert calls["channel_stats"] is None
    assert calls["thumbnail"] is None


def test_cli_continues_when_channel_stats_fetch_fails(monkeypatch, tmp_path):
    calls = {}

    def fake_summarize_video(metadata, transcript, **kwargs):
        calls.update(kwargs)
        return SUMMARY

    def failing_channel_stats(channel_url, **kwargs):
        raise VideoFetchError("channel unreachable")

    _patch_pipeline(
        monkeypatch,
        summarize_video_fn=fake_summarize_video,
        fetch_channel_stats_fn=failing_channel_stats,
    )

    output_path = tmp_path / "report.md"
    result = runner.invoke(app, [METADATA.url, "--output", str(output_path)])

    assert result.exit_code == 0, result.output
    assert calls["channel_stats"] is None
    assert "スキップ" in result.output


def test_cli_summarize_reports_errors(monkeypatch):
    def _raise(url):
        raise VideoFetchError("bad url")

    monkeypatch.setattr("youtube_summarizer.cli.extract_video_id", _raise)

    result = runner.invoke(app, ["not-a-video"])

    assert result.exit_code == 1
    assert "エラー" in result.output
