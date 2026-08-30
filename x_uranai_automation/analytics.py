"""Local, file-based tracking for posts, engagement metrics, and the
monetization funnel (link clicks, LINE registrations, paid-reading
conversions, ...).

Kept as append-only JSONL rather than a database — this toolkit runs as
periodic CLI invocations, not a long-lived service, so there is no
concurrent-writer problem to design around, and JSONL is trivial to
inspect, diff, or load into a spreadsheet later.
"""

import json
import os
from dataclasses import asdict, dataclass
from datetime import UTC, datetime

DEFAULT_RESULTS_DIR = os.path.join(os.path.expanduser("~"), ".x_uranai_automation")
POSTS_LOG = "posts.jsonl"
FUNNEL_LOG = "funnel.jsonl"


def _results_dir(results_dir: str | None) -> str:
    directory = results_dir or DEFAULT_RESULTS_DIR
    os.makedirs(directory, exist_ok=True)
    return directory


def _append_jsonl(path: str, record: dict) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def log_post(
    format_name: str,
    text: str,
    tweet_id: str | None = None,
    dry_run: bool = True,
    results_dir: str | None = None,
) -> None:
    record = {
        "timestamp": datetime.now(UTC).isoformat(),
        "format": format_name,
        "text": text,
        "tweet_id": tweet_id,
        "dry_run": dry_run,
    }
    _append_jsonl(os.path.join(_results_dir(results_dir), POSTS_LOG), record)


@dataclass
class FunnelEvent:
    event_type: str  # e.g. "profile_link_click", "line_registration", "paid_reading"
    count: int = 1
    note: str = ""


def log_funnel_event(event: FunnelEvent, results_dir: str | None = None) -> None:
    record = {"timestamp": datetime.now(UTC).isoformat(), **asdict(event)}
    _append_jsonl(os.path.join(_results_dir(results_dir), FUNNEL_LOG), record)


def _read_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def summarize(results_dir: str | None = None) -> dict:
    directory = _results_dir(results_dir)
    posts = _read_jsonl(os.path.join(directory, POSTS_LOG))
    funnel_events = _read_jsonl(os.path.join(directory, FUNNEL_LOG))

    funnel_counts: dict[str, int] = {}
    for event in funnel_events:
        funnel_counts[event["event_type"]] = funnel_counts.get(event["event_type"], 0) + event["count"]

    posts_by_format: dict[str, int] = {}
    for post in posts:
        posts_by_format[post["format"]] = posts_by_format.get(post["format"], 0) + 1

    return {
        "total_posts": len(posts),
        "posts_by_format": posts_by_format,
        "funnel_counts": funnel_counts,
    }
