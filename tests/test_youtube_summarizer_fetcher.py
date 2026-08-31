import sys
import types

import pytest

from youtube_summarizer.errors import TranscriptUnavailableError, VideoFetchError
from youtube_summarizer.fetcher import extract_video_id, fetch_metadata, fetch_transcript

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
            "description": "A description",
            "view_count": 12345,
            "like_count": 678,
            "comment_count": 9,
            "upload_date": "20260101",
            "duration": 600,
            "tags": ["a", "b"],
            "categories": ["Education"],
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
