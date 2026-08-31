import sys
import types

import pytest

from youtube_summarizer.errors import TranscriptUnavailableError, VideoFetchError
from youtube_summarizer.fetcher import (
    extract_video_id,
    fetch_channel_stats,
    fetch_metadata,
    fetch_thumbnail,
    fetch_transcript,
)

VIDEO_ID = "dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={VIDEO_ID}",
        f"https://youtube.com/watch?v={VIDEO_ID}&t=42s",
        f"https://m.youtube.com/watch?v={VIDEO_ID}",
        f"https://youtu.be/{VIDEO_ID}",
        f"https://youtu.be/{VIDEO_ID}?t=10",
        f"https://www.youtube.com/embed/{VIDEO_ID}",
        f"https://www.youtube.com/shorts/{VIDEO_ID}",
        f"https://www.youtube.com/live/{VIDEO_ID}",
        VIDEO_ID,
    ],
)
def test_extract_video_id_accepts_common_formats(url):
    assert extract_video_id(url) == VIDEO_ID


def test_extract_video_id_rejects_unrelated_url():
    with pytest.raises(VideoFetchError):
        extract_video_id("https://example.com/not-a-video")


class _FakeYoutubeDL:
    def __init__(self, opts=None):
        self.opts = opts

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False

    def extract_info(self, url, download=False):
        return {
            "title": "Test Video",
            "channel": "Test Channel",
            "channel_id": "UC12345",
            "channel_url": "https://www.youtube.com/channel/UC12345",
            "channel_follower_count": 99000,
            "description": "A description",
            "view_count": 12345,
            "like_count": 678,
            "comment_count": 9,
            "upload_date": "20260101",
            "duration": 600,
            "tags": ["a", "b"],
            "categories": ["Education"],
            "thumbnail": "https://example.com/thumb.jpg",
        }


def test_fetch_metadata_maps_yt_dlp_fields(monkeypatch):
    fake_module = types.SimpleNamespace(YoutubeDL=_FakeYoutubeDL)
    monkeypatch.setitem(sys.modules, "yt_dlp", fake_module)

    metadata = fetch_metadata(VIDEO_ID)

    assert metadata.video_id == VIDEO_ID
    assert metadata.title == "Test Video"
    assert metadata.channel == "Test Channel"
    assert metadata.view_count == 12345
    assert metadata.like_count == 678
    assert metadata.comment_count == 9
    assert metadata.upload_date == "20260101"
    assert metadata.duration_seconds == 600
    assert metadata.tags == ["a", "b"]
    assert metadata.categories == ["Education"]
    assert metadata.channel_id == "UC12345"
    assert metadata.channel_url == "https://www.youtube.com/channel/UC12345"
    assert metadata.subscriber_count == 99000
    assert metadata.thumbnail_url == "https://example.com/thumb.jpg"


def test_fetch_metadata_wraps_yt_dlp_failures(monkeypatch):
    class _FailingYoutubeDL(_FakeYoutubeDL):
        def extract_info(self, url, download=False):
            raise RuntimeError("boom")

    fake_module = types.SimpleNamespace(YoutubeDL=_FailingYoutubeDL)
    monkeypatch.setitem(sys.modules, "yt_dlp", fake_module)

    with pytest.raises(VideoFetchError):
        fetch_metadata(VIDEO_ID)


def test_fetch_metadata_missing_dependency(monkeypatch):
    monkeypatch.setitem(sys.modules, "yt_dlp", None)
    with pytest.raises(VideoFetchError):
        fetch_metadata(VIDEO_ID)


class _FakeTranscript:
    def __init__(self, segments):
        self._segments = segments

    def fetch(self):
        return self._segments


class _FakeTranscriptList:
    def __init__(self, transcript):
        self._transcript = transcript

    def find_transcript(self, languages):
        return self._transcript

    def find_generated_transcript(self, languages):
        raise self._no_transcript_found()

    def _no_transcript_found(self):
        from youtube_transcript_api import NoTranscriptFound

        return NoTranscriptFound("video", [], object())

    def __iter__(self):
        return iter([self._transcript])


def _install_fake_transcript_api(monkeypatch, transcript_list_factory):
    class _NoTranscriptFound(Exception):
        def __init__(self, *args):
            super().__init__("no transcript found")

    class _TranscriptsDisabled(Exception):
        pass

    class _VideoUnavailable(Exception):
        pass

    class _FakeApiInstance:
        def list(self, video_id):
            return transcript_list_factory(video_id)

    fake_module = types.SimpleNamespace(
        YouTubeTranscriptApi=_FakeApiInstance,
        NoTranscriptFound=_NoTranscriptFound,
        TranscriptsDisabled=_TranscriptsDisabled,
        VideoUnavailable=_VideoUnavailable,
    )
    monkeypatch.setitem(sys.modules, "youtube_transcript_api", fake_module)
    return fake_module


