"""CLI for the X fortune-account automation toolkit.

    python -m x_uranai_automation.cli generate-day
    python -m x_uranai_automation.cli post-day --live
    python -m x_uranai_automation.cli stats
"""

import datetime

import typer
from rich.console import Console
from rich.table import Table

from . import analytics, scheduler
from .compliance import ComplianceError
from .content_generator import ContentGenerator, GeneratorConfig
from .x_client import XClient, XClientError

app = typer.Typer(
    name="x-uranai",
    help="X (Twitter) fortune-account content generation, posting, and monetization tracking.",
    add_completion=False,
)
console = Console()


def _today(date: str | None) -> datetime.date:
    return datetime.date.fromisoformat(date) if date else datetime.date.today()


@app.command("generate-day")
def generate_day(
    date: str = typer.Option(None, help="ISO date (YYYY-MM-DD); defaults to today."),
    provider: str = typer.Option("openai", help="LLM provider (see tradingagents.llm_clients)."),
    model: str = typer.Option("gpt-5.4-mini", help="LLM model name."),
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
    provider: str = typer.Option("openai", help="LLM provider (see tradingagents.llm_clients)."),
    model: str = typer.Option("gpt-5.4-mini", help="LLM model name."),
    live: bool = typer.Option(False, "--live", help="Actually post to X. Without this flag, runs as a dry run."),
):
    """Generate and post today's full slate. Defaults to a dry run (nothing is sent to X)."""
    for_date = _today(date)
    plan = scheduler.build_daily_plan(for_date)
    generator = ContentGenerator(GeneratorConfig(llm_provider=provider, llm_model=model))
    client = XClient(dry_run=not live)

    if live:
        console.print("[bold red]LIVE mode: posts will be sent to X.[/bold red]")

    for scheduled in plan:
        try:
            posts = generator.generate(scheduled.format, scheduled.date_label)
        except ComplianceError as exc:
            console.print(f"[red]Skipped {scheduled.slot_time} ({scheduled.format}): compliance check failed: {exc}[/red]")
            continue

        texts = [post.text for post in posts]
        try:
            if len(texts) == 1:
                results = [client.post_tweet(texts[0])]
            else:
                results = client.post_thread(texts)
        except XClientError as exc:
            console.print(f"[red]Post failed for {scheduled.slot_time} ({scheduled.format}): {exc}[/red]")
            continue

        for post, result in zip(posts, results, strict=True):
            tweet_id = result.get("data", {}).get("id") if not client.dry_run else None
            analytics.log_post(post.format, post.text, tweet_id=tweet_id, dry_run=client.dry_run)
        console.print(f"[green]Posted {scheduled.slot_time} ({scheduled.format}, {len(texts)} tweet(s)).[/green]")


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
