"""Minimal X (Twitter) API v2 posting client.

Uses OAuth 1.0a User Context (via ``requests-oauthlib``) rather than an
OAuth 2.0 PKCE user flow — it needs no browser/callback round-trip, which
suits an unattended posting script, and is the standard auth mode for
``POST /2/tweets`` on a bot account's own app credentials.

``dry_run`` defaults to True everywhere: nothing is ever posted to a real
account unless the caller explicitly opts in, so a misconfigured cron job
or a CLI slip can't spam a live account.
"""

import os

import requests
from requests_oauthlib import OAuth1

API_BASE = "https://api.twitter.com/2"
# The legacy v1.1 media/upload endpoint was retired in March 2025; media now
# goes through this v2 endpoint instead. It is documented as OAuth 1.0a User
# Context only (a Bearer/OAuth2 token gets "not permitted" here) — matching
# the auth this client already uses for posting. API surface here has moved
# fast; re-check X's current media upload docs before relying on this in
# production.
MEDIA_UPLOAD_URL = "https://api.x.com/2/media/upload"
MAX_TWEET_CHARS = 280

# X counts most Basic-Multilingual-Plane CJK ideographs/kana/hangul/fullwidth
# punctuation as weight 2 toward the character limit (the "weighted length"
# rule behind the well-known "280 Latin chars ~= 140 Japanese chars"). Ranges
# below mirror Twitter's own twitter-text ``config.json`` "weightedLength"
# ranges for weight-2 codepoints.
_WEIGHT_2_RANGES = (
    (0x1100, 0x115F), (0x2E80, 0x303E), (0x3041, 0x33FF), (0x3400, 0x4DBF),
    (0x4E00, 0x9FFF), (0xA000, 0xA4CF), (0xAC00, 0xD7A3), (0xF900, 0xFAFF),
    (0xFF00, 0xFF60), (0xFFE0, 0xFFE6), (0x1F200, 0x1F251), (0x20000, 0x3FFFD),
)


def weighted_length(text: str) -> int:
    """X's character count for the 280-char limit, not ``len(text)``.

    A tweet made mostly of Japanese/Chinese/Korean text hits the limit at
    roughly half the character count of one made of Latin text — this is
    what actually gets enforced by the API, not a flat 280 characters.
    """
    total = 0
    for ch in text:
        cp = ord(ch)
        total += 2 if any(lo <= cp <= hi for lo, hi in _WEIGHT_2_RANGES) else 1
    return total


class XClientError(RuntimeError):
    pass


class XClient:
    def __init__(
        self,
        api_key: str | None = None,
        api_secret: str | None = None,
        access_token: str | None = None,
        access_token_secret: str | None = None,
        dry_run: bool = True,
    ):
        self.api_key = api_key or os.getenv("X_API_KEY")
        self.api_secret = api_secret or os.getenv("X_API_SECRET")
        self.access_token = access_token or os.getenv("X_ACCESS_TOKEN")
        self.access_token_secret = access_token_secret or os.getenv("X_ACCESS_TOKEN_SECRET")
        self.dry_run = dry_run

    def _auth(self) -> OAuth1:
        missing = [
            name
            for name, value in (
                ("X_API_KEY", self.api_key),
                ("X_API_SECRET", self.api_secret),
                ("X_ACCESS_TOKEN", self.access_token),
                ("X_ACCESS_TOKEN_SECRET", self.access_token_secret),
            )
            if not value
        ]
        if missing:
            raise XClientError(f"Missing X API credentials: {', '.join(missing)}")
        return OAuth1(self.api_key, self.api_secret, self.access_token, self.access_token_secret)

    def upload_media(self, image_bytes: bytes, alt_text: str | None = None) -> str:
        """Upload an image and return its media_id, for attaching to a tweet.

        Uses the legacy v1.1 media/upload endpoint — X API v2 still has no
        upload endpoint of its own, so every client (including tweepy) goes
        through v1.1 for this step even when posting the tweet itself via v2.
        """
        if self.dry_run:
            return "dry_run_media_id"

        response = requests.post(
            MEDIA_UPLOAD_URL,
            files={"media": image_bytes},
            auth=self._auth(),
            timeout=30,
        )
        if response.status_code >= 300:
            raise XClientError(f"X media upload error {response.status_code}: {response.text}")
        media_id = response.json()["media_id_string"]

        if alt_text:
            metadata_response = requests.post(
                f"{MEDIA_UPLOAD_URL}?command=metadata_create&media_id={media_id}",
                json={"media_id": media_id, "alt_text": {"text": alt_text[:1000]}},
                auth=self._auth(),
                timeout=30,
            )
            if metadata_response.status_code >= 300:
                raise XClientError(
                    f"X media alt-text error {metadata_response.status_code}: {metadata_response.text}"
                )

        return media_id

    def post_tweet(
        self, text: str, reply_to_id: str | None = None, media_ids: list[str] | None = None
    ) -> dict:
        length = weighted_length(text)
        if length > MAX_TWEET_CHARS:
            raise XClientError(f"Tweet exceeds {MAX_TWEET_CHARS} weighted characters ({length}).")

        if self.dry_run:
            return {"dry_run": True, "text": text, "reply_to_id": reply_to_id, "media_ids": media_ids}

        payload: dict = {"text": text}
        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}
        if media_ids:
            payload["media"] = {"media_ids": media_ids}

        response = requests.post(f"{API_BASE}/tweets", json=payload, auth=self._auth(), timeout=30)
        if response.status_code >= 300:
            raise XClientError(f"X API error {response.status_code}: {response.text}")
        return response.json()

    def post_thread(self, texts: list[str], first_media_ids: list[str] | None = None) -> list[dict]:
        """Post a reply chain; each tweet replies to the previous one.

        ``first_media_ids`` attaches media (e.g. a tarot card image) to only
        the opening tweet — image + text once, plain text for the replies.
        """
        results = []
        reply_to_id = None
        for index, text in enumerate(texts):
            media_ids = first_media_ids if index == 0 else None
            result = self.post_tweet(text, reply_to_id=reply_to_id, media_ids=media_ids)
            results.append(result)
            if not self.dry_run:
                reply_to_id = result["data"]["id"]
        return results

    def get_tweet_metrics(self, tweet_id: str) -> dict:
        if self.dry_run:
            return {"dry_run": True, "tweet_id": tweet_id}

        response = requests.get(
            f"{API_BASE}/tweets/{tweet_id}",
            params={"tweet.fields": "public_metrics"},
            auth=self._auth(),
            timeout=30,
        )
        if response.status_code >= 300:
            raise XClientError(f"X API error {response.status_code}: {response.text}")
        return response.json()
