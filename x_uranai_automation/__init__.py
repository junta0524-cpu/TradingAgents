"""X (Twitter) fortune-telling account automation toolkit.

Independent of the ``tradingagents`` trading framework — it only reuses the
multi-provider LLM client factory (``tradingagents.llm_clients.factory``) so
content generation supports the same provider set (OpenAI, Anthropic,
Google, ...) without duplicating API key handling.
"""

__version__ = "0.1.0"
