"""Daily posting-time planning.

No background daemon is included here on purpose — invoking
``x-uranai post-day`` from cron (or any external scheduler) at each slot is
simpler to operate and debug than a long-running process, and matches how
the rest of this toolkit is meant to be run (one-shot CLI commands).
"""

from dataclasses import dataclass
from datetime import date as date_cls

from . import templates

# Commute-before (7-9am), lunch-break (noon), and evening wind-down
# (9-11pm) are the three windows with consistently highest engagement for
# this niche.
DEFAULT_SLOTS = ["07:30", "12:00", "21:30"]


@dataclass
class ScheduledPost:
    slot_time: str
    format: str
    date_label: str


def build_daily_plan(for_date: date_cls, slots: list[str] | None = None) -> list[ScheduledPost]:
    """One format per slot; the weekday rotation decides the day's "main"
    format, and the other slots fill in with a light-weight tarot pull so
    the account posts multiple times a day without repeating content.
    """
    slots = slots or DEFAULT_SLOTS
    date_label = for_date.isoformat()
    main_format = templates.WEEKDAY_ROTATION[for_date.weekday()]

    plan = []
    for i, slot_time in enumerate(slots):
        format_name = main_format if i == 0 else "tarot_pull"
        plan.append(ScheduledPost(slot_time=slot_time, format=format_name, date_label=date_label))
    return plan
