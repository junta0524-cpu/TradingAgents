"""Browser-based UI for the YouTube summarizer, built on Flask.

A thin web front end over the same fetch_metadata / fetch_transcript /
fetch_channel_stats / fetch_thumbnail / summarize_video pipeline the CLI
(cli.py) drives. Intended for local/personal use on a single machine: there's
no authentication or rate limiting, so don't expose this beyond localhost
without adding some.
"""

import os
import uuid

from flask import Flask, Response, abort, render_template, request

from .errors import YouTubeSummarizerError
from .fetcher import (
    extract_video_id,
    fetch_channel_stats,
    fetch_metadata,
    fetch_thumbnail,
    fetch_transcript,
)
from .report import render_markdown
from .summarizer import summarize_video

app = Flask(__name__)

# In-memory store backing the "download as Markdown" link. Fine for a local,
# single-user tool: reports are lost on restart and never written to disk
# unless the user downloads them.
_REPORTS: dict[str, str] = {}


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/summarize")
def summarize():
    url = request.form.get("url", "").strip()
    provider = request.form.get("provider", "").strip() or "anthropic"
    model = request.form.get("model", "").strip() or "claude-sonnet-5"
    languages = [lang.strip() for lang in request.form.get("languages", "ja,en").split(",") if lang.strip()]
    include_transcript = "include_transcript" in request.form
    channel_comparison = "channel_comparison" in request.form
    include_thumbnail = "thumbnail" in request.form

    if not url:
        return render_template("index.html", error="YouTube動画のURLまたは動画IDを入力してください。"), 400

    try:
        video_id = extract_video_id(url)
        metadata = fetch_metadata(video_id)
        transcript = fetch_transcript(video_id, languages)

        channel_stats = None
        channel_stats_error = None
        if channel_comparison and metadata.channel_url:
            try:
                channel_stats = fetch_channel_stats(metadata.channel_url, exclude_video_id=video_id)
            except YouTubeSummarizerError as exc:
                channel_stats_error = str(exc)

        thumbnail_bytes, thumbnail_mime_type = None, "image/jpeg"
        thumbnail_error = None
        if include_thumbnail and metadata.thumbnail_url:
            try:
                thumbnail_bytes, thumbnail_mime_type = fetch_thumbnail(metadata.thumbnail_url)
            except YouTubeSummarizerError as exc:
                thumbnail_error = str(exc)

        result = summarize_video(
            metadata,
            transcript,
            provider=provider,
            model=model,
            channel_stats=channel_stats,
            thumbnail=thumbnail_bytes,
            thumbnail_mime_type=thumbnail_mime_type,
        )
    except YouTubeSummarizerError as exc:
        return render_template("index.html", error=str(exc), form=request.form), 400

    # The downloadable Markdown always includes the transcript, regardless of
    # whether the results page itself is showing it inline.
    report_markdown = render_markdown(result, include_transcript=True)
    result_id = uuid.uuid4().hex
    _REPORTS[result_id] = report_markdown

    return render_template(
        "result.html",
        result=result,
        include_transcript=include_transcript,
        result_id=result_id,
        channel_stats_error=channel_stats_error,
        thumbnail_error=thumbnail_error,
    )


@app.get("/download/<result_id>")
def download(result_id: str):
    report_markdown = _REPORTS.get(result_id)
    if report_markdown is None:
        abort(404)
    return Response(
        report_markdown,
        mimetype="text/markdown",
        headers={"Content-Disposition": "attachment; filename=youtube-summary.md"},
    )


def main() -> None:
    """Entry point for the `youtube-summarizer-web` console script.

    Binds to 127.0.0.1 (this machine only) by default. Set ``HOST=0.0.0.0``
    to also accept connections from other devices on the same network (e.g.
    a phone on the same Wi-Fi), reachable at ``http://<this-machine's-LAN-IP>:<PORT>``.
    """
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
