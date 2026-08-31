"""LLM-driven summarization of a fetched video's metadata + transcript.

Reuses tradingagents' existing multi-provider LLM client factory, so any
provider/model already supported by TradingAgents (Anthropic, OpenAI, Google,
Azure, Bedrock, ...) works here too.
"""

import json
import re

from tradingagents.llm_clients import create_llm_client

from .errors import SummarizationError
from .models import VideoMetadata, VideoSummary

_SYSTEM_PROMPT = (
    "あなたはYouTube動画のアナリストです。与えられた動画のメタデータと文字起こしから、"
    "日本語で「要約」「要点」「再生回数が伸びた理由の考察」を作成してください。\n"
    "再生回数の理由はあくまで推測であることを前提に、タイトル・概要欄の訴求力、"
    "話題性や時事性、構成(冒頭のフック、テンポ、感情の起伏)、"
    "投稿者・チャンネルの影響力、視聴者にとっての実用性など複数の観点から具体的に考察してください。\n"
    "出力は次のキーを持つJSONオブジェクトのみを返してください。前置き、説明文、"
    "コードフェンスなど、JSON以外のテキストは一切含めないでください。\n"
    '{"summary": "動画全体の要約", '
    '"key_points": ["要点1", "要点2", "..."], '
    '"view_count_reasoning": "再生回数が伸びた理由の考察"}'
)

# Keeps the prompt within a reasonable context/token budget for very long videos.
_TRANSCRIPT_CHAR_LIMIT = 12000
_DESCRIPTION_CHAR_LIMIT = 1000


def _build_user_prompt(metadata: VideoMetadata, transcript: str) -> str:
    truncated_transcript = transcript[:_TRANSCRIPT_CHAR_LIMIT]
    if len(transcript) > _TRANSCRIPT_CHAR_LIMIT:
        truncated_transcript += "\n...(以下省略)"

    return (
        f"タイトル: {metadata.title}\n"
        f"チャンネル: {metadata.channel}\n"
        f"投稿日: {metadata.upload_date or '不明'}\n"
        f"再生回数: {metadata.view_count if metadata.view_count is not None else '不明'}\n"
        f"高評価数: {metadata.like_count if metadata.like_count is not None else '不明'}\n"
        f"コメント数: {metadata.comment_count if metadata.comment_count is not None else '不明'}\n"
        f"動画の長さ(秒): {metadata.duration_seconds if metadata.duration_seconds is not None else '不明'}\n"
        f"タグ: {', '.join(metadata.tags) if metadata.tags else 'なし'}\n"
        f"概要欄: {metadata.description[:_DESCRIPTION_CHAR_LIMIT]}\n\n"
        f"文字起こし:\n{truncated_transcript}"
    )


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
    **llm_kwargs,
) -> VideoSummary:
    """Summarize a video's transcript into a summary, key points, and a
    view-count-reasoning analysis, via the configured LLM provider."""
    client = create_llm_client(provider, model, **llm_kwargs)
    llm = client.get_llm()

    messages = [
        ("system", _SYSTEM_PROMPT),
        ("human", _build_user_prompt(metadata, transcript)),
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
    )
