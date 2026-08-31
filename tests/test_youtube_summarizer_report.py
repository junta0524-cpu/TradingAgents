from youtube_summarizer.models import ChannelStats, VideoMetadata, VideoSummary
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


def test_render_markdown_includes_channel_stats_and_thumbnail_note():
    summary_with_extras = VideoSummary(
        metadata=METADATA,
        transcript="text",
        summary="summary",
        key_points=[],
        view_count_reasoning="reasoning",
        channel_stats=ChannelStats(channel="Test Channel", sample_size=12, average_view_count=100000.0),
        thumbnail_considered=True,
    )

    report = render_markdown(summary_with_extras)

    assert "チャンネル平均再生回数(直近12本): 100,000" in report
    assert "約12.35倍" in report  # 1,234,567 / 100,000
    assert "サムネイル画像: 考察に反映済み" in report


def test_render_markdown_omits_channel_stats_when_absent():
    report = render_markdown(SUMMARY)

    assert "チャンネル平均再生回数" not in report
    assert "サムネイル画像" not in report
