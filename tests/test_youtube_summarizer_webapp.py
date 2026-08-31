import re

import pytest

pytest.importorskip("flask")  # webapp.py needs the optional `web` extra installed

from youtube_summarizer.errors import VideoFetchError  # noqa: E402
from youtube_summarizer.models import ChannelStats, VideoMetadata, VideoSummary  # noqa: E402
from youtube_summarizer.webapp import app, main  # noqa: E402

METADATA = VideoMetadata(
    video_id="abc12345678",
    url="https://www.youtube.com/watch?v=abc12345678",
    title="Test Video",
    channel="Test Channel",
    channel_url="https://www.youtube.com/@testchannel",
    view_count=1000,
    like_count=50,
    comment_count=5,
    thumbnail_url="https://example.com/thumb.jpg",
)

SUMMARY = VideoSummary(
    metadata=METADATA,
    transcript="transcript text",
    summary="summary text",
    key_points=["point one"],
    view_count_reasoning="reasoning text",
)


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    return app.test_client()


def _patch_pipeline(monkeypatch, *, summarize_video_fn=None, fetch_channel_stats_fn=None, fetch_thumbnail_fn=None):
    monkeypatch.setattr("youtube_summarizer.webapp.extract_video_id", lambda url: METADATA.video_id)
    monkeypatch.setattr("youtube_summarizer.webapp.fetch_metadata", lambda video_id: METADATA)
    monkeypatch.setattr("youtube_summarizer.webapp.fetch_transcript", lambda video_id, languages: "transcript text")
    monkeypatch.setattr(
        "youtube_summarizer.webapp.summarize_video",
        summarize_video_fn or (lambda metadata, transcript, **kwargs: SUMMARY),
    )
    monkeypatch.setattr(
        "youtube_summarizer.webapp.fetch_channel_stats",
        fetch_channel_stats_fn or (lambda channel_url, **kwargs: ChannelStats("Test Channel", 5, 500.0)),
    )
    monkeypatch.setattr(
        "youtube_summarizer.webapp.fetch_thumbnail",
        fetch_thumbnail_fn or (lambda thumbnail_url: (b"fakeimage", "image/jpeg")),
    )


def test_index_renders_form(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b'name="url"' in response.data
    assert b"\xe8\xa6\x81\xe7\xb4\x84\xe3\x81\x99\xe3\x82\x8b" in response.data  # "要約する"


def test_summarize_requires_url(client):
    response = client.post("/summarize", data={})

    assert response.status_code == 400
    assert "入力してください" in response.get_data(as_text=True)


def test_summarize_renders_result(monkeypatch, client):
    _patch_pipeline(monkeypatch)

    response = client.post(
        "/summarize",
        data={
            "url": METADATA.url,
            "provider": "anthropic",
            "model": "claude-sonnet-5",
            "languages": "ja,en",
            "channel_comparison": "on",
            "thumbnail": "on",
            "include_transcript": "on",
        },
    )

    body = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "summary text" in body
    assert "point one" in body
    assert "reasoning text" in body
    assert "transcript text" in body
    assert "/download/" in body


def test_summarize_omits_transcript_when_unchecked(monkeypatch, client):
    _patch_pipeline(monkeypatch)

    response = client.post("/summarize", data={"url": METADATA.url})

    body = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "文字起こし</h3>" not in body


def test_summarize_skips_channel_and_thumbnail_when_unchecked(monkeypatch, client):
    calls = {}

    def fake_summarize_video(metadata, transcript, **kwargs):
        calls.update(kwargs)
        return SUMMARY

    channel_calls = []
    thumbnail_calls = []
    _patch_pipeline(
        monkeypatch,
        summarize_video_fn=fake_summarize_video,
        fetch_channel_stats_fn=lambda channel_url, **kwargs: channel_calls.append(1) or ChannelStats("c", 1, 1.0),
        fetch_thumbnail_fn=lambda thumbnail_url: thumbnail_calls.append(1) or (b"x", "image/jpeg"),
    )

    response = client.post("/summarize", data={"url": METADATA.url})

    assert response.status_code == 200
    assert not channel_calls
    assert not thumbnail_calls
    assert calls["channel_stats"] is None
    assert calls["thumbnail"] is None


def test_summarize_reports_fetch_errors(monkeypatch, client):
    def _raise(url):
        raise VideoFetchError("video unavailable")

    monkeypatch.setattr("youtube_summarizer.webapp.extract_video_id", _raise)

    response = client.post("/summarize", data={"url": "not-a-video"})

    assert response.status_code == 400
    assert "video unavailable" in response.get_data(as_text=True)


def test_download_serves_markdown_report(monkeypatch, client):
    _patch_pipeline(monkeypatch)

    result_response = client.post("/summarize", data={"url": METADATA.url})
    body = result_response.get_data(as_text=True)
    match = re.search(r"/download/([0-9a-f]{32})", body)
    assert match, body

    download_response = client.get(f"/download/{match.group(1)}")

    assert download_response.status_code == 200
    assert download_response.mimetype == "text/markdown"
    assert "attachment" in download_response.headers["Content-Disposition"]
    assert "summary text" in download_response.get_data(as_text=True)


def test_download_unknown_id_returns_404(client):
    response = client.get("/download/does-not-exist")

    assert response.status_code == 404


def test_main_defaults_to_localhost_only(monkeypatch):
    monkeypatch.delenv("HOST", raising=False)
    monkeypatch.delenv("PORT", raising=False)
    calls = {}
    monkeypatch.setattr(app, "run", lambda **kwargs: calls.update(kwargs))

    main()

    assert calls["host"] == "127.0.0.1"
    assert calls["port"] == 5000


def test_main_honors_host_and_port_env_vars(monkeypatch):
    monkeypatch.setenv("HOST", "0.0.0.0")
    monkeypatch.setenv("PORT", "8080")
    calls = {}
    monkeypatch.setattr(app, "run", lambda **kwargs: calls.update(kwargs))

    main()

    assert calls["host"] == "0.0.0.0"
    assert calls["port"] == 8080
