"""LLM-backed post generation, built on top of ``tradingagents.llm_clients``
so the same provider roster (OpenAI, Anthropic, Google, ...) and API-key
handling as the trading framework is reused rather than duplicated.
"""

import random
from dataclasses import dataclass, field

from tradingagents.llm_clients import factory as llm_factory
from tradingagents.llm_clients.base_client import normalize_content

from . import templates
from .compliance import assert_compliant
from .persona import TAROT_MAJOR_ARCANA, Persona

# Formats built around a tarot draw. The card is picked once here (rather
# than inside the template builder) so the same draw can be handed to
# image_generator.render_tarot_card for a matching image.
_TAROT_FORMATS = {"tarot_pull", "thread"}


@dataclass
class Post:
    format: str
    text: str
    date_label: str
    thread_index: int = 0
    card_name: str | None = None
    card_meaning: str | None = None


@dataclass
class GeneratorConfig:
    llm_provider: str = "openai"
    llm_model: str = "gpt-5.4-mini"
    backend_url: str | None = None
    persona: Persona = field(default_factory=Persona)


class ContentGenerator:
    def __init__(self, config: GeneratorConfig | None = None):
        self.config = config or GeneratorConfig()
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            client = llm_factory.create_llm_client(
                provider=self.config.llm_provider,
                model=self.config.llm_model,
                base_url=self.config.backend_url,
            )
            self._llm = client.get_llm()
        return self._llm

    def generate(self, format_name: str, date_label: str, **format_kwargs) -> list[Post]:
        """Generate one post (most formats) or several (``thread``), each
        screened by the compliance filter before being returned.
        """
        try:
            builder = templates.FORMATS[format_name]
        except KeyError:
            raise ValueError(
                f"Unknown format {format_name!r}; choose one of {sorted(templates.FORMATS)}"
            ) from None

        card = None
        if format_name in _TAROT_FORMATS:
            card = format_kwargs.pop("card", None) or random.choice(TAROT_MAJOR_ARCANA)
            format_kwargs["card"] = card

        prompts = builder(self.config.persona, date_label, **format_kwargs)
        llm = self._get_llm()

        posts = []
        for index, prompt in enumerate(prompts):
            response = normalize_content(llm.invoke(prompt))
            text = response.content.strip()
            assert_compliant(text)
            posts.append(
                Post(
                    format=format_name,
                    text=text,
                    date_label=date_label,
                    thread_index=index,
                    card_name=card["name"] if card else None,
                    card_meaning=card["upright"] if card else None,
                )
            )
        return posts

    def generate_for_weekday(self, weekday: int, date_label: str) -> list[Post]:
        """``weekday``: Mon=0 ... Sun=6, per ``templates.WEEKDAY_ROTATION``."""
        format_name = templates.WEEKDAY_ROTATION[weekday]
        return self.generate(format_name, date_label)

    def generate_trend_event(self, date_label: str, event_name: str) -> list[Post]:
        """``trend_event`` needs an event name, so it isn't in ``templates.FORMATS``
        (which every other format's uniform ``(persona, date_label)`` signature fits).
        """
        prompts = templates.trend_event(self.config.persona, date_label, event_name)
        llm = self._get_llm()
        response = normalize_content(llm.invoke(prompts[0]))
        text = response.content.strip()
        assert_compliant(text)
        return [Post(format="trend_event", text=text, date_label=date_label)]
