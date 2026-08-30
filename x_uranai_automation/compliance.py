"""Compliance guardrails for fortune-telling posts.

Japan's Act against Unjustifiable Premiums and Misleading Representations
(景品表示法) prohibits absolute/guaranteed claims in advertising-adjacent
content. A fortune account routinely blurs into advertising once it links to
paid readings or products, so every generated post is screened before it can
be scheduled or posted.
"""

# Absolute/guaranteed-outcome phrasing — the highest-risk category, and the
# one most tempting for an LLM to reach for when writing "viral" copy.
NG_PHRASES = [
    "絶対当たる",
    "100%当たる",
    "必ず当たる",
    "確実に当たる",
    "100%的中",
    "絶対的中",
    "誰でも必ず",
    "絶対に幸せになれる",
    "絶対成功",
    "必ず願いが叶う",
    "100%幸せになれる",
    "確実に願いが叶う",
]

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
