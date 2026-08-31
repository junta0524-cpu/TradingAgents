import pytest

from x_uranai_automation.x_client import MAX_TWEET_CHARS, XClient, XClientError


@pytest.mark.unit
def test_dry_run_post_tweet_does_not_require_credentials(monkeypatch):
    for var in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"):
        monkeypatch.delenv(var, raising=False)
    client = XClient(dry_run=True)
    result = client.post_tweet("今日の運勢です")
    assert result == {
        "dry_run": True,
        "text": "今日の運勢です",
        "reply_to_id": None,
        "media_ids": None,
    }


@pytest.mark.unit
def test_dry_run_post_tweet_with_media(monkeypatch):
    for var in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"):
        monkeypatch.delenv(var, raising=False)
    client = XClient(dry_run=True)
    media_id = client.upload_media(b"fake-png-bytes", alt_text="タロットカード")
    assert media_id == "dry_run_media_id"
    result = client.post_tweet("今日の運勢です", media_ids=[media_id])
    assert result["media_ids"] == ["dry_run_media_id"]


@pytest.mark.unit
def test_dry_run_thread_chains_without_real_ids(monkeypatch):
    for var in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"):
        monkeypatch.delenv(var, raising=False)
    client = XClient(dry_run=True)
    results = client.post_thread(["1つ目", "2つ目", "3つ目"])
    assert len(results) == 3
    assert all(r["dry_run"] for r in results)


@pytest.mark.unit
def test_dry_run_thread_attaches_media_to_first_tweet_only(monkeypatch):
    for var in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"):
        monkeypatch.delenv(var, raising=False)
    client = XClient(dry_run=True)
    results = client.post_thread(["1つ目", "2つ目"], first_media_ids=["dry_run_media_id"])
    assert results[0]["media_ids"] == ["dry_run_media_id"]
    assert results[1]["media_ids"] is None


@pytest.mark.unit
def test_post_tweet_rejects_over_length_text():
    client = XClient(dry_run=True)
    with pytest.raises(XClientError, match="exceeds"):
        client.post_tweet("あ" * (MAX_TWEET_CHARS + 1))


@pytest.mark.unit
def test_live_mode_without_credentials_raises(monkeypatch):
    for var in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"):
        monkeypatch.delenv(var, raising=False)
    client = XClient(dry_run=False)
    with pytest.raises(XClientError, match="Missing X API credentials"):
        client.post_tweet("こんにちは")
