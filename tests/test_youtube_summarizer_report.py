from youtube_summarizer.models import VideoMetadata, VideoSummary
from youtube_summarizer.report import render_markdown

METADATA = VideoMetadata(
    video_id="abc12345678",
    url="https://www.youtube.com/watch?v=abc12345678",
    title="Test Video",
    channel="Test Channel",
    upload_date="20260115",
    view_count=1234567,
    like_count=8901,
    comment_count=234,
)

SUMMARY = VideoSummary(
    metadata=METADATA,
    transcript="これは文字起こしです。",
    summary="これは要約です。",
    key_points=["要点A", "要点B"],
    view_count_reasoning="タイトルが強いためだと考えられます。",
)


def test_render_markdown_includes_all_sections_by_default():
    report = render_markdown(SUMMARY)

    assert "# Test Video" in report
    assert "1,234,567" in report
    assert "2026-01-15" in report
    assert "## 要約" in report
    assert "これは要約です。" in report
    assert "## 要点" in report
    assert "- 要点A" in report
    assert "- 要点B" in report
    assert "## 再生回数が伸びた理由(考察)" in report
    assert "タイトルが強いためだと考えられます。" in report
    assert "## 文字起こし" in report
    assert "これは文字起こしです。" in report


def test_render_markdown_can_omit_transcript():
    report = render_markdown(SUMMARY, include_transcript=False)

    assert "## 文字起こし" not in report
    assert "これは文字起こしです。" not in report


def test_render_markdown_handles_missing_optional_fields():
    metadata = VideoMetadata(video_id="v", url="https://www.youtube.com/watch?v=v")
    summary = VideoSummary(metadata=metadata, transcript="", summary="", key_points=[], view_count_reasoning="")

    report = render_markdown(summary)

    assert "# v" in report
    assert "不明" in report
    assert "(要約なし)" in report
    assert "(要点なし)" in report
    assert "(考察なし)" in report
    assert "(文字起こしなし)" in report
