"""Compliance guardrails for fortune-telling posts.

Japan's Act against Unjustifiable Premiums and Misleading Representations
(景品表示法) prohibits absolute/guaranteed claims in advertising-adjacent
content. A fortune account routinely blurs into advertising once it links to
paid readings or products, so every generated post is screened before it can
be scheduled or posted.
"""

# Absolute/guaranteed-outcome phrasing — the highest-risk category, and the
# one most tempting for an LLM to reach for when writing "viral" copy.
_ABSOLUTE_CLAIM_PHRASES = [
    "絶対当たる",
    "100%当たる",
    "必ず当たる",
    "確実に当たる",
    "100%的中",
    "絶対的中",
    "日本一の的中率",
    "業界No.1",
    "誰でも必ず",
    "絶対に幸せになれる",
    "絶対成功",
    "必ず願いが叶う",
    "100%幸せになれる",
    "確実に願いが叶う",
    "必ず良くなります",
]

# Fear-based/anxiety-marketing phrasing — pressures a reader into a purchase
# through dread rather than genuine value, and reads as deceptive even when
# not a strict "absolute claim". Distinct from caution_ranking's legitimate
# "week to watch out for" framing, which stays hedged and ends positively.
_FEAR_MARKETING_PHRASES = [
    "不幸になります",
    "災いが起きます",
    "呪われて",
    "霊障",
    "除霊しないと",
    "今すぐ申し込まないと手遅れ",
    "このままでは危険",
    "運気が下がり続け",
]

# Health/medical-effect claims — a fortune reading implying it treats or
# cures a medical condition strays into 薬機法 (Pharmaceutical and Medical
# Device Act) territory, a separate and stricter regime from 景品表示法.
_MEDICAL_CLAIM_PHRASES = [
    "病気が治る",
    "うつが治り",
    "不妊が解消",
]

NG_PHRASES = _ABSOLUTE_CLAIM_PHRASES + _FEAR_MARKETING_PHRASES + _MEDICAL_CLAIM_PHRASES

# Required when a post's call-to-action links to a paid service (readings,
# products) rather than being purely editorial content.
PAID_LINK_DISCLAIMER = "※鑑定・購入には別途料金がかかります"


class ComplianceError(ValueError):
    """Raised when generated post text fails the compliance screen."""


def find_ng_phrases(text: str) -> list[str]:
    return [phrase for phrase in NG_PHRASES if phrase in text]


def assert_compliant(text: str) -> None:
    hits = find_ng_phrases(text)
    if hits:
        raise ComplianceError(
            f"Prohibited absolute-claim phrase(s) found: {', '.join(hits)}"
        )


def needs_paid_link_disclaimer(text: str, has_paid_link: bool) -> bool:
    return has_paid_link and PAID_LINK_DISCLAIMER not in text
