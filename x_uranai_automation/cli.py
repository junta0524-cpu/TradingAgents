"""CLI for the X fortune-account automation toolkit.

    python -m x_uranai_automation.cli generate-day
    python -m x_uranai_automation.cli post-day --live
    python -m x_uranai_automation.cli post-slot --slot-index 0 --live
    python -m x_uranai_automation.cli stats

``--provider``/``--model`` also read the ``X_AUTOMATION_LLM_PROVIDER`` /
``X_AUTOMATION_LLM_MODEL`` env vars, so a scheduler (cron, GitHub Actions)
doesn't need to hardcode them on the command line.
"""

import datetime

import typer
from rich.console import Console
from rich.table import Table

from . import analytics, scheduler
from .compliance import ComplianceError
from .content_generator import ContentGenerator, GeneratorConfig
from .image_generator import ImageGenerationError, render_tarot_card
from .scheduler import ScheduledPost
from .x_client import XClient, XClientError

app = typer.Typer(
    name="x-uranai",
    help="X (Twitter) fortune-account content generation, posting, and monetization tracking.",
    add_completion=False,
)
console = Console()

_PROVIDER_OPTION = typer.Option(
    "openai", envvar="X_AUTOMATION_LLM_PROVIDER", help="LLM provider (see tradingagents.llm_clients)."
)
_MODEL_OPTION = typer.Option("gpt-5.4-mini", envvar="X_AUTOMATION_LLM_MODEL", help="LLM model name.")


def _today(date: str | None) -> datetime.date:
    return datetime.date.fromisoformat(date) if date else datetime.date.today()


def _post_one(
    generator: ContentGenerator, client: XClient, scheduled: ScheduledPost
) -> None:
    try:
        posts = generator.generate(scheduled.format, scheduled.date_label)
    except ComplianceError as exc:
        console.print(f"[red]Skipped {scheduled.slot_time} ({scheduled.format}): compliance check failed: {exc}[/red]")
        return

    media_ids = None
    if posts[0].card_name:
        try:
            image = render_tarot_card(
                card_name=posts[0].card_name,
                meaning=posts[0].card_meaning or "",
                persona_name=generator.config.persona.name,
                date_label=scheduled.date_label,
            )
            media_ids = [client.upload_media(image.png_bytes, alt_text=image.alt_text)]
        except ImageGenerationError as exc:
            console.print(f"[yellow]Image generation skipped for {scheduled.slot_time}: {exc}[/yellow]")
        except XClientError as exc:
            console.print(f"[yellow]Image upload failed for {scheduled.slot_time}: {exc}[/yellow]")

    texts = [post.text for post in posts]
    try:
        if len(texts) == 1:
            results = [client.post_tweet(texts[0], media_ids=media_ids)]
        else:
            results = client.post_thread(texts, first_media_ids=media_ids)
    except XClientError as exc:
        console.print(f"[red]Post failed for {scheduled.slot_time} ({scheduled.format}): {exc}[/red]")
        return

    for post, result in zip(posts, results, strict=True):
        tweet_id = result.get("data", {}).get("id") if not client.dry_run else None
        analytics.log_post(post.format, post.text, tweet_id=tweet_id, dry_run=client.dry_run)
    console.print(f"[green]Posted {scheduled.slot_time} ({scheduled.format}, {len(texts)} tweet(s)).[/green]")


@app.command("generate-day")
def generate_day(
    date: str = typer.Option(None, help="ISO date (YYYY-MM-DD); defaults to today."),
    provider: str = _PROVIDER_OPTION,
    model: str = _MODEL_OPTION,
):
    """Generate (but do not post) today's full slate of posts, screened for compliance."""
    for_date = _today(date)
    plan = scheduler.build_daily_plan(for_date)
    generator = ContentGenerator(GeneratorConfig(llm_provider=provider, llm_model=model))

    table = Table(title=f"Generated posts for {for_date.isoformat()}")
    table.add_column("Slot")
    table.add_column("Format")
    table.add_column("Text")

    for scheduled in plan:
        try:
            posts = generator.generate(scheduled.format, scheduled.date_label)
        except ComplianceError as exc:
            console.print(f"[red]Compliance check failed for {scheduled.slot_time} ({scheduled.format}): {exc}[/red]")
            continue
        for post in posts:
            table.add_row(scheduled.slot_time, f"{post.format}#{post.thread_index}", post.text)

    console.print(table)


@app.command("post-day")
def post_day(
    date: str = typer.Option(None, help="ISO date (YYYY-MM-DD); defaults to today."),
    provider: str = _PROVIDER_OPTION,
    model: str = _MODEL_OPTION,
    live: bool = typer.Option(False, "--live", help="Actually post to X. Without this flag, runs as a dry run."),
):
    """Generate and post today's full slate, back-to-back. Defaults to a dry run.

    For spaced-out posting across the day (the realistic case — see
    ``post-slot``), call this from three separate scheduler firings instead,
    one per slot.
    """
    for_date = _today(date)
    plan = scheduler.build_daily_plan(for_date)
    generator = ContentGenerator(GeneratorConfig(llm_provider=provider, llm_model=model))
    client = XClient(dry_run=not live)

    if live:
        console.print("[bold red]LIVE mode: posts will be sent to X.[/bold red]")

    for scheduled in plan:
        _post_one(generator, client, scheduled)


@app.command("post-slot")
def post_slot(
    slot_index: int = typer.Option(..., help="Which of today's schedule.DEFAULT_SLOTS to post (0-indexed)."),
    date: str = typer.Option(None, help="ISO date (YYYY-MM-DD); defaults to today."),
    provider: str = _PROVIDER_OPTION,
    model: str = _MODEL_OPTION,
    live: bool = typer.Option(False, "--live", help="Actually post to X. Without this flag, runs as a dry run."),
):
    """Generate and post a single slot of the day's plan. Meant to be invoked
    once per posting time by an external scheduler (cron, GitHub Actions),
    so posts land spread across the day instead of all at once.
    """
    for_date = _today(date)
    plan = scheduler.build_daily_plan(for_date)
    if not 0 <= slot_index < len(plan):
        raise typer.BadParameter(f"slot_index must be between 0 and {len(plan) - 1}")

    generator = ContentGenerator(GeneratorConfig(llm_provider=provider, llm_model=model))
    client = XClient(dry_run=not live)

    if live:
        console.print("[bold red]LIVE mode: post will be sent to X.[/bold red]")

    _post_one(generator, client, plan[slot_index])


@app.command("log-funnel")
def log_funnel(
    event_type: str = typer.Argument(..., help="e.g. profile_link_click, line_registration, paid_reading"),
    count: int = typer.Option(1, help="Number of occurrences to log."),
    note: str = typer.Option("", help="Optional free-text note."),
):
    """Record a monetization funnel event (link click, LINE signup, paid reading, ...)."""
    analytics.log_funnel_event(analytics.FunnelEvent(event_type=event_type, count=count, note=note))
    console.print(f"[green]Logged funnel event: {event_type} (+{count})[/green]")


@app.command("stats")
def stats():
    """Summarize logged posts and monetization funnel events."""
    summary = analytics.summarize()
    console.print(summary)


if __name__ == "__main__":
    app()
