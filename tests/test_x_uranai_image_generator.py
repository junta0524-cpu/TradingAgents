import os

import pytest

from x_uranai_automation.image_generator import (
    NOTO_SERIF_CJK_BOLD,
    ImageGenerationError,
    render_tarot_card,
)

_requires_cjk_font = pytest.mark.skipif(
    not os.path.exists(NOTO_SERIF_CJK_BOLD),
    reason="fonts-noto-cjk not installed in this environment (see README for the apt package)",
)


@_requires_cjk_font
@pytest.mark.unit
def test_render_tarot_card_produces_png_bytes():
    result = render_tarot_card(
        card_name="星",
        meaning="希望・癒し",
        persona_name="月詠",
        date_label="2026-08-31",
    )
    assert result.png_bytes.startswith(b"\x89PNG")
    assert "星" in result.alt_text
    assert "正位置" in result.alt_text


@_requires_cjk_font
@pytest.mark.unit
def test_render_tarot_card_reversed_alt_text():
    result = render_tarot_card(
        card_name="塔",
        meaning="急な変化",
        persona_name="月詠",
        date_label="2026-08-31",
        reversed_=True,
    )
    assert "逆位置" in result.alt_text


@pytest.mark.unit
def test_missing_font_raises_clear_error(monkeypatch):
    monkeypatch.setattr(
        "x_uranai_automation.image_generator.NOTO_SERIF_CJK_BOLD", "/nonexistent/font.ttc"
    )
    with pytest.raises(ImageGenerationError, match="fonts-noto-cjk"):
        render_tarot_card(
            card_name="星",
            meaning="希望",
            persona_name="月詠",
            date_label="2026-08-31",
        )
