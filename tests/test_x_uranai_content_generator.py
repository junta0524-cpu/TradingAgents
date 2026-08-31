from types import SimpleNamespace

import pytest

from x_uranai_automation.compliance import ComplianceError
from x_uranai_automation.content_generator import ContentGenerator, GeneratorConfig


class _FakeLLM:
    def __init__(self, responses):
        self._responses = iter(responses)

    def invoke(self, prompt):
        return SimpleNamespace(content=next(self._responses))


@pytest.fixture
def patch_llm(monkeypatch):
    def _patch(responses):
        fake_llm = _FakeLLM(responses)
        fake_client = SimpleNamespace(get_llm=lambda: fake_llm)
        monkeypatch.setattr(
            "tradingagents.llm_clients.factory.create_llm_client",
            lambda **kwargs: fake_client,
        )
        return fake_llm

    return _patch


@pytest.mark.unit
def test_generate_single_post(patch_llm):
    patch_llm(["今日は穏やかに過ごせそうな一日です"])
    generator = ContentGenerator(GeneratorConfig())
    posts = generator.generate("tarot_pull", "2026-08-31")
    assert len(posts) == 1
    assert posts[0].text == "今日は穏やかに過ごせそうな一日です"
    assert posts[0].format == "tarot_pull"


@pytest.mark.unit
def test_generate_thread_returns_multiple_posts(patch_llm):
    patch_llm(["1つ目の投稿", "2つ目の投稿", "3つ目の投稿"])
    generator = ContentGenerator(GeneratorConfig())
    posts = generator.generate("thread", "2026-08-31")
    assert [p.text for p in posts] == ["1つ目の投稿", "2つ目の投稿", "3つ目の投稿"]
    assert [p.thread_index for p in posts] == [0, 1, 2]


@pytest.mark.unit
def test_generate_raises_on_ng_phrase(patch_llm):
    patch_llm(["必ず当たる今日の運勢をお届けします"])
    generator = ContentGenerator(GeneratorConfig())
    with pytest.raises(ComplianceError):
        generator.generate("tarot_pull", "2026-08-31")


@pytest.mark.unit
def test_generate_unknown_format_raises(patch_llm):
    patch_llm([])
    generator = ContentGenerator(GeneratorConfig())
    with pytest.raises(ValueError, match="Unknown format"):
        generator.generate("not_a_format", "2026-08-31")


@pytest.mark.unit
def test_generate_for_weekday_uses_rotation(patch_llm):
    patch_llm(["月曜日の投稿"])
    generator = ContentGenerator(GeneratorConfig())
    posts = generator.generate_for_weekday(0, "2026-08-31")  # Monday -> ranking
    assert posts[0].format == "ranking"
