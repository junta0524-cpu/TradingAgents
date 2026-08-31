from dataclasses import dataclass, field


@dataclass
class VideoMetadata:
    """Metadata pulled from YouTube for a single video."""

    video_id: str
    url: str
    title: str = ""
    channel: str = ""
    description: str = ""
    view_count: int | None = None
    like_count: int | None = None
    comment_count: int | None = None
    upload_date: str | None = None  # YYYYMMDD, as returned by yt-dlp
    duration_seconds: int | None = None
    tags: list[str] = field(default_factory=list)
    categories: list[str] = field(default_factory=list)


@dataclass
class VideoSummary:
    """The finished analysis: transcript plus the LLM-generated summary."""

    metadata: VideoMetadata
    transcript: str
    summary: str
    key_points: list[str]
    view_count_reasoning: str
