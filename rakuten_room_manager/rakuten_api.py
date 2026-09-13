# -*- coding: utf-8 -*-
"""
rakuten_api.py
-----------------------------------------------------------------------------
楽天商品検索API（IchibaItem/Search）と連携するモジュール。

【楽天の規約遵守について】
このモジュールは楽天が公式に提供する「楽天商品検索API」のみを利用して商品情報を取得する。
HTMLページを直接取得して解析する「スクレイピング」は一切行わない。
また、このモジュールはあくまで「商品情報の取得」のみを行い、
楽天ROOMへの自動投稿などは一切行わない（規約で禁止されているため）。

公式ドキュメント:
https://webservice.rakuten.co.jp/api/ichibaitemsearch/
"""

import requests

# 楽天商品検索APIのエンドポイント（2022年6月版）
RAKUTEN_API_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"

# APIへのリクエストタイムアウト（秒）
REQUEST_TIMEOUT = 10


class RakutenAPIError(Exception):
    """楽天APIの呼び出しに失敗した場合に送出する例外。"""
    pass


def search_items(app_id: str, keyword: str, hits: int = 20) -> list[dict]:
    """
    楽天商品検索APIを呼び出し、キーワードに一致する商品情報を取得する。

    Parameters
    ----------
    app_id : str
        楽天ウェブサービスのアプリケーションID。
    keyword : str
        検索キーワード（例: "ワイヤレスイヤホン"）。
    hits : int
        取得件数（1〜30。楽天APIの仕様上の上限に準拠）。

    Returns
    -------
    list[dict]
        以下のキーを持つ辞書のリスト。
        - item_name  : 商品名
        - price      : 価格（税込・円）
        - item_url   : 商品ページURL
        - image_url  : 商品画像URL（中サイズ画像の1枚目）
        - shop_name  : ショップ名
    """
    if not app_id:
        raise RakutenAPIError(
            "楽天アプリケーションIDが設定されていません。"
            "設定画面から入力するか、環境変数 RAKUTEN_APP_ID を設定してください。"
        )
    if not keyword:
        raise RakutenAPIError("検索キーワードを入力してください。")

    params = {
        "applicationId": app_id,
        "keyword": keyword,
        "hits": max(1, min(hits, 30)),  # 楽天APIの仕様に合わせて1〜30件にクランプ
        "format": "json",
    }

    try:
        response = requests.get(RAKUTEN_API_ENDPOINT, params=params, timeout=REQUEST_TIMEOUT)
    except requests.exceptions.RequestException as exc:
        raise RakutenAPIError(f"楽天APIへの接続に失敗しました: {exc}") from exc

    # 楽天APIはエラー時でも200以外のステータスコードを返すことがあるため、
    # レスポンスボディのerrorフィールドも合わせて確認する。
    try:
        data = response.json()
    except ValueError as exc:
        raise RakutenAPIError("楽天APIからのレスポンスを解析できませんでした。") from exc

    if "error" in data:
        error_description = data.get("error_description", data.get("error"))
        raise RakutenAPIError(f"楽天APIエラー: {error_description}")

    if not response.ok:
        raise RakutenAPIError(f"楽天APIがエラーを返しました（HTTP {response.status_code}）。")

    items = []
    for entry in data.get("Items", []):
        item = entry.get("Item", {})

        # 商品画像は複数枚返ってくることがあるため、1枚目を代表画像として使用する
        medium_images = item.get("mediumImageUrls", [])
        image_url = medium_images[0].get("imageUrl", "") if medium_images else ""
        # 楽天の画像URLにはサイズ指定のクエリパラメータ（?_ex=128x128等）が
        # 付与されていることがあるので、必要に応じて除去する（見た目を大きくするため）。
        if "?_ex=" in image_url:
            image_url = image_url.split("?_ex=")[0]

        items.append(
            {
                "item_name": item.get("itemName", ""),
                "price": item.get("itemPrice", 0),
                "item_url": item.get("itemUrl", ""),
                "image_url": image_url,
                "shop_name": item.get("shopName", ""),
            }
        )

    return items
