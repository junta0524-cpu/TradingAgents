"""Prompt builders for the post formats known to perform well in the
fortune-telling niche on X.

Each builder returns a list of one or more LLM prompts — most formats are a
single post, but ``thread`` returns several prompts meant to be posted as a
reply chain. Keeping the "why this format works" note next to its builder
means a new format can be added by anyone without re-deriving the pattern.
"""

import random

from .persona import TAROT_MAJOR_ARCANA, ZODIAC_SIGNS, Persona

# X's 280-character limit is *weighted*, not a flat character count: most
# Japanese characters (kana, kanji, full-width punctuation) count as 2
# toward it, so a pure-Japanese tweet effectively caps at ~140 characters,
# not 280 (see XClient.weighted_length). 120 leaves headroom for the LLM's
# imprecision and any half-width characters (numbers, "X", emoji) mixed in,
# without needing an X Premium account's long-form posting.
MAX_CHARS = 120


def _header(persona: Persona, date_label: str) -> str:
    return f"{persona.system_prompt()}\n本文は{MAX_CHARS}字以内の日本語。日付ラベル: {date_label}\n"


def ranking(persona: Persona, date_label: str) -> list[str]:
    """12星座の今日の運勢ランキング — 自分の星座を探させる導線で保存/リプ率が高い。"""
    signs = ", ".join(s["name"] for s in ZODIAC_SIGNS)
    prompt = (
        _header(persona, date_label)
        + f"12星座({signs})全ての今日の運勢を1位〜12位のランキング形式で作成して。"
        "各星座は「◯位 ◯◯座:一言アドバイス」の形式で改行区切り。"
        f"最後に「{persona.cta}」を入れる。絶対・必ず・100%等の断定表現は禁止。"
    )
    return [prompt]


def tarot_pull(persona: Persona, date_label: str, card: dict | None = None) -> list[str]:
    """今日の1枚(タロット) — カード画像との相性が良く、シンプルで毎日回せる。

    ``card`` is normally chosen by the caller (``ContentGenerator``) rather
    than here, so the same draw can also be handed to
    ``image_generator.render_tarot_card`` for the accompanying image.
    """
    card = card or random.choice(TAROT_MAJOR_ARCANA)
    prompt = (
        _header(persona, date_label)
        + f"今日の1枚は「{card['name']}」の正位置(意味: {card['upright']})として、"
        "今日1日をどう過ごすと良いかのアドバイスを書いて。"
        "カード名を冒頭に明記し、断定表現は禁止。"
    )
    return [prompt]


def diagnosis(persona: Persona, date_label: str) -> list[str]:
    """参加型診断 — リプ・引用RTを誘発し、フォロー外にも伸びやすい。"""
    prompt = (
        _header(persona, date_label)
        + "「生まれた季節でわかる、あなたの隠れた性格」診断ツイートを作成して。"
        "春夏秋冬の4パターンそれぞれに短い性格診断コメントをつけ、"
        "最後にリプライで自分の季節を教えてもらうよう促す一文を入れる。"
    )
    return [prompt]


def caution_ranking(persona: Persona, date_label: str) -> list[str]:
    """要注意ランキング — 不安喚起は保存/シェアされやすいが、断定・過度な煽りは厳禁。"""
    signs = ", ".join(s["name"] for s in ZODIAC_SIGNS)
    prompt = (
        _header(persona, date_label)
        + f"12星座({signs})の中から「今週ちょっとだけ注意したい星座」を3つ選び、"
        "それぞれ理由と、注意すれば大丈夫という前向きな一言を添えて。"
        "不安を煽りすぎず、読んだ後に安心できるトーンで。断定表現は禁止。"
    )
    return [prompt]


def thread(persona: Persona, date_label: str, card: dict | None = None) -> list[str]:
    """スレッド深掘り(タロット1枚引き→意味の解説→今日のアドバイス) — 滞在時間を伸ばす。"""
    card = card or random.choice(TAROT_MAJOR_ARCANA)
    base = _header(persona, date_label)
    return [
        base + f"スレッドの1投稿目。今日のカードは「{card['name']}」とだけ発表し、続きは次のツイートで、と匂わせる。",
        base + f"スレッドの2投稿目。「{card['name']}」の正位置の意味({card['upright']})を、"
        "初心者にもわかるように解説する。",
        base + f"スレッドの3投稿目。「{card['name']}」を踏まえた今日の過ごし方のアドバイスで締め、"
        f"最後に「{persona.cta}」を入れる。",
    ]


def trend_event(persona: Persona, date_label: str, event_name: str) -> list[str]:
    """天体イベント便乗(満月・水星逆行など) — タイミング投稿でインプレッションが伸びやすい。"""
    prompt = (
        _header(persona, date_label)
        + f"今日は「{event_name}」の日。このイベントが持つ意味と、"
        "今日を穏やかに過ごすための一言アドバイスを書いて。断定表現は禁止。"
    )
    return [prompt]


FORMATS = {
    "ranking": ranking,
    "tarot_pull": tarot_pull,
    "diagnosis": diagnosis,
    "caution_ranking": caution_ranking,
    "thread": thread,
}

# Mon=0 ... Sun=6. Spreads formats across the week instead of repeating the
# same shape daily, which flattens engagement over time.
WEEKDAY_ROTATION = {
    0: "ranking",
    1: "tarot_pull",
    2: "diagnosis",
    3: "tarot_pull",
    4: "caution_ranking",
    5: "thread",
    6: "ranking",
}
