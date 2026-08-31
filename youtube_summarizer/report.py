from .models import VideoSummary


def _format_upload_date(upload_date: str | None) -> str:
    if not upload_date or len(upload_date) != 8 or not upload_date.isdigit():
        return upload_date or "不明"
    return f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"


def _format_count(value: int | None) -> str:
    return f"{value:,}" if value is not None else "不明"


def render_markdown(result: VideoSummary, *, include_transcript: bool = True) -> str:
    """Render a VideoSummary as a Markdown report covering all four requested
    sections: 文字起こし (transcript), 要約 (summary), 要点 (key points), and
    再生回数の理由 (why it got the views it did)."""
    metadata = result.metadata
    lines = [
        f"# {metadata.title or metadata.video_id}",
        "",
        f"- URL: {metadata.url}",
        f"- チャンネル: {metadata.channel or '不明'}",
        f"- 投稿日: {_format_upload_date(metadata.upload_date)}",
        f"- 再生回数: {_format_count(metadata.view_count)}",
        f"- 高評価数: {_format_count(metadata.like_count)}",
        f"- コメント数: {_format_count(metadata.comment_count)}",
        "",
        "## 要約",
        "",
        result.summary or "(要約なし)",
        "",
        "## 要点",
        "",
    ]

    if result.key_points:
        lines.extend(f"- {point}" for point in result.key_points)
    else:
        lines.append("(要点なし)")

    lines.extend(
        [
            "",
            "## 再生回数が伸びた理由(考察)",
            "",
            result.view_count_reasoning or "(考察なし)",
        ]
    )

    if include_transcript:
        lines.extend(
            [
                "",
                "## 文字起こし",
                "",
                result.transcript or "(文字起こしなし)",
            ]
        )

    return "\n".join(lines) + "\n"
