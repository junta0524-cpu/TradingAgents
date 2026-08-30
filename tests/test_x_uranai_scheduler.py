import datetime

import pytest

from x_uranai_automation import templates
from x_uranai_automation.scheduler import DEFAULT_SLOTS, build_daily_plan


@pytest.mark.unit
def test_build_daily_plan_uses_default_slots():
    monday = datetime.date(2026, 8, 31)  # a Monday
    plan = build_daily_plan(monday)
    assert [p.slot_time for p in plan] == DEFAULT_SLOTS


@pytest.mark.unit
def test_first_slot_matches_weekday_rotation():
    for offset in range(7):
        day = datetime.date(2026, 8, 31) + datetime.timedelta(days=offset)
        plan = build_daily_plan(day)
        assert plan[0].format == templates.WEEKDAY_ROTATION[day.weekday()]


@pytest.mark.unit
def test_secondary_slots_are_tarot_pull():
    day = datetime.date(2026, 8, 31)
    plan = build_daily_plan(day)
    assert all(p.format == "tarot_pull" for p in plan[1:])


@pytest.mark.unit
def test_custom_slots_respected():
    day = datetime.date(2026, 8, 31)
    plan = build_daily_plan(day, slots=["09:00"])
    assert len(plan) == 1
    assert plan[0].slot_time == "09:00"