def test_fetch_transcript_joins_segment_text(monkeypatch):
    transcript = _FakeTranscript([{"text": "hello"}, {"text": "world"}])
    _install_fake_transcript_api(monkeypatch, lambda video_id: _FakeTranscriptList(transcript))

    text = fetch_transcript(VIDEO_ID, languages=["en"])

    assert text == "hello world"


def test_fetch_transcript_disabled_raises(monkeypatch):
    fake_module = _install_fake_transcript_api(monkeypatch, lambda video_id: None)

    class _RaisingApiInstance:
        def list(self, video_id):
            raise fake_module.TranscriptsDisabled("disabled")

    fake_module.YouTubeTranscriptApi = _RaisingApiInstance

    with pytest.raises(TranscriptUnavailableError):
        fetch_transcript(VIDEO_ID)


def test_fetch_transcript_missing_dependency(monkeypatch):
    monkeypatch.setitem(sys.modules, "youtube_transcript_api", None)
    with pytest.raises(TranscriptUnavailableError):
        fetch_transcript(VIDEO_ID)


class _FakeChannelYoutubeDL:
    def __init__(self, entries):
        self._entries = entries

    def __call__(self, opts=None):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False

    def extract_info(self, url, download=False):
        assert url.endswith("/videos")
        return {"channel": "Test Channel", "entries": self._entries}


def test_fetch_channel_stats_averages_view_counts(monkeypatch):
    entries = [
        {"id": "vid1", "view_count": 100},
        {"id": "vid2", "view_count": 300},
        {"id": VIDEO_ID, "view_count": 999999},  # excluded: the video being analyzed
    ]
    fake_module = types.SimpleNamespace(YoutubeDL=_FakeChannelYoutubeDL(entries))
    monkeypatch.setitem(sys.modules, "yt_dlp", fake_module)

    stats = fetch_channel_stats(
        "https://www.youtube.com/@testchannel", exclude_video_id=VIDEO_ID, sample_size=15
    )

    assert stats.channel == "Test Channel"
    assert stats.sample_size == 2
    assert stats.average_view_count == 200
    assert stats.ratio_for(400) == 2.0


def test_fetch_channel_stats_handles_missing_view_counts(monkeypatch):
    entries = [{"id": "vid1", "view_count": None}, {"id": "vid2"}]
    fake_module = types.SimpleNamespace(YoutubeDL=_FakeChannelYoutubeDL(entries))
    monkeypatch.setitem(sys.modules, "yt_dlp", fake_module)

    stats = fetch_channel_stats("https://www.youtube.com/@testchannel")

    assert stats.sample_size == 0
    assert stats.average_view_count is None
    assert stats.ratio_for(100) is None


def test_fetch_channel_stats_wraps_failures(monkeypatch):
    class _FailingYoutubeDL(_FakeYoutubeDL):
        def extract_info(self, url, download=False):
            raise RuntimeError("boom")

    fake_module = types.SimpleNamespace(YoutubeDL=_FailingYoutubeDL)
    monkeypatch.setitem(sys.modules, "yt_dlp", fake_module)

    with pytest.raises(VideoFetchError):
        fetch_channel_stats("https://www.youtube.com/@testchannel")


class _FakeThumbnailResponse:
    def __init__(self, content, content_type, raise_exc=None):
        self.content = content
        self.headers = {"Content-Type": content_type}
        self._raise_exc = raise_exc

    def raise_for_status(self):
        if self._raise_exc:
            raise self._raise_exc


def test_fetch_thumbnail_returns_bytes_and_mime_type(monkeypatch):
    import requests

    monkeypatch.setattr(
        requests,
        "get",
        lambda url, timeout=None: _FakeThumbnailResponse(b"binarydata", "image/webp"),
    )

    content, mime_type = fetch_thumbnail("https://example.com/thumb.webp")

    assert content == b"binarydata"
    assert mime_type == "image/webp"


def test_fetch_thumbnail_wraps_request_failures(monkeypatch):
    import requests

    def _raise_get(url, timeout=None):
        raise requests.RequestException("network error")

    monkeypatch.setattr(requests, "get", _raise_get)

    with pytest.raises(VideoFetchError):
        fetch_thumbnail("https://example.com/thumb.jpg")
