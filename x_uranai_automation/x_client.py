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
MAX_TWEET_CHARS = 280


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

    def post_tweet(self, text: str, reply_to_id: str | None = None) -> dict:
        if len(text) > MAX_TWEET_CHARS:
            raise XClientError(f"Tweet exceeds {MAX_TWEET_CHARS} characters ({len(text)}).")

        if self.dry_run:
            return {"dry_run": True, "text": text, "reply_to_id": reply_to_id}

        payload: dict = {"text": text}
        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}

        response = requests.post(f"{API_BASE}/tweets", json=payload, auth=self._auth(), timeout=30)
        if response.status_code >= 300:
            raise XClientError(f"X API error {response.status_code}: {response.text}")
        return response.json()

    def post_thread(self, texts: list[str]) -> list[dict]:
        """Post a reply chain; each tweet replies to the previous one."""
        results = []
        reply_to_id = None
        for text in texts:
            result = self.post_tweet(text, reply_to_id=reply_to_id)
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
