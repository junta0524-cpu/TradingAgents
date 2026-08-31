import pytest

from x_uranai_automation.compliance import (
    ComplianceError,
    assert_compliant,
    find_ng_phrases,
    needs_paid_link_disclaimer,
)


@pytest.mark.unit
def test_find_ng_phrases_detects_absolute_claims():
    assert find_ng_phrases("今日は絶対当たる占いをお届け") == ["絶対当たる"]


@pytest.mark.unit
def test_find_ng_phrases_clean_text():
    assert find_ng_phrases("今日は穏やかに過ごせそうです") == []


@pytest.mark.unit
def test_assert_compliant_raises_on_ng_phrase():
    with pytest.raises(ComplianceError):
        assert_compliant("必ず当たる今日の運勢")


@pytest.mark.unit
def test_assert_compliant_passes_clean_text():
    assert_compliant("今日は落ち着いて過ごせそうな一日です")


@pytest.mark.unit
def test_find_ng_phrases_detects_fear_marketing():
    assert find_ng_phrases("除霊しないと不幸になります") == ["不幸になります", "除霊しないと"]


@pytest.mark.unit
def test_find_ng_phrases_detects_medical_claims():
    assert find_ng_phrases("この鑑定でうつが治りますよ") == ["うつが治り"]


@pytest.mark.unit
def test_needs_paid_link_disclaimer():
    assert needs_paid_link_disclaimer("鑑定はこちら", has_paid_link=True) is True
    assert needs_paid_link_disclaimer("鑑定はこちら ※鑑定・購入には別途料金がかかります", has_paid_link=True) is False
    assert needs_paid_link_disclaimer("鑑定はこちら", has_paid_link=False) is False
