"""Fetches video metadata and transcripts from YouTube.

Metadata (title, view/like/comment counts, tags, ...) comes from yt-dlp, which
scrapes the page and needs no API key. Transcripts come from
youtube-transcript-api, which reads YouTube's caption tracks (manual or
auto-generated) directly. Both are optional extras (``pip install
"tradingagents[youtube]"``) so the core install stays lean.
"""

import re
from urllib.parse import parse_qs, urlparse

from .errors import TranscriptUnavailableError, VideoFetchError
from .models import ChannelStats, VideoMetadata

_VIDEO_ID_RE = re.compile(r"^[\w-]{11}$")
_PATH_ID_SUFFIXES = ("/embed/", "/shorts/", "/live/", "/v/")


def extract_video_id(url_or_id: str) -> str:
    """Extract an 11-character YouTube video ID from a URL, or pass an ID through."""
    candidate = url_or_id.strip()
    if _VIDEO_ID_RE.match(candidate):
        return candidate

    parsed = urlparse(candidate)
    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")

    if host == "youtu.be":
        video_id = parsed.path.lstrip("/").split("/")[0]
        if _VIDEO_ID_RE.match(video_id):
            return video_id

    if host in ("youtube.com", "youtube-nocookie.com"):
        query = parse_qs(parsed.query)
        v = query.get("v", [None])[0]
        if v and _VIDEO_ID_RE.match(v):
            return v
        for suffix in _PATH_ID_SUFFIXES:
            if parsed.path.startswith(suffix):
                video_id = parsed.path[len(suffix) :].split("/")[0]
                if _VIDEO_ID_RE.match(video_id):
                    return video_id

    raise VideoFetchError(f"Could not extract a YouTube video ID from: {url_or_id!r}")


def fetch_metadata(video_id: str) -> VideoMetadata:
    """Fetch video metadata (title, view count, etc.) via yt-dlp."""
    try:
        import yt_dlp
    except ImportError as exc:
        raise VideoFetchError(
            "yt-dlp is required to fetch video metadata. Install it with "
            '`pip install "tradingagents[youtube]"` or `pip install yt-dlp`.'
        ) from exc

    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {"quiet": True, "no_warnings": True, "skip_download": True, "noplaylist": True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:  # yt-dlp raises its own DownloadError subclasses
        raise VideoFetchError(f"Failed to fetch metadata for {video_id}: {exc}") from exc

    if not info:
        raise VideoFetchError(f"No metadata returned for {video_id}")

    return VideoMetadata(
        video_id=video_id,
        url=url,
        title=info.get("title") or "",
        channel=info.get("channel") or info.get("uploader") or "",
        channel_id=info.get("channel_id"),
        channel_url=info.get("channel_url") or info.get("uploader_url"),
        subscriber_count=info.get("channel_follower_count"),
        description=info.get("description") or "",
        view_count=info.get("view_count"),
        like_count=info.get("like_count"),
        comment_count=info.get("comment_count"),
        upload_date=info.get("upload_date"),
        duration_seconds=info.get("duration"),
        tags=list(info.get("tags") or []),
        categories=list(info.get("categories") or []),
        thumbnail_url=info.get("thumbnail"),
    )


def fetch_channel_stats(
    channel_url: str, *, exclude_video_id: str | None = None, sample_size: int = 15
) -> ChannelStats:
    """Fetch the average view count over a channel's most recent uploads.

    Used to judge whether a video over- or under-performed its channel's
    normal reach, rather than reading its view count in isolation. Best-effort:
    videos yt-dlp can't return a view count for (rare, but happens for very
    recent or restricted uploads) are simply excluded from the average.
    """
    try:
        import yt_dlp
    except ImportError as exc:
        raise VideoFetchError(
            "yt-dlp is required to fetch channel stats. Install it with "
            '`pip install "tradingagents[youtube]"` or `pip install yt-dlp`.'
        ) from exc

    videos_url = channel_url.rstrip("/")
    if not videos_url.endswith("/videos"):
        videos_url += "/videos"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
        "playlistend": sample_size + 1,  # +1 to still have `sample_size` after excluding the video itself
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(videos_url, download=False)
    except Exception as exc:
        raise VideoFetchError(f"Failed to fetch channel videos for {channel_url}: {exc}") from exc

    if not info:
        raise VideoFetchError(f"No channel data returned for {channel_url}")

    entries = [entry for entry in (info.get("entries") or []) if entry]
    if exclude_video_id:
        entries = [entry for entry in entries if entry.get("id") != exclude_video_id]
    entries = entries[:sample_size]

    view_counts = [
        entry.get("view_count") for entry in entries if isinstance(entry.get("view_count"), (int, float))
    ]
    average = (sum(view_counts) / len(view_counts)) if view_counts else None

    return ChannelStats(
        channel=info.get("channel") or info.get("title") or "",
        sample_size=len(view_counts),
        average_view_count=average,
    )


def fetch_thumbnail(thumbnail_url: str) -> tuple[bytes, str]:
    """Download a video's thumbnail image. Returns (bytes, mime_type)."""
    import requests

    try:
        response = requests.get(thumbnail_url, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise VideoFetchError(f"Failed to download thumbnail from {thumbnail_url}: {exc}") from exc

    mime_type = response.headers.get("Content-Type", "").split(";")[0].strip() or "image/jpeg"
    return response.content, mime_type


def _segment_text(segment) -> str:
    if isinstance(segment, dict):
        return (segment.get("text") or "").strip()
    return (getattr(segment, "text", "") or "").strip()


def fetch_transcript(video_id: str, languages: "list[str] | tuple[str, ...]" = ("ja", "en")) -> str:
    """Fetch and flatten the transcript/captions for a video into plain text.

    Prefers a manually created transcript in ``languages`` (in order), then an
    auto-generated one in those languages, then whatever transcript exists at
    all. Raises ``TranscriptUnavailableError`` if captions are disabled or
    none are available.
    """
    try:
        from youtube_transcript_api import (
            NoTranscriptFound,
            TranscriptsDisabled,
            VideoUnavailable,
            YouTubeTranscriptApi,
        )
    except ImportError as exc:
        raise TranscriptUnavailableError(
            "youtube-transcript-api is required to fetch transcripts. Install it "
            'with `pip install "tradingagents[youtube]"` or '
            "`pip install youtube-transcript-api`."
        ) from exc

    try:
        try:
            # youtube-transcript-api >= 1.0 exposes an instance API.
            transcript_list = YouTubeTranscriptApi().list(video_id)
        except AttributeError:
            # youtube-transcript-api < 1.0 exposes classmethods only.
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    except (TranscriptsDisabled, VideoUnavailable) as exc:
        raise TranscriptUnavailableError(f"No transcript is available for {video_id}: {exc}") from exc

    lang_list = list(languages) or ["en"]
    try:
        transcript = transcript_list.find_transcript(lang_list)
    except NoTranscriptFound:
        try:
            transcript = transcript_list.find_generated_transcript(lang_list)
        except NoTranscriptFound:
            available = list(transcript_list)
            if not available:
                raise TranscriptUnavailableError(f"No transcript is available for {video_id}") from None
            transcript = available[0]

    fetched = transcript.fetch()
    segments = fetched.to_raw_data() if hasattr(fetched, "to_raw_data") else fetched
    text = " ".join(t for t in (_segment_text(segment) for segment in segments) if t)
    if not text:
        raise TranscriptUnavailableError(f"Transcript for {video_id} was empty")
    return text
