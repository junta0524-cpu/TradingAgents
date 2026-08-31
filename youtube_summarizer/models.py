from dataclasses import dataclass, field


@dataclass
class VideoMetadata:
    """Metadata pulled from YouTube for a single video."""

    video_id: str
    url: str
    title: str = ""
    channel: str = ""
    channel_id: str | None = None
    channel_url: str | None = None
    subscriber_count: int | None = None
    description: str = ""
    view_count: int | None = None
    like_count: int | None = None
    comment_count: int | None = None
    upload_date: str | None = None  # YYYYMMDD, as returned by yt-dlp
    duration_seconds: int | None = None
    tags: list[str] = field(default_factory=list)
    categories: list[str] = field(default_factory=list)
    thumbnail_url: str | None = None


@dataclass
class ChannelStats:
    """Aggregate view-count stats for a channel's recent uploads, used to
    judge whether a given video over- or under-performed its channel."""

    channel: str
    sample_size: int
    average_view_count: float | None

    def ratio_for(self, view_count: int | None) -> float | None:
        """How many times the channel average `view_count` represents, or
        None if either side of the comparison is unavailable."""
        if view_count is None or not self.average_view_count:
            return None
        return view_count / self.average_view_count


@dataclass
class VideoSummary:
    """The finished analysis: transcript plus the LLM-generated summary."""

    metadata: VideoMetadata
    transcript: str
    summary: str
    key_points: list[str]
    view_count_reasoning: str
    channel_stats: ChannelStats | None = None
    thumbnail_considered: bool = False
