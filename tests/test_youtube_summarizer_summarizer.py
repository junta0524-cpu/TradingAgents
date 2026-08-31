import json

import pytest

from youtube_summarizer.errors import SummarizationError
from youtube_summarizer.models import ChannelStats, VideoMetadata
from youtube_summarizer.summarizer import summarize_video

METADATA = VideoMetadata(
    video_id="abc12345678",
    url="https://www.youtube.com/watch?v=abc12345678",
    title="Test Video",
    channel="Test Channel",
    view_count=1000,
)


class _FakeResponse:
    def __init__(self, content):
        self.content = content


class _FakeLLM:
    def __init__(self, content):
        self._content = content
        self.invoked_with = None

    def invoke(self, messages):
        self.invoked_with = messages
        return _FakeResponse(self._content)


class _FakeClient:
    def __init__(self, content):
        self._llm = _FakeLLM(content)

    def get_llm(self):
        return self._llm


def _patch_create_llm_client(monkeypatch, content):
    fake_client = _FakeClient(content)
    calls = {}

    def fake_factory(provider, model, **kwargs):
        calls["provider"] = provider
        calls["model"] = model
        calls["kwargs"] = kwargs
        return fake_client

    monkeypatch.setattr("youtube_summarizer.summarizer.create_llm_client", fake_factory)
    return fake_client, calls


def test_summarize_video_parses_plain_json(monkeypatch):
    payload = {
        "summary": "動画の要約です。",
        "key_points": ["要点1", "要点2"],
        "view_count_reasoning": "タイトルが強い。",
    }
    _patch_create_llm_client(monkeypatch, json.dumps(payload, ensure_ascii=False))

    result = summarize_video(METADATA, "文字起こしテキスト")

    assert result.summary == payload["summary"]
    assert result.key_points == payload["key_points"]
    assert result.view_count_reasoning == payload["view_count_reasoning"]
    assert result.metadata is METADATA
    assert result.transcript == "文字起こしテキスト"


def test_summarize_video_parses_fenced_json(monkeypatch):
    payload = {"summary": "s", "key_points": ["p1"], "view_count_reasoning": "r"}
    content = f"以下がJSONです。\n```json\n{json.dumps(payload)}\n```"
    _patch_create_llm_client(monkeypatch, content)

    result = summarize_video(METADATA, "transcript")

    assert result.summary == "s"
    assert result.key_points == ["p1"]
    assert result.view_count_reasoning == "r"


def test_summarize_video_coerces_string_key_points(monkeypatch):
    payload = {"summary": "s", "key_points": "only one point", "view_count_reasoning": "r"}
    _patch_create_llm_client(monkeypatch, json.dumps(payload))

    result = summarize_video(METADATA, "transcript")

    assert result.key_points == ["only one point"]


def test_summarize_video_raises_on_unparseable_response(monkeypatch):
    _patch_create_llm_client(monkeypatch, "not json at all")

    with pytest.raises(SummarizationError):
        summarize_video(METADATA, "transcript")


def test_summarize_video_passes_provider_and_model(monkeypatch):
    payload = {"summary": "s", "key_points": [], "view_count_reasoning": "r"}
    _fake_client, calls = _patch_create_llm_client(monkeypatch, json.dumps(payload))

    summarize_video(METADATA, "transcript", provider="openai", model="gpt-5")

    assert calls["provider"] == "openai"
    assert calls["model"] == "gpt-5"


def test_summarize_video_truncates_long_transcript(monkeypatch):
    payload = {"summary": "s", "key_points": [], "view_count_reasoning": "r"}
    fake_client, _calls = _patch_create_llm_client(monkeypatch, json.dumps(payload))

    long_transcript = "x" * 20000
    summarize_video(METADATA, long_transcript)

    human_message = fake_client._llm.invoked_with[1]
    prompt_text = human_message[1]
    assert "以下省略" in prompt_text
    assert len(prompt_text) < len(long_transcript)


def test_summarize_video_defaults_have_no_channel_stats_or_thumbnail(monkeypatch):
    payload = {"summary": "s", "key_points": [], "view_count_reasoning": "r"}
    _patch_create_llm_client(monkeypatch, json.dumps(payload))

    result = summarize_video(METADATA, "transcript")

    assert result.channel_stats is None
    assert result.thumbnail_considered is False


def test_summarize_video_includes_channel_stats_in_prompt_and_result(monkeypatch):
    payload = {"summary": "s", "key_points": [], "view_count_reasoning": "r"}
    fake_client, _calls = _patch_create_llm_client(monkeypatch, json.dumps(payload))
    channel_stats = ChannelStats(channel="Test Channel", sample_size=10, average_view_count=500.0)

    result = summarize_video(METADATA, "transcript", channel_stats=channel_stats)

    assert result.channel_stats is channel_stats
    human_message = fake_client._llm.invoked_with[1]
    prompt_text = human_message[1]
    assert "チャンネル直近10本の平均再生回数" in prompt_text
    assert "約2.00倍" in prompt_text  # METADATA.view_count == 1000, average == 500.0


def test_summarize_video_attaches_thumbnail_as_image_content_block(monkeypatch):
    payload = {"summary": "s", "key_points": [], "view_count_reasoning": "r"}
    fake_client, _calls = _patch_create_llm_client(monkeypatch, json.dumps(payload))

    result = summarize_video(METADATA, "transcript", thumbnail=b"binarydata", thumbnail_mime_type="image/png")

    assert result.thumbnail_considered is True
    human_message = fake_client._llm.invoked_with[1]
    content_blocks = human_message[1]
    assert isinstance(content_blocks, list)
    assert content_blocks[0]["type"] == "text"
    assert "サムネイル画像" in content_blocks[0]["text"]
    assert content_blocks[1]["type"] == "image_url"
    assert content_blocks[1]["image_url"]["url"].startswith("data:image/png;base64,")
