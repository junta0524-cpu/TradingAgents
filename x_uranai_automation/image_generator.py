"""Renders a branded tarot-card image (PNG bytes) to accompany a post.

An image-carrying post gets meaningfully more impressions and saves than
text alone in this niche (see the README's viral-pattern table), so this
draws the card programmatically with Pillow instead of calling a paid
image-generation API — zero marginal cost per post, and no dependency on
an external service being up when a scheduled post fires.

Requires a CJK-capable font (Japanese text won't render otherwise). Point
``NOTO_SERIF_CJK_BOLD`` at your installed copy if it isn't at the default
Debian/Ubuntu path — the GitHub Actions workflow installs
``fonts-noto-cjk`` via apt for exactly this reason.
"""

import io
import os
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageFont

CARD_SIZE = (1080, 1350)  # 4:5 portrait — X crops/displays this without letterboxing

# Palette lifted from the diagnosis-page artifact so the bot's tarot images
# and the diagnosis site read as the same brand.
BG_TOP = (12, 10, 26)
BG_BOTTOM = (30, 24, 54)
GOLD = (212, 175, 55)
GOLD_SOFT = (232, 207, 122)
TEXT_0 = (244, 240, 230)
TEXT_1 = (201, 194, 221)
TEXT_2 = (143, 136, 171)

NOTO_SERIF_CJK_BOLD = os.getenv(
    "X_AUTOMATION_CJK_FONT", "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
)
# Index 0 of the combined Noto CJK TTC is the Japanese glyph variant; see
# https://github.com/notofonts/noto-cjk — KR/SC/TC/HK follow at 1-4.
_JP_FONT_INDEX = 0


class ImageGenerationError(RuntimeError):
    pass


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    if not os.path.exists(NOTO_SERIF_CJK_BOLD):
        raise ImageGenerationError(
            f"CJK font not found at {NOTO_SERIF_CJK_BOLD!r}. Install fonts-noto-cjk "
            "(apt-get install -y fonts-noto-cjk) or set X_AUTOMATION_CJK_FONT to a "
            "font file that covers Japanese."
        )
    return ImageFont.truetype(NOTO_SERIF_CJK_BOLD, size, index=_JP_FONT_INDEX)


def _vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    width, height = size
    gradient = Image.new("RGB", (1, height))
    for y in range(height):
        t = y / max(height - 1, 1)
        gradient.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return gradient.resize(size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        if draw.textlength(candidate, font=font) > max_width and current:
            lines.append(current)
            current = char
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


@dataclass
class TarotCardImage:
    png_bytes: bytes
    alt_text: str


def render_tarot_card(
    card_name: str,
    meaning: str,
    persona_name: str,
    date_label: str,
    reversed_: bool = False,
) -> TarotCardImage:
    """Render a single tarot card as a branded portrait image."""
    img = _vertical_gradient(CARD_SIZE, BG_TOP, BG_BOTTOM)
    draw = ImageDraw.Draw(img)
    width, height = CARD_SIZE
    margin = 64

    # Outer gold frame, echoing the diagnosis page's card styling, with a
    # dimmer inner line for depth.
    dim_gold = tuple(int(c * 0.4) for c in GOLD)
    draw.rounded_rectangle(
        [margin, margin, width - margin, height - margin], radius=28, outline=GOLD, width=3
    )
    draw.rounded_rectangle(
        [margin + 14, margin + 14, width - margin - 14, height - margin - 14],
        radius=20,
        outline=dim_gold,
        width=1,
    )

    eyebrow_font = _load_font(28)
    title_font = _load_font(72)
    meaning_font = _load_font(34)
    footer_font = _load_font(24)

    eyebrow = "今日の1枚" if not reversed_ else "今日の1枚(逆位置)"
    draw.text((width / 2, margin + 90), eyebrow, font=eyebrow_font, fill=GOLD_SOFT, anchor="mm")

    draw.text((width / 2, height * 0.38), card_name, font=title_font, fill=TEXT_0, anchor="mm")
    draw.line(
        [(width / 2 - 60, height * 0.38 + 60), (width / 2 + 60, height * 0.38 + 60)],
        fill=GOLD,
        width=2,
    )

    meaning_lines = _wrap_text(draw, meaning, meaning_font, width - margin * 2 - 80)
    line_height = 50
    start_y = height * 0.55
    for i, line in enumerate(meaning_lines[:4]):
        draw.text((width / 2, start_y + i * line_height), line, font=meaning_font, fill=TEXT_1, anchor="mm")

    footer = f"{persona_name} · {date_label}"
    draw.text((width / 2, height - margin - 40), footer, font=footer_font, fill=TEXT_2, anchor="mm")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    alt_text = f"タロットカード「{card_name}」{'逆位置' if reversed_ else '正位置'}。{meaning}"
    return TarotCardImage(png_bytes=buffer.getvalue(), alt_text=alt_text)
