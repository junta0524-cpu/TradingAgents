class YouTubeSummarizerError(Exception):
    """Base error for the youtube_summarizer package."""


class VideoFetchError(YouTubeSummarizerError):
    """Raised when a video URL can't be resolved or its metadata can't be fetched."""


class TranscriptUnavailableError(YouTubeSummarizerError):
    """Raised when no transcript/captions could be retrieved for a video."""


class SummarizationError(YouTubeSummarizerError):
    """Raised when the LLM response can't be parsed into a summary."""
