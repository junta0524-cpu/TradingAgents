"""LLM-driven summarization of a fetched video's metadata + transcript.

Reuses tradingagents' existing multi-provider LLM client factory, so any
provider/model already supported by TradingAgents (Anthropic, OpenAI, Google,
Azure, Bedrock, ...) works here too. When channel stats and/or a thumbnail
image are supplied, they're folded into the same prompt so the view-count
reasoning can cite them (over/underperforming the channel average, the
thumbnail's visual appeal) instead of only guessing from the transcript.
"""

import base64
import json
import re

from tradingagents.llm_clients import create_llm_client

from .errors import SummarizationError
from .models import ChannelStats, VideoMetadata, VideoSummary

_SYSTEM_PROMPT = (
    "あなたはYouTube動画のアナリストです。与えられた動画のメタデータ、文字起こし、"
    "(提供されている場合は)チャンネル平均再生回数との比較データやサムネイル画像をもとに、"
    "日本語で「要約」「要点」「再生回数が伸びた理由の考察」を作成してください。\n"
    "再生回数の理由はあくまで推測であることを前提に、タイトル・概要欄・サムネイルの訴求力、"
    "話題性や時事性、構成(冒頭のフック、テンポ、感情の起伏)、投稿者・チャンネルの影響力、"
    "チャンネル平均との比較(与えられている場合)、視聴者にとっての実用性など複数の観点から"
    "具体的に考察してください。サムネイル画像が提供されている場合は、配色・文字の視認性・"
    "表情やインパクトなど視覚的な訴求力にも言及してください。\n"
    "出力は次のキーを持つJSONオブジェクトのみを返してください。前置き、説明文、"
    "コードフェンスなど、JSON以外のテキストは一切含めないでください。\n"
    '{"summary": "動画全体の要約", '
    '"key_points": ["要点1", "要点2", "..."], '
    '"view_count_reasoning": "再生回数が伸びた理由の考察"}'
)

# Keeps the prompt within a reasonable context/token budget for very long videos.
_TRANSCRIPT_CHAR_LIMIT = 12000
_DESCRIPTION_CHAR_LIMIT = 1000


def _build_channel_stats_line(metadata: VideoMetadata, channel_stats: ChannelStats | None) -> str:
    if channel_stats is None or not channel_stats.sample_size:
        return "チャンネル平均との比較データ: なし"

    ratio = channel_stats.ratio_for(metadata.view_count)
    avg_text = (
        f"{channel_stats.average_view_count:,.0f}回"
        if channel_stats.average_view_count is not None
        else "不明"
    )
    ratio_text = f"約{ratio:.2f}倍" if ratio is not None else "不明"
    return (
        f"チャンネル直近{channel_stats.sample_size}本の平均再生回数: {avg_text}\n"
        f"本動画の再生回数はチャンネル平均の: {ratio_text}"
    )


def _build_user_prompt(
    metadata: VideoMetadata,
    transcript: str,
    channel_stats: ChannelStats | None,
    *,
    thumbnail_attached: bool,
) -> str:
    truncated_transcript = transcript[:_TRANSCRIPT_CHAR_LIMIT]
    if len(transcript) > _TRANSCRIPT_CHAR_LIMIT:
        truncated_transcript += "\n...(以下省略)"

    lines = [
        f"タイトル: {metadata.title}",
        f"チャンネル: {metadata.channel}",
        f"チャンネル登録者数: {metadata.subscriber_count if metadata.subscriber_count is not None else '不明'}",
        f"投稿日: {metadata.upload_date or '不明'}",
        f"再生回数: {metadata.view_count if metadata.view_count is not None else '不明'}",
        f"高評価数: {metadata.like_count if metadata.like_count is not None else '不明'}",
        f"コメント数: {metadata.comment_count if metadata.comment_count is not None else '不明'}",
        f"動画の長さ(秒): {metadata.duration_seconds if metadata.duration_seconds is not None else '不明'}",
        f"タグ: {', '.join(metadata.tags) if metadata.tags else 'なし'}",
        _build_channel_stats_line(metadata, channel_stats),
    ]
    if thumbnail_attached:
        lines.append("サムネイル画像: 添付あり(視覚的な訴求力を考慮すること)")
    lines.append(f"概要欄: {metadata.description[:_DESCRIPTION_CHAR_LIMIT]}")
    lines.append("")
    lines.append(f"文字起こし:\n{truncated_transcript}")
    return "\n".join(lines)


def _parse_response(content: str) -> dict:
    text = content.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1)
    else:
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise SummarizationError(f"Could not parse LLM response as JSON: {content[:500]!r}") from exc

    if not isinstance(parsed, dict):
        raise SummarizationError(f"Expected a JSON object from the LLM, got: {content[:500]!r}")
    return parsed


def summarize_video(
    metadata: VideoMetadata,
    transcript: str,
    *,
    provider: str = "anthropic",
    model: str = "claude-sonnet-5",
    channel_stats: ChannelStats | None = None,
    thumbnail: bytes | None = None,
    thumbnail_mime_type: str = "image/jpeg",
    **llm_kwargs,
) -> VideoSummary:
    """Summarize a video's transcript into a summary, key points, and a
    view-count-reasoning analysis, via the configured LLM provider.

    ``channel_stats`` (see ``fetch_channel_stats``) grounds the reasoning in
    how this video's view count compares to the channel's recent average.
    ``thumbnail``, if given the raw image bytes, is sent alongside the text
    prompt to a multimodal-capable model so its visual appeal can factor into
    the reasoning too; a provider/model without vision support will simply
    ignore or reject the image, so pass one only when you know the model
    supports it.
    """
    client = create_llm_client(provider, model, **llm_kwargs)
    llm = client.get_llm()

    thumbnail_attached = thumbnail is not None
    user_text = _build_user_prompt(metadata, transcript, channel_stats, thumbnail_attached=thumbnail_attached)

    if thumbnail_attached:
        encoded_image = base64.b64encode(thumbnail).decode("ascii")
        human_content = [
            {"type": "text", "text": user_text},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{thumbnail_mime_type};base64,{encoded_image}"},
            },
        ]
    else:
        human_content = user_text

    messages = [
        ("system", _SYSTEM_PROMPT),
        ("human", human_content),
    ]
    response = llm.invoke(messages)
    content = response.content if hasattr(response, "content") else response
    if not isinstance(content, str):
        content = str(content)

    parsed = _parse_response(content)

    key_points = parsed.get("key_points") or []
    if isinstance(key_points, str):
        key_points = [key_points]

    return VideoSummary(
        metadata=metadata,
        transcript=transcript,
        summary=str(parsed.get("summary", "")).strip(),
        key_points=[str(point).strip() for point in key_points if str(point).strip()],
        view_count_reasoning=str(parsed.get("view_count_reasoning", "")).strip(),
        channel_stats=channel_stats,
        thumbnail_considered=thumbnail_attached,
    )
